// Miyco Lite - Database seed
// Populates realistic data: 7 workers, 40 work orders, and a default workflow
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const LOCATIONS = [
  { name: 'Kadikoy Center', address: 'Caferaga Mah., Moda Cad. No:14', lat: 40.9881, lon: 29.0270 },
  { name: 'Besiktas Square', address: 'Sinanpasa Mah., Barbaros Bul.', lat: 41.0422, lon: 29.0060 },
  { name: 'Sisli Mecidiyekoy', address: 'Mecidiyekoy Mah., Buyukdere Cad.', lat: 41.0660, lon: 28.9950 },
  { name: 'Uskudar', address: 'Mimar Sinan Mah.', lat: 41.0260, lon: 29.0150 },
  { name: 'Maltepe Coast', address: 'Yali Mah., Sahil Yolu', lat: 40.9230, lon: 29.1400 },
  { name: 'Atasehir', address: 'Kucukbakkalkoy Mah.', lat: 40.9923, lon: 29.1244 },
  { name: 'Beyoglu Taksim', address: 'Gumussuyu Mah.', lat: 41.0370, lon: 28.9850 },
  { name: 'Fatih Vefa', address: 'Vefa Mah.', lat: 41.0166, lon: 28.9558 },
  { name: 'Bakirkoy', address: 'Zeytinlik Mah.', lat: 40.9819, lon: 28.8531 },
  { name: 'Sariyer Maslak', address: 'Maslak Mah.', lat: 41.1096, lon: 29.0194 },
  { name: 'Beykoz', address: 'Kavacik Mah.', lat: 41.0936, lon: 29.0906 },
  { name: 'Pendik', address: 'Bati Mah.', lat: 40.8776, lon: 29.2510 },
  { name: 'Kartal', address: 'Yukari Mah.', lat: 40.8908, lon: 29.1908 },
  { name: 'Beylikduzu', address: 'Yakuplu Mah.', lat: 40.9894, lon: 28.6406 },
  { name: 'Esenyurt', address: 'Incirtepe Mah.', lat: 41.0214, lon: 28.6744 },
]

const WORK_ORDER_TEMPLATES = [
  { title: 'AC Malfunction', desc: 'Split AC not cooling, refrigerant refill required.', priority: 'HIGH' },
  { title: 'Water Leak', desc: 'Main pipe burst, urgent intervention needed.', priority: 'URGENT' },
  { title: 'Periodic Maintenance', desc: 'Annual elevator maintenance.', priority: 'LOW' },
  { title: 'Power Outage', desc: 'Panel burnt, breaker keeps tripping.', priority: 'CRITICAL' },
  { title: 'Internet Outage', desc: 'Fiber cable cut, no connectivity.', priority: 'MEDIUM' },
  { title: 'Boiler Failure', desc: 'Boiler leaking, pressure dropping.', priority: 'HIGH' },
  { title: 'Elevator Door Fault', desc: 'Door not closing, possible sensor failure.', priority: 'HIGH' },
  { title: 'Generator Service', desc: 'Monthly routine check and oil change.', priority: 'MEDIUM' },
  { title: 'CCTV Installation', desc: '4-camera IP system to be installed.', priority: 'MEDIUM' },
  { title: 'Fire Alarm Service', desc: 'Detector test and battery replacement.', priority: 'HIGH' },
  { title: 'Gas Leak Detection', desc: 'Smell reported, urgent inspection.', priority: 'CRITICAL' },
  { title: 'Door Closer Repair', desc: 'Spring door not closing properly.', priority: 'LOW' },
  { title: 'Water Tank Cleaning', desc: 'Annual disinfection.', priority: 'MEDIUM' },
  { title: 'Pool Maintenance', desc: 'Chemical balancing.', priority: 'LOW' },
  { title: 'Garden Lighting', desc: 'LED conversion required.', priority: 'LOW' },
  { title: 'Roof Insulation', desc: 'Leak after rainfall.', priority: 'HIGH' },
  { title: 'Window Glass Replacement', desc: 'Broken glass needs replacement.', priority: 'MEDIUM' },
  { title: 'HVAC Fan Motor', desc: 'Fan motor making burning noise.', priority: 'HIGH' },
]

const DEFAULT_STAGES = [
  { name: 'Intake', slug: 'intake', description: 'New request received', order: 1, color: 'slate', isInitial: true, requiresAssignee: false },
  { name: 'Dispatch', slug: 'dispatch', description: 'Technician assigned and dispatched', order: 2, color: 'blue', requiresAssignee: true },
  { name: 'On-Site', slug: 'on-site', description: 'Technician on site, work in progress', order: 3, color: 'indigo', requiresAssignee: true },
  { name: 'QA Check', slug: 'qa-check', description: 'Quality assurance verification', order: 4, color: 'amber', requiresAssignee: false },
  { name: 'Completed', slug: 'completed', description: 'Job completed and closed', order: 5, color: 'emerald', isFinal: true, requiresAssignee: false },
]

const WORKERS = [
  { name: 'Ahmet Yilmaz', email: 'ahmet.yilmaz@miyco.io', role: 'EXPERT' },
  { name: 'Mehmet Demir', email: 'mehmet.demir@miyco.io', role: 'TECHNICIAN' },
  { name: 'Ayse Kaya', email: 'ayse.kaya@miyco.io', role: 'TECHNICIAN' },
  { name: 'Burak Sahin', email: 'burak.sahin@miyco.io', role: 'EXPERT' },
  { name: 'Zeynep Celik', email: 'zeynep.celik@miyco.io', role: 'TECHNICIAN' },
  { name: 'Can Ozturk', email: 'can.ozturk@miyco.io', role: 'TECHNICIAN' },
  { name: 'Elif Aydin', email: 'elif.aydin@miyco.io', role: 'EXPERT' },
]

async function main() {
  console.log('Seeding Miyco Lite database...')

  await prisma.stageLog.deleteMany()
  await prisma.workOrder.deleteMany()
  await prisma.workflowStage.deleteMany()
  await prisma.worker.deleteMany()
  console.log('Cleared existing data')

  // 1. Default workflow stages
  const stages = []
  for (const s of DEFAULT_STAGES) {
    const created = await prisma.workflowStage.create({ data: s })
    stages.push(created)
  }
  console.log(`Created ${stages.length} workflow stages`)

  // 2. Workers
  const workers = await Promise.all(
    WORKERS.map((w) => prisma.worker.create({ data: w })),
  )
  console.log(`Created ${workers.length} workers`)

  const intake = stages.find((s) => s.slug === 'intake')
  const dispatch = stages.find((s) => s.slug === 'dispatch')
  const onSite = stages.find((s) => s.slug === 'on-site')
  const completed = stages.find((s) => s.slug === 'completed')

  // Map old statuses to stages for seed data
  const stageForStatus = {
    PENDING: intake.id,
    ASSIGNED: dispatch.id,
    IN_PROGRESS: onSite.id,
    COMPLETED: completed.id,
  }

  // 3. Work orders
  const statuses = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED']
  let created = 0

  for (let i = 0; i < 40; i++) {
    const tpl = WORK_ORDER_TEMPLATES[i % WORK_ORDER_TEMPLATES.length]
    const loc = LOCATIONS[i % LOCATIONS.length]
    const status = statuses[i % statuses.length]
    const woNumber = `WO-${1001 + i}`
    const assignedTo = status === 'PENDING' ? null : workers[i % workers.length]

    const daysOffset = i - 20
    const baseDate = new Date()
    baseDate.setDate(baseDate.getDate() + daysOffset)

    const wo = await prisma.workOrder.create({
      data: {
        woNumber,
        title: tpl.title,
        description: tpl.desc,
        priority: tpl.priority,
        status,
        currentStageId: stageForStatus[status],
        locationName: loc.name,
        address: loc.address,
        latitude: loc.lat + (Math.random() - 0.5) * 0.01,
        longitude: loc.lon + (Math.random() - 0.5) * 0.01,
        assignedToId: assignedTo ? assignedTo.id : null,
        scheduledDate: status !== 'COMPLETED' ? baseDate : null,
        completedAt: status === 'COMPLETED' ? baseDate : null,
      },
    })

    // Initial stage log
    await prisma.stageLog.create({
      data: {
        workOrderId: wo.id,
        stageId: intake.id,
        note: 'Work order created',
        movedBy: 'system',
      },
    })

    if (status !== 'PENDING') {
      await prisma.stageLog.create({
        data: {
          workOrderId: wo.id,
          stageId: stageForStatus[status],
          note: status === 'COMPLETED' ? 'Job completed' : 'Moved to active stage',
          movedBy: assignedTo ? assignedTo.name : 'system',
        },
      })
    }

    created++
  }

  const allWos = await prisma.workOrder.findMany({ select: { status: true } })

  console.log(`Created ${created} work orders`)
  console.log('')
  console.log('Summary:')
  console.log(`  Total Workers     : ${workers.length}`)
  console.log(`  Workflow Stages   : ${stages.length}`)
  console.log(`  Total Work Orders : ${created}`)
  console.log(`  Pending           : ${allWos.filter((w) => w.status === 'PENDING').length}`)
  console.log(`  Assigned          : ${allWos.filter((w) => w.status === 'ASSIGNED').length}`)
  console.log(`  In Progress       : ${allWos.filter((w) => w.status === 'IN_PROGRESS').length}`)
  console.log(`  Completed         : ${allWos.filter((w) => w.status === 'COMPLETED').length}`)
  console.log('')
  console.log('Seed complete!')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
