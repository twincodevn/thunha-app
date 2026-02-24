import { cn } from "@/lib/utils";

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    description?: string;
    children?: React.ReactNode;
}

export function PageHeader({
    title,
    description,
    children,
    className,
    ...props
}: PageHeaderProps) {
    return (
        <div className={cn("flex flex-col gap-3 pb-5", className)} {...props}>
            <div className="space-y-0.5">
                <h1 className="text-xl font-bold tracking-tight lg:text-2xl">{title}</h1>
                {description && (
                    <p className="text-sm text-muted-foreground lg:text-base">
                        {description}
                    </p>
                )}
            </div>
            {children && (
                <div className="flex items-center gap-2 w-full md:w-auto">
                    {children}
                </div>
            )}
        </div>
    );
}
