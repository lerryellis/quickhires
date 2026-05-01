import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as any).userType !== "admin") return null;
  return session;
}

function toCSV(rows: Record<string, any>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    const s = v == null ? "" : String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type") ?? "bookings";

  let csv = "";
  let filename = "";

  if (type === "bookings") {
    const rows = await prisma.booking.findMany({
      include: {
        user: { select: { fullName: true, email: true } },
        provider: { include: { user: { select: { fullName: true } } } },
        service: true,
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });
    csv = toCSV(
      rows.map((b) => ({
        booking_id: b.id,
        customer: b.user.fullName,
        email: b.user.email,
        provider: b.provider.user.fullName,
        service: b.service.serviceName,
        price: Number(b.service.price).toFixed(2),
        status: b.status,
        payment_status: b.payment?.paymentStatus ?? "none",
        booking_date: b.bookingDate.toISOString(),
        created_at: b.createdAt.toISOString(),
      }))
    );
    filename = "bookings.csv";
  } else if (type === "payments") {
    const rows = await prisma.payment.findMany({
      include: { booking: { include: { user: { select: { fullName: true } } } } },
      orderBy: { paymentDate: "desc" },
    });
    csv = toCSV(
      rows.map((p) => ({
        payment_id: p.id,
        booking_id: p.bookingId,
        customer: p.booking.user.fullName,
        amount: Number(p.amount).toFixed(2),
        method: p.paymentMethod,
        status: p.paymentStatus,
        date: p.paymentDate.toISOString(),
      }))
    );
    filename = "payments.csv";
  } else if (type === "users") {
    const rows = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    csv = toCSV(
      rows.map((u) => ({
        user_id: u.id,
        full_name: u.fullName,
        email: u.email,
        phone: u.phone ?? "",
        user_type: u.userType,
        created_at: u.createdAt.toISOString(),
      }))
    );
    filename = "users.csv";
  } else if (type === "providers") {
    const rows = await prisma.serviceProvider.findMany({
      include: { user: { select: { fullName: true, email: true } } },
    });
    csv = toCSV(
      rows.map((p) => ({
        provider_id: p.id,
        full_name: p.user.fullName,
        email: p.user.email,
        category: p.serviceCategory,
        is_verified: p.isVerified,
        is_featured: p.isFeatured,
        rating: Number(p.rating).toFixed(2),
        joined_at: p.joinedAt.toISOString(),
      }))
    );
    filename = "providers.csv";
  } else {
    return NextResponse.json({ error: "Unknown export type" }, { status: 400 });
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
