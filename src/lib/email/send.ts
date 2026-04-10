import { sendPlatformEmail } from '@/lib/email/sender'; // NEW CENTRAL UTILITY
import InquiryAlert from '@/emails/InquiryAlert';
import type { Inquiry } from '@/lib/validations/inquiry';

interface OutfitterProfile {
  displayName: string;
  email: string;
}

interface EmailData {
  outfitter: OutfitterProfile;
  inquiry: Inquiry;
}

export const sendInquiryEmail = async ({ outfitter, inquiry }: EmailData) => {
  if (!outfitter.email) {
    console.error(`Outfitter ${outfitter.displayName} has no email address. Cannot send inquiry notification.`);
    return;
  }

  try {
    const result = await sendPlatformEmail({
      to: outfitter.email,
      subject: `New Hunt Inquiry: ${inquiry.huntTitle}`,
      react: InquiryAlert({
        outfitterName: outfitter.displayName || 'Outfitter',
        hunterName: inquiry.hunterName,
        huntTitle: inquiry.huntTitle,
        message: inquiry.message,
      }),
    });

    if (!result.success) {
      throw result.error;
    }

    console.log(`Inquiry email sent successfully to ${outfitter.email}.`);

  } catch (error) {
    console.error("Email sending failed:", error);
  }
};