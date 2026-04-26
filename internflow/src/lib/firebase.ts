import admin from "firebase-admin";

// Initialize Firebase Admin SDK (singleton)
if (!admin.apps.length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccount) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccount)),
      });
    } catch (error) {
      console.warn("Firebase Admin initialization failed:", error);
    }
  } else {
    console.warn("FIREBASE_SERVICE_ACCOUNT_KEY not set. Push notifications will be disabled.");
  }
}

export const firebaseAdmin = admin;

/**
 * Send a push notification to a specific device via FCM.
 */
export async function sendPushNotification(
  deviceToken: string,
  title: string,
  body: string,
  data?: Record<string, string>,
) {
  if (!admin.apps.length) {
    console.warn("Firebase not initialized. Skipping push notification.");
    return { success: false, reason: "firebase_not_initialized" };
  }

  try {
    const response = await admin.messaging().send({
      token: deviceToken,
      notification: { title, body },
      data: data || {},
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "internflow_notifications",
        },
      },
    });

    return { success: true, messageId: response };
  } catch (error: unknown) {
    const err = error as { code?: string };
    console.error("FCM send error:", err);

    // If token is invalid, caller should remove it from DB
    if (err.code === "messaging/registration-token-not-registered") {
      return { success: false, reason: "invalid_token" };
    }

    return { success: false, reason: "send_failed" };
  }
}

/**
 * Send a push notification to multiple devices.
 */
export async function sendPushToMultiple(
  deviceTokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>,
) {
  if (!admin.apps.length || deviceTokens.length === 0) return { successCount: 0, failureCount: 0 };

  try {
    const response = await admin.messaging().sendEachForMulticast({
      tokens: deviceTokens,
      notification: { title, body },
      data: data || {},
      android: {
        priority: "high",
        notification: {
          sound: "default",
          channelId: "internflow_notifications",
        },
      },
    });

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.error("FCM multicast error:", error);
    return { successCount: 0, failureCount: deviceTokens.length };
  }
}
