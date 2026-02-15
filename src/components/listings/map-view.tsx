"use client";

import { Button } from "@/components/ui/button";
import { LocateFixed } from "lucide-react";

export function MapView() {
    return (
        <div className="relative w-full h-[calc(100vh-80px)] bg-[#f0f0f0] flex items-center justify-center overflow-hidden">
            {/* Mock Map Background - Using a reliable static map pattern or gradient */}
            <div
                className="absolute inset-0 opacity-40 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/Hanoi_location_map.svg')] bg-cover bg-center grayscale"
            />

            <div className="absolute inset-0 bg-teal-50/10 mix-blend-multiply" />

            {/* Mock Pins */}
            <div className="absolute top-1/4 left-1/4 bg-white px-2 py-1 rounded-full shadow-lg font-bold text-xs hover:scale-110 transition cursor-pointer">
                3tr
            </div>
            <div className="absolute top-1/2 left-1/2 bg-white px-2 py-1 rounded-full shadow-lg font-bold text-xs hover:scale-110 transition cursor-pointer">
                4.5tr
            </div>
            <div className="absolute bottom-1/3 right-1/4 bg-gray-900 text-white px-2 py-1 rounded-full shadow-lg font-bold text-xs hover:scale-110 transition cursor-pointer z-10">
                2.8tr
            </div>

            <Button
                variant="default"
                className="relative z-10 shadow-xl bg-gray-900 hover:bg-black text-white rounded-full px-6 py-6"
            >
                <LocateFixed className="mr-2 h-4 w-4" />
                Dùng bản đồ Google thật (Cần API Key)
            </Button>
        </div>
    );
}
