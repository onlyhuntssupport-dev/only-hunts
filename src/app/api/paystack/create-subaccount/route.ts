import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { businessName, bankCode, accountNumber } = body;

    if (!businessName || !bankCode || !accountNumber) {
      return NextResponse.json({ status: false, message: "Missing required banking fields" }, { status: 400 });
    }

    // ==========================================
    // MOCK MODE FOR DEVELOPMENT
    // ==========================================
    // Since you don't have an account yet, we simulate a successful Paystack response.
    // Delete this return statement when you are ready to go live.
    return NextResponse.json({
      status: true,
      message: "Subaccount created successfully",
      data: {
        subaccount_code: `SUB_mock_${Math.floor(Math.random() * 1000000)}`,
        business_name: businessName,
        bank_id: bankCode,
        account_number: accountNumber,
      }
    });

    // ==========================================
    // REAL PAYSTACK INTEGRATION
    // ==========================================
    // Uncomment this block when you have your PAYSTACK_SECRET_KEY in your .env.local file
    /*
    const response = await fetch('https://api.paystack.co/subaccount', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        business_name: businessName,
        settlement_bank: bankCode,
        account_number: accountNumber,
        percentage_charge: 10, // ONLY-HUNTS PLATFORM COMMISSION
        description: "Only-Hunts Outfitter Payout Account"
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to create Paystack Subaccount');

    return NextResponse.json(data);
    */

  } catch (error: any) {
    console.error("Paystack API Error:", error);
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}