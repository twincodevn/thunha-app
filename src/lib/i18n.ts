/**
 * Internationalization (i18n) System
 * Supports Vietnamese (default) and English
 */

export type Locale = "vi" | "en";

const translations: Record<Locale, Record<string, string>> = {
    vi: {
        // Common
        "app.name": "ThuNhà",
        "app.tagline": "Quản lý nhà cho thuê thông minh",
        "common.save": "Lưu",
        "common.cancel": "Hủy",
        "common.delete": "Xóa",
        "common.edit": "Sửa",
        "common.add": "Thêm",
        "common.search": "Tìm kiếm",
        "common.loading": "Đang tải...",
        "common.export": "Xuất",
        "common.all": "Tất cả",
        "common.confirm": "Xác nhận",
        "common.back": "Quay lại",
        "common.next": "Tiếp theo",
        "common.close": "Đóng",
        "common.yes": "Có",
        "common.no": "Không",

        // Navigation
        "nav.dashboard": "Tổng quan",
        "nav.properties": "Tòa nhà",
        "nav.tenants": "Khách thuê",
        "nav.utilities": "Điện nước",
        "nav.billing": "Hóa đơn",
        "nav.analytics": "Phân tích",
        "nav.settings": "Cài đặt",
        "nav.deposits": "Tiền cọc",
        "nav.comparison": "So sánh",
        "nav.tax_report": "Báo cáo thuế",
        "nav.forecast": "Dự báo AI",
        "nav.marketplace": "Cho thuê",
        "nav.team": "Nhân viên",
        "nav.subscription": "Gói dịch vụ",

        // Dashboard
        "dashboard.title": "Tổng quan",
        "dashboard.revenue": "Doanh thu",
        "dashboard.occupancy": "Tỷ lệ lấp đầy",
        "dashboard.pending_bills": "Hóa đơn chờ",
        "dashboard.overdue": "Quá hạn",

        // Properties
        "property.title": "Quản lý tòa nhà",
        "property.add": "Thêm tòa nhà",
        "property.name": "Tên tòa nhà",
        "property.address": "Địa chỉ",
        "property.rooms": "Phòng",
        "property.electricity_rate": "Giá điện",
        "property.water_rate": "Giá nước",

        // Rooms
        "room.number": "Số phòng",
        "room.rent": "Tiền phòng",
        "room.status": "Trạng thái",
        "room.occupied": "Đang thuê",
        "room.available": "Trống",
        "room.maintenance": "Bảo trì",
        "room.area": "Diện tích",
        "room.floor": "Tầng",
        "room.deposit": "Tiền cọc",

        // Tenants
        "tenant.name": "Họ tên",
        "tenant.phone": "Số điện thoại",
        "tenant.email": "Email",
        "tenant.id_number": "CMND/CCCD",

        // Billing
        "bill.title": "Quản lý hóa đơn",
        "bill.create": "Lập hóa đơn mới",
        "bill.total": "Tổng cộng",
        "bill.status.pending": "Chờ thanh toán",
        "bill.status.paid": "Đã thanh toán",
        "bill.status.overdue": "Quá hạn",
        "bill.due_date": "Hạn thanh toán",
        "bill.rent": "Tiền phòng",
        "bill.electricity": "Tiền điện",
        "bill.water": "Tiền nước",
        "bill.reminder": "Nhắc nhở",
        "bill.batch_reminder": "Nhắc nhở hàng loạt",

        // Payment
        "payment.vietqr": "Thanh toán QR",
        "payment.bank_transfer": "Chuyển khoản",
        "payment.cash": "Tiền mặt",

        // Tax
        "tax.title": "Báo cáo thuế",
        "tax.income": "Thu nhập",
        "tax.expense": "Chi phí",
        "tax.profit": "Lợi nhuận",
        "tax.estimated": "Thuế ước tính",
        "tax.export_csv": "Xuất CSV",

        // Marketplace
        "marketplace.title": "Tìm phòng trọ",
        "marketplace.search": "Tìm theo khu vực",
        "marketplace.contact": "Liên hệ",
        "marketplace.call": "Gọi điện",
    },
    en: {
        // Common
        "app.name": "ThuNhà",
        "app.tagline": "Smart Rental Property Management",
        "common.save": "Save",
        "common.cancel": "Cancel",
        "common.delete": "Delete",
        "common.edit": "Edit",
        "common.add": "Add",
        "common.search": "Search",
        "common.loading": "Loading...",
        "common.export": "Export",
        "common.all": "All",
        "common.confirm": "Confirm",
        "common.back": "Back",
        "common.next": "Next",
        "common.close": "Close",
        "common.yes": "Yes",
        "common.no": "No",

        // Navigation
        "nav.dashboard": "Dashboard",
        "nav.properties": "Properties",
        "nav.tenants": "Tenants",
        "nav.utilities": "Utilities",
        "nav.billing": "Billing",
        "nav.analytics": "Analytics",
        "nav.settings": "Settings",
        "nav.deposits": "Deposits",
        "nav.comparison": "Comparison",
        "nav.tax_report": "Tax Report",
        "nav.forecast": "AI Forecast",
        "nav.marketplace": "Marketplace",
        "nav.team": "Team",
        "nav.subscription": "Subscription",

        // Dashboard
        "dashboard.title": "Dashboard",
        "dashboard.revenue": "Revenue",
        "dashboard.occupancy": "Occupancy Rate",
        "dashboard.pending_bills": "Pending Bills",
        "dashboard.overdue": "Overdue",

        // Properties
        "property.title": "Property Management",
        "property.add": "Add Property",
        "property.name": "Property Name",
        "property.address": "Address",
        "property.rooms": "Rooms",
        "property.electricity_rate": "Electricity Rate",
        "property.water_rate": "Water Rate",

        // Rooms
        "room.number": "Room Number",
        "room.rent": "Monthly Rent",
        "room.status": "Status",
        "room.occupied": "Occupied",
        "room.available": "Available",
        "room.maintenance": "Maintenance",
        "room.area": "Area",
        "room.floor": "Floor",
        "room.deposit": "Deposit",

        // Tenants
        "tenant.name": "Full Name",
        "tenant.phone": "Phone",
        "tenant.email": "Email",
        "tenant.id_number": "ID Number",

        // Billing
        "bill.title": "Bill Management",
        "bill.create": "Create New Bill",
        "bill.total": "Total",
        "bill.status.pending": "Pending",
        "bill.status.paid": "Paid",
        "bill.status.overdue": "Overdue",
        "bill.due_date": "Due Date",
        "bill.rent": "Rent",
        "bill.electricity": "Electricity",
        "bill.water": "Water",
        "bill.reminder": "Reminder",
        "bill.batch_reminder": "Batch Reminder",

        // Payment
        "payment.vietqr": "QR Payment",
        "payment.bank_transfer": "Bank Transfer",
        "payment.cash": "Cash",

        // Tax
        "tax.title": "Tax Report",
        "tax.income": "Income",
        "tax.expense": "Expenses",
        "tax.profit": "Net Profit",
        "tax.estimated": "Estimated Tax",
        "tax.export_csv": "Export CSV",

        // Marketplace
        "marketplace.title": "Find Rooms",
        "marketplace.search": "Search by area",
        "marketplace.contact": "Contact",
        "marketplace.call": "Call",
    },
};

// Default locale
let currentLocale: Locale = "vi";

export function setLocale(locale: Locale) {
    currentLocale = locale;
    if (typeof window !== "undefined") {
        localStorage.setItem("thunha-locale", locale);
    }
}

export function getLocale(): Locale {
    if (typeof window !== "undefined") {
        return (localStorage.getItem("thunha-locale") as Locale) || "vi";
    }
    return currentLocale;
}

export function t(key: string, locale?: Locale): string {
    const lang = locale || getLocale();
    return translations[lang]?.[key] || translations.vi[key] || key;
}

/**
 * Format currency based on locale
 */
export function formatMoney(amount: number, locale?: Locale): string {
    const lang = locale || getLocale();
    if (lang === "en") {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0,
        }).format(amount);
    }
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Format date based on locale
 */
export function formatDate(date: Date | string, locale?: Locale): string {
    const lang = locale || getLocale();
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString(lang === "en" ? "en-US" : "vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}
