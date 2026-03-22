import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/digest?error=invalid", req.url));
  }

  const subscriber = await prisma.subscriber.findFirst({
    where: { confirmToken: token },
  });

  if (!subscriber) {
    return NextResponse.redirect(new URL("/digest?error=invalid", req.url));
  }

  if (subscriber.confirmed) {
    return NextResponse.redirect(new URL("/digest/confirm", req.url));
  }

  await prisma.subscriber.update({
    where: { id: subscriber.id },
    data: {
      confirmed: true,
      confirmedAt: new Date(),
    },
  });

  return NextResponse.redirect(new URL("/digest/confirm", req.url));
}
