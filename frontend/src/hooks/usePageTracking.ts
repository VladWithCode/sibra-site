import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";

function getSessionId(): string {
    const key = "sibra_session_id";
    let id = sessionStorage.getItem(key);
    if (!id) {
        id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
        sessionStorage.setItem(key, id);
    }
    return id;
}

export function usePageTracking() {
    const router = useRouter();

    useEffect(() => {
        const sessionId = getSessionId();

        const unsubscribe = router.subscribe("onResolved", (evt) => {
            const path = evt.toLocation.pathname;
            if (path.startsWith("/panel")) return;
            const payload = JSON.stringify({
                path,
                referrer: document.referrer,
                sessionId,
            });

            if (navigator.sendBeacon) {
                navigator.sendBeacon(
                    "/api/analytics/track",
                    new Blob([payload], { type: "application/json" }),
                );
            } else {
                fetch("/api/analytics/track", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: payload,
                    keepalive: true,
                }).catch(() => {});
            }
        });

        return unsubscribe;
    }, [router]);
}
