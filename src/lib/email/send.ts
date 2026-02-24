import { Resend } from 'resend';
import InquiryAlert from '@/emails/InquiryAlert';
import type { Inquiry } from '@/lib/validations/inquiry';

const resend = new Resend(process.env.RESEND_API_KEY);

interface OutfitterProfile {
  displayName: string;
  email: string;
}

interface EmailData {
  outfitter: OutfitterProfile;
  inquiry: Inquiry;
}

export const sendInquiryEmail = async ({ outfitter, inquiry }: EmailData) => {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your-resend-api-key') {
    console.warn("RESEND_API_KEY is not set. Skipping email notification.");
    return;
  }
  if (!outfitter.email) {
    console.error(`Outfitter ${outfitter.displayName} has no email address. Cannot send inquiry notification.`);
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'OnlyHunts <notifications@onlyhunts.co.za>', // TODO: Replace with your verified Resend domain
      to: [outfitter.email],
      subject: `New Hunt Inquiry: ${inquiry.huntTitle}`,
      react: InquiryAlert({
        outfitterName: outfitter.displayName || 'Outfitter',
        hunterName: inquiry.hunterName,
        huntTitle: inquiry.huntTitle,
        message: inquiry.message,
      }),
    });

    if (error) {
      throw error;
    }

    console.log(`Inquiry email sent successfully to ${outfitter.email}. Message ID: ${data?.id}`);

  } catch (error) {
    console.error("Email sending failed:", error);
    // In a real app, you'd want to log this to a service like Sentry or Axiom
  }
};
