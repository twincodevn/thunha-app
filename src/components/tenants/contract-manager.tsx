
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileText, Plus, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createContract } from "@/app/(dashboard)/dashboard/contracts/generate-action";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RoomTenant, Contract, ContractTemplate, Room } from "@prisma/client";
import { useEffect } from "react";
import { getTemplates } from "./actions"; // We need a way to fetch templates
import { RenewContractDialog } from "./renew-contract-dialog";

interface ContractManagerProps {
    roomTenant: RoomTenant & { contracts?: Contract[], room?: Room };
}

export function ContractManager({ roomTenant }: ContractManagerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [templates, setTemplates] = useState<ContractTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string>("");
    const router = useRouter();

    // Fetch templates when dialog opens
    useEffect(() => {
        if (isOpen && templates.length === 0) {
            getTemplates().then(setTemplates);
        }
    }, [isOpen]);

    async function handleCreate() {
        if (!selectedTemplate) return;
        setIsLoading(true);
        try {
            const result = await createContract(
                roomTenant.id,
                selectedTemplate,
                new Date(roomTenant.startDate),
                roomTenant.endDate ? new Date(roomTenant.endDate) : undefined
            );

            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Đã tạo hợp đồng thành công");
                setIsOpen(false);
                router.refresh();
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Hợp đồng thuê</span>
                <div className="flex items-center gap-2">
                    {roomTenant.room && (
                        <RenewContractDialog roomTenant={roomTenant as any} />
                    )}
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 text-xs">
                                <Plus className="mr-1 h-3 w-3" /> Tạo mới
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Tạo hợp đồng mới</DialogTitle>
                                <DialogDescription>
                                    Chọn mẫu hợp đồng để áp dụng cho khách thuê này.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="template">Mẫu hợp đồng</Label>
                                    <Select onValueChange={setSelectedTemplate} value={selectedTemplate}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn mẫu..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {templates.map((t) => (
                                                <SelectItem key={t.id} value={t.id}>
                                                    {t.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsOpen(false)}>Hủy</Button>
                                <Button onClick={handleCreate} disabled={!selectedTemplate || isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Tạo hợp đồng
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {roomTenant.contracts && roomTenant.contracts.length > 0 ? (
                <div className="space-y-2">
                    {roomTenant.contracts.map((contract) => (
                        <div key={contract.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm group hover:bg-muted transition-colors">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                                <span className="truncate">Hợp đồng {new Date(contract.createdAt).toLocaleDateString('vi-VN')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <BadgeStatus status={contract.status} />
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                                    <Link href={`/dashboard/contracts/${contract.id}`}>
                                        <ExternalLink className="h-3 w-3" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-xs text-muted-foreground italic">Chưa có hợp đồng nào</p>
            )}
        </div>
    );
}

function BadgeStatus({ status }: { status: string }) {
    const styles: Record<string, string> = {
        DRAFT: "bg-gray-100 text-gray-800",
        SENT: "bg-blue-100 text-blue-800",
        SIGNED: "bg-green-100 text-green-800",
        EXPIRED: "bg-orange-100 text-orange-800",
        TERMINATED: "bg-red-100 text-red-800",
    };

    const labels: Record<string, string> = {
        DRAFT: "Nháp",
        SENT: "Đã gửi",
        SIGNED: "Đã ký",
        EXPIRED: "Hết hạn",
        TERMINATED: "Chấm dứt",
    };

    return (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${styles[status] || styles.DRAFT}`}>
            {labels[status] || status}
        </span>
    );
}
