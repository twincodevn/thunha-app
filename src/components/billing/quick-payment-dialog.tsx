"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, DollarSign } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { formatCurrency } from "@/lib/billing";
import { confirmPayment } from "@/app/(dashboard)/dashboard/billing/actions";

const formSchema = z.object({
    amount: z.coerce.number().min(1000, "Số tiền tối thiểu 1.000đ"),
    method: z.enum(["CASH", "BANK_TRANSFER", "VNPAY", "MOMO"]),
    note: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface QuickPaymentDialogProps {
    bill: {
        id: string;
        total: number;
        status: string;
        payments: { amount: number }[];
        roomTenant: {
            room: { roomNumber: string; property: { name: string } };
            tenant: { name: string };
        };
    };
    trigger?: React.ReactNode;
}

export function QuickPaymentDialog({ bill, trigger }: QuickPaymentDialogProps) {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const paidAmount = bill.payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingAmount = Math.max(0, bill.total - paidAmount);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            amount: remainingAmount,
            method: "CASH",
            note: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const result = await confirmPayment({
                billId: bill.id,
                amount: values.amount,
                method: values.method,
                note: values.note,
            });

            if (result.error) {
                toast.error(result.error);
                return;
            }

            toast.success("Đã ghi nhận thanh toán thành công");
            setOpen(false);
            router.refresh();
        } catch (error) {
            toast.error("Đã có lỗi xảy ra");
        }
    }

    if (bill.status === "PAID") return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button size="sm" variant="outline" className="h-8">
                        <DollarSign className="mr-2 h-3.5 w-3.5" />
                        Thanh toán
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Xác nhận thanh toán</DialogTitle>
                    <DialogDescription>
                        Ghi nhận thanh toán cho phòng {bill.roomTenant.room.roomNumber} -{" "}
                        {bill.roomTenant.room.property.name}
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Tổng tiền:</span>
                        <span className="font-medium">{formatCurrency(bill.total)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Đã trả:</span>
                        <span className="font-medium">{formatCurrency(paidAmount)}</span>
                    </div>
                    <div className="flex justify-between border-t border-border/50 pt-2 mt-2">
                        <span className="text-muted-foreground font-medium">Còn lại:</span>
                        <span className="font-bold text-lg text-primary">
                            {formatCurrency(remainingAmount)}
                        </span>
                    </div>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Số tiền thực nhận</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input {...field} type="number" />
                                            <div className="absolute right-3 top-2.5 text-sm text-muted-foreground">
                                                đ
                                            </div>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="method"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phương thức</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn phương thức" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="CASH">Tiền mặt</SelectItem>
                                            <SelectItem value="BANK_TRANSFER">
                                                Chuyển khoản
                                            </SelectItem>
                                            <SelectItem value="MOMO">MoMo</SelectItem>
                                            <SelectItem value="VNPAY">VNPay</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="note"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ghi chú (tùy chọn)</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} placeholder="VD: Đã nhận đủ tiền mặt..." />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="submit"
                                disabled={form.formState.isSubmitting}
                                className="w-full"
                            >
                                {form.formState.isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Đang xử lý...
                                    </>
                                ) : (
                                    "Xác nhận đã thu tiền"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
