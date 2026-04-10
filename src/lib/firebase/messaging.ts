import { app, db } from "./client";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { doc, updateDoc } from "firebase/firestore";

export const requestPushPermission = async (userId: string) => {
  try {
    const supported = await isSupported();
    if (!supported) {
      console.log("Push notifications are not supported on this browser.");
      return false;
    }

    const permission = await Notification.requestPermission();
    
    if (permission === "granted") {
      const messaging = getMessaging(app);
      
      const token = await getToken(messaging, {
        vapidKey: "BMrLl127KIMTz9BNWo1DdO9ypoIpG64XoRKrGFch-aP4Zc_WLS2EWXMicvReRVpIHtiSUzsWGjt9M-sj0IM9CeI" // <--- PASTE YOUR KEY FROM STEP 2 HERE
      });

      if (token) {
        await updateDoc(doc(db, "users", userId), {
          fcmToken: token
        });
        console.log("Successfully generated and saved FCM Token!");
        return true;
      }
    } else {
      console.log("User denied notification permissions.");
      return false;
    }
  } catch (error) {
    console.error("Error requesting push permission:", error);
    return false;
  }
};