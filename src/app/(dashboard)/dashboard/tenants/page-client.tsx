"use client";

import { useState } from "react";
import { TenantFilters } from "@/components/tenants/tenant-filters";
import { TenantList } from "@/components/tenants/tenant-list";
import { Plus, Users, Download, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { toast } from "sonner";

export function TenantPageClient({ tenants, properties, propertyId }: { tenants: any[]; properties: any[]; propertyId?: string }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const response = await fetch("/api/tenants/export");
            if (!response.ok) throw new Error("Export failed");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;

            // Extract filename from Content-Disposition if available, or fallback
            const disposition = response.headers.get('Content-Disposition');
            let filename = 'KhachThue.csv';
            if (disposition && disposition.indexOf('attachment') !== -1) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(disposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }

            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success("Xuất file CSV thành công!");
        } catch (error) {
            toast.error("Lỗi khi xuất file CSV");
        } finally {
            setIsExporting(false);
        }
    };

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
                    <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                        <Button
                            variant="outline"
                            className="shrink-0 flex-1 sm:flex-none"
                            onClick={handleExport}
                            disabled={isExporting || tenants.length === 0}
                        >
                            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            Xuất CSV
                        </Button>
                        <Button asChild className="shrink-0 flex-1 sm:flex-none">
                            <Link href="/dashboard/tenants/new">
                                <Plus className="mr-2 h-4 w-4" />
                                Thêm khách
                            </Link>
                        </Button>
                    </div>
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
