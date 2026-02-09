"use client";

import { SearchableSelect } from "@/components/ui/searchable-select";

interface Room {
    id: string;
    roomNumber: string;
    status: string;
    property: { id: string; name: string };
}

interface RoomSelectProps {
    rooms: Room[];
    value: string;
    onChange: (value: string) => void;
}

export function RoomSelect({ rooms, value, onChange }: RoomSelectProps) {
    const options = rooms.map((room) => ({
        value: room.id,
        label: `Phòng ${room.roomNumber}`,
        sublabel: room.property.name,
    }));

    // Add empty option
    const allOptions = [
        { value: "", label: "-- Không gán phòng --", sublabel: undefined },
        ...options,
    ];

    return (
        <SearchableSelect
            options={allOptions}
            value={value}
            onChange={onChange}
            placeholder="-- Không gán phòng --"
            searchPlaceholder="Tìm phòng..."
            emptyMessage="Không tìm thấy phòng trống"
        />
    );
}
