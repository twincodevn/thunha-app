import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function PortalLogo({ className, showText = true }: { className?: string, showText?: boolean }) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm ring-2 ring-white/50">
                <Building2 className="h-5 w-5" />
            </div>
            {showText && (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-900 leading-none tracking-tight">ThuNhà</span>
                    <span className="text-[10px] text-slate-500 font-medium leading-none tracking-wide">PORTAL</span>
                </div>
            )}
        </div>
    );
}
