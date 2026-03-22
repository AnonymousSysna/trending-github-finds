import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { RepoWithSnapshot } from "@/lib/types";

interface DigestEmailProps {
  repos: RepoWithSnapshot[];
  date: string;
  unsubscribeUrl: string;
  appUrl: string;
}

export function DigestEmail({
  repos,
  date,
  unsubscribeUrl,
  appUrl,
}: DigestEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        Today&apos;s top {String(repos.length)} trending GitHub repos — {date}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>🔥 Today&apos;s Trending GitHub Repos</Heading>
          <Text style={subtitle}>{date} · Ranked by momentum</Text>
          <Hr style={hr} />

          {repos.map((repo, i) => {
            const summary = repo.aiSummary;
            return (
              <Section key={repo.id} style={repoSection}>
                <Text style={rankBadge}>#{i + 1}</Text>
                <Heading as="h2" style={repoTitle}>
                  <Link
                    href={`${appUrl}/repo/${repo.owner}/${repo.name}`}
                    style={repoLink}
                  >
                    {repo.owner}/{repo.name}
                  </Link>
                </Heading>

                {repo.snapshot && (
                  <Text style={statLine}>
                    ★ {repo.starsTotal.toLocaleString()} total ·{" "}
                    <strong>
                      +{repo.snapshot.starsGained24h.toLocaleString()} today
                    </strong>
                    {repo.language ? ` · ${repo.language}` : ""}
                  </Text>
                )}

                {summary && (
                  <>
                    <Text style={hookText}>{summary.hook}</Text>
                    <Text style={bodyText}>{summary.why_trending}</Text>
                  </>
                )}

                <Button
                  href={`${appUrl}/repo/${repo.owner}/${repo.name}`}
                  style={button}
                >
                  View repo →
                </Button>
                <Hr style={thinHr} />
              </Section>
            );
          })}

          <Section style={footer}>
            <Text style={footerText}>
              You&apos;re receiving this because you subscribed at{" "}
              <Link href={appUrl} style={footerLink}>
                {appUrl.replace(/^https?:\/\//, "")}
              </Link>
            </Text>
            <Text style={footerText}>
              <Link href={unsubscribeUrl} style={footerLink}>
                Unsubscribe
              </Link>{" "}
              · No spam, ever.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#0a0a0a",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const container = {
  maxWidth: "600px",
  margin: "0 auto",
  padding: "20px",
};

const h1 = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "700",
  margin: "0 0 8px",
};

const subtitle = {
  color: "#888",
  fontSize: "14px",
  margin: "0 0 20px",
};

const hr = {
  borderColor: "#222",
  margin: "20px 0",
};

const thinHr = {
  borderColor: "#1a1a1a",
  margin: "16px 0",
};

const repoSection = {
  padding: "0 0 4px",
};

const rankBadge = {
  color: "#22c55e",
  fontSize: "12px",
  fontWeight: "700",
  margin: "0 0 4px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

const repoTitle = {
  fontSize: "18px",
  fontWeight: "700",
  margin: "0 0 6px",
};

const repoLink = {
  color: "#ffffff",
  textDecoration: "none",
};

const statLine = {
  color: "#888",
  fontSize: "13px",
  margin: "0 0 8px",
};

const hookText = {
  color: "#e5e7eb",
  fontSize: "15px",
  fontStyle: "italic",
  margin: "0 0 6px",
};

const bodyText = {
  color: "#9ca3af",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0 0 12px",
};

const button = {
  backgroundColor: "#22c55e",
  borderRadius: "6px",
  color: "#000",
  fontSize: "13px",
  fontWeight: "600",
  padding: "8px 16px",
  textDecoration: "none",
  display: "inline-block",
};

const footer = {
  marginTop: "32px",
  paddingTop: "16px",
  borderTop: "1px solid #222",
};

const footerText = {
  color: "#555",
  fontSize: "12px",
  margin: "4px 0",
};

const footerLink = {
  color: "#777",
};
