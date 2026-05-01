import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || (session.user as any).userType !== "admin") redirect("/");

  let data: any = {
    users: [], bookings: [], payments: [], providers: [],
    verifications: [], feedback: [], totalRevenue: 0, categories: [],
  };

  try {
    const [users, bookings, payments, providers, verifications, feedback, categories] = await Promise.all([
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
        include: { provider: { include: { user: { select: { fullName: true } } } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.platformFeedback.findMany({
        include: { user: { select: { fullName: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.homepageCategory.findMany({ orderBy: { displayOrder: "asc" } }),
    ]);

    const totalRevenue = payments
      .filter((p) => p.paymentStatus === "completed")
      .reduce((s, p) => s + Number(p.amount) * 0.1, 0);

    data = JSON.parse(JSON.stringify({ users, bookings, payments, providers, verifications, feedback, totalRevenue, categories }));
  } catch {
    // DB not connected
  }

  return <AdminClient {...data} />;
}
