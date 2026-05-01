import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const bookingId = parseInt(id);
  const body = await req.json();
  const { status } = body;

  const validStatuses = ["accepted", "completed", "cancelled"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      user: { select: { id: true, fullName: true } },
      provider: { include: { user: { select: { fullName: true } } } },
      service: true,
    },
  });

  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: status as any },
  });

  const providerName = booking.provider.user.fullName;
  const userName = booking.user.fullName;

  if (status === "accepted") {
    await createNotification(
      booking.user.id,
      "booking_accepted",
      "Booking Accepted",
      `${providerName} has accepted your booking #${bookingId}. Your service is confirmed!`,
      "/dashboard"
    );
  } else if (status === "completed") {
    await createNotification(
      booking.user.id,
      "booking_completed",
      "Service Completed",
      `${providerName} has completed your service. You can now make payment and leave a review.`,
      "/dashboard"
    );
  } else if (status === "cancelled") {
    await createNotification(
      booking.user.id,
      "booking_declined",
      "Booking Declined",
      `${providerName} has declined your booking #${bookingId}.`,
      "/dashboard"
    );
  }

  return NextResponse.json(updated);
}
