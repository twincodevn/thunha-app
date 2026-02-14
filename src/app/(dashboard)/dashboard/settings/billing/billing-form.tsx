
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { updateBankInfo } from "../actions";

const bankFormSchema = z.object({
    bankName: z.string().min(1, "Vui lòng chọn ngân hàng"),
    bankAccountNumber: z.string().min(1, "Vui lòng nhập số tài khoản"),
    bankAccountName: z.string().min(1, "Vui lòng nhập tên chủ tài khoản"),
});

type BankFormValues = z.infer<typeof bankFormSchema>;

// List of common banks in Vietnam for VietQR
const BANKS = [
    { code: "VCB", name: "Vietcombank" },
    { code: "TCB", name: "Techcombank" },
    { code: "MB", name: "MB Bank" },
    { code: "ACB", name: "ACB" },
    { code: "VPB", name: "VPBank" },
    { code: "BIDV", name: "BIDV" },
    { code: "CTG", name: "VietinBank" },
    { code: "TPB", name: "TPBank" },
    { code: "VIB", name: "VIB" },
    { code: "STB", name: "Sacombank" },
];

interface BillingFormProps {
    initialData: {
        bankName: string;
        bankAccountNumber: string;
        bankAccountName: string;
    };
}

export function BillingForm({ initialData }: BillingFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const form = useForm<BankFormValues>({
        resolver: zodResolver(bankFormSchema),
        defaultValues: {
            bankName: initialData.bankName || "",
            bankAccountNumber: initialData.bankAccountNumber || "",
            bankAccountName: initialData.bankAccountName || "",
        },
    });

    async function onSubmit(data: BankFormValues) {
        setIsLoading(true);
        try {
            const result = await updateBankInfo(data);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Cập nhật thông tin ngân hàng thành công");
                router.refresh();
            }
        } catch (error) {
            toast.error("Đã có lỗi xảy ra");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card className="overflow-hidden">
                    <CardHeader>
                        <CardTitle>Tài khoản nhận tiền</CardTitle>
                        <CardDescription>
                            Thông tin này sẽ được sử dụng để tạo mã QR thanh toán cho khách thuê.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="bankName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ngân hàng</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn ngân hàng" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {BANKS.map((bank) => (
                                                <SelectItem key={bank.code} value={bank.code}>
                                                    {bank.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Ngân hàng thụ hưởng.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="bankAccountNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Số tài khoản</FormLabel>
                                    <FormControl>
                                        <Input placeholder="0123456789" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="bankAccountName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tên chủ tài khoản</FormLabel>
                                    <FormControl>
                                        <Input placeholder="NGUYEN VAN A" className="uppercase" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Nhập không dấu, in hoa.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
                <div className="flex justify-end">
                    <Button type="submit" size="lg" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Lưu thay đổi
                    </Button>
                </div>
            </form>
        </Form>
    );
}
