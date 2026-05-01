import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || (session.user as any).userType !== "admin") {
    return null;
  }
  return session;
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [users, bookings, payments, providers, verifications, feedback] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.booking.findMany({
      include: {
        user: { select: { fullName: true } },
        provider: { include: { user: { select: { fullName: true } } } },
        service: true,
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payment.findMany({ orderBy: { paymentDate: "desc" } }),
    prisma.serviceProvider.findMany({
      include: { user: { select: { fullName: true, email: true } } },
    }),
    prisma.verificationRequest.findMany({
      where: { status: "pending" },
      include: { provider: { include: { user: { select: { fullName: true } } } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.platformFeedback.findMany({
      include: { user: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalRevenue = payments
    .filter((p) => p.paymentStatus === "completed")
    .reduce((s, p) => s + Number(p.amount) * 0.1, 0);

  return NextResponse.json({ users, bookings, payments, providers, verifications, feedback, totalRevenue });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { action, targetId, data } = body;

  switch (action) {
    case "approve_verification": {
      await prisma.verificationRequest.update({
        where: { id: parseInt(targetId) },
        data: { status: "approved", reviewedAt: new Date() },
      });
      const vr = await prisma.verificationRequest.findUnique({
        where: { id: parseInt(targetId) },
        include: { provider: true },
      });
      if (vr) {
        await prisma.serviceProvider.update({
          where: { id: vr.providerId },
          data: { isVerified: true },
        });
        await createNotification(
          vr.provider.userId,
          "verification",
          "Verification Approved",
          "Your ID has been verified. You can now accept bookings.",
          "/dashboard"
        );
      }
      return NextResponse.json({ success: true });
    }

    case "reject_verification": {
      await prisma.verificationRequest.update({
        where: { id: parseInt(targetId) },
        data: { status: "rejected", adminNotes: data?.notes, reviewedAt: new Date() },
      });
      return NextResponse.json({ success: true });
    }

    case "approve_featured": {
      const expires = new Date();
      expires.setDate(expires.getDate() + 90);
      await prisma.featuredRequest.update({
        where: { id: parseInt(targetId) },
        data: { requestStatus: "approved", approvedAt: new Date(), expiresAt: expires },
      });
      const fr = await prisma.featuredRequest.findUnique({ where: { id: parseInt(targetId) } });
      if (fr) {
        await prisma.serviceProvider.update({
          where: { id: fr.providerId },
          data: { isFeatured: true },
        });
      }
      return NextResponse.json({ success: true });
    }

    case "reply_feedback": {
      await prisma.platformFeedback.update({
        where: { id: parseInt(targetId) },
        data: { adminReply: data?.reply, isRead: true },
      });
      const fb = await prisma.platformFeedback.findUnique({ where: { id: parseInt(targetId) } });
      if (fb) {
        await createNotification(
          fb.userId,
          "support",
          "QuickHire Support Response",
          `We've responded to your feedback: "${data?.reply?.slice(0, 80)}..."`,
          "/dashboard"
        );
      }
      return NextResponse.json({ success: true });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
