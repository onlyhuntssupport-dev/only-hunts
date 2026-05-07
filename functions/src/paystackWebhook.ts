import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as crypto from "crypto";

// Ensure Admin SDK is initialized
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
      const { data } = event;
      const outfitterId = data?.metadata?.outfitterId;

      // --- UPGRADE LOGIC ---
      if (event.event === "charge.success") {
        const { reference, amount, customer, paid_at } = data;
        
        // Convert Paystack amount (in cents) to ZAR
        const grossAmountZAR = amount / 100;
        
        // Determine transaction type from metadata payload
        const transactionType = data.metadata?.type || "subscription"; 
        
        // Calculate 15% VAT for the R800 subscriptions
        let vatAmount = 0;
        if (transactionType === "subscription") {
          vatAmount = Number(((grossAmountZAR * 15) / 115).toFixed(2));
        }

        // Write to the Immutable Ledger
        await db.collection("transactions").doc(reference).set({
          transactionId: reference,
          outfitterId: outfitterId || "unassigned",
          customerEmail: customer?.email || "unknown",
          type: transactionType,
          grossAmountZAR: grossAmountZAR,
          vatZAR: vatAmount,
          status: "Paid",
          timestamp: admin.firestore.Timestamp.fromDate(new Date(paid_at)),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        console.log(`Successfully logged transaction: ${reference}`);

        // Trigger the PRO Upgrade
        if (outfitterId && transactionType === "subscription") {
          await db.collection("outfitters").doc(outfitterId).update({
            tier: "PRO",
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`Upgraded Outfitter ${outfitterId} to PRO Tier.`);
        }
      }

      // --- DOWNGRADE LOGIC (The Soft Lock Trigger) ---
      if (event.event === "subscription.disable" || event.event === "charge.failed") {
        if (outfitterId) {
          await db.collection("outfitters").doc(outfitterId).update({
            tier: "STANDARD",
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`Downgraded Outfitter ${outfitterId} to STANDARD Tier due to cancellation/failure.`);
        }
      }

    } catch (error) {
      console.error("Error processing webhook payload:", error);
      // We already returned 200 to Paystack, so we just log the internal failure
    }
  }
);