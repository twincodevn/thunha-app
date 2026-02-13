"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface TenantFiltersProps {
    properties: {
        id: string;
        name: string;
    }[];
}

export function TenantFilters({ properties }: TenantFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentProperty = searchParams.get("propertyId") || "all";

    const handlePropertyChange = (value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value === "all") {
            params.delete("propertyId");
        } else {
            params.set("propertyId", value);
        }
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="flex items-center gap-2">
            <Select value={currentProperty} onValueChange={handlePropertyChange}>
                <SelectTrigger className="w-[200px] bg-background">
                    <SelectValue placeholder="Tất cả tòa nhà" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tất cả tòa nhà</SelectItem>
                    {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                            {property.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
