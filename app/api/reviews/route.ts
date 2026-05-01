import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { bookingId, rating, comment } = body;

  if (!bookingId || !rating) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const userId = parseInt(session.user.id);
  const booking = await prisma.booking.findUnique({ where: { id: parseInt(bookingId) } });

  if (!booking || booking.userId !== userId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const existing = await prisma.review.findFirst({
    where: { bookingId: parseInt(bookingId), userId },
  });

  if (existing) {
    return NextResponse.json({ error: "Already reviewed" }, { status: 409 });
  }

  const review = await prisma.review.create({
    data: {
      bookingId: parseInt(bookingId),
      userId,
      providerId: booking.providerId,
      rating: parseInt(rating),
      comment,
    },
  });

  // Update provider avg rating
  const allReviews = await prisma.review.findMany({
    where: { providerId: booking.providerId, rating: { not: null } },
    select: { rating: true },
  });
  const avg = allReviews.reduce((s, r) => s + (r.rating ?? 0), 0) / allReviews.length;
  await prisma.serviceProvider.update({
    where: { id: booking.providerId },
    data: { rating: Math.round(avg * 100) / 100 },
  });

  return NextResponse.json(review, { status: 201 });
}
