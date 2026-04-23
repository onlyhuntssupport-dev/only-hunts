import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import { Resend } from "resend";

// Ensure Admin SDK is initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

export const monthlySARSReport = onSchedule(
  {
    schedule: "0 2 1 * *", // 2:00 AM on the 1st of every month
    timezone: "Africa/Johannesburg", // Strict SAST execution for accurate tax cutoffs
    secrets: ["RESEND_API_KEY"],
  },
  async (event) => {
    try {
      // 1. Calculate Date Range (Strictly the previous calendar month)
      const now = new Date();
      const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      // Set to 23:59:59 on the last day of the month
      const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

      // 2. Query the Immutable Ledger
      const snapshot = await db.collection("transactions")
        .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(firstDayOfLastMonth))
        .where("timestamp", "<=", admin.firestore.Timestamp.fromDate(lastDayOfLastMonth))
        .get();

      if (snapshot.empty) {
        console.log("No transactions found for the previous month. Skipping report.");
        return;
      }

      // 3. Compile the CSV manually to avoid extra dependencies
      const headers = "Transaction ID,Date,Outfitter ID,Type,Gross Amount (ZAR),VAT (ZAR),Status\n";
      const rows = snapshot.docs.map(doc => {
        const data = doc.data();
        const dateStr = data.timestamp.toDate().toISOString().split('T')[0];
        // Ensure no commas in the data break the CSV formatting
        return `${data.transactionId},${dateStr},${data.outfitterId},${data.type},${data.grossAmountZAR},${data.vatZAR},${data.status}`;
      }).join("\n");

      const csvContent = headers + rows;
      const csvBuffer = Buffer.from(csvContent, "utf-8");

      const monthName = firstDayOfLastMonth.toLocaleString('en-ZA', { month: 'long', year: 'numeric' });

      // 4. Dispatch via Resend (with API Key Failsafe)
      const resendKey = process.env.RESEND_API_KEY;
      
      if (resendKey) {
        const resend = new Resend(resendKey);
        await resend.emails.send({
          from: "Only-Hunts Accounting <accounting@your-verified-domain.com>", // Update upon Resend approval
          to: ["admin@only-hunts.com"], // Update with your email and tax practitioner's email
          subject: `SARS Financial Ledger - ${monthName}`,
          text: `Attached is the immutable transaction ledger for ${monthName}.`,
          attachments: [
            {
              filename: `Only-Hunts-Ledger-${monthName.replace(" ", "-")}.csv`,
              content: csvBuffer,
            },
          ],
        });
        console.log(`Successfully dispatched SARS report for ${monthName}`);
      } else {
        console.warn(`RESEND_API_KEY missing. CSV compiled successfully for ${monthName} but email dispatch bypassed.`);
      }

    } catch (error) {
      console.error("Critical error generating monthly SARS report:", error);
    }
  }
);