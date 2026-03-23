import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY?.replace(/\s+/g, "");
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY?.replace(/\s+/g, "");
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

function parseSummaryJson(rawText: string): AiSummary {
  const normalized = rawText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  const tryParse = (text: string): AiSummary | null => {
    try {
      const parsed = JSON.parse(text) as unknown;
      if (typeof parsed === "string") {
        return tryParse(parsed);
      }
      if (
        parsed &&
        typeof parsed === "object" &&
        "what_it_does" in parsed &&
        "why_trending" in parsed &&
        "who_should_care" in parsed &&
        "tags" in parsed &&
        "hook" in parsed
      ) {
        return parsed as AiSummary;
      }
      return null;
    } catch {
      return null;
    }
  };

  const direct = tryParse(normalized);
  if (direct) return direct;

  const firstBrace = normalized.indexOf("{");
  const lastBrace = normalized.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const extracted = normalized.slice(firstBrace, lastBrace + 1);
    const extractedParsed = tryParse(extracted);
    if (extractedParsed) return extractedParsed;
  }

  const unescaped = normalized
    .replace(/\\"/g, '"')
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t");
  const unescapedParsed = tryParse(unescaped);
  if (unescapedParsed) return unescapedParsed;

  throw new SyntaxError("AI response was not valid summary JSON");
}

async function repairSummaryJsonWithOpenAI(
  openai: OpenAI,
  invalidOutput: string
): Promise<AiSummary | null> {
  const repairPrompt = `Convert the following text into valid JSON only.
Schema:
{
  "what_it_does": "string",
  "why_trending": "string",
  "who_should_care": "string",
  "tags": ["string"],
  "hook": "string",
  "install_hint": "string or null"
}

Text:
${invalidOutput}`;

  const repaired = await openai.responses.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
    input: [
      { role: "system", content: "Return valid JSON only. No prose." },
      { role: "user", content: repairPrompt },
    ],
    max_output_tokens: 300,
  });

  const repairedRaw = repaired.output_text.trim();
  if (!repairedRaw) return null;
  return parseSummaryJson(repairedRaw);
}

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

  const anthropic = getAnthropicClient();
  if (anthropic) {
    try {
      const message = await anthropic.messages.create({
        model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001",
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      });

      const content = message.content[0];
      if (content.type !== "text") return null;

      return parseSummaryJson(content.text);
    } catch (err) {
      console.warn(
        `Anthropic summarization failed for ${repo.owner}/${repo.name}; falling back to OpenAI:`,
        err
      );
    }
  }

  try {
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
      try {
        return parseSummaryJson(raw);
      } catch (parseErr) {
        console.warn(
          `OpenAI returned invalid JSON for ${repo.owner}/${repo.name}; attempting repair pass:`,
          parseErr
        );
        return await repairSummaryJsonWithOpenAI(openai, raw);
      }
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
