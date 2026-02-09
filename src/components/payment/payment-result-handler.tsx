"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export function PaymentResultHandler() {
    const searchParams = useSearchParams();

    useEffect(() => {
        const payment = searchParams.get("payment");
        const amount = searchParams.get("amount");
        const message = searchParams.get("message");

        if (payment === "success") {
            toast.success(`Thanh toán thành công${amount ? `: ${parseInt(amount).toLocaleString("vi-VN")}đ` : ""}`);
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (payment === "failed") {
            toast.error(message || "Thanh toán thất bại");
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [searchParams]);

    return null;
}
