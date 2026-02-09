"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
    trigger: React.ReactNode;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "destructive" | "default";
    onConfirm: () => Promise<void> | void;
}

/**
 * Confirmation dialog for destructive actions (delete, cancel, etc.)
 * Prevents accidental data loss by requiring user confirmation.
 */
export function ConfirmDialog({
    trigger,
    title,
    description,
    confirmText = "Xác nhận",
    cancelText = "Hủy",
    variant = "destructive",
    onConfirm,
}: ConfirmDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);

    async function handleConfirm() {
        setIsLoading(true);
        try {
            await onConfirm();
            setOpen(false);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                {trigger}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>{cancelText}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleConfirm();
                        }}
                        disabled={isLoading}
                        className={cn(
                            variant === "destructive" && "bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        )}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

/**
 * Delete button with built-in confirmation dialog
 */
interface DeleteButtonProps {
    itemName: string;
    onDelete: () => Promise<void>;
    disabled?: boolean;
    className?: string;
}

export function DeleteButton({ itemName, onDelete, disabled, className }: DeleteButtonProps) {
    return (
        <ConfirmDialog
            trigger={
                <Button variant="destructive" disabled={disabled} className={className}>
                    Xóa
                </Button>
            }
            title="Xác nhận xóa"
            description={`Bạn có chắc muốn xóa "${itemName}"? Hành động này không thể hoàn tác.`}
            confirmText="Xóa"
            variant="destructive"
            onConfirm={onDelete}
        />
    );
}
