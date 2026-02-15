"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState } from "react";

// Fix for default marker icons in Next.js
const icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

export default function RealMap() {
    // Ho Chi Minh City coordinates
    const center: [number, number] = [10.762622, 106.660172];

    // Mock listings data for the map
    const markers = [
        { id: 1, lat: 10.762622, lng: 106.660172, title: "Phòng 101 - 3tr", price: "3tr" },
        { id: 2, lat: 10.765, lng: 106.665, title: "Phòng 102 - 4.5tr", price: "4.5tr" },
        { id: 3, lat: 10.760, lng: 106.655, title: "Phòng 103 - 2.8tr", price: "2.8tr" },
        { id: 4, lat: 10.770, lng: 106.670, title: "Căn hộ A - 7tr", price: "7tr" },
    ];

    return (
        <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {markers.map((m) => (
                <Marker key={m.id} position={[m.lat, m.lng]} icon={icon}>
                    <Popup>
                        <div className="text-center">
                            <h3 className="font-bold text-sm text-gray-900">{m.title}</h3>
                            <button className="bg-teal-600 text-white text-xs px-2 py-1 rounded mt-1">Xem phòng</button>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
