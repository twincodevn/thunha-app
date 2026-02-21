"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface TenantFiltersProps {
    properties: {
        id: string;
        name: string;
    }[];
    onSearchChange: (value: string) => void;
    onStatusChange: (value: string) => void;
}

export function TenantFilters({ properties, onSearchChange, onStatusChange }: TenantFiltersProps) {
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
        <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative w-full sm:w-[250px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Tìm tên hoặc SĐT..."
                    className="pl-8 bg-background"
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            <Select value={currentProperty} onValueChange={handlePropertyChange}>
                <SelectTrigger className="w-full sm:w-[180px] bg-background">
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

            <Select defaultValue="all" onValueChange={onStatusChange}>
                <SelectTrigger className="w-full sm:w-[160px] bg-background">
                    <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="in_debt">Đang nợ tiền</SelectItem>
                    <SelectItem value="paid">Đã thanh toán</SelectItem>
                    <SelectItem value="expiring">Hợp đồng sắp hết</SelectItem>
                    <SelectItem value="expired">Hợp đồng hết hạn</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
