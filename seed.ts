import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  await prisma.user.upsert({
    where: { email: 'tamu@airbnb.com' },
    update: {},
    create: {
      email: 'tamu@airbnb.com',
      name: 'Budi (Tamu)',
      role: 'GUEST',
    },
  })

  await prisma.user.upsert({
    where: { email: 'host@airbnb.com' },
    update: {},
    create: {
      email: 'host@airbnb.com',
      name: 'Andi (Host)',
      role: 'HOST',
    },
  })

  console.log('Seed users created!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })