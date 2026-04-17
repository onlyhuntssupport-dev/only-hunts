import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { defineString } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";

const callMeBotPhone = defineString("CALLMEBOT_PHONE");
const callMeBotApiKey = defineString("CALLMEBOT_API_KEY");

export const notifyAdminOnNewOutfitter = onDocumentCreated("outfitters/{outfitterId}", async (event) => {
  const snapshot = event.data;
  
  if (!snapshot) {
    logger.error("No data associated with the event");
    return;
  }

  const newOutfitter = snapshot.data();
  const name = newOutfitter.name || "Unknown Outfitter";
  const location = newOutfitter.location || "Unknown Location";
  const outfitterPhone = newOutfitter.phone || "Not provided";

  const message = `🚨 *New Outfitter Application*\n\n*Business:* ${name}\n*Contact:* ${outfitterPhone}\n*Location:* ${location}\n\nPlease check the Only-Hunts admin dashboard to review their permit and approve the account.`;
  const encodedMessage = encodeURIComponent(message);
  
  const phone = callMeBotPhone.value();
  const apiKey = callMeBotApiKey.value();
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodedMessage}&apikey=${apiKey}`;

  try {
    const response = await fetch(url);
    if (response.ok) {
      logger.info(`WhatsApp notification sent successfully for outfitter: ${name}`);
    } else {
      const errorText = await response.text();
      logger.error(`Failed to send WhatsApp notification. Status: ${response.status}. Error: ${errorText}`);
    }
  } catch (error) {
    logger.error("Error making HTTP request to CallMeBot", error);
  }
});
