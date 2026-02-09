import Link from "next/link";
import { Building2, Check, X, ArrowRight, Zap, Shield, Crown, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/billing";
import { PLAN_PRICING, PLAN_LIMITS } from "@/lib/constants";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

const plans = [
    {
        id: "FREE",
        name: "Miễn phí",
        description: "Dành cho chủ trọ mới bắt đầu",
        price: PLAN_PRICING.FREE,
        rooms: PLAN_LIMITS.FREE,
        icon: Building2,
        color: "gray",
        popular: false,
        cta: "Bắt đầu miễn phí",
    },
    {
        id: "BASIC",
        name: "Basic",
        description: "Cho chủ trọ có 5-10 phòng",
        price: PLAN_PRICING.BASIC,
        rooms: PLAN_LIMITS.BASIC,
        icon: Zap,
        color: "blue",
        popular: false,
        cta: "Dùng thử 14 ngày",
    },
    {
        id: "PRO",
        name: "Pro",
        description: "Cho chủ trọ chuyên nghiệp",
        price: PLAN_PRICING.PRO,
        rooms: PLAN_LIMITS.PRO,
        icon: Crown,
        color: "indigo",
        popular: true,
        cta: "Dùng thử 14 ngày",
    },
    {
        id: "BUSINESS",
        name: "Business",
        description: "Cho doanh nghiệp & chuỗi nhà trọ",
        price: PLAN_PRICING.BUSINESS,
        rooms: PLAN_LIMITS.BUSINESS,
        icon: Shield,
        color: "purple",
        popular: false,
        cta: "Liên hệ tư vấn",
    },
];

const featureMatrix = [
    {
        category: "Quản lý cơ bản",
        features: [
            { name: "Quản lý tòa nhà & phòng", free: true, basic: true, pro: true, business: true },
            { name: "Quản lý khách thuê", free: true, basic: true, pro: true, business: true },
            { name: "Tính tiền điện nước tự động", free: true, basic: true, pro: true, business: true },
            { name: "Giới hạn phòng", free: "3", basic: "10", pro: "30", business: "∞" },
        ]
    },
    {
        category: "Hóa đơn & Thanh toán",
        features: [
            { name: "Tạo hóa đơn thủ công", free: true, basic: true, pro: true, business: true },
            { name: "Tạo hóa đơn hàng loạt", free: false, basic: true, pro: true, business: true },
            { name: "Xuất PDF hóa đơn", free: false, basic: true, pro: true, business: true },
            { name: "Chia sẻ qua Zalo/SMS", free: false, basic: true, pro: true, business: true },
            { name: "Thu tiền qua VNPay", free: false, basic: false, pro: true, business: true },
            { name: "QR Code thanh toán", free: false, basic: false, pro: true, business: true },
        ]
    },
    {
        category: "Tự động hóa",
        features: [
            { name: "Nhắc nợ tự động qua Email", free: false, basic: true, pro: true, business: true },
            { name: "Nhắc nợ qua SMS", free: false, basic: false, pro: true, business: true },
            { name: "Báo cáo định kỳ", free: false, basic: false, pro: true, business: true },
        ]
    },
    {
        category: "Báo cáo & Phân tích",
        features: [
            { name: "Thống kê cơ bản", free: true, basic: true, pro: true, business: true },
            { name: "Báo cáo doanh thu chi tiết", free: false, basic: false, pro: true, business: true },
            { name: "Xuất CSV/Excel", free: false, basic: true, pro: true, business: true },
            { name: "Dashboard Analytics", free: false, basic: false, pro: true, business: true },
        ]
    },
    {
        category: "Nâng cao",
        features: [
            { name: "API tích hợp", free: false, basic: false, pro: false, business: true },
            { name: "Nhiều tài khoản quản lý", free: false, basic: false, pro: false, business: true },
            { name: "Hỗ trợ ưu tiên 1-1", free: false, basic: false, pro: false, business: true },
            { name: "White-label (tuỳ chỉnh thương hiệu)", free: false, basic: false, pro: false, business: true },
        ]
    },
];

const faqs = [
    {
        question: "Tôi có thể dùng thử miễn phí bao lâu?",
        answer: "Gói Free là miễn phí vĩnh viễn với 3 phòng. Gói Basic và Pro có 14 ngày dùng thử miễn phí, bạn có thể huỷ bất cứ lúc nào."
    },
    {
        question: "Thanh toán bằng cách nào?",
        answer: "Chúng tôi hỗ trợ thanh toán qua VNPay, chuyển khoản ngân hàng, hoặc thẻ tín dụng/ghi nợ quốc tế."
    },
    {
        question: "Nếu tôi cần thêm phòng thì sao?",
        answer: "Bạn có thể nâng cấp gói bất cứ lúc nào. Chênh lệch phí sẽ được tính theo ngày còn lại trong chu kỳ."
    },
    {
        question: "Dữ liệu của tôi có được bảo mật không?",
        answer: "Chắc chắn! Dữ liệu được mã hoá SSL, sao lưu hàng ngày, và lưu trữ trên server tại Việt Nam tuân thủ quy định bảo mật."
    },
    {
        question: "Có hỗ trợ kỹ thuật khi gặp vấn đề không?",
        answer: "Có! Gói Free được hỗ trợ qua email. Gói Basic có hỗ trợ ưu tiên. Gói Pro và Business có hỗ trợ 1-1 qua Zalo/điện thoại."
    },
    {
        question: "Tôi có thể huỷ gói trả phí không?",
        answer: "Có, bạn có thể huỷ bất cứ lúc nào. Sau khi huỷ, tài khoản sẽ chuyển về gói Free khi hết chu kỳ thanh toán."
    },
];

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/50 to-white">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                            <Building2 className="h-5 w-5" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            ThuNhà
                        </span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-6">
                        <Link href="/#features" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                            Tính năng
                        </Link>
                        <Link href="/pricing" className="text-sm font-medium text-blue-600">
                            Bảng giá
                        </Link>
                        <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                            Đăng nhập
                        </Link>
                        <Button asChild>
                            <Link href="/register">Dùng thử miễn phí</Link>
                        </Button>
                    </nav>
                    <Button asChild className="md:hidden">
                        <Link href="/register">Đăng ký</Link>
                    </Button>
                </div>
            </header>

            {/* Hero */}
            <section className="py-16 md:py-24">
                <div className="container mx-auto px-4 text-center">
                    <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-sm font-medium px-4 py-2 rounded-full mb-6">
                        <Zap className="h-4 w-4" />
                        14 ngày dùng thử miễn phí
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                        Chọn gói phù hợp với{" "}
                        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            quy mô của bạn
                        </span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Từ chủ trọ nhỏ đến doanh nghiệp lớn, ThuNhà có gói phù hợp cho bạn.
                        Bắt đầu miễn phí, nâng cấp khi cần.
                    </p>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="pb-20">
                <div className="container mx-auto px-4">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
                        {plans.map((plan) => (
                            <Card
                                key={plan.id}
                                className={`relative flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${plan.popular
                                    ? "border-2 border-indigo-600 shadow-lg shadow-indigo-500/20 scale-[1.02]"
                                    : "border shadow-sm hover:border-gray-300"
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold px-4 py-1.5 rounded-full shadow-lg">
                                            🔥 Phổ biến nhất
                                        </span>
                                    </div>
                                )}
                                <CardHeader className="text-center pb-2 pt-8">
                                    <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-xl mb-4 ${plan.popular
                                        ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
                                        : "bg-gray-100 text-gray-600"
                                        }`}>
                                        <plan.icon className="h-7 w-7" />
                                    </div>
                                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                                    <CardDescription className="text-sm">{plan.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col">
                                    <div className="text-center mb-6">
                                        <div className="flex items-baseline justify-center gap-1">
                                            <span className="text-4xl font-bold">
                                                {plan.price === 0 ? "0" : formatCurrency(plan.price).replace("₫", "")}
                                            </span>
                                            <span className="text-lg text-muted-foreground">₫</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {plan.price === 0 ? "mãi mãi" : "/tháng"}
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                        <div className="flex items-center justify-center gap-2">
                                            <Building2 className="h-5 w-5 text-blue-600" />
                                            <span className="font-semibold">
                                                {plan.rooms === Infinity ? "Không giới hạn" : `${plan.rooms} phòng`}
                                            </span>
                                        </div>
                                    </div>

                                    <ul className="space-y-3 mb-6 flex-1">
                                        {plan.id === "FREE" && (
                                            <>
                                                <li className="flex items-center gap-2 text-sm">
                                                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                                                    <span>Quản lý cơ bản</span>
                                                </li>
                                                <li className="flex items-center gap-2 text-sm">
                                                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                                                    <span>Tính tiền điện nước</span>
                                                </li>
                                                <li className="flex items-center gap-2 text-sm">
                                                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                                                    <span>Hóa đơn thủ công</span>
                                                </li>
                                            </>
                                        )}
                                        {plan.id === "BASIC" && (
                                            <>
                                                <li className="flex items-center gap-2 text-sm">
                                                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                                                    <span>Tất cả tính năng Free</span>
                                                </li>
                                                <li className="flex items-center gap-2 text-sm">
                                                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                                                    <span>Nhắc nợ tự động</span>
                                                </li>
                                                <li className="flex items-center gap-2 text-sm">
                                                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                                                    <span>Xuất PDF hóa đơn</span>
                                                </li>
                                                <li className="flex items-center gap-2 text-sm">
                                                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                                                    <span>Chia sẻ Zalo/SMS</span>
                                                </li>
                                            </>
                                        )}
                                        {plan.id === "PRO" && (
                                            <>
                                                <li className="flex items-center gap-2 text-sm">
                                                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                                                    <span>Tất cả tính năng Basic</span>
                                                </li>
                                                <li className="flex items-center gap-2 text-sm">
                                                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                                                    <span>Thu tiền qua VNPay</span>
                                                </li>
                                                <li className="flex items-center gap-2 text-sm">
                                                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                                                    <span>Báo cáo nâng cao</span>
                                                </li>
                                                <li className="flex items-center gap-2 text-sm">
                                                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                                                    <span>Hỗ trợ ưu tiên</span>
                                                </li>
                                            </>
                                        )}
                                        {plan.id === "BUSINESS" && (
                                            <>
                                                <li className="flex items-center gap-2 text-sm">
                                                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                                                    <span>Tất cả tính năng Pro</span>
                                                </li>
                                                <li className="flex items-center gap-2 text-sm">
                                                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                                                    <span>Nhiều tài khoản quản lý</span>
                                                </li>
                                                <li className="flex items-center gap-2 text-sm">
                                                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                                                    <span>API tích hợp</span>
                                                </li>
                                                <li className="flex items-center gap-2 text-sm">
                                                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                                                    <span>Hỗ trợ 1-1</span>
                                                </li>
                                            </>
                                        )}
                                    </ul>

                                    <Button
                                        className={`w-full ${plan.popular
                                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
                                            : ""
                                            }`}
                                        variant={plan.popular ? "default" : "outline"}
                                        size="lg"
                                        asChild
                                    >
                                        <Link href={plan.id === "BUSINESS" ? "mailto:business@thunha.vn" : "/register"}>
                                            {plan.cta}
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Feature Comparison Matrix */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4">So sánh chi tiết các gói</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Xem đầy đủ tính năng của từng gói để chọn phương án phù hợp nhất
                        </p>
                    </div>

                    <div className="max-w-5xl mx-auto overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2">
                                    <th className="text-left py-4 px-4 font-semibold">Tính năng</th>
                                    <th className="text-center py-4 px-4 font-semibold text-gray-600">Free</th>
                                    <th className="text-center py-4 px-4 font-semibold text-blue-600">Basic</th>
                                    <th className="text-center py-4 px-4 font-semibold text-indigo-600">Pro</th>
                                    <th className="text-center py-4 px-4 font-semibold text-purple-600">Business</th>
                                </tr>
                            </thead>
                            <tbody>
                                {featureMatrix.map((category, catIndex) => (
                                    <>
                                        <tr key={`cat-${catIndex}`} className="bg-gray-50">
                                            <td colSpan={5} className="py-3 px-4 font-semibold text-sm text-gray-700">
                                                {category.category}
                                            </td>
                                        </tr>
                                        {category.features.map((feature, featIndex) => (
                                            <tr key={`feat-${catIndex}-${featIndex}`} className="border-b hover:bg-gray-50/50">
                                                <td className="py-3 px-4 text-sm">{feature.name}</td>
                                                <td className="py-3 px-4 text-center">
                                                    {typeof feature.free === "string" ? (
                                                        <span className="text-sm font-medium">{feature.free}</span>
                                                    ) : feature.free ? (
                                                        <Check className="h-5 w-5 text-green-600 mx-auto" />
                                                    ) : (
                                                        <X className="h-5 w-5 text-gray-300 mx-auto" />
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    {typeof feature.basic === "string" ? (
                                                        <span className="text-sm font-medium">{feature.basic}</span>
                                                    ) : feature.basic ? (
                                                        <Check className="h-5 w-5 text-green-600 mx-auto" />
                                                    ) : (
                                                        <X className="h-5 w-5 text-gray-300 mx-auto" />
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    {typeof feature.pro === "string" ? (
                                                        <span className="text-sm font-medium">{feature.pro}</span>
                                                    ) : feature.pro ? (
                                                        <Check className="h-5 w-5 text-green-600 mx-auto" />
                                                    ) : (
                                                        <X className="h-5 w-5 text-gray-300 mx-auto" />
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    {typeof feature.business === "string" ? (
                                                        <span className="text-sm font-medium">{feature.business}</span>
                                                    ) : feature.business ? (
                                                        <Check className="h-5 w-5 text-green-600 mx-auto" />
                                                    ) : (
                                                        <X className="h-5 w-5 text-gray-300 mx-auto" />
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-sm font-medium px-4 py-2 rounded-full mb-4">
                            <HelpCircle className="h-4 w-4" />
                            FAQ
                        </div>
                        <h2 className="text-3xl font-bold mb-4">Câu hỏi thường gặp</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Bạn có thắc mắc? Chúng tôi có câu trả lời.
                        </p>
                    </div>

                    <div className="max-w-3xl mx-auto">
                        <Accordion type="single" collapsible className="w-full">
                            {faqs.map((faq, index) => (
                                <AccordionItem key={index} value={`item-${index}`}>
                                    <AccordionTrigger className="text-left">
                                        {faq.question}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground">
                                        {faq.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Sẵn sàng quản lý nhà trọ thông minh hơn?
                    </h2>
                    <p className="text-blue-100 max-w-2xl mx-auto mb-8">
                        Tham gia cùng hơn 1,000 chủ nhà trọ đã tin dùng ThuNhà.
                        Bắt đầu miễn phí ngay hôm nay.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" variant="secondary" asChild>
                            <Link href="/register">
                                Bắt đầu miễn phí
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white/10" asChild>
                            <Link href="mailto:support@thunha.vn">
                                Liên hệ tư vấn
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 bg-gray-900 text-gray-400">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white">
                                <Building2 className="h-4 w-4" />
                            </div>
                            <span className="font-semibold text-white">ThuNhà</span>
                        </div>
                        <div className="flex gap-6 text-sm">
                            <Link href="/terms" className="hover:text-white">Điều khoản</Link>
                            <Link href="/privacy" className="hover:text-white">Bảo mật</Link>
                            <Link href="mailto:support@thunha.vn" className="hover:text-white">Liên hệ</Link>
                        </div>
                        <p className="text-sm">© 2026 ThuNhà. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
