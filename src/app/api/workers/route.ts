import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const workers = await prisma.worker.findMany({
      include: {
        workOrders: {
          select: { id: true, status: true, priority: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({
      data: workers.map((w) => ({
        id: w.id,
        name: w.name,
        email: w.email,
        role: w.role,
        isActive: w.isActive,
        activeTasks: w.workOrders.filter((o) =>
          ['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(o.status),
        ).length,
        totalTasks: w.workOrders.length,
      })),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}