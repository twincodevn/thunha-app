"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export function OneSignalProvider() {
    const { data: session, status } = useSession();

    useEffect(() => {
        // Only run after user is logged in
        if (status !== "authenticated" || !session?.user) return;

        const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
        if (!appId) return;

        // Dynamically import to avoid SSR issues
        import("react-onesignal").then(({ default: OneSignal }) => {
            OneSignal.init({
                appId,
                allowLocalhostAsSecureOrigin: process.env.NODE_ENV === "development",
                serviceWorkerParam: { scope: "/" },
                // Prompt the user right after login (slidedown style)
                promptOptions: {
                    slidedown: {
                        prompts: [
                            {
                                type: "push",
                                autoPrompt: true,
                                text: {
                                    actionMessage:
                                        "ThuNhà muốn gửi thông báo cho bạn khi có hóa đơn mới hoặc thông tin quan trọng!",
                                    acceptButton: "Cho phép",
                                    cancelButton: "Để sau",
                                },
                                delay: {
                                    pageViews: 1,
                                    timeDelay: 3, // seconds after page load
                                },
                            },
                        ],
                    },
                },
            })
                .then(() => {
                    // After init, try to get subscription and save to DB
                    return OneSignal.User.PushSubscription.optIn();
                })
                .then(() => {
                    const playerId = OneSignal.User.PushSubscription.id;
                    if (!playerId) return;

                    // Save this player ID to our database
                    return fetch("/api/push/subscribe", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ playerId }),
                    });
                })
                .catch((err) => {
                    // Silently fail – push is non-critical
                    console.warn("[OneSignal] init error:", err);
                });
        });
    }, [status, session]);

    return null; // No UI
}
