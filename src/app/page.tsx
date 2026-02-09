import Link from "next/link";
import { Building2, Check, ArrowRight, Zap, Receipt, Users, BarChart3, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/billing";
import { PLAN_PRICING } from "@/lib/constants";

const features = [
  {
    icon: Building2,
    title: "Quản lý phòng",
    description: "Thêm tòa nhà, phòng, theo dõi tình trạng trống/đang thuê một cách dễ dàng.",
  },
  {
    icon: Users,
    title: "Quản lý khách thuê",
    description: "Lưu trữ thông tin, lịch sử thuê, và liên hệ với khách thuê nhanh chóng.",
  },
  {
    icon: Zap,
    title: "Tính tiền điện tự động",
    description: "Áp dụng giá bậc thang EVN hoặc giá tùy chỉnh. Nhập số công tơ, hệ thống tự tính.",
  },
  {
    icon: Receipt,
    title: "Xuất hóa đơn",
    description: "Tạo và gửi hóa đơn PDF chuyên nghiệp qua Zalo/SMS trong vài click.",
  },
  {
    icon: BarChart3,
    title: "Báo cáo doanh thu",
    description: "Theo dõi thu nhập, tỷ lệ thanh toán và hiệu suất cho thuê.",
  },
  {
    icon: Shield,
    title: "Bảo mật dữ liệu",
    description: "Dữ liệu được mã hóa và sao lưu tự động. An toàn và riêng tư.",
  },
];

const pricing = [
  {
    name: "Miễn phí",
    price: 0,
    rooms: "3 phòng",
    features: ["Quản lý cơ bản", "Tính tiền điện nước", "Hóa đơn thủ công"],
    cta: "Bắt đầu miễn phí",
    popular: false,
  },
  {
    name: "Basic",
    price: PLAN_PRICING.BASIC,
    rooms: "10 phòng",
    features: ["Tất cả tính năng Free", "Nhắc nợ tự động", "Xuất PDF hóa đơn", "Hỗ trợ email"],
    cta: "Dùng thử 14 ngày",
    popular: false,
  },
  {
    name: "Pro",
    price: PLAN_PRICING.PRO,
    rooms: "30 phòng",
    features: ["Tất cả tính năng Basic", "Thu tiền qua VNPay", "Báo cáo nâng cao", "Hỗ trợ ưu tiên"],
    cta: "Dùng thử 14 ngày",
    popular: true,
  },
  {
    name: "Business",
    price: PLAN_PRICING.BUSINESS,
    rooms: "Không giới hạn",
    features: ["Tất cả tính năng Pro", "Nhiều tài khoản nhân viên", "API tích hợp", "Hỗ trợ 1-1"],
    cta: "Liên hệ",
    popular: false,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
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
            <Link href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Tính năng
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900">
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
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Quản lý nhà trọ{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              thông minh
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Tự động tính tiền điện nước theo bậc thang EVN, xuất hóa đơn chuyên nghiệp, thu tiền online.
            Tiết kiệm 10+ giờ mỗi tháng.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25">
              <Link href="/register">
                Bắt đầu miễn phí
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">Xem tính năng</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            ✓ Miễn phí 3 phòng · ✓ Không cần thẻ tín dụng · ✓ Hủy bất cứ lúc nào
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Mọi thứ bạn cần để quản lý nhà trọ</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Từ quản lý phòng đến thu tiền, ThuNhà giúp bạn tiết kiệm thời gian và giảm sai sót.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 mb-4">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Bảng giá đơn giản, minh bạch</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Bắt đầu miễn phí, nâng cấp khi bạn cần. Hủy bất cứ lúc nào.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {pricing.map((plan, i) => (
              <Card
                key={i}
                className={`relative ${plan.popular
                  ? "border-blue-600 shadow-lg shadow-blue-500/20"
                  : "border-0 shadow-sm"
                  }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                      Phổ biến nhất
                    </span>
                  </div>
                )}
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold">
                      {plan.price === 0 ? "0đ" : formatCurrency(plan.price)}
                    </span>
                    {plan.price > 0 && <span className="text-muted-foreground">/tháng</span>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{plan.rooms}</p>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${plan.popular
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      : ""
                      }`}
                    variant={plan.popular ? "default" : "outline"}
                    asChild
                  >
                    <Link href="/register">{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Sẵn sàng tiết kiệm thời gian?
          </h2>
          <p className="text-blue-100 max-w-2xl mx-auto mb-8">
            Hơn 1,000 chủ nhà trọ đã tin dùng ThuNhà. Bắt đầu miễn phí ngay hôm nay.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/register">
              Đăng ký miễn phí
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
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
