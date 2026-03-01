import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, Sparkles } from "lucide-react";
import Link from "next/link";

export function ViralShareCard() {
    return (
        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-10 translate-x-10" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl translate-y-10 -translate-x-10" />

            <CardContent className="p-5 relative z-10">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-white/20 rounded-md backdrop-blur-sm">
                        <Sparkles className="h-4 w-4 text-yellow-300" />
                    </div>
                    <h3 className="font-bold text-sm tracking-wide uppercase">Cộng Đồng Bất Động Sản</h3>
                </div>

                <p className="text-sm text-indigo-100 mb-4 leading-relaxed">
                    Bạn có một khách thuê tuyệt vời? Hoặc một khách hàng nợ tiền bỏ trốn?
                </p>
                <div className="bg-black/20 p-3 rounded-lg mb-4 text-xs font-medium border border-white/10 shadow-inner">
                    Chia sẻ Báo cáo Tín nhiệm ngay. <span className="text-yellow-300 font-bold block mt-1">🎁 Nhận 1 tháng PRO khi có người đăng ký qua link của bạn!</span>
                </div>

                <Button className="w-full bg-white text-indigo-700 hover:bg-indigo-50 hover:scale-[1.02] active:scale-[0.98] transition-all font-semibold shadow-md" asChild>
                    <Link href="/dashboard/tenants">
                        <Share2 className="h-4 w-4 mr-2" />
                        Chia sẻ Báo cáo ngay
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}
