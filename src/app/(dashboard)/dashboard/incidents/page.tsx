import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { IncidentList } from "@/components/incidents/incident-list";
import { IncidentReportForm } from "@/components/incidents/incident-report-form";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata = {
    title: "Quản lý Sự cố | ThuNhà",
    description: "Theo dõi và xử lý các sự cố tại các tòa nhà",
};

export default async function IncidentsPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const userId = session.user.id;

    // Fetch properties for the report form
    const properties = await prisma.property.findMany({
        where: { userId },
        select: { id: true, name: true },
    });

    // Fetch room tenants for linking incidents
    const roomTenants = await prisma.roomTenant.findMany({
        where: { room: { property: { userId } }, isActive: true },
        select: {
            id: true,
            room: { select: { roomNumber: true, propertyId: true } },
            tenant: { select: { name: true } },
        },
    });

    const formattedRoomTenants = roomTenants.map((rt: any) => ({
        id: rt.id,
        roomNumber: rt.room.roomNumber,
        tenantName: rt.tenant.name,
        propertyId: rt.room.propertyId,
    }));

    // Fetch incidents
    const allIncidents = await prisma.incident.findMany({
        where: { property: { userId } },
        include: {
            property: { select: { name: true } },
            roomTenant: {
                include: {
                    room: { select: { roomNumber: true } },
                    tenant: { select: { name: true } },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    const parsedIncidents = allIncidents.map((incident: any) => ({
        ...incident,
        images: incident.images ? JSON.parse(incident.images) : [],
    }));

    const openIncidents = parsedIncidents.filter((i: any) => i.status === "OPEN" || i.status === "IN_PROGRESS");
    const resolvedIncidents = parsedIncidents.filter((i: any) => i.status === "RESOLVED" || i.status === "CANCELLED");

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Quản lý Sự cố</h1>
                    <p className="text-muted-foreground">
                        Theo dõi và xử lý các vấn đề phát sinh tại tòa nhà của bạn.
                    </p>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="shrink-0">
                            <Plus className="mr-2 h-4 w-4" /> Báo cáo sự cố mới
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Báo cáo sự cố</DialogTitle>
                            <DialogDescription>
                                Điền thông tin chi tiết về sự cố để bắt đầu theo dõi xử lý.
                            </DialogDescription>
                        </DialogHeader>
                        <IncidentReportForm
                            properties={properties}
                            roomTenants={formattedRoomTenants}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                    <TabsTrigger value="active">
                        Đang xử lý ({openIncidents.length})
                    </TabsTrigger>
                    <TabsTrigger value="history">
                        Lịch sử ({resolvedIncidents.length})
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="active" className="mt-6">
                    <IncidentList incidents={openIncidents as any} />
                </TabsContent>
                <TabsContent value="history" className="mt-6">
                    <IncidentList incidents={resolvedIncidents as any} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
