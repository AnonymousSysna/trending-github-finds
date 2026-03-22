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
    return NextResponse.redirect(new URL("/digest/unsubscribe?error=invalid", origin));
  }

  const subscriber = await prisma.subscriber.findFirst({
    where: { unsubscribeToken: token },
  });

  if (!subscriber) {
    return NextResponse.redirect(new URL("/digest/unsubscribe?error=invalid", origin));
  }

  await prisma.subscriber.delete({ where: { id: subscriber.id } });

  return NextResponse.redirect(new URL("/digest/unsubscribe?success=true", origin));
}
