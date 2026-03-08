
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
    ExternalLink,
    CheckCircle2,
    Copy,
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    sepayApiKey: z.string().optional(),
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
        sepayApiKey: string;
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
            sepayApiKey: initialData.sepayApiKey || "",
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
                <div className="flex justify-end gap-4">
                    <Button type="submit" size="lg" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Lưu thay đổi
                    </Button>
                </div>

                <Card className="border-blue-200 bg-blue-50/30">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                                    Tự động gạch nợ (SePay)
                                </CardTitle>
                                <CardDescription>
                                    Tự động cập nhật trạng thái "Đã thanh toán" khi có tiền về ngân hàng.
                                </CardDescription>
                            </div>
                            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                                Khuyên dùng
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="rounded-lg border bg-white p-4 space-y-4">
                            <div className="space-y-1">
                                <p className="text-sm font-medium">URL Webhook của bạn:</p>
                                <div className="flex gap-2">
                                    <code className="flex-1 bg-muted p-2 rounded text-xs break-all border select-all">
                                        https://thunha.vercel.app/api/webhooks/payment
                                    </code>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="shrink-0"
                                        onClick={() => {
                                            navigator.clipboard.writeText("https://thunha.vercel.app/api/webhooks/payment");
                                            toast.success("Đã copy URL Webhook");
                                        }}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-sm font-medium">Hướng dẫn 3 bước:</p>
                                <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
                                    <li>
                                        Truy cập <a href="https://sepay.vn" target="_blank" className="text-blue-600 underline font-medium inline-flex items-center gap-1">SePay.vn <ExternalLink className="h-3 w-3" /></a> và tạo tài khoản miễn phí.
                                    </li>
                                    <li>
                                        Thêm ngân hàng của bạn (Số tài khoản: <strong>{form.getValues("bankAccountNumber") || "..."}</strong>).
                                    </li>
                                    <li>
                                        Vào mục <strong>Tích hợp {">"} Webhooks</strong>, chọn "Thêm mới" dán URL ở trên vào và lưu lại.
                                    </li>
                                </ol>
                            </div>

                            <FormField
                                control={form.control}
                                name="sepayApiKey"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            SePay API Key (Webhook Key)
                                        </FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type="password"
                                                    placeholder="Nhập API Key lấy từ SePay"
                                                    className="pr-10"
                                                    {...field}
                                                />
                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                            </div>
                                        </FormControl>
                                        <FormDescription>
                                            Tìm thấy trong mục <strong>Tích hợp {">"} API và Webhooks</strong> trên SePay.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>
            </form>
        </Form>
    );
}
