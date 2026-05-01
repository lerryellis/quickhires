import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = parseInt(session.user.id);
  const provider = await prisma.serviceProvider.findUnique({
    where: { userId },
    include: { services: { orderBy: { createdAt: "desc" } } },
  });

  if (!provider) return NextResponse.json([]);
  return NextResponse.json(JSON.parse(JSON.stringify(provider.services)));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = parseInt(session.user.id);
  const userType = (session.user as any).userType;

  if (userType !== "provider" && userType !== "both") {
    return NextResponse.json({ error: "Not a provider account" }, { status: 403 });
  }

  const { serviceName, description, price, duration } = await req.json();
  if (!serviceName?.trim() || !price) {
    return NextResponse.json({ error: "Service name and price are required" }, { status: 400 });
  }

  const provider = await prisma.serviceProvider.findUnique({ where: { userId } });
  if (!provider) return NextResponse.json({ error: "Provider profile not found" }, { status: 404 });

  const service = await prisma.service.create({
    data: {
      providerId: provider.id,
      serviceName: serviceName.trim(),
      description,
      price: parseFloat(price),
      duration: duration ? parseInt(duration) : null,
      isActive: true,
    },
  });

  return NextResponse.json(JSON.parse(JSON.stringify(service)), { status: 201 });
}
