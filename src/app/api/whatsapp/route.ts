import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    // Your secure CallMeBot credentials
    const phone = "27648405560";
    const apiKey = "9858066";     
    
    // Encode the message so spaces and special characters don't break the URL
    const encodedMessage = encodeURIComponent(message || "New Outfitter Pending Approval!");
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodedMessage}&apikey=${apiKey}`;

    const response = await fetch(url);
    const text = await response.text();

    if (!response.ok) {
      throw new Error(`CallMeBot rejected the request: ${text}`);
    }

    return NextResponse.json({ success: true, response: text });
  } catch (error: any) {
    console.error("WhatsApp API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}