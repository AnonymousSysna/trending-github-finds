import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function getRequestOrigin(req: NextRequest): string {
  const proto = req.headers.get("x-forwarded-proto");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");

  if (proto && host) {
    return `${proto}://${host}`;
  }

  return req.nextUrl.origin;
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const origin = getRequestOrigin(req);

  if (!token) {
    return NextResponse.redirect(new URL("/digest?error=invalid", origin));
  }

  const subscriber = await prisma.subscriber.findFirst({
    where: { confirmToken: token },
  });

  if (!subscriber) {
    return NextResponse.redirect(new URL("/digest?error=invalid", origin));
  }

  if (subscriber.confirmed) {
    return NextResponse.redirect(new URL("/digest/confirm", origin));
  }

  await prisma.subscriber.update({
    where: { id: subscriber.id },
    data: {
      confirmed: true,
      confirmedAt: new Date(),
    },
  });

  return NextResponse.redirect(new URL("/digest/confirm", origin));
}
