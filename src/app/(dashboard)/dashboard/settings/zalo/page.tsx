"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    MessageSquare, CheckCircle2, XCircle, AlertTriangle,
    ExternalLink, Phone, Loader2, Link2, Link2Off,
    Zap, Info, RefreshCw
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function ZaloSettingsPage() {
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [testPhone, setTestPhone] = useState("");
    const [isTesting, setIsTesting] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);

    // Xử lý query params từ OAuth callback
    useEffect(() => {
        const success = searchParams.get("success");
        const error = searchParams.get("error");

        if (success === "connected") {
            toast.success("🎉 Kết nối Zalo OA thành công!");
            setIsConnected(true);
            router.replace("/dashboard/settings/zalo");
        }
        if (error) {
            const msgs: Record<string, string> = {
                missing_params: "Thiếu thông tin xác thực từ Zalo",
                invalid_state: "Phiên xác thực không hợp lệ",
                token_exchange_failed: "Không thể lấy access token từ Zalo",
            };
            toast.error(msgs[error] || "Kết nối thất bại: " + error);
            router.replace("/dashboard/settings/zalo");
        }
    }, [searchParams, router]);

    // Kiểm tra trạng thái kết nối từ server
    useEffect(() => {
        async function checkStatus() {
            try {
                const res = await fetch("/api/zalo/status");
                if (res.ok) {
                    const data = await res.json();
                    setIsConnected(data.connected);
                }
            } catch { /* ignore */ }
            finally { setCheckingStatus(false); }
        }
        checkStatus();
    }, []);

    const handleConnect = () => {
        window.location.href = "/api/zalo/connect";
    };

    const handleDisconnect = async () => {
        setIsDisconnecting(true);
        try {
            const res = await fetch("/api/zalo/send-test", { method: "DELETE" });
            if (res.ok) {
                setIsConnected(false);
                toast.success("Đã ngắt kết nối Zalo OA");
            } else {
                toast.error("Không thể ngắt kết nối");
            }
        } finally {
            setIsDisconnecting(false);
        }
    };

    const handleTestSend = async () => {
        if (!testPhone) {
            toast.error("Vui lòng nhập số điện thoại");
            return;
        }
        setIsTesting(true);
        try {
            const res = await fetch("/api/zalo/send-test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: testPhone }),
            });
            const data = await res.json();

            if (data.success) {
                if (data.sandboxMode) {
                    toast.info(`📋 Sandbox mode: Message logged. Phone: ${data.phone}`);
                } else {
                    toast.success(`✅ Đã gửi ZNS đến ${data.phone}! MsgID: ${data.msgId}`);
                }
            } else {
                toast.error("Gửi thất bại: " + (data.error || "Lỗi không xác định"));
            }
        } catch (e) {
            toast.error("Lỗi kết nối");
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <DashboardShell>
            <PageHeader
                title="Tích hợp Zalo OA"
                description="Kết nối Zalo Official Account để gửi thông báo tự động đến khách thuê"
            />

            <div className="space-y-6">
                {/* Connection Status Card */}
                <Card className={isConnected
                    ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20"
                    : "border-orange-200 bg-orange-50/50 dark:border-orange-900 dark:bg-orange-950/20"
                }>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${isConnected ? "bg-green-100 dark:bg-green-900/40" : "bg-orange-100 dark:bg-orange-900/40"}`}>
                                    <MessageSquare className={`h-5 w-5 ${isConnected ? "text-green-600" : "text-orange-500"}`} />
                                </div>
                                <div>
                                    <CardTitle className="text-base">Trạng thái kết nối</CardTitle>
                                    <CardDescription>
                                        {checkingStatus ? "Đang kiểm tra..." : isConnected
                                            ? "Zalo OA đã được kết nối và sẵn sàng gửi tin"
                                            : "Chưa kết nối — khách thuê sẽ không nhận được ZNS"
                                        }
                                    </CardDescription>
                                </div>
                            </div>
                            <Badge variant={isConnected ? "default" : "secondary"}
                                className={isConnected ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-100" : ""}>
                                {checkingStatus ? (
                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                ) : isConnected ? (
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                ) : (
                                    <XCircle className="h-3 w-3 mr-1" />
                                )}
                                {checkingStatus ? "Đang kiểm tra" : isConnected ? "Đã kết nối" : "Chưa kết nối"}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isConnected ? (
                            <Button
                                variant="outline"
                                onClick={handleDisconnect}
                                disabled={isDisconnecting}
                                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                            >
                                {isDisconnecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Link2Off className="h-4 w-4 mr-2" />}
                                Ngắt kết nối
                            </Button>
                        ) : (
                            <Button
                                onClick={handleConnect}
                                className="bg-blue-500 hover:bg-blue-600 text-white"
                            >
                                <Link2 className="h-4 w-4 mr-2" />
                                Kết nối Zalo OA
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* What ZNS Sends */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Zap className="h-4 w-4 text-blue-500" />
                            Thông báo tự động
                        </CardTitle>
                        <CardDescription>Các tin nhắn ZNS được gửi tự động đến khách thuê</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {[
                                {
                                    title: "📋 Hóa đơn mới",
                                    desc: "Gửi ngay khi tạo hóa đơn — thông báo số tiền, hạn thanh toán",
                                    status: "env",
                                    env: "ZALO_TEMPLATE_BILL_CREATED",
                                },
                                {
                                    title: "⚠️ Hóa đơn quá hạn",
                                    desc: "Gửi cùng email nhắc nợ (cron hàng ngày)",
                                    status: "env",
                                    env: "ZALO_TEMPLATE_BILL_OVERDUE",
                                },
                                {
                                    title: "📆 Hợp đồng sắp hết hạn",
                                    desc: "Nhắc trước 30, 14, 7 ngày (cron hàng ngày)",
                                    status: "env",
                                    env: "ZALO_TEMPLATE_CONTRACT_EXPIRY",
                                },
                                {
                                    title: "✅ Xác nhận thanh toán",
                                    desc: "Gửi khi chủ nhà xác nhận đã nhận tiền",
                                    status: "env",
                                    env: "ZALO_TEMPLATE_PAYMENT_CONFIRM",
                                },
                            ].map((item) => (
                                <div key={item.env} className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/40 border">
                                    <div>
                                        <p className="text-sm font-medium">{item.title}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                                        <code className="text-[10px] text-muted-foreground/70 mt-1 block">{item.env}</code>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Test Send */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Phone className="h-4 w-4 text-blue-500" />
                            Gửi tin thử
                        </CardTitle>
                        <CardDescription>
                            Gửi ZNS test đến số điện thoại bất kỳ để kiểm tra kết nối
                            {!isConnected && " (sandbox mode — không gửi thật)"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <Label htmlFor="testPhone">Số điện thoại</Label>
                                <Input
                                    id="testPhone"
                                    placeholder="09xxxxxxxx"
                                    value={testPhone}
                                    onChange={(e) => setTestPhone(e.target.value)}
                                    className="mt-1.5"
                                />
                            </div>
                            <div className="flex items-end">
                                <Button onClick={handleTestSend} disabled={isTesting}>
                                    {isTesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Gửi test
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Setup Guide */}
                <Card className="border-blue-100 dark:border-blue-900/50">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Info className="h-4 w-4 text-blue-500" />
                            Hướng dẫn cài đặt
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
                            <li>
                                Tạo tài khoản tại{" "}
                                <a href="https://developers.zalo.me" target="_blank" rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline inline-flex items-center gap-1">
                                    developers.zalo.me <ExternalLink className="h-3 w-3" />
                                </a>
                            </li>
                            <li>Tạo ứng dụng Zalo và lấy <strong>App ID</strong> + <strong>App Secret</strong></li>
                            <li>Tạo Zalo Official Account (OA) và lấy <strong>OA ID</strong></li>
                            <li>Thêm vào file <code className="bg-muted px-1.5 py-0.5 rounded text-xs">.env</code>:
                                <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-x-auto">
                                    {`ZALO_APP_ID=your_app_id
ZALO_APP_SECRET=your_app_secret
ZALO_OA_ID=your_oa_id`}
                                </pre>
                            </li>
                            <li>Submit các ZNS template tại{" "}
                                <a href="https://oa.zalo.me/home" target="_blank" rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline inline-flex items-center gap-1">
                                    oa.zalo.me <ExternalLink className="h-3 w-3" />
                                </a>{" "}
                                và thêm template IDs vào .env
                            </li>
                            <li>Nhấn <strong>Kết nối Zalo OA</strong> ở trên để hoàn tất</li>
                        </ol>

                        <Alert className="mt-4 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm">
                                ZNS template cần được Zalo duyệt (1–3 ngày).
                                Mỗi tin nhắn ZNS có phí — cần nạp credit tại Zalo Business.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            </div>
        </DashboardShell>
    );
}
