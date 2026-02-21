import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TenantPageClient } from "./page-client";
import Link from "next/link";
import { Plus, Users, Phone, Mail, Home, AlertCircle, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TenantFilters } from "@/components/tenants/tenant-filters";
import { formatCurrency } from "@/lib/billing";
import { PageHeader } from "@/components/dashboard/page-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TenantList } from "@/components/tenants/tenant-list";

async function getTenants(userId: string, propertyId?: string) {
    const where: any = { userId };

    if (propertyId && propertyId !== "all") {
        where.roomTenants = {
            some: {
                isActive: true,
                room: { propertyId },
            },
        };
    }

    return prisma.tenant.findMany({
        where,
        include: {
            roomTenants: {
                where: { isActive: true },
                include: {
                    room: { include: { property: true } },
                    bills: {
                        where: {
                            status: { in: ["PENDING", "OVERDUE"] },
                        },
                        include: {
                            payments: true,
                        },
                    },
                },
            },
        },
        orderBy: { name: "asc" },
    });
}

async function getProperties(userId: string) {
    return prisma.property.findMany({
        where: { userId },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
    });
}

import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Khách thuê",
    description: "Quản lý khách thuê và hợp đồng",
};

export default async function TenantsPage({
    searchParams,
}: {
    searchParams: Promise<{ propertyId?: string }>;
}) {
    const session = await auth();
    if (!session?.user) return null;

    const { propertyId } = await searchParams;
    const [tenants, properties] = await Promise.all([
        getTenants(session.user.id, propertyId),
        getProperties(session.user.id),
    ]);

    return (
        <TenantPageClient
            tenants={tenants}
            properties={properties}
            propertyId={propertyId}
        />
    );
}
