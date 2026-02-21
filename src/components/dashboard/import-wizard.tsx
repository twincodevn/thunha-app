"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UploadCloud, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ImportWizard({ propertyId }: { propertyId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const router = useRouter();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleImport = async () => {
        if (!file) return;
        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("propertyId", propertyId);

            const res = await fetch("/api/import/excel", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (res.ok) {
                toast.success(`Nhập thành công ${data.count} phòng/khách thuê`);
                setIsOpen(false);
                router.refresh();
            } else {
                toast.error(data.error || "Lỗi khi nhập dữ liệu");
            }
        } catch (error) {
            toast.error("Đã xảy ra lỗi ngoài ý muốn. Vui lòng thử lại.");
        } finally {
            setIsUploading(false);
            setFile(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                    <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                    <span className="hidden sm:inline">Nhập từ Excel</span>
                    <span className="sm:hidden">Excel</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Nhập danh sách phòng nhanh</DialogTitle>
                    <DialogDescription>
                        Sử dụng file Excel mẫu để thêm hàng loạt phòng và khách thuê cùng lúc.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            className="hidden"
                            id="excel-upload"
                            onChange={handleFileChange}
                        />
                        <label htmlFor="excel-upload" className="cursor-pointer flex flex-col items-center w-full">
                            <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
                            {file ? (
                                <span className="text-sm font-medium text-primary flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" /> {file.name}
                                </span>
                            ) : (
                                <>
                                    <span className="text-sm font-medium">Bấm để chọn file Excel (.xlsx)</span>
                                    <span className="text-xs text-muted-foreground mt-1 text-center">
                                        Chuẩn format: Tên phòng, Giá thuê, Diện tích, Tiền cọc, Tên khách, SĐT
                                    </span>
                                </>
                            )}
                        </label>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex items-start gap-2 text-sm text-blue-700 dark:text-blue-300">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <p>
                            Dữ liệu sẽ được tự động tạo mới hoặc cập nhật nếu trùng khớp Tên phòng.
                            Khách thuê sẽ được tự động xếp vào phòng.
                        </p>
                    </div>

                    <Button
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        onClick={handleImport}
                        disabled={!file || isUploading}
                    >
                        {isUploading ? "Đang xử lý..." : "Bắt đầu Nhập dữ liệu"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
