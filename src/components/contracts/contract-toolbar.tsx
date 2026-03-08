
"use client";

import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ContractToolbarProps {
    contractId: string;
    fileName: string;
}

export function ContractToolbar({ contractId, fileName }: ContractToolbarProps) {
    const [isExporting, setIsExporting] = useState(false);

    const handleDownloadPDF = async () => {
        setIsExporting(true);
        try {
            const element = document.getElementById("contract-content");
            if (!element) {
                toast.error("Không tìm thấy nội dung hợp đồng");
                return;
            }

            // Create a new window for printing
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                toast.error("Vui lòng cho phép popup để tải PDF");
                return;
            }

            // Write content to new window
            printWindow.document.write(`
                <html>
                    <head>
                        <title>${fileName}</title>
                        <script src="https://cdn.tailwindcss.com"></script>
                        <style>
                            body { 
                                font-family: "Times New Roman", Times, serif; 
                                padding: 40px; 
                                max-width: 800px; 
                                margin: 0 auto; 
                            }
                            .contract-signature-img {
                                max-height: 80px;
                                max-width: 150px;
                                object-fit: contain;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="p-8 bg-white">
                            ${element.innerHTML}
                        </div>
                        <script>
                            window.onload = function() {
                                setTimeout(() => {
                                    window.print();
                                    window.close();
                                }, 500); // Wait for images/tailwind to load
                            }
                        </script>
                    </body>
                </html>
            `);
            printWindow.document.close();

            toast.success("Đang mở cửa sổ in...");
        } catch (error) {
            console.error("Print error:", error);
            toast.error("Lỗi khi tạo bản in");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleDownloadPDF} disabled={isExporting}>
                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Tải PDF / In
            </Button>
        </div>
    );
}
