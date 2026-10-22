import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const host = await prisma.user.findUnique({ where: { email: 'host@airbnb.com' } })
  if (!host) {
    console.error("Host tidak ditemukan. Jalankan seed user dulu.")
    return
  }

  // Hapus properti lama jika ada, agar bersih
  await prisma.property.deleteMany({})

  // Buat 4 properti dummy di lokasi berbeda (sekitar Jakarta/Bandung/Bali)
  const properties = [
    {
      title: "Vila Mewah Pinggir Pantai Bali",
      description: "Nikmati pengalaman menginap tak terlupakan dengan pemandangan langsung menghadap samudra Hindia. Dilengkapi dengan kolam renang pribadi dan akses langsung ke pantai.",
      price: 150,
      address: "Seminyak, Bali",
      latitude: -8.6914,
      longitude: 115.1633,
      maxGuests: 4,
      hostId: host.id,
    },
    {
      title: "Apartemen Modern Pusat Kota Jakarta",
      description: "Apartemen studio yang bersih dan modern di tengah hiruk pikuk kota. Berjalan kaki saja ke mall, MRT, dan restoran terbaik di Jakarta Selatan.",
      price: 60,
      address: "Sudirman, Jakarta",
      latitude: -6.2255,
      longitude: 106.8121,
      maxGuests: 2,
      hostId: host.id,
    },
    {
      title: "Kabin Kayu Sejuk Lembang",
      description: "Kabur dari panasnya kota dengan menginap di kabin kayu pegunungan Lembang. Udara sejuk, api unggun, dan pemandangan kebun teh membentang hijau.",
      price: 85,
      address: "Lembang, Bandung",
      latitude: -6.8160,
      longitude: 107.6186,
      maxGuests: 6,
      hostId: host.id,
    },
    {
      title: "Rumah Etnik Estetik Yogyakarta",
      description: "Menginap di rumah bernuansa Jawa kuno dengan fasilitas modern. Dekat dengan Malioboro dan keraton. Sangat cocok untuk keluarga.",
      price: 45,
      address: "Kraton, Yogyakarta",
      latitude: -7.8053,
      longitude: 110.3642,
      maxGuests: 4,
      hostId: host.id,
    }
  ]

  for (const p of properties) {
    await prisma.property.create({ data: p })
  }

  console.log('Dummy properties seeded!')
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