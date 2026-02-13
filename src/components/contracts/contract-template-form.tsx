
"use client";

import { updateContractTemplate } from "@/app/(dashboard)/dashboard/contracts/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Save } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ContractTemplate } from "@prisma/client";

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

interface ContractTemplateFormProps {
    template: ContractTemplate;
}

export function ContractTemplateForm({ template }: ContractTemplateFormProps) {
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
            const result = await updateContractTemplate(template.id, formData);
            if (result?.error) {
                toast.error(result.error);
            } else {
                toast.success("Cập nhật mẫu hợp đồng thành công");
                router.refresh();
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
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
                                defaultValue={template.name}
                                placeholder="Ví dụ: Hợp đồng thuê 6 tháng"
                                required
                            />
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                            <input
                                type="checkbox"
                                id="isActive"
                                name="isActive"
                                value="true"
                                defaultChecked={template.isActive}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                            />
                            <Label htmlFor="isActive" className="font-normal">Kích hoạt mẫu này</Label>
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
                            defaultValue={template.content}
                            rows={20}
                            className="min-h-[500px] font-mono text-sm leading-relaxed p-6"
                            placeholder="CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM..."
                            required
                        />
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" asChild>
                        <Link href="/dashboard/contracts/templates">Quay lại</Link>
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                            "Đang lưu..."
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" /> Lưu thay đổi
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </form>
    );
}
