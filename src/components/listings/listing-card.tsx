"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart, Star, ChevronLeft, ChevronRight, Share } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ListingCardProps {
    data: any;
}

export function ListingCard({ data }: ListingCardProps) {
    const [currentImage, setCurrentImage] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    const nextImage = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentImage((prev) => (prev + 1) % data.images.length);
    };

    const prevImage = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentImage((prev) => (prev - 1 + data.images.length) % data.images.length);
    };

    return (
        <div
            className="group cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Image Carousel */}
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 mb-3">
                <Image
                    src={data.images[currentImage]}
                    alt={data.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Favorite Button */}
                <button className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/10 transition">
                    <Heart className="h-6 w-6 text-white/70 hover:text-rose-500 hover:fill-rose-500 transition-colors" strokeWidth={2} />
                </button>

                {/* Navigation Arrows (Show on hover) */}
                <div className={cn(
                    "absolute inset-0 flex items-center justify-between px-2 opacity-0 transition-opacity duration-200",
                    isHovered && "opacity-100"
                )}>
                    <button
                        onClick={prevImage}
                        className="bg-white/90 p-1.5 rounded-full hover:bg-white hover:scale-110 transition shadow-sm"
                    >
                        <ChevronLeft className="h-4 w-4 text-gray-800" />
                    </button>
                    <button
                        onClick={nextImage}
                        className="bg-white/90 p-1.5 rounded-full hover:bg-white hover:scale-110 transition shadow-sm"
                    >
                        <ChevronRight className="h-4 w-4 text-gray-800" />
                    </button>
                </div>

                {/* Pagination Dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {data.images.map((_: any, i: number) => (
                        <div
                            key={i}
                            className={cn(
                                "h-1.5 rounded-full transition-all shadow-sm",
                                i === currentImage ? "w-4 bg-white" : "w-1.5 bg-white/60"
                            )}
                        />
                    ))}
                </div>

                {/* Superhost Badge */}
                {data.host.verified && (
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold shadow-sm">
                        Chủ nhà uy tín
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="space-y-1">
                <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-gray-900 truncate pr-2">{data.title}</h3>
                    <div className="flex items-center gap-1 text-sm">
                        <Star className="h-3 w-3 fill-black text-black" />
                        <span>{data.rating}</span>
                    </div>
                </div>
                <p className="text-gray-500 text-sm truncate">{data.address}, {data.city}</p>
                <p className="text-gray-500 text-sm">cách trung tâm 2km</p>
                <div className="flex items-baseline gap-1 mt-1">
                    <span className="font-bold text-gray-900">
                        {new Intl.NumberFormat("vi-VN").format(data.price)}đ
                    </span>
                    <span className="text-gray-500 text-sm">/tháng</span>
                </div>
            </div>
        </div>
    );
}
