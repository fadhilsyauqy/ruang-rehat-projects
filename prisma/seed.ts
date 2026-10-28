import { PrismaClient, Role, KycStatus, CancellationPolicy } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  const defaultPassword = await bcrypt.hash('password123', 10)

  // ==========================================
  // 1. SYSTEM SETTINGS
  // ==========================================
  const systemSettings = await prisma.systemSetting.upsert({
    where: { id: 'global' },
    update: {
      baseCurrency: 'IDR',
      usdExchangeRate: 18051,
      guestServiceFeePct: 10.0,
      hostPlatformFeePct: 3.0,
      hostCancelPenaltyIdr: 250000,
      maxStayNights: 28,
    },
    create: {
      id: 'global',
      baseCurrency: 'IDR',
      usdExchangeRate: 18051,
      guestServiceFeePct: 10.0,
      hostPlatformFeePct: 3.0,
      hostCancelPenaltyIdr: 250000,
      maxStayNights: 28,
    },
  })
  console.log('✅ System settings verified.')

  // ==========================================
  // 2. USERS (Admin, Hosts, Guest)
  // ==========================================

  // Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ruangrehat.com' },
    update: {
      name: 'Administrator Ruang Rehat',
      role: Role.ADMIN,
      kycStatus: KycStatus.VERIFIED,
    },
    create: {
      email: 'admin@ruangrehat.com',
      name: 'Administrator Ruang Rehat',
      password: defaultPassword,
      role: Role.ADMIN,
      kycStatus: KycStatus.VERIFIED,
      phoneNumber: '+6281100000001',
      address: 'Kantor Pusat Ruang Rehat, SCBD Jakarta Selatan',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=300',
    },
  })

  // Pastikan akun admin@gmail.com lama juga memiliki role ADMIN jika ada
  await prisma.user.updateMany({
    where: { email: 'admin@gmail.com' },
    data: { role: Role.ADMIN, kycStatus: KycStatus.VERIFIED },
  })

  // Host 1: Andi Wijaya
  const host1 = await prisma.user.upsert({
    where: { email: 'host@ruangrehat.com' },
    update: {
      name: 'Andi Wijaya (Host Superhost)',
      role: Role.HOST,
      kycStatus: KycStatus.VERIFIED,
    },
    create: {
      email: 'host@ruangrehat.com',
      name: 'Andi Wijaya (Host Superhost)',
      password: defaultPassword,
      role: Role.HOST,
      kycStatus: KycStatus.VERIFIED,
      phoneNumber: '+6281234567890',
      address: 'Jl. Kemang Raya No. 12, Jakarta Selatan',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    },
  })

  // Rekening Bank Host 1
  await prisma.hostBankAccount.upsert({
    where: { userId: host1.id },
    update: {
      bankCode: 'BCA',
      bankName: 'Bank Central Asia',
      accountNumber: '8830192847',
      accountHolder: 'ANDI WIJAYA',
      isVerified: true,
    },
    create: {
      userId: host1.id,
      bankCode: 'BCA',
      bankName: 'Bank Central Asia',
      accountNumber: '8830192847',
      accountHolder: 'ANDI WIJAYA',
      isVerified: true,
    },
  })

  // Host 2: Siti Rahmawati
  const host2 = await prisma.user.upsert({
    where: { email: 'host2@ruangrehat.com' },
    update: {
      name: 'Siti Rahmawati (Host)',
      role: Role.HOST,
      kycStatus: KycStatus.VERIFIED,
    },
    create: {
      email: 'host2@ruangrehat.com',
      name: 'Siti Rahmawati (Host)',
      password: defaultPassword,
      role: Role.HOST,
      kycStatus: KycStatus.VERIFIED,
      phoneNumber: '+6281987654321',
      address: 'Jl. Kaliurang KM 14, Sleman, DI Yogyakarta',
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
    },
  })

  // Rekening Bank Host 2
  await prisma.hostBankAccount.upsert({
    where: { userId: host2.id },
    update: {
      bankCode: 'MANDIRI',
      bankName: 'Bank Mandiri',
      accountNumber: '1370019283741',
      accountHolder: 'SITI RAHMAWATI',
      isVerified: true,
    },
    create: {
      userId: host2.id,
      bankCode: 'MANDIRI',
      bankName: 'Bank Mandiri',
      accountNumber: '1370019283741',
      accountHolder: 'SITI RAHMAWATI',
      isVerified: true,
    },
  })

  // Guest: Budi Santoso
  const guest = await prisma.user.upsert({
    where: { email: 'tamu@ruangrehat.com' },
    update: {
      name: 'Budi Santoso (Tamu)',
      role: Role.GUEST,
    },
    create: {
      email: 'tamu@ruangrehat.com',
      name: 'Budi Santoso (Tamu)',
      password: defaultPassword,
      role: Role.GUEST,
      phoneNumber: '+6281355577799',
      address: 'Jl. Diponegoro No. 45, Bandung',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    },
  })

  console.log(`✅ Users seeded: Admin (${admin.email}), Hosts (${host1.email}, ${host2.email}), Guest (${guest.email})`)

  // ==========================================
  // 3. CURATED PROPERTIES (V2 IDR Standard)
  // ==========================================
  const propertiesData = [
    {
      id: 'prop-bali-seminyak-asri',
      hostId: host1.id,
      title: 'Villa Seminyak Asri Private Pool',
      description: 'Nikmati pengalaman menginap tropis mewah di jantung Seminyak. Dilengkapi dengan kolam renang pribadi, dapur modern, dan hanya 5 menit berjalan kaki ke pantai serta restoran ternama.',
      category: 'Villa',
      pricePerNight: 1850000,
      cleaningFee: 150000,
      latitude: -8.6833,
      longitude: 115.1667,
      address: 'Jl. Kayu Aya No. 88, Seminyak, Kuta, Bali',
      maxGuests: 4,
      maxStayNights: 28,
      amenities: ['wifi', 'pool', 'ac', 'kitchen', 'parking', 'breakfast'],
      imageUrls: [
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=800',
      ],
      cancellationPolicy: CancellationPolicy.FLEXIBLE,
      isPublished: true,
    },
    {
      id: 'prop-bali-ubud-retreat',
      hostId: host1.id,
      title: 'Ubud Tranquility Rice Field Eco-Lodge',
      description: 'Menikmati kedamaian alam Ubud dengan panorama terasering sawah yang memukau. Rumah kayu ramah lingkungan dengan fasilitas modern, studio yoga, dan udara pegunungan segar.',
      category: 'Cabin',
      pricePerNight: 1250000,
      cleaningFee: 100000,
      latitude: -8.5069,
      longitude: 115.2625,
      address: 'Jl. Raya Pengosekan, Ubud, Gianyar, Bali',
      maxGuests: 3,
      maxStayNights: 21,
      amenities: ['wifi', 'breakfast', 'workspace', 'parking'],
      imageUrls: [
        'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&q=80&w=800',
      ],
      cancellationPolicy: CancellationPolicy.MODERATE,
      isPublished: true,
    },
    {
      id: 'prop-jkt-sudirman-suite',
      hostId: host1.id,
      title: 'Sudirman Executive Sky Suite SCBD',
      description: 'Apartemen mewah di kawasan bisnis SCBD Sudirman dengan pemandangan cakrawala kota Jakarta yang spektakuler. Akses langsung ke stasiun MRT dan pusat perbelanjaan papan atas.',
      category: 'Apartment',
      pricePerNight: 1450000,
      cleaningFee: 120000,
      latitude: -6.2215,
      longitude: 106.8045,
      address: 'Kawasan SCBD, Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan',
      maxGuests: 2,
      maxStayNights: 28,
      amenities: ['wifi', 'ac', 'gym', 'pool', 'tv', 'workspace', 'self_checkin'],
      imageUrls: [
        'https://images.unsplash.com/photo-1502691857118-846d5c6437b0?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800',
      ],
      cancellationPolicy: CancellationPolicy.FLEXIBLE,
      isPublished: true,
    },
    {
      id: 'prop-bdg-lembang-cabin',
      hostId: host1.id,
      title: 'Lembang Pine Forest Wooden Cabin',
      description: 'Kabin kayu bernuansa Skandinavia di tengah sejuknya hutan pinus Lembang. Dilengkapi perapian, balkon terbuka, dan tempat api unggun untuk malam yang hangat bersama keluarga.',
      category: 'Cabin',
      pricePerNight: 950000,
      cleaningFee: 80000,
      latitude: -6.8143,
      longitude: 107.6186,
      address: 'Jl. Maribaya No. 105, Lembang, Bandung Barat, Jawa Barat',
      maxGuests: 5,
      maxStayNights: 14,
      amenities: ['wifi', 'parking', 'kitchen', 'pet_friendly'],
      imageUrls: [
        'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=800',
      ],
      cancellationPolicy: CancellationPolicy.FLEXIBLE,
      isPublished: true,
    },
    {
      id: 'prop-jogja-kaliurang-joglo',
      hostId: host2.id,
      title: 'Villa Joglo Asri Kaliurang Lereng Merapi',
      description: 'Villa bergaya Joglo tradisional Jawa dengan sentuhan modern di lereng Gunung Merapi. Suasana asri dan sejuk dengan kolam renang privat, pendopo luas, dan dapur keluarga lengkap.',
      category: 'Villa',
      pricePerNight: 1350000,
      cleaningFee: 100000,
      latitude: -7.5982,
      longitude: 110.4244,
      address: 'Kawasan Wisata Kaliurang, Sleman, DI Yogyakarta',
      maxGuests: 6,
      maxStayNights: 28,
      amenities: ['wifi', 'pool', 'kitchen', 'parking', 'breakfast'],
      imageUrls: [
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800',
      ],
      cancellationPolicy: CancellationPolicy.MODERATE,
      isPublished: true,
    },
    {
      id: 'prop-lombok-cliff-villa',
      hostId: host2.id,
      title: 'Lombok Ocean Breeze Sunset Cliff Villa',
      description: 'Villa eksklusif di atas tebing pantai Lombok Selatan dengan infinity pool menghadap langsung ke Samudra Hindia. Saksikan pemandangan matahari terbenam terbaik dari teras kamar Anda.',
      category: 'Villa',
      pricePerNight: 2450000,
      cleaningFee: 200000,
      latitude: -8.8953,
      longitude: 116.2913,
      address: 'Kawasan Pantai Kuta Mandalika, Pujut, Lombok Tengah, NTB',
      maxGuests: 4,
      maxStayNights: 28,
      amenities: ['wifi', 'pool', 'ac', 'breakfast', 'parking', 'workspace'],
      imageUrls: [
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=800',
      ],
      cancellationPolicy: CancellationPolicy.STRICT,
      isPublished: true,
    },
  ]

  for (const item of propertiesData) {
    const usdPrice = item.pricePerNight / systemSettings.usdExchangeRate
    await prisma.property.upsert({
      where: { id: item.id },
      update: {
        hostId: item.hostId,
        title: item.title,
        description: item.description,
        category: item.category,
        pricePerNight: item.pricePerNight,
        cleaningFee: item.cleaningFee,
        price: usdPrice,
        latitude: item.latitude,
        longitude: item.longitude,
        address: item.address,
        maxGuests: item.maxGuests,
        maxStayNights: item.maxStayNights,
        amenities: item.amenities,
        imageUrls: item.imageUrls,
        cancellationPolicy: item.cancellationPolicy,
        isPublished: item.isPublished,
      },
      create: {
        id: item.id,
        hostId: item.hostId,
        title: item.title,
        description: item.description,
        category: item.category,
        pricePerNight: item.pricePerNight,
        cleaningFee: item.cleaningFee,
        price: usdPrice,
        latitude: item.latitude,
        longitude: item.longitude,
        address: item.address,
        maxGuests: item.maxGuests,
        maxStayNights: item.maxStayNights,
        amenities: item.amenities,
        imageUrls: item.imageUrls,
        cancellationPolicy: item.cancellationPolicy,
        isPublished: item.isPublished,
      },
    })
  }

  // Bersihkan akun dummy lama berbasis @airbnb.com jika ada
  await prisma.user.deleteMany({
    where: {
      email: {
        in: ['host@airbnb.com', 'host2@airbnb.com', 'tamu@airbnb.com'],
      },
    },
  })

  console.log(`✅ Curated properties seeded successfully (${propertiesData.length} properties).`)
  console.log('🎉 Seeding completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
