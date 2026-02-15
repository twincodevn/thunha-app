"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, House, BedDouble, Building2, Users, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Professional Lucide Icons instead of Emojis
const CATEGORIES = [
    { label: "Tất cả", icon: House },
    { label: "Phòng trọ", icon: BedDouble },
    { label: "Căn hộ", icon: Building2 },
    { label: "Nhà nguyên căn", icon: Home },
    { label: "Ở ghép", icon: Users },
];

export function FilterBar() {
    const [selectedCategory, setSelectedCategory] = useState("Tất cả");

    return (
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 py-4 px-4 md:px-8">
            <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">

                {/* Search Bar - Airbnb Style */}
                <div className="flex bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow p-2 pl-6 w-full md:w-auto min-w-[300px] items-center">
                    <div className="flex-1 border-r border-gray-200 pr-4">
                        <label className="text-xs font-bold block text-gray-800">Địa điểm</label>
                        <input
                            type="text"
                            placeholder="Bạn muốn ở đâu?"
                            className="text-sm text-gray-600 outline-none w-full bg-transparent p-0"
                        />
                    </div>
                    <div className="flex-1 px-4 hidden sm:block">
                        <label className="text-xs font-bold block text-gray-800">Giá</label>
                        <span className="text-sm text-gray-400">Thêm khoảng giá</span>
                    </div>
                    <Button size="icon" className="rounded-full h-10 w-10 bg-rose-500 hover:bg-rose-600 text-white shrink-0">
                        <Search className="h-4 w-4" />
                    </Button>
                </div>

                {/* Categories */}
                <div className="flex items-center gap-8 overflow-x-auto no-scrollbar w-full md:w-auto">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.label}
                            onClick={() => setSelectedCategory(cat.label)}
                            className={cn(
                                "flex flex-col items-center gap-2 min-w-[64px] transition-all group",
                                selectedCategory === cat.label
                                    ? "text-gray-900 border-b-2 border-gray-900 pb-2"
                                    : "text-gray-500 hover:text-gray-800 border-b-2 border-transparent pb-2 hover:border-gray-200"
                            )}
                        >
                            <cat.icon
                                className={cn(
                                    "h-6 w-6 transition-transform group-hover:scale-110",
                                    selectedCategory === cat.label ? "stroke-[2.5px]" : "stroke-[1.5px]"
                                )}
                            />
                            <span className={cn(
                                "text-xs font-medium whitespace-nowrap",
                                selectedCategory === cat.label ? "font-bold" : ""
                            )}>{cat.label}</span>
                        </button>
                    ))}
                </div>

                {/* Filter Button */}
                <Button variant="outline" className="hidden md:flex gap-2 rounded-xl border-gray-300">
                    <SlidersHorizontal className="h-4 w-4" />
                    Bộ lọc
                </Button>
            </div>
        </div>
    );
}
