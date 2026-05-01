import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { calculatePayout, COMMISSION_RATE } from "@/lib/taxes";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { bookingId, paymentMethod, mobileNetwork, mobilePhone } = body;

  if (!bookingId || !paymentMethod) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: parseInt(bookingId) },
    include: {
      service: true,
      provider: { include: { user: { select: { id: true, fullName: true } } } },
      user: { select: { id: true, fullName: true } },
    },
  });

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.status !== "completed") {
    return NextResponse.json({ error: "Booking must be completed before payment" }, { status: 400 });
  }

  const serviceAmount = Number(booking.service.price);
  const payout = calculatePayout(serviceAmount, paymentMethod);

  const payment = await prisma.payment.create({
    data: {
      bookingId: booking.id,
      amount: serviceAmount,
      paymentMethod: paymentMethod as any,
      paymentStatus: "completed",
    },
  });

  // For cash: provider owes commission separately
  if (paymentMethod === "cash") {
    const commission = serviceAmount * COMMISSION_RATE;
    await prisma.providerCommission.upsert({
      where: { bookingId: booking.id },
      update: {},
      create: {
        bookingId: booking.id,
        providerId: booking.providerId,
        amount: commission,
        status: "owed",
      },
    });
    await createNotification(
      booking.provider.userId,
      "commission",
      "Commission Due",
      `A 10% platform commission of GH₵ ${commission.toFixed(2)} is due for cash booking #${booking.id}. Pay from your dashboard.`,
      "/dashboard"
    );
  } else {
    // For card/momo: release payout automatically
    const ref = `PAYOUT-${Math.random().toString(16).slice(2, 10).toUpperCase()}`;
    await prisma.providerPayout.upsert({
      where: { bookingId: booking.id },
      update: {},
      create: {
        bookingId: booking.id,
        providerId: booking.providerId,
        grossAmount: payout.grossAmount,
        commissionAmount: payout.commissionAmount,
        taxAmount: payout.taxAmount,
        payoutAmount: payout.payoutAmount,
        paymentMethod: paymentMethod,
        payoutReference: ref,
        status: "released",
        releasedAt: new Date(),
      },
    });
    await createNotification(
      booking.provider.userId,
      "payment",
      "Payout Released",
      `Payout of GH₵ ${payout.payoutAmount.toFixed(2)} released for booking #${booking.id}. Platform commission GH₵ ${payout.commissionAmount.toFixed(2)} was deducted automatically.`,
      "/dashboard"
    );
  }

  await createNotification(
    booking.provider.userId,
    "payment",
    "Payment Received",
    `You received GH₵ ${serviceAmount.toFixed(2)} for booking #${booking.id}.`,
    "/dashboard"
  );

  return NextResponse.json({ payment, payout });
}
