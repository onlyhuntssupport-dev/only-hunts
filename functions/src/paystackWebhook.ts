import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as crypto from "crypto";

// Ensure Admin SDK is initialized (usually done in your main index.ts)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

export const paystackWebhook = onRequest(
  { secrets: ["PAYSTACK_SECRET_KEY"] },
  async (req, res) => {
    // 1. Validate HTTP Method
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    // 2. Cryptographic Signature Verification
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      console.error("Missing PAYSTACK_SECRET_KEY");
      res.status(500).send("Internal Server Error");
      return;
    }

    const hash = crypto
      .createHmac("sha512", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    const paystackSignature = req.headers["x-paystack-signature"];

    if (hash !== paystackSignature) {
      console.error("Invalid Webhook Signature. Potential Spoofing Attempt.");
      res.status(401).send("Unauthorized");
      return;
    }

    // 3. Process the Verified Payload
    const event = req.body;

    // Acknowledge receipt to Paystack immediately to prevent timeouts/retries
    res.status(200).send("Webhook Received");

    try {
      if (event.event === "charge.success") {
        const { reference, amount, metadata, customer, paid_at } = event.data;
        
        // Convert Paystack amount (in cents) to ZAR
        const grossAmountZAR = amount / 100;
        
        // Determine transaction type from metadata payload
        const transactionType = metadata?.type || "unknown"; // 'subscription', 'commission', 'deposit'
        const outfitterId = metadata?.outfitterId || "unassigned";

        // Calculate 15% VAT for the R800 subscriptions (Platform as Principal)
        let vatAmount = 0;
        if (transactionType === "subscription") {
          // VAT fraction: 15/115 to extract VAT from a VAT-inclusive amount
          vatAmount = Number(((grossAmountZAR * 15) / 115).toFixed(2));
        }

        // 4. Write to the Immutable Ledger via Admin SDK
        await db.collection("transactions").doc(reference).set({
          transactionId: reference,
          outfitterId: outfitterId,
          customerEmail: customer?.email || "unknown",
          type: transactionType,
          grossAmountZAR: grossAmountZAR,
          vatZAR: vatAmount,
          status: "Paid",
          timestamp: admin.firestore.Timestamp.fromDate(new Date(paid_at)),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`Successfully logged transaction: ${reference}`);
      }
    } catch (error) {
      console.error("Error processing webhook payload:", error);
      // We already returned 200 to Paystack, so we just log the internal failure
    }
  }
);