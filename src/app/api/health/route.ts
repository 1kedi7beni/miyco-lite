import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [workerCount, workOrderCount] = await Promise.all([
      prisma.worker.count(),
      prisma.workOrder.count(),
    ])

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: {
        workers: workerCount,
        workOrders: workOrderCount,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}