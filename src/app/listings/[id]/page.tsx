import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { getPublicListingDetail } from "@/app/listings/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Home, ArrowLeft, Phone, Zap, Ruler, Store, Info, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/billing";
import { ChatWidget } from "@/components/ai/chat-widget";

// Header Component (Different from Dashboard Header)
function ListingHeader() {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                        <Home className="h-4 w-4" />
                    </div>
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">ThuNhà</span>
                </Link>
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost">
                        <Link href="/listings">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Quay lại
                        </Link>
                    </Button>
                </div>
            </div>
        </header>
    );
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const room = await getPublicListingDetail(id);

    if (!room) {
        return {
            title: "Không tìm thấy phòng | ThuNhà",
        };
    }

    const title = `Cho thuê phòng ${room.roomNumber} tại ${room.property.name} - ${formatCurrency(room.baseRent)}`;
    const description = `Phòng trọ tiện nghi, ${room.area ? `${room.area}m2, ` : ""}giá ${formatCurrency(room.baseRent)}/tháng tại ${room.property.address}, ${room.property.city}. Xem chi tiết ngay!`;

    return {
        title: title,
        description: description,
        openGraph: {
            title: title,
            description: description,
            type: "website",
            images: [
                {
                    url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2000&auto=format&fit=crop", // Dynamic if we had images
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
        },
    };
}

export default async function ListingDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const room = await getPublicListingDetail(id);

    if (!room) {
        notFound();
    }

    // Placeholder images until we implement real uploads
    const images = [
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=2000&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=2000&auto=format&fit=crop"
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 md:pb-12">
            <ListingHeader />

            <main className="container mx-auto py-8 px-4">
                {/* Breadcrumb */}
                <div className="mb-6 flex items-center text-sm text-muted-foreground">
                    <Link href="/listings" className="hover:text-primary transition-colors">Tìm phòng</Link>
                    <span className="mx-2">/</span>
                    <span className="truncate max-w-[200px]">{room.property.city || "Hồ Chí Minh"}</span>
                    <span className="mx-2">/</span>
                    <span className="font-medium text-foreground">Phòng {room.roomNumber}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Images & Info */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Images Gallery */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 h-[400px] rounded-xl overflow-hidden relative">
                            <div className="h-full bg-gray-200 relative">
                                {/* Main Image */}
                                <div
                                    className="absolute inset-0 bg-cover bg-center"
                                    style={{ backgroundImage: `url(${images[0]})` }}
                                />
                            </div>
                            <div className="hidden md:grid grid-rows-2 gap-2 h-full">
                                <div className="relative bg-gray-200">
                                    <div
                                        className="absolute inset-0 bg-cover bg-center"
                                        style={{ backgroundImage: `url(${images[1]})` }}
                                    />
                                </div>
                                <div className="relative bg-gray-200">
                                    <div
                                        className="absolute inset-0 bg-cover bg-center"
                                        style={{ backgroundImage: `url(${images[2]})` }}
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                        <span className="text-white font-medium">+ Xem thêm</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Info */}
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">{room.property.name} - Phòng {room.roomNumber}</h1>
                                    <div className="flex items-center text-muted-foreground">
                                        <MapPin className="h-4 w-4 mr-2 text-primary" />
                                        {room.property.address}, {room.property.city}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-blue-600">{formatCurrency(room.baseRent)}</div>
                                    <div className="text-sm text-muted-foreground">/tháng</div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-4 mt-6">
                                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border shadow-sm">
                                    <Ruler className="h-5 w-5 text-gray-500" />
                                    <span className="font-medium">{room.area ? `${room.area} m²` : "Chưa cập nhật"}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border shadow-sm">
                                    <Zap className="h-5 w-5 text-yellow-500" />
                                    <span className="font-medium">{room.property.electricityRate ? `${formatCurrency(room.property.electricityRate)}/kWh` : "Nhà nước"}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border shadow-sm">
                                    <div className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs">N</div>
                                    <span className="font-medium">{room.property.waterRate ? `${formatCurrency(room.property.waterRate)}/người` : "Thỏa thuận"}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border shadow-sm">
                                    <Home className="h-5 w-5 text-gray-500" />
                                    <span className="font-medium">Tầng {room.floor}</span>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold">Mô tả phòng</h2>
                            <div className="prose dark:prose-invert max-w-none text-muted-foreground">
                                <p>{room.notes || `Phòng trọ tiện nghi tại ${room.property.name}. Vị trí thuận lợi, an ninh tốt, giờ giấc tự do.`}</p>
                                <p className="mt-2">Tiện ích bao gồm:</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    {room.assets && room.assets.length > 0 ? (
                                        room.assets.map((asset: any) => (
                                            <li key={asset.id}>{asset.name}</li>
                                        ))
                                    ) : (
                                        <>
                                            <li>Wifi tốc độ cao</li>
                                            <li>Chỗ để xe rộng rãi</li>
                                            <li>Camera an ninh 24/7</li>
                                            <li>Không chung chủ</li>
                                        </>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Contact Card */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24">
                            <Card className="border-2 border-blue-100 dark:border-blue-900 shadow-lg">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="h-14 w-14 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-500 overflow-hidden">
                                            {room.property.user.avatar ? (
                                                <img src={room.property.user.avatar} alt="Owner" className="h-full w-full object-cover" />
                                            ) : (
                                                room.property.user?.name?.charAt(0).toUpperCase() || "H"
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">Liên hệ chủ nhà</div>
                                            <div className="font-bold text-lg">{room.property.user.name || "Chủ nhà"}</div>
                                            <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                                                <CheckCircle className="h-3 w-3" />
                                                Đã xác thực
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Button className="w-full h-12 text-lg font-bold bg-green-600 hover:bg-green-700" asChild>
                                            <Link href={`tel:${room.property.user.phone}`} target="_blank">
                                                <Phone className="mr-2 h-5 w-5" />
                                                Gọi điện ngay
                                            </Link>
                                        </Button>
                                        <Button className="w-full h-12 text-lg font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200" variant="outline" asChild>
                                            <Link href={`https://zalo.me/${room.property.user.phone}`} target="_blank">
                                                Chat Zalo
                                            </Link>
                                        </Button>
                                    </div>

                                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-muted-foreground">
                                        <p className="mb-2 flex items-center gap-2">
                                            <Info className="h-4 w-4" />
                                            Lưu ý từ ThuNhà:
                                        </p>
                                        <ul className="list-disc pl-5 space-y-1 text-xs">
                                            <li>Không đặt cọc nếu chưa xem phòng.</li>
                                            <li>Kiểm tra kỹ hợp đồng trước khi ký.</li>
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>

            {/* Mobile Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t lg:hidden z-50 flex gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <Button className="flex-1 h-12 text-lg font-bold bg-green-600 hover:bg-green-700" asChild>
                    <Link href={`tel:${room.property.user.phone}`}>
                        <Phone className="mr-2 h-5 w-5" />
                        Gọi ngay
                    </Link>
                </Button>
                <Button className="flex-1 h-12 text-lg font-bold" variant="outline" asChild>
                    <Link href={`https://zalo.me/${room.property.user.phone}`}>
                        Chat Zalo
                    </Link>
                </Button>
            </div>

            <ChatWidget
                title="Tư vấn thuê phòng"
                context={`
                    Thông tin phòng trọ:
                    - Tên: ${room.property.name} - Phòng ${room.roomNumber}
                    - Địa chỉ: ${room.property.address}, ${room.property.city}
                    - Giá thuê: ${formatCurrency(room.baseRent)}/tháng
                    - Diện tích: ${room.area ? room.area + " m2" : "Chưa cập nhật"}
                    - Tầng: ${room.floor}
                    - Giá điện: ${room.property.electricityRate ? formatCurrency(room.property.electricityRate) + "/kWh" : "Giá nhà nước"}
                    - Giá nước: ${room.property.waterRate ? formatCurrency(room.property.waterRate) + "/người" : "Thỏa thuận"}
                    - Mô tả: ${room.notes || "Không có mô tả"}
                    - Tiện ích: ${room.assets?.map((a: any) => a.name).join(", ") || "Wifi, Chỗ để xe, Camera"}
                    - Chủ nhà: ${room.property.user?.name || "Chủ nhà"}
                    - SĐT Chủ nhà: ${room.property.user?.phone || "Liên hệ trực tiếp"}
                    
                    Hãy trả lời các câu hỏi của người thuê dựa trên thông tin trên. Nếu không biết, hãy khuyên họ liên hệ chủ nhà qua SĐT hoặc Zalo.
                `}
            />
        </div>
    );
}
