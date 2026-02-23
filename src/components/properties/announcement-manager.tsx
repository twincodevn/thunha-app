"use client";

import { useState } from "react";
import { Announcement } from "@prisma/client";
import { format } from "date-fns";
import { vi } from "date-fns/locale/vi";
import { Plus, Trash2, Megaphone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createAnnouncement, deleteAnnouncement } from "@/app/actions/announcement-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Props {
    propertyId: string;
    announcements: Announcement[];
}

export function AnnouncementManager({ propertyId, announcements }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleCreate = async () => {
        if (!title.trim() || !content.trim()) {
            toast.error("Vui lòng nhập đầy đủ tiêu đề và nội dung.");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await createAnnouncement({ propertyId, title, content });
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Đã tạo thông báo thành công!");
                setIsOpen(false);
                setTitle("");
                setContent("");
            }
        } catch (error) {
            toast.error("Lỗi khi tạo thông báo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;

        try {
            const res = await deleteAnnouncement(deleteId, propertyId);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Đã xóa thông báo.");
            }
        } catch (error) {
            toast.error("Lỗi khi xóa thông báo.");
        } finally {
            setDeleteId(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Megaphone className="w-5 h-5 text-blue-600" />
                        Bảng tin Tòa nhà
                    </h2>
                    <p className="text-sm text-slate-500">Thông báo sẽ được hiển thị trực tiếp trên ứng dụng của tất cả khách thuê.</p>
                </div>

                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Tạo thông báo
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Tạo thông báo mới</DialogTitle>
                            <DialogDescription>
                                Thông báo này sẽ được gửi dưới dạng chuông báo và hiển thị nổi bật trên portal của khách thuê.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tiêu đề</label>
                                <Input
                                    placeholder="VD: Thông báo bảo trì điện, nước..."
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nội dung</label>
                                <Textarea
                                    placeholder="Nhập nội dung chi tiết..."
                                    className="min-h-[120px]"
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>Hủy</Button>
                            <Button onClick={handleCreate} disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Đăng thông báo
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="space-y-3">
                {announcements.length === 0 ? (
                    <Card className="border-dashed bg-slate-50/50">
                        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                            <Megaphone className="h-10 w-10 text-slate-300 mb-3" />
                            <p className="text-slate-500 mb-1">Chưa có thông báo nào</p>
                            <p className="text-xs text-slate-400 max-w-[250px]">Tạo thông báo để dễ dàng quản lý thông tin chung với tất cả người thuê tại đây.</p>
                        </CardContent>
                    </Card>
                ) : (
                    announcements.map(announcement => (
                        <Card key={announcement.id}>
                            <CardContent className="p-4 flex gap-4">
                                <div className="mt-1 bg-blue-100 p-2 rounded-full h-fit">
                                    <Megaphone className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-medium text-slate-900 truncate pr-4">{announcement.title}</h3>
                                        <ConfirmDialog
                                            trigger={
                                                <button className="text-slate-400 hover:text-red-500 transition-colors shrink-0">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            }
                                            title="Xóa thông báo này?"
                                            description="Hành động này không thể hoàn tác. Các khách thuê sẽ không còn thấy thông báo này trên hệ thống."
                                            confirmText="Xóa thông báo"
                                            variant="destructive"
                                            onConfirm={async () => {
                                                try {
                                                    const res = await deleteAnnouncement(announcement.id, propertyId);
                                                    if (res.error) toast.error(res.error);
                                                    else toast.success("Đã xóa thông báo.");
                                                } catch (e) {
                                                    toast.error("Lỗi khi xóa thông báo.");
                                                }
                                            }}
                                        />
                                    </div>
                                    <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                                        {announcement.content}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-2">
                                        {format(new Date(announcement.createdAt), "HH:mm, dd/MM/yyyy", { locale: vi })}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
