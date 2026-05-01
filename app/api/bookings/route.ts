import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = parseInt(session.user.id);
  const userType = (session.user as any).userType;

  let bookings;

  if (userType === "provider" || userType === "both") {
    const provider = await prisma.serviceProvider.findUnique({ where: { userId } });
    if (!provider) return NextResponse.json([]);

    bookings = await prisma.booking.findMany({
      where: { providerId: provider.id },
      include: {
        user: { select: { fullName: true, email: true, phone: true } },
        service: true,
        payment: true,
        reviews: true,
      },
      orderBy: { createdAt: "desc" },
    });
  } else {
    bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        provider: { include: { user: { select: { fullName: true } } } },
        service: true,
        payment: true,
        reviews: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  return NextResponse.json(bookings);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { providerId, serviceId, bookingDate, address, notes } = body;

  if (!providerId || !serviceId || !bookingDate || !address) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const userId = parseInt(session.user.id);

  const booking = await prisma.booking.create({
    data: {
      userId,
      providerId: parseInt(providerId),
      serviceId: parseInt(serviceId),
      bookingDate: new Date(bookingDate),
      address,
      notes,
    },
    include: {
      provider: { include: { user: { select: { fullName: true } } } },
      user: { select: { fullName: true } },
    },
  });

  await createNotification(
    booking.provider.userId,
    "booking",
    "New Booking Request",
    `${booking.user.fullName} has booked your service. Check your Manage Bookings tab.`,
    "/dashboard"
  );

  return NextResponse.json(booking, { status: 201 });
}
