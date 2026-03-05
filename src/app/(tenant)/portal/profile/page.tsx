import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { User, Phone, Mail, IdCard, Calendar, MapPin, LogOut } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { LogoutButton } from "./logout-button";

export default async function ProfilePage() {
    const session = await auth();
    if (!session || session.user.role !== "TENANT") {
        redirect("/portal/login");
    }

    const tenant = await prisma.tenant.findUnique({
        where: { id: session.user.id },
        include: {
            roomTenants: {
                where: { isActive: true },
                include: {
                    room: { include: { property: true } },
                },
            },
        },
    });

    if (!tenant) {
        redirect("/portal/login");
    }

    const currentTenancy = tenant.roomTenants[0];
    const room = currentTenancy?.room;
    const property = room?.property;

    const infoItems = [
        { icon: User, label: "Họ tên", value: tenant.name },
        { icon: Phone, label: "Số điện thoại", value: tenant.phone || "Chưa cập nhật" },
        { icon: Mail, label: "Email", value: tenant.email || "Chưa cập nhật" },
        { icon: IdCard, label: "CCCD/CMND", value: tenant.idNumber || "Chưa cập nhật" },
        {
            icon: Calendar,
            label: "Ngày sinh",
            value: tenant.dateOfBirth
                ? format(tenant.dateOfBirth, "dd/MM/yyyy", { locale: vi })
                : "Chưa cập nhật",
        },
        {
            icon: MapPin,
            label: "Phòng hiện tại",
            value: room
                ? `${property?.name || "Nhà trọ"} — Phòng ${room.roomNumber}`
                : "Chưa được gán phòng",
        },
    ];

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="px-2 pt-2">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    Tài khoản <span className="text-3xl">👤</span>
                </h1>
                <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1">
                    Thông tin cá nhân của bạn
                </p>
            </div>

            {/* Avatar Section */}
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-[28px] border border-slate-200/50 dark:border-zinc-800/50 shadow-sm p-6 flex flex-col items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-black shadow-lg">
                    {tenant.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-center">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">{tenant.name}</h2>
                    <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">{tenant.phone}</p>
                </div>
            </div>

            {/* Info Card */}
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-[28px] border border-slate-200/50 dark:border-zinc-800/50 shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                    {infoItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4 px-5 py-4">
                            <div className="h-10 w-10 rounded-2xl bg-slate-50 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                                <item.icon className="h-4.5 w-4.5 text-slate-500 dark:text-zinc-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">{item.label}</p>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5 truncate">{item.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Logout */}
            <LogoutButton />
        </div>
    );
}
