
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
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-center text-green-600 flex flex-col items-center gap-2">
                            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                                <Check className="h-6 w-6" />
                            </div>
                            Thành công!
                        </DialogTitle>
                        <DialogDescription className="text-center">
                            Đã tạo tài khoản cho khách thuê <b>{tenantName}</b>.
                            <br />
                            Hãy sao chép thông tin bên dưới và gửi cho khách.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-muted p-4 rounded-md space-y-3 mt-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Đường dẫn:</span>
                            <span className="font-mono bg-white px-2 py-0.5 rounded border select-all">/portal/login</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Tài khoản:</span>
                            <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border select-all">{generatedCredentials.u}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Mật khẩu:</span>
                            <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border select-all">{generatedCredentials.p}</span>
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-center gap-2">
                        <Button variant="outline" onClick={handleClose} className="w-full">
                            Đóng
                        </Button>
                        <Button onClick={copyToClipboard} className="w-full bg-blue-600 hover:bg-blue-700">
                            <Copy className="mr-2 h-4 w-4" /> Sao chép gửi khách
                        </Button>
                    </DialogFooter>
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
