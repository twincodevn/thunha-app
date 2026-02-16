import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Hero } from "@/components/landing/hero";
import { BentoFeatures } from "@/components/landing/bento-features";
import { Testimonials } from "@/components/landing/testimonials";
import { Pricing } from "@/components/landing/pricing";
import { CTA } from "@/components/landing/cta";
import { BrandLogo } from "@/components/ui/brand-logo";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <BrandLogo variant="gradient" className="h-8 w-8 transition-transform group-hover:scale-110 duration-500" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-sans tracking-tight">
              ThuNhà
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/listings" className="text-sm font-medium text-muted-foreground hover:text-blue-600 transition-colors flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Tìm phòng
            </Link>
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-blue-600 transition-colors">
              Tính năng
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-blue-600 transition-colors">
              Bảng giá
            </Link>
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-blue-600 transition-colors">
              Đăng nhập
            </Link>
            <Button asChild className="rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all hover:scale-105">
              <Link href="/register">Dùng thử miễn phí</Link>
            </Button>
          </nav>
          <div className="flex md:hidden items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link href="/listings">Tìm phòng</Link>
            </Button>
            <Button asChild size="sm" className="rounded-full">
              <Link href="/register">Đăng ký</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <Hero />
        <BentoFeatures />
        <Testimonials />
        <Pricing />
        <CTA />
      </main>

      {/* Footer */}
      <footer className="py-12 bg-slate-50 dark:bg-slate-950 border-t">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 group">
                <BrandLogo variant="gradient" className="h-6 w-6" />
                <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">ThuNhà</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                Giải pháp quản lý nhà trọ, căn hộ dịch vụ thông minh và hiệu quả nhất.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Sản phẩm</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground">Tính năng</Link></li>
                <li><Link href="#pricing" className="hover:text-foreground">Bảng giá</Link></li>
                <li><Link href="/portal/login" className="hover:text-foreground">Cổng khách thuê</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Hỗ trợ</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/manual" className="hover:text-foreground">Hướng dẫn sử dụng</Link></li>
                <li><Link href="#" className="hover:text-foreground">Câu hỏi thường gặp</Link></li>
                <li><Link href="mailto:support@thunha.vn" className="hover:text-foreground">Liên hệ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Pháp lý</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/terms" className="hover:text-foreground">Điều khoản</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground">Bảo mật</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2026 ThuNhà. All rights reserved.</p>
            <div className="flex items-center gap-4">
              {/* Social icons can go here */}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
