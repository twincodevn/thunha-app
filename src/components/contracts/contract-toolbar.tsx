
"use client";

import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import jsPDF from "jspdf";
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
                setIsExporting(false);
                return;
            }

            const doc = new jsPDF({
                orientation: "p",
                unit: "pt",
                format: "a4",
            });

            await doc.html(element, {
                callback: function (doc) {
                    doc.save(`${fileName}.pdf`);
                },
                x: 40,
                y: 40,
                width: 500, // Slightly less for margins
                windowWidth: 800,
            });

            toast.success("Đang bắt đầu tải xuống...");
        } catch (error) {
            console.error("PDF export error:", error);
            toast.error("Lỗi khi tạo PDF");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleDownloadPDF} disabled={isExporting}>
                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Tải PDF
            </Button>
        </div>
    );
}
