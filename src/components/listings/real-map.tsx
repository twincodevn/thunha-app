import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { renderToString } from "react-dom/server";
import { Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Fix for default marker icons in Next.js
const icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

// Create a custom modern marker icon using DivIcon (Same as Dashboard)
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

interface RealMapProps {
    listings?: any[];
}

export default function RealMap({ listings = [] }: RealMapProps) {
    // Ho Chi Minh City coordinates
    const defaultCenter: [number, number] = [10.762622, 106.660172];
    const customIcon = createCustomIcon();

    // Calculate center if listings exist
    let center = defaultCenter;
    const validListings = listings.filter(l => l.lat && l.lng);

    if (validListings.length > 0) {
        const lat = validListings.reduce((sum, l) => sum + l.lat, 0) / validListings.length;
        const lng = validListings.reduce((sum, l) => sum + l.lng, 0) / validListings.length;
        center = [lat, lng];
    }

    return (
        <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            {validListings.map((m) => (
                <Marker key={m.id} position={[m.lat, m.lng]} icon={customIcon}>
                    <Popup className="custom-popup">
                        <div className="min-w-[200px] text-center p-1">
                            <h3 className="font-bold text-sm text-gray-900 mb-1">{m.title}</h3>
                            <p className="text-xs text-gray-500 mb-2 truncate">{m.address}</p>
                            <div className="font-bold text-indigo-600 mb-2">
                                {new Intl.NumberFormat("vi-VN").format(m.price)}đ
                            </div>
                            <button className="w-full bg-slate-900 text-white text-xs py-2 rounded font-medium hover:bg-slate-800 transition-colors">
                                Xem chi tiết
                            </button>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}

