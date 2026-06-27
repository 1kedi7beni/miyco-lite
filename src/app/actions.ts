'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

// Map old status field to keep API/UI compatibility while using stages
const STATUS_FOR_STAGE_SLUG: Record<string, string> = {
  intake: 'PENDING',
  dispatch: 'ASSIGNED',
  'on-site': 'IN_PROGRESS',
  'qa-check': 'IN_PROGRESS',
  completed: 'COMPLETED',
}

export async function assignWorkOrder(workOrderId: number, technicianId: number) {
  const dispatchStage = await prisma.workflowStage.findUnique({
    where: { slug: 'dispatch' },
  })

  const updated = await prisma.workOrder.update({
    where: { id: workOrderId },
    data: {
      assignedToId: technicianId,
      status: 'ASSIGNED',
      currentStageId: dispatchStage?.id ?? undefined,
    },
  })

  if (dispatchStage) {
    await prisma.stageLog.create({
      data: {
        workOrderId: updated.id,
        stageId: dispatchStage.id,
        note: 'Assigned to technician',
      },
    })
  }

  revalidatePath('/')
  revalidatePath('/work-orders')
  revalidatePath('/workers')
  return { ok: true, id: updated.id }
}

export async function unassignWorkOrder(workOrderId: number) {
  const intakeStage = await prisma.workflowStage.findUnique({
    where: { slug: 'intake' },
  })

  await prisma.workOrder.update({
    where: { id: workOrderId },
    data: {
      assignedToId: null,
      status: 'PENDING',
      currentStageId: intakeStage?.id ?? undefined,
    },
  })

  if (intakeStage) {
    await prisma.stageLog.create({
      data: {
        workOrderId,
        stageId: intakeStage.id,
        note: 'Unassigned - back to intake',
      },
    })
  }

  revalidatePath('/')
  revalidatePath('/work-orders')
  revalidatePath('/workers')
  return { ok: true }
}

export async function startWorkOrder(workOrderId: number) {
  const onSiteStage = await prisma.workflowStage.findUnique({
    where: { slug: 'on-site' },
  })

  await prisma.workOrder.update({
    where: { id: workOrderId },
    data: {
      status: 'IN_PROGRESS',
      currentStageId: onSiteStage?.id ?? undefined,
    },
  })

  if (onSiteStage) {
    await prisma.stageLog.create({
      data: {
        workOrderId,
        stageId: onSiteStage.id,
        note: 'Technician on site - work started',
      },
    })
  }

  revalidatePath('/')
  revalidatePath('/work-orders')
  revalidatePath('/workers')
  return { ok: true }
}

export async function completeWorkOrder(workOrderId: number) {
  const completedStage = await prisma.workflowStage.findUnique({
    where: { slug: 'completed' },
  })

  await prisma.workOrder.update({
    where: { id: workOrderId },
    data: {
      status: 'COMPLETED',
      currentStageId: completedStage?.id ?? undefined,
      completedAt: new Date(),
    },
  })

  if (completedStage) {
    await prisma.stageLog.create({
      data: {
        workOrderId,
        stageId: completedStage.id,
        note: 'Job completed',
      },
    })
  }

  revalidatePath('/')
  revalidatePath('/work-orders')
  revalidatePath('/workers')
  return { ok: true }
}

export async function moveStage(
  workOrderId: number,
  stageId: number,
  note?: string,
) {
  const stage = await prisma.workflowStage.findUnique({
    where: { id: stageId },
  })
  if (!stage) throw new Error('Stage not found')

  if (stage.requiresAssignee) {
    const wo = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      select: { assignedToId: true },
    })
    if (!wo?.assignedToId) {
      throw new Error('This stage requires an assigned technician')
    }
  }

  const newStatus = STATUS_FOR_STAGE_SLUG[stage.slug] ?? 'PENDING'

  await prisma.workOrder.update({
    where: { id: workOrderId },
    data: {
      currentStageId: stage.id,
      status: newStatus,
      completedAt: stage.isFinal ? new Date() : undefined,
    },
  })

  await prisma.stageLog.create({
    data: {
      workOrderId,
      stageId,
      note: note ?? `Moved to ${stage.name}`,
    },
  })

  revalidatePath('/')
  revalidatePath('/work-orders')
  revalidatePath('/workers')
  return { ok: true }
}

export type TechnicianSuggestion = {
  id: number
  name: string
  role: string
  activeTasks: number
  score: number
  distanceKm: number | null
}

function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

export async function suggestTechnician(
  workOrderId: number,
): Promise<TechnicianSuggestion[]> {
  const wo = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
  })
  if (!wo) return []

  const workers = await prisma.worker.findMany({
    where: { isActive: true },
    include: {
      workOrders: {
        where: { status: { in: ['ASSIGNED', 'IN_PROGRESS'] } },
        select: { id: true, latitude: true, longitude: true, status: true },
      },
    },
  })

  const suggestions: TechnicianSuggestion[] = workers.map((w) => {
    const activeTasks = w.workOrders.length

    let lastLat: number | null = null
    let lastLon: number | null = null

    if (w.workOrders.length > 0) {
      const lats = w.workOrders
        .map((o) => o.latitude)
        .filter((v): v is number => typeof v === 'number')
      const lons = w.workOrders
        .map((o) => o.longitude)
        .filter((v): v is number => typeof v === 'number')
      if (lats.length && lons.length) {
        lastLat = lats.reduce((a, b) => a + b, 0) / lats.length
        lastLon = lons.reduce((a, b) => a + b, 0) / lons.length
      }
    }

    let distanceKmValue: number | null = null
    if (
      wo.latitude != null &&
      wo.longitude != null &&
      lastLat != null &&
      lastLon != null
    ) {
      distanceKmValue = distanceKm(wo.latitude, wo.longitude, lastLat, lastLon)
    }

    let score = 100 - activeTasks * 20
    if (distanceKmValue != null) {
      score -= distanceKmValue / 5
    }
    if (w.role === 'EXPERT') score += 10

    return {
      id: w.id,
      name: w.name,
      role: w.role,
      activeTasks,
      score: Math.max(0, Math.round(score)),
      distanceKm:
        distanceKmValue == null ? null : Math.round(distanceKmValue * 10) / 10,
    }
  })

  return suggestions.sort((a, b) => b.score - a.score).slice(0, 3)
}

export async function createWorkOrder(input: {
  title: string
  description?: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL'
  locationName?: string
  address?: string
  latitude?: number
  longitude?: number
}) {
  // Fix race condition by using timestamp + random suffix instead of sequential fetch
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const woNumber = `WO-${Date.now().toString().slice(-6)}-${randomSuffix}`;

  const intakeStage = await prisma.workflowStage.findUnique({
    where: { slug: 'intake' },
  })

  const wo = await prisma.workOrder.create({
    data: {
      woNumber,
      title: input.title,
      description: input.description,
      priority: input.priority ?? 'MEDIUM',
      status: 'PENDING',
      currentStageId: intakeStage?.id ?? null,
      locationName: input.locationName,
      address: input.address,
      latitude: input.latitude,
      longitude: input.longitude,
    },
  })

  if (intakeStage) {
    await prisma.stageLog.create({
      data: {
        workOrderId: wo.id,
        stageId: intakeStage.id,
        note: 'Work order created',
        movedBy: 'system',
      },
    })
  }

  revalidatePath('/')
  revalidatePath('/work-orders')
  revalidatePath('/workers')
  return { ok: true, woNumber }
}

// ----- Settings: Workflow Stages -----

export async function createStage(input: {
  name: string
  slug: string
  description?: string
  color?: string
  order: number
  isInitial?: boolean
  isFinal?: boolean
  requiresAssignee?: boolean
}) {
  if (input.isInitial) {
    await prisma.workflowStage.updateMany({
      where: { isInitial: true },
      data: { isInitial: false },
    })
  }
  await prisma.workflowStage.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      color: input.color ?? 'slate',
      order: input.order,
      isInitial: input.isInitial ?? false,
      isFinal: input.isFinal ?? false,
      requiresAssignee: input.requiresAssignee ?? false,
    },
  })
  revalidatePath('/settings')
  return { ok: true }
}

export async function updateStage(
  id: number,
  data: Partial<{
    name: string
    description: string
    color: string
    order: number
    isInitial: boolean
    isFinal: boolean
    isActive: boolean
    requiresAssignee: boolean
  }>,
) {
  if (data.isInitial) {
    await prisma.workflowStage.updateMany({
      where: { isInitial: true, NOT: { id } },
      data: { isInitial: false },
    })
  }
  await prisma.workflowStage.update({ where: { id }, data })
  revalidatePath('/settings')
  return { ok: true }
}

export async function deleteStage(id: number) {
  const stage = await prisma.workflowStage.findUnique({ where: { id } })
  if (!stage) return { ok: false }
  if (stage.isInitial) {
    throw new Error('Cannot delete the initial stage')
  }
  // Re-parent work orders in this stage to the initial stage
  const intake = await prisma.workflowStage.findFirst({
    where: { isInitial: true },
  })
  if (intake) {
    await prisma.workOrder.updateMany({
      where: { currentStageId: id },
      data: { currentStageId: intake.id },
    })
  }
  await prisma.workflowStage.delete({ where: { id } })
  revalidatePath('/settings')
  return { ok: true }
}

export async function reorderStages(orderedIds: number[]) {
  await prisma.$transaction(
    orderedIds.map((id, idx) =>
      prisma.workflowStage.update({
        where: { id },
        data: { order: idx + 1 },
      }),
    ),
  )
  revalidatePath('/settings')
  return { ok: true }
}

// ----- Settings: Workers -----

export async function createWorker(input: {
  name: string
  email: string
  role: 'TECHNICIAN' | 'EXPERT'
}) {
  await prisma.worker.create({ data: input })
  revalidatePath('/workers')
  revalidatePath('/settings')
  return { ok: true }
}

export async function toggleWorkerActive(id: number, isActive: boolean) {
  await prisma.worker.update({ where: { id }, data: { isActive } })
  revalidatePath('/workers')
  revalidatePath('/settings')
  return { ok: true }
}
