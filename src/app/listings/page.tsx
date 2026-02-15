"use client";

import { useEffect, useState } from "react";
import { MarketplaceHeader } from "@/components/listings/header";
import { FilterBar } from "@/components/listings/filter-bar";
import { ListingCard } from "@/components/listings/listing-card";
import { MapView } from "@/components/listings/map-view";
import { getListings } from "./actions";
import { Button } from "@/components/ui/button";
import { Map } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ListingsPage() {
    const [data, setData] = useState<any>(null);
    const [showMapMobile, setShowMapMobile] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await getListings();
                setData(res);
            } catch (e) {
                console.error(e);
            }
        };
        load();
    }, []);

    // Placeholder skeleton
    const SkeletonCard = () => (
        <div className="space-y-3">
            <div className="bg-gray-100 dark:bg-gray-800 aspect-[4/3] rounded-xl animate-pulse" />
            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/2 animate-pulse" />
        </div>
    );

    return (
        <div className="min-h-screen bg-white">
            <FilterBar />

            <div className="pt-2">
                <div className="flex flex-col xl:flex-row relative">
                    {/* List View - Left Side */}
                    <div className={cn(
                        "w-full px-4 md:px-8 pb-20 pt-4 transition-all duration-300",
                        "xl:w-[55%] xl:pr-4" // Split view on large screens
                    )}>
                        <div className="mb-6 flex justify-between items-center">
                            <h1 className="text-xl font-semibold">
                                {data ? `${data.total} chỗ ở tại Hồ Chí Minh` : "Đang tìm kiếm..."}
                            </h1>
                        </div>

                        {!data ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                                {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                                {data.listings.map((item: any) => (
                                    <ListingCard key={item.id} data={item} />
                                ))}
                            </div>
                        )}

                        <div className="mt-12 text-center py-12">
                            <h3 className="text-lg font-semibold mb-2">Tiếp tục khám phá phòng trọ ThuNhà</h3>
                            <Button variant="outline" className="rounded-xl border-black text-black hover:bg-gray-100 px-8 py-6">
                                Xem thêm kết quả
                            </Button>
                        </div>
                    </div>

                    {/* Map View - Right Side (Sticky) */}
                    <div className="hidden xl:block xl:w-[45%] sticky top-[80px] h-[calc(100vh-80px)] border-l  border-gray-100">
                        <MapView />
                    </div>
                </div>
            </div>

            {/* Mobile Map Toggle Button */}
            {!showMapMobile && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 xl:hidden">
                    <Button
                        onClick={() => setShowMapMobile(true)}
                        className="rounded-full bg-gray-900 hover:bg-black text-white px-6 shadow-xl flex gap-2 h-12 transition-transform hover:scale-105"
                    >
                        <Map className="h-4 w-4" />
                        Hiện bản đồ
                    </Button>
                </div>
            )}

            {/* Mobile Map View Overlay */}
            {showMapMobile && (
                <div className="fixed inset-0 z-50 bg-white xl:hidden flex flex-col">
                    <div className="p-4 border-b flex justify-between items-center">
                        <h2 className="font-semibold">Bản đồ</h2>
                        <Button variant="ghost" onClick={() => setShowMapMobile(false)}>Đóng</Button>
                    </div>
                    <div className="flex-1">
                        <MapView />
                    </div>
                </div>
            )}
        </div>
    );
}
