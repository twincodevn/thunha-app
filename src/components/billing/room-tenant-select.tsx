"use client";

import { useState } from "react";
import { SearchableSelect } from "@/components/ui/searchable-select";

interface RoomTenant {
    id: string;
    room: {
        id: string;
        roomNumber: string;
        property: { name: string };
    };
    tenant: { name: string };
}

interface RoomTenantSelectProps {
    roomTenants: RoomTenant[];
    defaultValue?: string;
    onValueChange?: (value: string) => void;
}

export function RoomTenantSelect({ roomTenants, defaultValue = "", onValueChange }: RoomTenantSelectProps) {
    const [value, setValue] = useState(defaultValue);

    const handleChange = (newValue: string) => {
        setValue(newValue);
        onValueChange?.(newValue);
    };

    const options = roomTenants.map((rt) => ({
        value: rt.id,
        label: `Phòng ${rt.room.roomNumber} - ${rt.tenant.name}`,
        sublabel: rt.room.property.name,
    }));

    return (
        <>
            <SearchableSelect
                options={options}
                value={value}
                onChange={handleChange}
                placeholder="Chọn phòng..."
                searchPlaceholder="Tìm phòng hoặc khách thuê..."
                emptyMessage="Không tìm thấy phòng"
            />
            <input type="hidden" name="roomTenantId" value={value} />
        </>
    );
}
