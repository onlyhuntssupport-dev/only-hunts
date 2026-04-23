import { app, db } from "./client";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { doc, updateDoc } from "firebase/firestore";

export const requestPushPermission = async (userId: string) => {
  try {
    // 1. APPLE RULE: Ask for permission INSTANTLY. No alerts or checks before this line.
    const permission = await Notification.requestPermission();
    alert("1. iOS Permission result: " + permission);
    
    if (permission === "granted") {
      alert("2. Permission granted! Fetching token...");
      
      const supported = await isSupported();
      if (!supported) {
        alert("❌ FAIL: Browser does not support Firebase messaging.");
        return false;
      }

      const messaging = getMessaging(app);
      const token = await getToken(messaging, {
        vapidKey: "BMrLl127KIMTz9BNWo1DdO9ypoIpG64XoRKrGFch-aP4Zc_WLS2EWXMicvReRVpIHtiSUzsWGjt9M-sj0IM9CeI"
      });

      if (token) {
        alert("3. Token received! Saving to database...");
        await updateDoc(doc(db, "users", userId), {
          fcmToken: token
        });
        alert("✅ SUCCESS: Token saved!");
        return true;
      } else {
        alert("❌ FAIL: Google returned an empty token.");
        return false;
      }
    } else {
      alert("❌ FAIL: Permission was denied by iOS.");
      return false;
    }
  } catch (error: any) {
    alert("❌ FATAL ERROR: " + error.message);
    console.error("Error requesting push permission:", error);
    return false;
  }
};