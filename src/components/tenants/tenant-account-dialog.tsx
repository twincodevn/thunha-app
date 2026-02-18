
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Copy, Check, RefreshCw, Key } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface TenantAccountDialogProps {
    tenantId: string;
    tenantName: string;
    currentUsername?: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function TenantAccountDialog({
    tenantId,
    tenantName,
    currentUsername,
    open,
    onOpenChange,
    onSuccess,
}: TenantAccountDialogProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [username, setUsername] = useState(currentUsername || "");
    const [password, setPassword] = useState("");
    const [generatedCredentials, setGeneratedCredentials] = useState<{ u: string; p: string } | null>(null);

    const generatePassword = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let pass = "";
        for (let i = 0; i < 8; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setPassword(pass);
    };

    const generateUsername = () => {
        // Simple suggestion based on name or random
        const base = tenantName.toLowerCase().replace(/[^a-z0-9]/g, "");
        const random = Math.floor(Math.random() * 1000);
        setUsername(`${base}${random}`);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch(`/api/tenants/${tenantId}/account`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Có lỗi xảy ra");
            }

            toast.success("Cấp tài khoản thành công!");
            setGeneratedCredentials({ u: username, p: password });
            if (onSuccess) onSuccess();
            router.refresh();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (!generatedCredentials) return;
        const text = `🏠 Thông tin đăng nhập Cổng Cư Dân:\n🔗 Link: ${window.location.origin}/portal/login\n👤 User: ${generatedCredentials.u}\n🔑 Pass: ${generatedCredentials.p}`;
        navigator.clipboard.writeText(text);
        toast.success("Đã sao chép vào bộ nhớ tạm!");
    };

    const handleClose = () => {
        setGeneratedCredentials(null);
        setPassword("");
        onOpenChange(false);
    };

    if (generatedCredentials) {
        return (
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="sm:max-w-[425px] p-6 gap-6">
                    <DialogHeader className="space-y-4">
                        <div className="mx-auto h-16 w-16 bg-green-100/80 dark:bg-green-900/30 rounded-full flex items-center justify-center ring-8 ring-green-50 dark:ring-green-900/10">
                            <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="space-y-1.5 text-center">
                            <DialogTitle className="text-xl font-bold">Thành công!</DialogTitle>
                            <DialogDescription className="text-base">
                                Đã tạo tài khoản cho khách thuê <span className="font-semibold text-foreground">{tenantName}</span>
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    <div className="bg-slate-50 dark:bg-slate-900/50 border rounded-xl p-4 space-y-4">
                        <p className="text-xs text-center text-muted-foreground uppercase tracking-wider font-semibold">Thông tin đăng nhập</p>

                        <div className="space-y-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Đường dẫn Portal</Label>
                                <div className="bg-white dark:bg-slate-950 border px-3 py-2 rounded-lg flex items-center justify-between group cursor-pointer hover:border-blue-400 transition-colors" onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/portal/login`);
                                    toast.success("Đã sao chép đường dẫn");
                                }}>
                                    <code className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">/portal/login</code>
                                    <Copy className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">Tài khoản</Label>
                                    <div className="bg-white dark:bg-slate-950 border px-3 py-2 rounded-lg flex items-center justify-between group">
                                        <code className="text-sm font-bold text-blue-600 select-all">{generatedCredentials.u}</code>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">Mật khẩu</Label>
                                    <div className="bg-white dark:bg-slate-950 border px-3 py-2 rounded-lg flex items-center justify-between group">
                                        <code className="text-sm font-bold text-slate-900 dark:text-slate-100 select-all">{generatedCredentials.p}</code>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button variant="outline" onClick={handleClose} className="flex-1 h-11">
                            Đóng
                        </Button>
                        <Button onClick={copyToClipboard} className="flex-1 bg-blue-600 hover:bg-blue-700 h-11 text-base shadow-lg shadow-blue-500/20">
                            <Copy className="mr-2 h-4 w-4" /> Gửi tài khoản
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{currentUsername ? "Đặt lại mật khẩu" : "Cấp tài khoản Portal"}</DialogTitle>
                    <DialogDescription>
                        Tạo tài khoản để khách thuê truy cập ứng dụng Portal (xem hóa đơn, báo cáo sự cố).
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="username">Tên đăng nhập</Label>
                        <div className="flex gap-2">
                            <Input
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="VD: ngueynvanTb01"
                                required
                                minLength={3}
                            />
                            {!currentUsername && (
                                <Button type="button" variant="outline" size="icon" onClick={generateUsername} title="Gợi ý">
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Mật khẩu</Label>
                        <div className="flex gap-2">
                            <Input
                                id="password"
                                type="text" // Show password intentionally for easier creation
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Nhập mật khẩu..."
                                required
                                minLength={6}
                            />
                            <Button type="button" variant="outline" size="icon" onClick={generatePassword} title="Tự sinh">
                                <Key className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                            * Mật khẩu hiển thị để bạn dễ dàng nhập và kiểm tra.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Hủy
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {currentUsername ? "Cập nhật mật khẩu" : "Tạo tài khoản"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
