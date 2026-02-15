"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MarketplacePage() {
    const router = useRouter();

    useEffect(() => {
        router.push("/listings");
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="animate-spin h-8 w-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-500">Đang chuyển hướng đến giao diện mới...</p>
            </div>
        </div>
    );
}
