import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendConfirmationEmail } from "@/lib/email";

const subscribeSchema = z.object({
  email: z.string().email("Invalid email address"),
  frequency: z.enum(["daily", "weekly"]).default("daily"),
  source: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
});

function getRequestOrigin(req: NextRequest): string {
  const proto = req.headers.get("x-forwarded-proto");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");

  if (proto && host) {
    return `${proto}://${host}`;
  }

  return req.nextUrl.origin;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = subscribeSchema.parse(body);
    const requestOrigin = getRequestOrigin(req);

    // Check if already subscribed
    const existing = await prisma.subscriber.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      if (existing.confirmed) {
        return NextResponse.json(
          { message: "Already subscribed!", alreadySubscribed: true },
          { status: 200 }
        );
      }
      // Resend confirmation
      await sendConfirmationEmail(data.email, existing.confirmToken, requestOrigin);
      return NextResponse.json(
        { message: "Confirmation email resent. Check your inbox!" },
        { status: 200 }
      );
    }

    const subscriber = await prisma.subscriber.create({
      data: {
        email: data.email,
        frequency: data.frequency,
        source: data.source,
        utmSource: data.utm_source,
        utmMedium: data.utm_medium,
        utmCampaign: data.utm_campaign,
      },
    });

    await sendConfirmationEmail(data.email, subscriber.confirmToken, requestOrigin);

    return NextResponse.json(
      { message: "Check your email to confirm your subscription!" },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Subscribe error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
