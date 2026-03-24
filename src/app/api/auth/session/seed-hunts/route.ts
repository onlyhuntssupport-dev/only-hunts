import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET() {
  const demoHunts = [
    {
      title: "Majestic Kudu Bull - Limpopo",
      outfitterName: "Wild Savannah Safaris",
      species: ["Kudu", "Impala"],
      price: 1850,
      location: "Limpopo Province, SA",
      status: "PENDING",
      thumbnail: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?q=80&w=1000",
      createdAt: new Date().toISOString()
    },
    {
      title: "Cape Buffalo Expedition",
      outfitterName: "Bushveld Pro Hunts",
      species: ["Buffalo"],
      price: 11000,
      location: "Eastern Cape, SA",
      status: "PENDING",
      thumbnail: "https://images.unsplash.com/photo-1516466723877-e4ec1d736c8a?q=80&w=1000",
      createdAt: new Date().toISOString()
    }
  ];

  try {
    const batch = adminDb.batch();
    
    demoHunts.forEach(hunt => {
      const docRef = adminDb.collection("hunts").doc();
      batch.set(docRef, hunt);
    });

    await batch.commit();
    
    return NextResponse.json({ 
      success: true, 
      message: "Only-Hunts Marketplace Initialized with test data." 
    });
  } catch (err: any) {
    return NextResponse.json({ 
      success: false, 
      error: err.message 
    });
  }
}