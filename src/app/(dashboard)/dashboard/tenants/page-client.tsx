"use client";

import { useState } from "react";
import { TenantFilters } from "@/components/tenants/tenant-filters";
import { TenantList } from "@/components/tenants/tenant-list";
import { Plus, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export function TenantPageClient({ tenants, properties, propertyId }: { tenants: any[]; properties: any[]; propertyId?: string }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    return (
        <DashboardShell>
            <PageHeader
                title="Khách thuê"
                description="Quản lý thông tin khách thuê của bạn"
            >
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <TenantFilters
                        properties={properties}
                        onSearchChange={setSearchQuery}
                        onStatusChange={setStatusFilter}
                    />
                    <Button asChild className="shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                        <Link href="/dashboard/tenants/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Thêm khách thuê
                        </Link>
                    </Button>
                </div>
            </PageHeader>

            {tenants.length === 0 ? (
                <EmptyState
                    icon={Users}
                    title="Chưa có khách thuê nào"
                    description={propertyId ? "Không tìm thấy khách thuê trong tòa nhà này." : "Thêm khách thuê để bắt đầu quản lý và tạo hóa đơn hàng tháng."}
                    actionLabel={propertyId ? undefined : "Thêm khách thuê đầu tiên"}
                    actionHref={propertyId ? undefined : "/dashboard/tenants/new"}
                />
            ) : (
                <TenantList
                    tenants={tenants}
                    searchQuery={searchQuery}
                    statusFilter={statusFilter}
                />
            )}
        </DashboardShell>
    );
}
