import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const host = await prisma.user.findFirst({ where: { role: 'HOST' } });
  if (!host) throw new Error("No host found");

  const properties = [
    // --- BALI CLUSTER ---
    {
      title: "Villa Seminyak Asri",
      description: "Beautiful private pool villa in the heart of Seminyak.",
      price: 150, // USD approx
      latitude: -8.6833,
      longitude: 115.1667,
      address: "Seminyak, Bali",
      maxGuests: 4,
      imageUrls: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800"]
    },
    {
      title: "Canggu Surfer's Paradise",
      description: "Modern loft just 5 minutes from Echo Beach.",
      price: 90,
      latitude: -8.6478,
      longitude: 115.1385,
      address: "Canggu, Bali",
      maxGuests: 2,
      imageUrls: ["https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&q=80&w=800"]
    },
    {
      title: "Ubud Tranquility Retreat",
      description: "Escape to the rice terraces in this wooden eco-lodge.",
      price: 110,
      latitude: -8.5069,
      longitude: 115.2625,
      address: "Ubud, Bali",
      maxGuests: 3,
      imageUrls: ["https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&q=80&w=800"]
    },
    {
      title: "Kuta Beachfront Apartment",
      description: "Wake up to the sound of waves in this 2-bedroom apartment.",
      price: 130,
      latitude: -8.7185,
      longitude: 115.1686,
      address: "Kuta, Bali",
      maxGuests: 4,
      imageUrls: ["https://images.unsplash.com/photo-1502672260266-1c1de2d93688?auto=format&fit=crop&q=80&w=800"]
    },
    {
      title: "Luxury Jimbaran Estate",
      description: "Spacious estate overlooking Jimbaran bay. Perfect for families.",
      price: 350,
      latitude: -8.7667,
      longitude: 115.1667,
      address: "Jimbaran, Bali",
      maxGuests: 8,
      imageUrls: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800"]
    },

    // --- BANDUNG CLUSTER ---
    {
      title: "Lembang Pine Cabin",
      description: "Cozy wooden cabin surrounded by pine trees.",
      price: 60,
      latitude: -6.8143,
      longitude: 107.6186,
      address: "Lembang, Bandung",
      maxGuests: 4,
      imageUrls: ["https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&q=80&w=800"]
    },
    {
      title: "Dago Pakar City View Villa",
      description: "Modern villa with a stunning night view of Bandung city.",
      price: 120,
      latitude: -6.8451,
      longitude: 107.6253,
      address: "Dago, Bandung",
      maxGuests: 6,
      imageUrls: ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800"]
    },
    {
      title: "Braga Historic Apartment",
      description: "Stay in the heart of Bandung's historic district.",
      price: 45,
      latitude: -6.9175,
      longitude: 107.6090,
      address: "Braga, Bandung",
      maxGuests: 2,
      imageUrls: ["https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&q=80&w=800"]
    },
    {
      title: "Setiabudi Family Guesthouse",
      description: "Comfortable and spacious guesthouse for family trips.",
      price: 75,
      latitude: -6.8624,
      longitude: 107.5941,
      address: "Setiabudi, Bandung",
      maxGuests: 8,
      imageUrls: ["https://images.unsplash.com/photo-1574362848149-11496d93a7c7?auto=format&fit=crop&q=80&w=800"]
    },

    // --- JAKARTA CLUSTER ---
    {
      title: "Sudirman Executive Suite",
      description: "Luxury apartment in the CBD with spectacular skyline views.",
      price: 100,
      latitude: -6.2215,
      longitude: 106.8045,
      address: "Sudirman, Jakarta",
      maxGuests: 2,
      imageUrls: ["https://images.unsplash.com/photo-1502691857118-846d5c6437b0?auto=format&fit=crop&q=80&w=800"]
    },
    {
      title: "Kemang Artsy Studio",
      description: "Hip studio apartment in Jakarta's favorite expat area.",
      price: 50,
      latitude: -6.2628,
      longitude: 106.8143,
      address: "Kemang, Jakarta",
      maxGuests: 2,
      imageUrls: ["https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&q=80&w=800"]
    },
    {
      title: "Menteng Heritage Home",
      description: "Classic colonial-style house in an elite neighborhood.",
      price: 250,
      latitude: -6.1955,
      longitude: 106.8327,
      address: "Menteng, Jakarta",
      maxGuests: 6,
      imageUrls: ["https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&q=80&w=800"]
    },
    {
      title: "PIK Coastal Apartment",
      description: "Fresh ocean breeze and vibrant culinary scene nearby.",
      price: 80,
      latitude: -6.1082,
      longitude: 106.7388,
      address: "Pantai Indah Kapuk, Jakarta",
      maxGuests: 4,
      imageUrls: ["https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&q=80&w=800"]
    },

    // --- TANGERANG CLUSTER ---
    {
      title: "BSD SkyHouse Loft",
      description: "Minimalist loft near ICE BSD. Perfect for concert goers.",
      price: 55,
      latitude: -6.3021,
      longitude: 106.6521,
      address: "BSD City, Tangerang",
      maxGuests: 3,
      imageUrls: ["https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800"]
    },
    {
      title: "Alam Sutera Green Condo",
      description: "Eco-friendly condo with amazing facilities and pools.",
      price: 65,
      latitude: -6.2238,
      longitude: 106.6506,
      address: "Alam Sutera, Tangerang",
      maxGuests: 4,
      imageUrls: ["https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=800"]
    },
    {
      title: "Bintaro Cozy Townhouse",
      description: "Spacious townhouse in a quiet, leafy neighborhood.",
      price: 70,
      latitude: -6.2842,
      longitude: 106.7289,
      address: "Bintaro, Tangerang",
      maxGuests: 5,
      imageUrls: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=800"]
    }
  ];

  console.log("Seeding properties...");
  for (const p of properties) {
    await prisma.property.create({
      data: {
        ...p,
        hostId: host.id,
      }
    });
  }
  console.log("Done seeding!");
}

main().catch(console.error).finally(() => prisma.$disconnect());