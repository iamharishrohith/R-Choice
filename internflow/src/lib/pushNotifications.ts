/**
 * Capacitor Push Notification Setup
 * 
 * This script should be loaded in the mobile app (via Capacitor) to:
 * 1. Request push notification permission
 * 2. Get the FCM device token
 * 3. Register it with the InternFlow server
 * 4. Listen for incoming push notifications
 * 
 * Usage: Import and call `initPushNotifications()` after user login.
 */

import { PushNotifications } from "@capacitor/push-notifications";
import { Capacitor } from "@capacitor/core";

export async function initPushNotifications() {
  // Only run on native platforms
  if (!Capacitor.isNativePlatform()) {
    console.log("Push notifications are only available on native platforms.");
    return;
  }

  // Request permission
  const permResult = await PushNotifications.requestPermissions();
  if (permResult.receive !== "granted") {
    console.warn("Push notification permission denied.");
    return;
  }

  // Register with FCM
  await PushNotifications.register();

  // Listen for successful registration
  PushNotifications.addListener("registration", async (token) => {
    console.log("FCM Token:", token.value);

    // Send token to our server
    try {
      const platform = Capacitor.getPlatform(); // 'android' or 'ios'
      await fetch("/api/fcm/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // send auth cookies
        body: JSON.stringify({
          token: token.value,
          platform,
        }),
      });
    } catch (error) {
      console.error("Failed to register FCM token with server:", error);
    }
  });

  // Listen for registration errors
  PushNotifications.addListener("registrationError", (error) => {
    console.error("Push registration error:", error);
  });

  // Listen for incoming push notifications (foreground)
  PushNotifications.addListener("pushNotificationReceived", (notification) => {
    console.log("Push received in foreground:", notification);
    // You can show a custom in-app toast here
  });

  // Listen for notification taps (background -> app open)
  PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    console.log("Push notification tapped:", action);
    const url = action.notification.data?.linkUrl;
    if (url) {
      window.location.href = url;
    }
  });
}
