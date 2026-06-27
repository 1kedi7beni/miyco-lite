import { prisma } from '@/lib/prisma'
import WorkersClient from './WorkersClient'

export const dynamic = 'force-dynamic'

export default async function WorkersPage() {
  const workers = await prisma.worker.findMany({
    include: {
      workOrders: {
        select: {
          id: true,
          status: true,
          priority: true,
          completedAt: true,
          scheduledDate: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return <WorkersClient initialWorkers={workers} />
}
