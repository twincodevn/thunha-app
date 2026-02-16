"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatCurrency } from "@/lib/billing";

// Fix for default marker icons in Next.js
const icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

interface PropertiesMapProps {
    properties: any[];
}

export default function PropertiesMap({ properties }: PropertiesMapProps) {
    // Default center (Ho Chi Minh City) or center of first property
    const firstProp = properties.find(p => p.lat && p.lng);
    const center: [number, number] = firstProp && firstProp.lat && firstProp.lng
        ? [firstProp.lat, firstProp.lng]
        : [10.762622, 106.660172];

    const validProperties = properties.filter(p => p.lat && p.lng);

    return (
        <div className="h-[600px] w-full rounded-lg overflow-hidden border shadow-sm relative z-0">
            <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {validProperties.map((property) => (
                    <Marker
                        key={property.id}
                        position={[property.lat, property.lng]}
                        icon={icon}
                    >
                        <Popup>
                            <div className="text-center min-w-[200px] p-2">
                                <h3 className="font-bold text-base mb-1">{property.name}</h3>
                                <p className="text-xs text-muted-foreground mb-2">{property.address}</p>

                                <div className="grid grid-cols-2 gap-2 text-xs mb-3 bg-muted/50 p-2 rounded">
                                    <div>
                                        <span className="block font-semibold">{property._count?.rooms || 0}</span>
                                        <span className="text-muted-foreground">Phòng</span>
                                    </div>
                                    <div>
                                        <span className="block font-semibold">
                                            {property.rooms?.filter((r: any) => r.status === "VACANT").length || 0}
                                        </span>
                                        <span className="text-green-600">Trống</span>
                                    </div>
                                </div>

                                <Button size="sm" className="w-full h-8" asChild>
                                    <Link href={`/dashboard/properties/${property.id}`}>
                                        Quản lý
                                    </Link>
                                </Button>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {validProperties.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-[1000] pointer-events-none">
                    <div className="bg-background p-4 rounded-lg shadow-lg border text-center">
                        <p className="font-medium text-muted-foreground">Chưa có tọa độ bản đồ</p>
                        <p className="text-xs text-muted-foreground mt-1">Cập nhật tọa độ trong phần chỉnh sửa tòa nhà</p>
                    </div>
                </div>
            )}
        </div>
    );
}
