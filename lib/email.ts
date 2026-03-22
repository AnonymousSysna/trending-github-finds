import { Resend } from "resend";
import { render } from "@react-email/components";
import { DigestEmail } from "@/emails/DigestEmail";
import type { RepoWithSnapshot } from "./types";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? "placeholder");
}
const FROM = process.env.RESEND_FROM_EMAIL ?? "digest@example.com";
const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

export async function sendConfirmationEmail(
  email: string,
  confirmToken: string
): Promise<void> {
  const confirmUrl = `${APP_URL}/digest/confirm?token=${confirmToken}`;

  const resend = getResend();
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Confirm your GitHub digest subscription",
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2>You're almost in! 🎉</h2>
        <p>Click below to confirm your subscription and start receiving daily trending GitHub repos.</p>
        <a href="${confirmUrl}" style="display:inline-block;background:#22c55e;color:#000;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0;">
          Confirm Subscription →
        </a>
        <p style="color:#888;font-size:12px;margin-top:24px;">
          If you didn't sign up, you can ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendDigestEmail(
  email: string,
  unsubscribeToken: string,
  repos: RepoWithSnapshot[],
  date: string
): Promise<void> {
  const unsubscribeUrl = `${APP_URL}/digest/unsubscribe?token=${unsubscribeToken}`;

  const html = await render(
    DigestEmail({ repos, date, unsubscribeUrl, appUrl: APP_URL }) as React.ReactElement
  );

  const resend = getResend();
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `🔥 Today's Top Trending GitHub Repos — ${date}`,
    html,
    headers: {
      "List-Unsubscribe": `<${unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
}

export async function sendDigestBatch(
  subscribers: Array<{ email: string; unsubscribeToken: string }>,
  repos: RepoWithSnapshot[],
  date: string
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  // Resend allows batch sending; process in groups of 50
  const batchSize = 50;
  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize);

    await Promise.allSettled(
      batch.map(async (sub) => {
        try {
          await sendDigestEmail(sub.email, sub.unsubscribeToken, repos, date);
          sent++;
        } catch (err) {
          console.error(`Failed to send digest to ${sub.email}:`, err);
          failed++;
        }
      })
    );
  }

  return { sent, failed };
}
