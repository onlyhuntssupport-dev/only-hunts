import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generatePDFReceipt = (booking: any, hunterName: string = "Hunter") => {
  // 1. Initialize a standard A4 portrait document
  const doc = new jsPDF('p', 'pt', 'a4');

  // --- BRANDING & HEADER ---
  // Kalahari Orange Hex: #F97316 (rgb: 249, 115, 22)
  // Olive Green Hex: #3F4E4F (rgb: 63, 78, 79)
  
  doc.setTextColor(249, 115, 22);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("ONLY-HUNTS", 40, 60);

  doc.setTextColor(63, 78, 79);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Premium Safari Marketplace", 40, 75);
  doc.text("www.only-hunts.com", 40, 90);

  // --- RECEIPT METADATA ---
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("OFFICIAL RECEIPT", 400, 60);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Receipt ID: ${booking.id.substring(0, 8).toUpperCase()}`, 400, 75);
  doc.text(`Date Issued: ${new Date().toLocaleDateString()}`, 400, 90);
  doc.text(`Status: DEPOSIT SECURED`, 400, 105);

  // --- ENTITY INFORMATION ---
  doc.setDrawColor(200, 200, 200);
  doc.line(40, 130, 550, 130); // Divider line

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Billed To:", 40, 160);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(hunterName, 40, 175);
  // Add hunter email or address here if you have it in state

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Service Provider (Outfitter):", 300, 160);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(booking.outfitterName || "Verified Outfitter", 300, 175);
  if (booking.location) {
    doc.text(`Region: ${booking.location}`, 300, 190);
  }

  // --- PACKAGE DETAILS ---
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Package Details", 40, 240);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Safari: ${booking.huntTitle}`, 40, 260);

  // --- FINANCIAL TABLE ---
  autoTable(doc, {
    startY: 290,
    head: [['Description', 'Amount (USD)']],
    body: [
      ['Total Package Price', `$${(booking.totalPriceUSD || 0).toLocaleString()}`],
      ['Upfront Deposit (Paid via Paystack)', `-$${(booking.depositPaidUSD || 0).toLocaleString()}`],
    ],
    foot: [['BALANCE DUE ON ARRIVAL', `$${(booking.balanceDueUSD || 0).toLocaleString()}`]],
    theme: 'grid',
    headStyles: { fillColor: [63, 78, 79], textColor: [255, 255, 255], fontStyle: 'bold' },
    footStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 8 },
    columnStyles: {
      0: { cellWidth: 350 },
      1: { cellWidth: 120, halign: 'right' },
    },
  });

  // --- FOOTER & TERMS ---
  const finalY = (doc as any).lastAutoTable.finalY || 400;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(63, 78, 79);
  doc.text("Next Steps & Guarantee:", 40, finalY + 40);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  const termsText = "Your deposit has been securely processed and locked via the Only-Hunts platform. Please coordinate your exact arrival dates directly with your outfitter via the in-app messaging system. The remaining balance shown above is payable directly to the outfitter upon your arrival in camp.";
  
  // Auto-wrap the text so it doesn't run off the page
  const splitTerms = doc.splitTextToSize(termsText, 510);
  doc.text(splitTerms, 40, finalY + 55);

  // 3. Trigger the file download in the browser
  doc.save(`OnlyHunts_Receipt_${booking.id.substring(0, 8)}.pdf`);
};