import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

export interface AiSummary {
  what_it_does: string;
  why_trending: string;
  who_should_care: string;
  tags: string[];
  hook: string;
  install_hint?: string | null;
}

const SYSTEM_PROMPT = "Respond with valid JSON only.";

export async function summarizeRepo(repo: {
  owner: string;
  name: string;
  description: string | null;
  language: string | null;
  topics: string[];
  stars: number;
  starsGained24h: number;
  readme: string;
}): Promise<AiSummary | null> {
  const prompt = `You are a senior developer writing punchy, opinionated repo summaries for other developers.

Given a GitHub repo, write a summary that:
1. Explains what it does in plain English (no marketing fluff, no repeating the repo name)
2. Explains WHY it is trending right now - a specific reason, not "it gained stars"
3. Identifies WHO should actually care - be specific (e.g. "Backend devs building RAG pipelines", not just "developers")
4. Writes a single hook line that would make a developer stop scrolling - lead with the problem it solves, not the solution
5. Generates 3-5 lowercase tags that are specific (e.g. "rag", "llm-routing", "self-hosted") not generic ("ai", "tool")
6. Optionally includes the install command if it's a library/CLI

Be opinionated. If a repo is genuinely useful, say so directly. If it solves a real pain point, name the pain point.

Repo info:
Name: ${repo.owner}/${repo.name}
Language: ${repo.language ?? "unknown"}
Stars: ${repo.stars.toLocaleString()}
Topics: ${repo.topics.join(", ") || "none"}
Description: ${repo.description ?? "none"}
README excerpt: ${repo.readme || "(no readme)"}

Respond ONLY with valid JSON matching this schema:
{
  "what_it_does": "string",
  "why_trending": "string",
  "who_should_care": "string",
  "tags": ["string"],
  "hook": "string",
  "install_hint": "string or null"
}`;

  try {
    const anthropic = getAnthropicClient();
    if (anthropic) {
      const message = await anthropic.messages.create({
        model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001",
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      });

      const content = message.content[0];
      if (content.type !== "text") return null;

      // Strip markdown code fences if present (e.g. ```json ... ```)
      const raw = content.text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
      return JSON.parse(raw) as AiSummary;
    }

    const openai = getOpenAIClient();
    if (openai) {
      const response = await openai.responses.create({
        model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
        input: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        max_output_tokens: 512,
      });

      const raw = response.output_text.trim();
      if (!raw) return null;
      const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
      return JSON.parse(cleaned) as AiSummary;
    }

    console.warn(
      "AI summarization skipped: missing ANTHROPIC_API_KEY and OPENAI_API_KEY."
    );
    return null;
  } catch (err) {
    console.error(`AI summarization failed for ${repo.owner}/${repo.name}:`, err);
    return null;
  }
}

export async function summarizeBatch(
  repos: Parameters<typeof summarizeRepo>[0][]
): Promise<Map<string, AiSummary>> {
  const results = new Map<string, AiSummary>();

  // Process in parallel batches of 5
  const batchSize = 5;
  for (let i = 0; i < repos.length; i += batchSize) {
    const batch = repos.slice(i, i + batchSize);
    const settled = await Promise.allSettled(
      batch.map((repo) =>
        summarizeRepo(repo).then((summary) => ({
          key: `${repo.owner}/${repo.name}`,
          summary,
        }))
      )
    );

    for (const result of settled) {
      if (result.status === "fulfilled" && result.value.summary) {
        results.set(result.value.key, result.value.summary);
      }
    }

    // Small delay between batches to stay within rate limits
    if (i + batchSize < repos.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return results;
}
