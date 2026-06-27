import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import MapClient from './MapClient'

export const dynamic = 'force-dynamic'

export default async function MapPage() {
  const [workers, workOrders] = await Promise.all([
    prisma.worker.findMany({
      include: {
        workOrders: {
          where: { status: { in: ['ASSIGNED', 'IN_PROGRESS'] } },
          select: { id: true, status: true, latitude: true, longitude: true },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.workOrder.findMany({
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return (
    <div className="-m-6 md:-m-8 h-[calc(100vh-4rem)]">
      <Suspense
        fallback={
          <div className="h-full flex items-center justify-center text-slate-400 bg-slate-50">
            Loading map...
          </div>
        }
      >
        <MapClient initialWorkers={workers} initialWorkOrders={workOrders} />
      </Suspense>
    </div>
  )
}
