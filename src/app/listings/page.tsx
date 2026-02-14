import { Suspense } from "react";
import Link from "next/link";
import { getPublicListings, getCities } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Home, ArrowRight, Search, Zap } from "lucide-react";
import { formatCurrency } from "@/lib/billing";

// Header Component
function ListingHeader() {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                        <Home className="h-4 w-4" />
                    </div>
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">ThuNhà</span>
                </Link>
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost">
                        <Link href="/login">Đăng nhập</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/register">Đăng tin miễn phí</Link>
                    </Button>
                </div>
            </div>
        </header>
    );
}

// Search Component
function ListingSearch({ cities }: { cities: string[] }) {
    return (
        <form action="" className="flex flex-col md:flex-row gap-4 mb-8 bg-card p-6 rounded-xl border shadow-sm">
            <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Tìm kiếm</label>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input name="q" placeholder="Tìm theo tên đường, tòa nhà..." className="pl-9" />
                </div>
            </div>
            <div className="w-full md:w-[200px]">
                <label className="text-sm font-medium mb-2 block">Khu vực</label>
                <Select name="city">
                    <SelectTrigger>
                        <SelectValue placeholder="Tất cả" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Tất cả</SelectItem>
                        {cities.map(city => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="w-full md:w-[200px]">
                <label className="text-sm font-medium mb-2 block">Giá thuê</label>
                <Select name="price">
                    <SelectTrigger>
                        <SelectValue placeholder="Tất cả" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Tất cả</SelectItem>
                        <SelectItem value="0-3000000">Dưới 3 triệu</SelectItem>
                        <SelectItem value="3000000-5000000">3 - 5 triệu</SelectItem>
                        <SelectItem value="5000000-10000000">5 - 10 triệu</SelectItem>
                        <SelectItem value="10000000-999999999">Trên 10 triệu</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-end">
                <Button type="submit" className="w-full md:w-auto">Tìm kiếm</Button>
            </div>
        </form>
    );
}

export default async function ListingsPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; city?: string; price?: string }>;
}) {
    const params = await searchParams;
    const q = params.q || "";
    const city = params.city || "ALL";
    const priceRange = params.price;

    let minPrice: number | undefined;
    let maxPrice: number | undefined;

    if (priceRange && priceRange !== "ALL") {
        const [min, max] = priceRange.split("-").map(Number);
        minPrice = min;
        maxPrice = max;
    }

    const [listings, cities] = await Promise.all([
        getPublicListings(q, minPrice, maxPrice, city),
        getCities()
    ]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
            <ListingHeader />

            <main className="container mx-auto py-8 px-4">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Tìm phòng trọ ưng ý</h1>
                    <p className="text-muted-foreground">Hàng ngàn phòng trọ xác thực đang chờ bạn</p>
                </div>

                <ListingSearch cities={cities} />

                {listings.length === 0 ? (
                    <div className="text-center py-20">
                        <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium">Không tìm thấy phòng nào</h3>
                        <p className="text-muted-foreground">Thử thay đổi bộ lọc tìm kiếm của bạn</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {listings.map((room) => (
                            <Link href={`/listings/${room.id}`} key={room.id} className="group">
                                <Card className="h-full overflow-hidden transition-all hover:shadow-lg border-transparent shadow hover:border-border">
                                    <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                                        {/* Placeholder image since we don't have a direct room image yet */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                                            <Home className="h-12 w-12 text-gray-300 dark:text-gray-700" />
                                        </div>
                                        <div className="absolute top-2 right-2">
                                            <Badge className="bg-blue-600 hover:bg-blue-700">Mới</Badge>
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-10">
                                            <h3 className="text-white font-medium truncate">{room.property.name}</h3>
                                            <div className="flex items-center text-white/80 text-xs mt-1">
                                                <MapPin className="h-3 w-3 mr-1" />
                                                <span className="truncate">{room.property.address}, {room.property.city}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-bold text-lg text-blue-600">{formatCurrency(room.baseRent)}/tháng</h4>
                                                <div className="text-sm text-muted-foreground">Phòng {room.roomNumber} • Tầng {room.floor}</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            {room.area && <Badge variant="secondary" className="font-normal">{room.area} m²</Badge>}
                                            <Badge variant="secondary" className="font-normal">Điện {room.property.electricityRate ? formatCurrency(room.property.electricityRate) : '---'}</Badge>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="p-4 pt-0 text-sm text-muted-foreground flex justify-between items-center border-t border-border/50 bg-muted/20 mt-auto">
                                        <span>Đăng bởi {room.property.user?.name || "Chủ nhà"}</span>
                                        <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                                    </CardFooter>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
