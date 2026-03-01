import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    actionHref?: string;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, actionHref }: EmptyStateProps) {
    return (
        <Card className="border-0 shadow-none bg-slate-50/50 dark:bg-zinc-800/20 rounded-2xl ring-1 ring-slate-100 dark:ring-zinc-800/50 min-h-[300px] flex items-center justify-center animate-in fade-in duration-500 m-2">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center max-w-md w-full">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-500/10 blur-xl rounded-full scale-150" />
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white dark:bg-zinc-800 shadow-sm border border-slate-100 dark:border-zinc-700 relative z-10 rotate-3 transition-transform hover:rotate-6 duration-300">
                        <Icon className="h-10 w-10 text-slate-400 dark:text-zinc-400" strokeWidth={1.5} />
                    </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">{title}</h3>
                <p className="text-slate-500 dark:text-zinc-400 mb-8 text-sm leading-relaxed">
                    {description}
                </p>
                {actionLabel && actionHref && (
                    <Button asChild className="rounded-full shadow-md shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 px-6">
                        <Link href={actionHref}>
                            {actionLabel}
                        </Link>
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
