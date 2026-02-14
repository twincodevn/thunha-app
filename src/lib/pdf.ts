import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency } from "./billing";
import { robotoBase64 } from "./fonts";

export interface InvoiceData {
    invoiceNumber: string;
    date: string;
    dueDate: string;
    landlord: {
        name: string;
        address: string;
        phone?: string;
        email?: string;
    };
    tenant: {
        name: string;
        phone: string;
        email?: string;
    };
    property: {
        name: string;
        address: string;
        roomNumber: string;
    };
    billing: {
        month: number;
        year: number;
        baseRent: number;
        electricityUsage: number;
        electricityAmount: number;
        waterUsage: number;
        waterAmount: number;
        extraCharges?: { name: string; amount: number }[];
        discount: number;
        total: number;
    };
    bank?: {
        name: string;
        bin: string;
        accountNumber: string;
        accountName?: string;
    };
    qrCodeDataURL?: string;
}

/**
 * Generate PDF invoice for a bill
 */
export function generateInvoicePDF(data: InvoiceData): Uint8Array {
    const doc = new jsPDF();

    // Add Roboto font for Vietnamese support
    doc.addFileToVFS("Roboto-Regular.ttf", robotoBase64);
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
    doc.addFont("Roboto-Regular.ttf", "Roboto", "bold"); // Use same font for bold to ensure Unicode support
    doc.setFont("Roboto", "normal");

    const pageWidth = doc.internal.pageSize.getWidth();

    // Header with gradient-like background
    doc.setFillColor(37, 99, 235); // Blue-600
    doc.rect(0, 0, pageWidth, 45, "F");

    // Company name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("Roboto", "bold"); // Fallback for header branding
    doc.text("ThuNhà", 20, 25);

    // Invoice title
    doc.setFontSize(12);
    doc.setFont("Roboto", "normal");
    doc.text("HÓA ĐƠN TIỀN PHÒNG", 20, 35);

    // Invoice number - right aligned
    doc.setFontSize(10);
    doc.text(`Số: ${data.invoiceNumber}`, pageWidth - 20, 25, { align: "right" });
    doc.text(`Ngày: ${data.date}`, pageWidth - 20, 32, { align: "right" });
    doc.text(`Hạn thanh toán: ${data.dueDate}`, pageWidth - 20, 39, { align: "right" });

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Billing period
    doc.setFontSize(14);
    doc.setFont("Roboto", "bold");
    const monthNames = [
        "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
        "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
    ];
    doc.text(`${monthNames[data.billing.month - 1]} / ${data.billing.year}`, pageWidth / 2, 55, { align: "center" });

    // Two column layout for landlord and tenant
    const col1X = 20;
    const col2X = pageWidth / 2 + 10;
    let yPos = 70;

    // Landlord info
    doc.setFontSize(10);
    doc.setFont("Roboto", "bold");
    doc.text("CHỦ TRỌ", col1X, yPos);
    doc.setFont("Roboto", "normal");
    yPos += 6;
    doc.text(data.landlord.name, col1X, yPos);
    yPos += 5;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(data.landlord.address, col1X, yPos);
    if (data.landlord.phone) {
        yPos += 4;
        doc.text(`SĐT: ${data.landlord.phone}`, col1X, yPos);
    }

    // Tenant info
    yPos = 70;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont("Roboto", "bold");
    doc.text("KHÁCH THUÊ", col2X, yPos);
    doc.setFont("Roboto", "normal");
    yPos += 6;
    doc.text(data.tenant.name, col2X, yPos);
    yPos += 5;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`${data.property.name} - Phòng ${data.property.roomNumber}`, col2X, yPos);
    yPos += 4;
    doc.text(`SĐT: ${data.tenant.phone}`, col2X, yPos);

    // Line items table
    yPos = 105;
    doc.setTextColor(0, 0, 0);

    const tableData = [
        ["Tiền phòng", "1 tháng", formatCurrency(data.billing.baseRent)],
        [
            "Tiền điện",
            `${data.billing.electricityUsage} kWh`,
            formatCurrency(data.billing.electricityAmount),
        ],
        [
            "Tiền nước",
            `${data.billing.waterUsage} m³`,
            formatCurrency(data.billing.waterAmount),
        ],
    ];

    // Add extra charges
    if (data.billing.extraCharges) {
        data.billing.extraCharges.forEach((charge) => {
            tableData.push([charge.name, "", formatCurrency(charge.amount)]);
        });
    }

    // Add discount if any
    if (data.billing.discount > 0) {
        tableData.push(["Giảm giá", "", `-${formatCurrency(data.billing.discount)}`]);
    }

    autoTable(doc, {
        startY: yPos,
        head: [["Khoản mục", "Số lượng", "Thành tiền"]],
        body: tableData,
        theme: "striped",
        styles: { font: "Roboto" },
        headStyles: {
            fillColor: [37, 99, 235],
            textColor: [255, 255, 255],
            fontStyle: "bold",
        },
        columnStyles: {
            0: { cellWidth: 80 },
            1: { cellWidth: 50, halign: "center" },
            2: { cellWidth: 50, halign: "right" },
        },
        margin: { left: 20, right: 20 },
    });

    // Total
    // @ts-expect-error - jspdf-autotable adds this property
    let finalY = doc.lastAutoTable.finalY + 10;

    doc.setFillColor(240, 240, 240);
    doc.rect(pageWidth - 100, finalY, 80, 20, "F");
    doc.setFontSize(12);
    doc.setFont("Roboto", "bold");
    doc.text("TỔNG CỘNG", pageWidth - 95, finalY + 8);
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(14);
    doc.text(formatCurrency(data.billing.total), pageWidth - 25, finalY + 15, { align: "right" });

    finalY += 30;

    // Payment Section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("Roboto", "bold");
    doc.text("THÔNG TIN THANH TOÁN", 20, finalY);

    finalY += 8;
    doc.setFontSize(10);
    doc.setFont("Roboto", "normal");

    if (data.qrCodeDataURL) {
        // QR Code on the left
        doc.addImage(data.qrCodeDataURL, "PNG", 20, finalY, 40, 40);

        // Bank details on the right of QR code
        const bankInfoX = 65;
        doc.setFont("Roboto", "bold");
        doc.text("Quét mã QR để thanh toán nhanh", bankInfoX, finalY + 10);
        doc.setFont("Roboto", "normal");
        doc.text(`Ngân hàng: ${data.bank?.name}`, bankInfoX, finalY + 18);
        doc.text(`Số tài khoản: ${data.bank?.accountNumber}`, bankInfoX, finalY + 24);
        if (data.bank?.accountName) {
            doc.text(`Chủ tài khoản: ${data.bank?.accountName.toUpperCase()}`, bankInfoX, finalY + 30);
        }
    } else {
        doc.text("• Chuyển khoản: Theo thông tin của chủ trọ", 20, finalY);
        doc.text("• Tiền mặt: Nộp trực tiếp cho chủ trọ", 20, finalY + 8);
    }

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.setFont("Roboto", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text("Hóa đơn được tạo bởi ThuNhà - thunha.vn", pageWidth / 2, footerY, { align: "center" });

    return new Uint8Array(doc.output("arraybuffer"));
}

export function generateInvoiceDataURL(_data: InvoiceData): string {
    const doc = new jsPDF();
    // ... same content as above, but return as data URL
    return doc.output("dataurlstring");
}

// ====================================
// VAT INVOICE (Hóa đơn đỏ - Red Invoice)
// ====================================

export interface VATInvoiceData extends InvoiceData {
    vat: {
        companyName: string;        // Tên doanh nghiệp
        taxCode: string;            // Mã số thuế
        companyAddress: string;     // Địa chỉ công ty
        vatRate: number;            // Thuế suất VAT (default 10%)
        vatAmount: number;          // Số tiền thuế
        totalWithVAT: number;       // Tổng sau thuế
        invoiceSerial: string;      // Ký hiệu hóa đơn (e.g., AB/22E)
        invoiceNo: string;          // Số hóa đơn
    };
}

export function generateVATInvoicePDF(data: VATInvoiceData): Uint8Array {
    const doc = new jsPDF();
    // Add Roboto font for Vietnamese support
    doc.addFileToVFS("Roboto-Regular.ttf", robotoBase64);
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
    doc.addFont("Roboto-Regular.ttf", "Roboto", "bold");
    doc.addFont("Roboto-Regular.ttf", "Roboto", "italic");
    doc.setFont("Roboto", "normal");

    const pageWidth = doc.internal.pageSize.getWidth();

    // Red header for VAT invoice
    doc.setFillColor(220, 38, 38); // Red-600
    doc.rect(0, 0, pageWidth, 50, "F");

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("Roboto", "bold");
    doc.text("HÓA ĐƠN GIÁ TRỊ GIA TĂNG", pageWidth / 2, 15, { align: "center" });
    doc.setFontSize(10);
    doc.text("(VAT INVOICE)", pageWidth / 2, 22, { align: "center" });

    // Invoice serial and number
    doc.setFontSize(9);
    doc.text(`Ký hiệu: ${data.vat.invoiceSerial}`, pageWidth / 2, 32, { align: "center" });
    doc.text(`Số: ${data.vat.invoiceNo}`, pageWidth / 2, 38, { align: "center" });
    doc.text(`Ngày: ${data.date}`, pageWidth / 2, 44, { align: "center" });

    // Seller info (left column)
    doc.setTextColor(0, 0, 0);
    let y = 60;
    doc.setFontSize(10);
    doc.setFont("Roboto", "bold");
    doc.text("ĐƠN VỊ BÁN HÀNG (SELLER):", 15, y);
    y += 6;
    doc.setFont("Roboto", "normal");
    doc.setFontSize(9);
    doc.text(`Tên: ${data.landlord.name}`, 15, y);
    y += 5;
    doc.text(`Địa chỉ: ${data.landlord.address}`, 15, y);
    y += 5;
    if (data.landlord.phone) doc.text(`ĐT: ${data.landlord.phone}`, 15, y);

    // Buyer info
    y = 85;
    doc.setFont("Roboto", "bold");
    doc.setFontSize(10);
    doc.text("ĐƠN VỊ MUA HÀNG (BUYER):", 15, y);
    y += 6;
    doc.setFont("Roboto", "normal");
    doc.setFontSize(9);
    doc.text(`Tên công ty: ${data.vat.companyName}`, 15, y);
    y += 5;
    doc.text(`Mã số thuế: ${data.vat.taxCode}`, 15, y);
    y += 5;
    doc.text(`Địa chỉ: ${data.vat.companyAddress}`, 15, y);
    y += 5;
    doc.text(`Người liên hệ: ${data.tenant.name} - ${data.tenant.phone}`, 15, y);

    // Items table
    const tableData = [
        ["Tiền thuê phòng", `Tháng ${data.billing.month}/${data.billing.year}`, formatCurrency(data.billing.baseRent)],
        ["Tiền điện", `${data.billing.electricityUsage} kWh`, formatCurrency(data.billing.electricityAmount)],
        ["Tiền nước", `${data.billing.waterUsage} m³`, formatCurrency(data.billing.waterAmount)],
    ];

    if (data.billing.extraCharges) {
        data.billing.extraCharges.forEach((charge) => {
            tableData.push([charge.name, "", formatCurrency(charge.amount)]);
        });
    }

    if (data.billing.discount > 0) {
        tableData.push(["Giảm giá", "", `-${formatCurrency(data.billing.discount)}`]);
    }

    autoTable(doc, {
        startY: 115,
        head: [["Tên hàng hóa, dịch vụ", "Số lượng/Đơn vị", "Thành tiền"]],
        body: tableData,
        theme: "grid",
        headStyles: {
            fillColor: [220, 38, 38],
            textColor: [255, 255, 255],
            fontStyle: "bold",
        },
        styles: {
            font: "Roboto",
            fontSize: 9,
        },
        columnStyles: {
            0: { cellWidth: 80 },
            1: { cellWidth: 50, halign: "center" },
            2: { cellWidth: 50, halign: "right" },
        },
        margin: { left: 15, right: 15 },
    });

    // @ts-expect-error - jspdf-autotable adds this property
    let finalY = doc.lastAutoTable.finalY + 5;

    // Totals section
    doc.setFontSize(10);
    doc.setFont("Roboto", "normal");

    // Subtotal
    doc.text("Cộng tiền hàng (trước thuế):", pageWidth - 100, finalY);
    doc.text(formatCurrency(data.billing.total), pageWidth - 20, finalY, { align: "right" });
    finalY += 7;

    // VAT
    doc.text(`Thuế GTGT (${data.vat.vatRate}%):`, pageWidth - 100, finalY);
    doc.text(formatCurrency(data.vat.vatAmount), pageWidth - 20, finalY, { align: "right" });
    finalY += 7;

    // Total with VAT
    doc.setFont("Roboto", "bold");
    doc.setFillColor(254, 226, 226); // Red-100
    doc.rect(pageWidth - 105, finalY - 5, 90, 12, "F");
    doc.text("TỔNG CỘNG:", pageWidth - 100, finalY + 2);
    doc.setTextColor(220, 38, 38);
    doc.setFontSize(12);
    doc.text(formatCurrency(data.vat.totalWithVAT), pageWidth - 20, finalY + 3, { align: "right" });

    // Amount in words (placeholder)
    finalY += 20;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont("Roboto", "italic");
    doc.text(`(Viết bằng chữ: ${numberToVietnameseWords(data.vat.totalWithVAT)})`, 15, finalY);

    // Signatures
    finalY += 20;
    doc.setFont("Roboto", "bold");
    doc.setFontSize(9);
    const col1 = 40;
    const col2 = pageWidth - 60;

    doc.text("NGƯỜI MUA HÀNG", col1, finalY, { align: "center" });
    doc.text("NGƯỜI BÁN HÀNG", col2, finalY, { align: "center" });
    finalY += 5;
    doc.setFont("Roboto", "normal");
    doc.text("(Ký, ghi rõ họ tên)", col1, finalY, { align: "center" });
    doc.text("(Ký, ghi rõ họ tên)", col2, finalY, { align: "center" });

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 15;
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text("Hóa đơn GTGT được tạo bởi ThuNhà - thunha.vn", pageWidth / 2, footerY, { align: "center" });
    doc.text("(*) Hóa đơn này không có giá trị pháp lý như hóa đơn điện tử chính thức", pageWidth / 2, footerY + 4, { align: "center" });

    return doc.output("arraybuffer") as unknown as Uint8Array;
}

/**
 * Convert number to Vietnamese words (simplified version)
 */
function numberToVietnameseWords(num: number): string {
    if (num === 0) return "Không đồng";

    const units = ["", "nghìn", "triệu", "tỷ"];
    const digits = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];

    let result = "";
    let unitIndex = 0;

    while (num > 0) {
        const chunk = num % 1000;
        if (chunk > 0) {
            const hundreds = Math.floor(chunk / 100);
            const tens = Math.floor((chunk % 100) / 10);
            const ones = chunk % 10;

            let chunkStr = "";
            if (hundreds > 0) {
                chunkStr += digits[hundreds] + " trăm ";
            }
            if (tens > 0) {
                if (tens === 1) {
                    chunkStr += "mười ";
                } else {
                    chunkStr += digits[tens] + " mươi ";
                }
            }
            if (ones > 0) {
                if (ones === 1 && tens > 1) {
                    chunkStr += "mốt ";
                } else if (ones === 5 && tens > 0) {
                    chunkStr += "lăm ";
                } else {
                    chunkStr += digits[ones] + " ";
                }
            }

            result = chunkStr + units[unitIndex] + " " + result;
        }

        num = Math.floor(num / 1000);
        unitIndex++;
    }

    return result.trim() + " đồng";
}

/**
 * Calculate VAT invoice data from regular invoice
 */
export function calculateVATInvoice(
    invoiceData: InvoiceData,
    companyInfo: {
        companyName: string;
        taxCode: string;
        companyAddress: string;
    },
    vatRate: number = 10
): VATInvoiceData {
    const vatAmount = Math.round(invoiceData.billing.total * vatRate / 100);
    const totalWithVAT = invoiceData.billing.total + vatAmount;

    return {
        ...invoiceData,
        vat: {
            ...companyInfo,
            vatRate,
            vatAmount,
            totalWithVAT,
            invoiceSerial: `TN/${new Date().getFullYear().toString().slice(-2)}E`,
            invoiceNo: invoiceData.invoiceNumber.replace(/[^\d]/g, "").slice(-8).padStart(7, "0"),
        },
    };
}
