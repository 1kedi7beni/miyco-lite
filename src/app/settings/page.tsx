import { prisma } from '@/lib/prisma'
import SettingsClient from './SettingsClient'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const [stages, workers] = await Promise.all([
    prisma.workflowStage.findMany({ orderBy: { order: 'asc' } }),
    prisma.worker.findMany({
      select: { id: true, name: true, email: true, role: true, isActive: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return <SettingsClient initialStages={stages} initialWorkers={workers} />
}