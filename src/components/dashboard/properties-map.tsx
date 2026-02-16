"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Property } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Building2, MapPin } from "lucide-react";
import { renderToString } from "react-dom/server";

interface PropertiesMapProps {
    properties: Property[];
}

// Create a custom modern marker icon using DivIcon
const createCustomIcon = () => {
    const iconHtml = renderToString(
        <div className="relative flex items-center justify-center w-8 h-8 md:w-10 md:h-10">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
            <div className="relative z-10 flex items-center justify-center w-full h-full bg-primary text-primary-foreground rounded-full shadow-lg border-2 border-white hover:scale-110 transition-transform">
                <Building2 className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div className="absolute -bottom-1 w-2 h-2 bg-primary rotate-45" />
        </div>
    );

    return L.divIcon({
        className: "custom-marker-icon bg-transparent border-none",
        html: iconHtml,
        iconSize: [40, 40],
        iconAnchor: [20, 40], // Tip of the pin
        popupAnchor: [0, -40],
    });
};

export default function PropertiesMap({ properties }: PropertiesMapProps) {
    const validProperties = properties.filter((p) => p.lat && p.lng);
    const customIcon = createCustomIcon();

    if (validProperties.length === 0) {
        return (
            <div className="flex h-[400px] w-full items-center justify-center rounded-lg border border-dashed bg-muted/40">
                <div className="text-center">
                    <MapPin className="mx-auto h-8 w-8 text-muted-foreground/60" />
                    <h3 className="mt-2 text-lg font-semibold">Chưa có dữ liệu bản đồ</h3>
                    <p className="text-sm text-muted-foreground">
                        Cập nhật tọa độ cho tòa nhà để hiển thị trên bản đồ.
                    </p>
                </div>
            </div>
        );
    }

    const centerLat = validProperties.reduce((sum, p) => sum + (p.lat || 0), 0) / validProperties.length;
    const centerLng = validProperties.reduce((sum, p) => sum + (p.lng || 0), 0) / validProperties.length;

    return (
        <div className="h-[600px] w-full rounded-xl overflow-hidden border shadow-lg relative z-0">
            <MapContainer
                center={[centerLat, centerLng]}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
                className="z-0"
            >
                {/* CartoDB Voyager - Một giao diện bản đồ hiện đại, sạch sẽ và đẹp mắt hơn */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />

                {validProperties.map((property) => (
                    <Marker
                        key={property.id}
                        position={[property.lat!, property.lng!]}
                        icon={customIcon}
                    >
                        <Popup className="custom-popup">
                            <div className="min-w-[200px] p-1">
                                <div className="font-semibold text-lg mb-1">{property.name}</div>
                                <div className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                    {property.address}
                                </div>
                                <div className="flex flex-wrap gap-1 mb-3">
                                    {property.electricityRate > 0 && (
                                        <Badge variant="secondary" className="text-xs">
                                            Điện: {property.electricityRate.toLocaleString()}đ
                                        </Badge>
                                    )}
                                    {property.waterRate > 0 && (
                                        <Badge variant="outline" className="text-xs">
                                            Nước: {property.waterRate.toLocaleString()}đ
                                        </Badge>
                                    )}
                                </div>
                                <Link
                                    href={`/dashboard/properties/${property.id}`}
                                    className="block w-full text-center bg-primary text-primary-foreground py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                                >
                                    Xem chi tiết
                                </Link>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
