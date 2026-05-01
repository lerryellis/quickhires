import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = parseInt(session.user.id);

  const service = await prisma.service.findUnique({
    where: { id: parseInt(id) },
    include: { provider: true },
  });

  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });
  if (service.provider.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let pb: any;
  try { pb = await req.json(); } catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }
  const { serviceName, description, price, duration, isActive } = pb;
  try {
  const updated = await prisma.service.update({
    where: { id: parseInt(id) },
    data: {
      serviceName: serviceName?.trim() ?? service.serviceName,
      description: description ?? service.description,
      price: price != null ? parseFloat(price) : service.price,
      duration: duration != null ? parseInt(duration) : service.duration,
      isActive: isActive != null ? Boolean(isActive) : service.isActive,
    },
  });

  return NextResponse.json(JSON.parse(JSON.stringify(updated)));
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = parseInt(session.user.id);

  const service = await prisma.service.findUnique({
    where: { id: parseInt(id) },
    include: { provider: true },
  });

  if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });
  if (service.provider.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.service.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
