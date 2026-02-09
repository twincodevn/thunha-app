"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ComponentPropsWithoutRef } from "react";

type ButtonProps = ComponentPropsWithoutRef<typeof Button>;

interface SubmitButtonProps extends ButtonProps {
    loadingText?: string;
    children: React.ReactNode;
}

/**
 * Submit button with automatic loading state during form submission.
 * Prevents double-submit by disabling the button while the form is pending.
 * 
 * FIX: Addresses MEDIUM severity bug - no double-submit protection.
 */
export function SubmitButton({
    loadingText = "Đang xử lý...",
    children,
    disabled,
    ...props
}: SubmitButtonProps) {
    const { pending } = useFormStatus();

    return (
        <Button
            type="submit"
            disabled={pending || disabled}
            {...props}
        >
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {loadingText}
                </>
            ) : (
                children
            )}
        </Button>
    );
}
