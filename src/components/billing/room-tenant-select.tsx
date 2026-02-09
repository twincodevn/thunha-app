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
}

export function RoomTenantSelect({ roomTenants, defaultValue = "" }: RoomTenantSelectProps) {
    const [value, setValue] = useState(defaultValue);

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
                onChange={setValue}
                placeholder="Chọn phòng..."
                searchPlaceholder="Tìm phòng hoặc khách thuê..."
                emptyMessage="Không tìm thấy phòng"
            />
            <input type="hidden" name="roomTenantId" value={value} />
        </>
    );
}
