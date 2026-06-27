import { prisma } from '@/lib/prisma'
import WorkOrdersClient from './WorkOrdersClient'

export const dynamic = 'force-dynamic'

export default async function WorkOrdersPage() {
  const [workOrders, workers, stages] = await Promise.all([
    prisma.workOrder.findMany({
      include: { assignedTo: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.worker.findMany({
      where: { isActive: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    }),
    prisma.workflowStage.findMany({
      orderBy: { order: 'asc' },
    }),
  ])

  return (
    <WorkOrdersClient
      initialWorkOrders={workOrders}
      workers={workers}
      stages={stages}
    />
  )
}
