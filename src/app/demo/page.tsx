import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";

export default function DemoPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/20">
            <div className="max-w-md text-center space-y-6">
                <div className="flex justify-center mb-8">
                    <BrandLogo variant="gradient" className="h-16 w-16" />
                </div>
                <h1 className="text-4xl font-bold tracking-tight">Trải nghiệm Demo</h1>
                <p className="text-muted-foreground text-lg">
                    Tính năng trải nghiệm tương tác (Live Interactive Demo) đang được hoàn thiện và bảo trì để nâng cấp server.
                </p>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 rounded-lg text-sm text-blue-700">
                    <p className="font-semibold">Mẹo:</p>
                    <p>Bạn có thể đăng ký tài khoản miễn phí để trải nghiệm toàn bộ tính năng ngay lập tức.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                    <Button asChild size="lg" className="rounded-full shadow-lg">
                        <Link href="/register">Đăng ký dùng thử</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="rounded-full">
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Quay lại trang chủ
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
