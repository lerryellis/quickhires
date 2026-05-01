import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || (session.user as any).userType !== "admin") redirect("/");

  let data: any = {
    users: [], bookings: [], payments: [], providers: [],
    verifications: [], featuredRequests: [], feedback: [],
    totalRevenue: 0, categories: [],
  };

  try {
    const [users, bookings, payments, providers, verifications, featuredRequests, feedback, categories] = await Promise.all([
      prisma.user.findMany({
        select: { id: true, fullName: true, email: true, phone: true, userType: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.booking.findMany({
        include: {
          user: { select: { fullName: true } },
          provider: { include: { user: { select: { fullName: true } } } },
          service: { select: { serviceName: true, price: true } },
          payment: { select: { id: true, paymentStatus: true, paymentMethod: true, amount: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.payment.findMany({
        select: { id: true, amount: true, paymentStatus: true, paymentMethod: true, paymentDate: true, bookingId: true },
        orderBy: { paymentDate: "desc" },
      }),
      prisma.serviceProvider.findMany({
        include: { user: { select: { fullName: true, email: true, phone: true } } },
        orderBy: { rating: "desc" },
      }),
      prisma.verificationRequest.findMany({
        include: { provider: { include: { user: { select: { fullName: true, email: true } } } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.featuredRequest.findMany({
        include: { provider: { include: { user: { select: { fullName: true, email: true } } } } },
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

    data = JSON.parse(JSON.stringify({
      users, bookings, payments, providers, verifications,
      featuredRequests, feedback, totalRevenue, categories,
    }));
  } catch {
    // DB not connected — show empty admin panel
  }

  return <AdminClient {...data} />;
}
