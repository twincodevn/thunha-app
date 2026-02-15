"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

export function MapView() {
    const Map = useMemo(() => dynamic(
        () => import("@/components/listings/real-map"),
        {
            loading: () => (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                    <p>Đang tải bản đồ...</p>
                </div>
            ),
            ssr: false
        }
    ), []);

    return (
        <div className="w-full h-full relative z-0">
            <Map />
        </div>
    );
}
