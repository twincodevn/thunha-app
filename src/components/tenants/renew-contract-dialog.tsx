"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Loader2, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { RoomTenant, ContractTemplate, Room } from "@prisma/client";
import { getTemplates } from "./actions";
import { renewContractAction } from "@/app/actions/renew-contract-action";
import { addMonths, format } from "date-fns";

interface RenewContractDialogProps {
    roomTenant: RoomTenant & { room: Room };
    trigger?: React.ReactNode;
}

export function RenewContractDialog({ roomTenant, trigger }: RenewContractDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [templates, setTemplates] = useState<ContractTemplate[]>([]);

    // Form state
    const [selectedTemplate, setSelectedTemplate] = useState<string>("");
    const [newBaseRent, setNewBaseRent] = useState<number>(roomTenant.room.baseRent);
    const [renewalMonths, setRenewalMonths] = useState<number>(6); // Default 6 months
    const [newEndDate, setNewEndDate] = useState<string>("");

    const router = useRouter();

    // Calculate new end date based on current end date and months
    useEffect(() => {
        if (roomTenant.endDate) {
            const currentEnd = new Date(roomTenant.endDate);
            const nextEnd = addMonths(currentEnd, renewalMonths);
            setNewEndDate(format(nextEnd, "yyyy-MM-dd"));
        } else {
            // Month to month, start from today
            const nextEnd = addMonths(new Date(), renewalMonths);
            setNewEndDate(format(nextEnd, "yyyy-MM-dd"));
        }
    }, [renewalMonths, roomTenant.endDate]);

    useEffect(() => {
        if (isOpen && templates.length === 0) {
            getTemplates().then((res) => {
                setTemplates(res);
                if (res.length > 0) setSelectedTemplate(res[0].id);
            });
        }
    }, [isOpen]);

    async function handleRenew() {
        if (!selectedTemplate || !newEndDate) {
            toast.error("Vui lòng điền đầy đủ thông tin mẫu và ngày hết hạn mới.");
            return;
        }

        setIsLoading(true);
        try {
            const res = await renewContractAction({
                roomTenantId: roomTenant.id,
                roomId: roomTenant.room.id,
                newEndDate: new Date(newEndDate).toISOString(),
                newBaseRent: newBaseRent,
                templateId: selectedTemplate
            });

            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Đã gia hạn hợp đồng thành công!");
                setIsOpen(false);
                router.refresh();
            }
        } catch (error) {
            toast.error("Không thể gia hạn hợp đồng. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger ? trigger : (
                    <Button variant="outline" size="sm" className="bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100 hover:text-orange-700">
                        <CalendarClock className="mr-2 h-4 w-4" />
                        Gia hạn hợp đồng
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-orange-500" />
                        Gia hạn Hợp đồng
                    </DialogTitle>
                    <DialogDescription>
                        Cập nhật thời hạn mới và giá thuê phòng (nếu có thay đổi) cho khách hàng này.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Chọn Mẫu Hợp đồng Mới</Label>
                        <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn mẫu hợp đồng..." />
                            </SelectTrigger>
                            <SelectContent>
                                {templates.map(t => (
                                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Gia hạn thêm</Label>
                            <Select value={renewalMonths.toString()} onValueChange={(v) => setRenewalMonths(parseInt(v))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">1 Tháng</SelectItem>
                                    <SelectItem value="3">3 Tháng</SelectItem>
                                    <SelectItem value="6">6 Tháng</SelectItem>
                                    <SelectItem value="12">1 Năm</SelectItem>
                                    <SelectItem value="24">2 Năm</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Ngày hết hạn mới</Label>
                            <Input
                                type="date"
                                value={newEndDate}
                                onChange={(e) => setNewEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Tiền phòng mới (Tháng)</Label>
                        <div className="relative">
                            <Input
                                type="number"
                                value={newBaseRent}
                                onChange={(e) => setNewBaseRent(Number(e.target.value))}
                                className="pl-8"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">₫</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 text-right">
                            Đang thu: {roomTenant.room.baseRent.toLocaleString('vi-VN')}₫
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>Hủy</Button>
                    <Button onClick={handleRenew} disabled={isLoading || !selectedTemplate} className="bg-orange-600 hover:bg-orange-700 text-white">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarClock className="mr-2 h-4 w-4" />}
                        Xác nhận gia hạn
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
