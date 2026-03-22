import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/digest/unsubscribe?error=invalid", req.url));
  }

  const subscriber = await prisma.subscriber.findFirst({
    where: { unsubscribeToken: token },
  });

  if (!subscriber) {
    return NextResponse.redirect(new URL("/digest/unsubscribe?error=invalid", req.url));
  }

  await prisma.subscriber.delete({ where: { id: subscriber.id } });

  return NextResponse.redirect(new URL("/digest/unsubscribe?success=true", req.url));
}
