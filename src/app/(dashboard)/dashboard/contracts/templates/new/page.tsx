
"use client";

import { createContractTemplate } from "../../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const PLACEHOLDERS = [
    { label: "Tên khách thuê", value: "{{TENANT_NAME}}" },
    { label: "Số phòng", value: "{{ROOM_NUMBER}}" },
    { label: "Giá thuê", value: "{{RENT_PRICE}}" },
    { label: "Tiền cọc", value: "{{DEPOSIT}}" },
    { label: "Ngày bắt đầu", value: "{{START_DATE}}" },
    { label: "Ngày kết thúc", value: "{{END_DATE}}" },
    { label: "Địa chỉ nhà", value: "{{PROPERTY_ADDRESS}}" },
    { label: "Chủ nhà", value: "{{LANDLORD_NAME}}" },
    { label: "SĐT Chủ nhà", value: "{{LANDLORD_PHONE}}" },
];

export default function NewContractTemplatePage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const router = useRouter();

    const insertPlaceholder = (placeholder: string) => {
        if (textareaRef.current) {
            const start = textareaRef.current.selectionStart;
            const end = textareaRef.current.selectionEnd;
            const text = textareaRef.current.value;
            const before = text.substring(0, start);
            const after = text.substring(end, text.length);

            textareaRef.current.value = before + placeholder + after;
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + placeholder.length;
            textareaRef.current.focus();
        }
    };

    async function handleSubmit(formData: FormData) {
        setIsSubmitting(true);
        try {
            const result = await createContractTemplate(formData);
            if (result?.error) {
                toast.error(result.error);
                return;
            }

            toast.success("Tạo mẫu hợp đồng thành công");
            router.push("/dashboard/contracts/templates");
        } catch (error) {
            toast.error("Có lỗi xảy ra");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/contracts/templates">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h1 className="text-2xl font-bold tracking-tight">Tạo mẫu hợp đồng mới</h1>
            </div>

            <form action={handleSubmit}>
                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Thông tin chung</CardTitle>
                            <CardDescription>Đặt tên cho mẫu hợp đồng để dễ dàng quản lý</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Tên mẫu hợp đồng</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="Ví dụ: Hợp đồng thuê 6 tháng"
                                    required
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Nội dung hợp đồng</CardTitle>
                            <CardDescription>
                                Soạn thảo nội dung và sử dụng các biến thay thế bên dưới.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-lg border">
                                <span className="text-xs font-medium text-muted-foreground w-full mb-1">Chèn biến tự động:</span>
                                {PLACEHOLDERS.map((p) => (
                                    <Button
                                        key={p.value}
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                                        onClick={() => insertPlaceholder(p.value)}
                                    >
                                        {p.label}
                                    </Button>
                                ))}
                            </div>

                            <Textarea
                                ref={textareaRef}
                                id="content"
                                name="content"
                                rows={20}
                                className="min-h-[500px] font-mono text-sm leading-relaxed p-6"
                                placeholder="CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM..."
                                required
                            />
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" asChild>
                            <Link href="/dashboard/contracts/templates">Hủy bỏ</Link>
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                "Đang lưu..."
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" /> Lưu mẫu hợp đồng
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
