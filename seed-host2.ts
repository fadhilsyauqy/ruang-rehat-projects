import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10)

  // 1. Buat / Update Host 2
  const host2 = await prisma.user.upsert({
    where: { email: 'host2@airbnb.com' },
    update: {
      name: 'Siti Rahmawati (Host 2)',
      password: hashedPassword,
      role: 'HOST',
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300'
    },
    create: {
      email: 'host2@airbnb.com',
      name: 'Siti Rahmawati (Host 2)',
      password: hashedPassword,
      role: 'HOST',
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300'
    },
  })

  console.log(`Host 2 created with ID: ${host2.id}`)

  // 2. Tambahkan Rekening Bank Host 2
  await prisma.hostBankAccount.upsert({
    where: { userId: host2.id },
    update: {
      bankName: 'BCA',
      accountNumber: '8830192847',
      accountHolder: 'SITI RAHMAWATI',
    },
    create: {
      userId: host2.id,
      bankName: 'BCA',
      accountNumber: '8830192847',
      accountHolder: 'SITI RAHMAWATI',
    }
  })

  console.log('Host 2 bank account verified.')

  // 3. Tambahkan 2 Properti Milik Host 2
  const prop1 = await prisma.property.upsert({
    where: { id: 'prop-host2-joglo-kaliurang' },
    update: {
      hostId: host2.id,
    },
    create: {
      id: 'prop-host2-joglo-kaliurang',
      hostId: host2.id,
      title: 'Villa Joglo Asri Kaliurang',
      description: 'Villa bergaya Joglo tradisional modern di lereng Gunung Merapi dengan udara sejuk, kolam renang privat, dan pemandangan asri.',
      price: 75, // approx Rp 1.125.000 / night
      latitude: -7.5982,
      longitude: 110.4244,
      address: 'Kaliurang, Sleman, DI Yogyakarta',
      maxGuests: 6,
      amenities: ['WiFi', 'Kolam Renang Privat', 'Dapur Lengkap', 'Parkir Gratis', 'Pemandangan Gunung', 'Water Heater'],
      imageUrls: [
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800'
      ]
    }
  })

  const prop2 = await prisma.property.upsert({
    where: { id: 'prop-host2-lombok-cliff' },
    update: {
      hostId: host2.id,
    },
    create: {
      id: 'prop-host2-lombok-cliff',
      hostId: host2.id,
      title: 'Lombok Ocean Breeze Cliff Villa',
      description: 'Luxury cliffside villa with infinity pool and panoramic sunset views over the Indian Ocean in South Lombok.',
      price: 120, // approx Rp 1.800.000 / night
      latitude: -8.8953,
      longitude: 116.2913,
      address: 'Kuta, Pujut, Lombok Tengah, NTB',
      maxGuests: 4,
      amenities: ['WiFi', 'Infinity Pool', 'Pemandangan Laut', 'Sarapan Gratis', 'AC', 'Balkon Sunset'],
      imageUrls: [
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=800'
      ]
    }
  })

  console.log(`Created properties: ${prop1.title} and ${prop2.title}`)
  console.log('Seed Host 2 finished successfully!')
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
