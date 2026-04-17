'use server';

import { z } from 'zod';
import { adminDb } from '@/lib/firebase/admin';
import { revalidatePath } from 'next/cache';

const LeadSchema = z.object({
  huntId: z.string().min(1),
  outfitterId: z.string().min(1),
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address').optional(), 
  message: z.string().min(10, 'Please provide more details in your message'),
  honeypot: z.string().max(0, { message: 'Bots are not welcome.' }).optional(),
});

type LeadFormData = z.infer<typeof LeadSchema>;

export async function submitLead(data: LeadFormData) {
  try {
    const parsedData = LeadSchema.parse(data);

    if (parsedData.honeypot) {
      console.warn('Bot detected by honeypot on lead submission.');
      return { success: true }; 
    }

    const leadPayload = {
      huntId: parsedData.huntId,
      outfitterId: parsedData.outfitterId,
      hunterDetails: {
        name: parsedData.name,
        email: parsedData.email || "Platform Secure Request",
      },
      message: parsedData.message,
      status: 'NEW', 
      createdAt: new Date().toISOString(),
    };

    await adminDb.collection('inquiries').add(leadPayload);

    return { success: true };
  } catch (error) {
    console.error('Error submitting lead:', error);
    if (error instanceof z.ZodError) {
        return { success: false, error: 'Validation failed.', issues: error.errors };
    }
    return { success: false, error: 'Failed to submit inquiry. Please try again.' };
  }
}

// --- FETCH LEADS FOR AN OUTFITTER ---
export async function getOutfitterLeads(outfitterId: string) {
  try {
    // FIX: Removed the .orderBy() to bypass the Firebase Composite Index error
    const snapshot = await adminDb.collection('inquiries')
      .where('outfitterId', '==', outfitterId)
      .get();

    if (snapshot.empty) return { success: true, data: [] };

    const leads = await Promise.all(snapshot.docs.map(async (doc) => {
      const leadData = doc.data();
      
      let huntTitle = leadData.huntTitle || "Unknown Package";
      
      if (!leadData.huntTitle) {
          try {
            const huntDoc = await adminDb.collection('hunts').doc(leadData.huntId).get();
            if (huntDoc.exists) huntTitle = huntDoc.data()?.title || "Unknown Package";
          } catch (e) {
            // Fallback
          }
      }

      return {
        id: doc.id,
        ...leadData,
        huntTitle
      };
    }));

    // OVERRIDE: Added strict 'any' typing to array parameters so TS doesn't panic over createdAt
    leads.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { success: true, data: leads };
  } catch (error: any) {
    console.error("Error fetching leads:", error);
    return { success: false, error: error.message };
  }
}

// --- UPDATE LEAD STATUS ---
export async function updateLeadStatus(leadId: string, newStatus: string) {
  try {
    await adminDb.collection('inquiries').doc(leadId).update({
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
    
    revalidatePath("/outfitter/dashboard/leads");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating lead status:", error);
    return { success: false, error: error.message };
  }
}