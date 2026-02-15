"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, Banknote, Home, Phone, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { getPublicListings } from "./actions";

function fmt(amount: number) {
    return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(amount);
}

export default function MarketplacePage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [page, setPage] = useState(1);

    const fetchData = async () => {
        setLoading(true);
        try {
            const result = await getPublicListings({
                city: search || undefined,
                minPrice: minPrice ? parseInt(minPrice) : undefined,
                maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
                page,
            });
            setData(result);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [page]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
            {/* Hero Header */}
            <header className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
                <div className="max-w-6xl mx-auto px-4 py-12">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">🏠 ThuNhà Marketplace</h1>
                        <p className="text-teal-100 text-base md:text-lg">Tìm phòng trọ nhanh chóng, minh bạch, uy tín</p>
                    </div>

                    {/* Search Bar */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 max-w-3xl mx-auto">
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="flex-1 relative">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-teal-200" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Tìm theo khu vực, quận..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/20 text-white placeholder:text-teal-200 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
                                />
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={minPrice}
                                    onChange={(e) => setMinPrice(e.target.value)}
                                    placeholder="Giá từ"
                                    className="w-28 px-3 py-2.5 rounded-lg bg-white/20 text-white placeholder:text-teal-200 border border-white/20 focus:outline-none"
                                />
                                <input
                                    type="number"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                    placeholder="Giá đến"
                                    className="w-28 px-3 py-2.5 rounded-lg bg-white/20 text-white placeholder:text-teal-200 border border-white/20 focus:outline-none"
                                />
                                <button
                                    onClick={() => { setPage(1); fetchData(); }}
                                    className="px-6 py-2.5 bg-white text-teal-700 rounded-lg font-semibold hover:bg-teal-50 transition flex items-center gap-2"
                                >
                                    <Search className="h-4 w-4" /> Tìm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Results */}
            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <p className="text-gray-600 dark:text-gray-400">
                        Tìm thấy <strong>{data?.total || 0}</strong> phòng trống
                    </p>
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin h-8 w-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto" />
                        <p className="text-gray-500 mt-3">Đang tìm kiếm...</p>
                    </div>
                ) : data?.rooms?.length === 0 ? (
                    <div className="text-center py-20">
                        <Home className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Không tìm thấy phòng phù hợp</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(data?.rooms || []).map((room: any) => (
                                <div
                                    key={room.id}
                                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all border border-gray-100 dark:border-gray-700 overflow-hidden group"
                                >
                                    {/* Room Image Placeholder */}
                                    <div className="h-48 bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 flex items-center justify-center">
                                        <Home className="h-16 w-16 text-teal-300 group-hover:scale-110 transition-transform" />
                                    </div>

                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-bold text-gray-800 dark:text-gray-200">
                                                    Phòng {room.roomNumber}
                                                </h3>
                                                <p className="text-sm text-gray-500">{room.propertyName}</p>
                                            </div>
                                            <span className="text-lg font-bold text-teal-600">
                                                {fmt(room.baseRent)}đ
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                                            <MapPin className="h-3.5 w-3.5" />
                                            <span className="truncate">{room.address}</span>
                                        </div>

                                        <div className="flex gap-2 text-xs text-gray-500 mb-4">
                                            {room.area && (
                                                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                                    {room.area}m²
                                                </span>
                                            )}
                                            {room.floor && (
                                                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                                    Tầng {room.floor}
                                                </span>
                                            )}
                                            {room.deposit && (
                                                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                                    Cọc {fmt(room.deposit)}đ
                                                </span>
                                            )}
                                        </div>

                                        {room.landlordPhone && (
                                            <div className="flex gap-2">
                                                <a
                                                    href={`tel:${room.landlordPhone}`}
                                                    className="flex-1 flex items-center justify-center gap-2 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-100 transition"
                                                >
                                                    <Phone className="h-3.5 w-3.5" /> Gọi ngay
                                                </a>
                                                <a
                                                    href={`https://zalo.me/${room.landlordPhone.startsWith("0") ? "84" + room.landlordPhone.slice(1) : room.landlordPhone}`}
                                                    target="_blank"
                                                    className="flex-1 flex items-center justify-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-100 transition"
                                                >
                                                    💬 Zalo
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {data && data.totalPages > 1 && (
                            <div className="flex justify-center gap-2 mt-8">
                                <button
                                    onClick={() => setPage(Math.max(1, page - 1))}
                                    disabled={page <= 1}
                                    className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <span className="px-4 py-2 text-sm text-gray-600">
                                    Trang {page}/{data.totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(Math.min(data.totalPages, page + 1))}
                                    disabled={page >= data.totalPages}
                                    className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-8">
                <div className="max-w-6xl mx-auto px-4 text-center">
                    <p className="text-gray-500 text-sm">
                        🏠 <strong>ThuNhà Marketplace</strong> — Nền tảng cho thuê nhà hàng đầu Việt Nam
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                        Đăng ký tài khoản chủ nhà tại <a href="/login" className="text-teal-600 hover:underline">thunha.app</a> để đăng phòng miễn phí
                    </p>
                </div>
            </footer>
        </div>
    );
}
