"use client";

import { useEffect } from "react";
import { initPushNotifications } from "@/lib/pushNotifications";
import { useSession } from "next-auth/react";

export function PushNotificationInit() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user) {
      initPushNotifications();
    }
  }, [session]);

  return null;
}
