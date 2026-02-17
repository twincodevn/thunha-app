
"use client";

import React, { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Eraser, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SignaturePadProps {
    onSave: (signatureData: string) => Promise<void>;
}

export function SignaturePad({ onSave }: SignaturePadProps) {
    const sigPad = useRef<SignatureCanvas>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isEmpty, setIsEmpty] = useState(true);

    const clear = () => {
        sigPad.current?.clear();
        setIsEmpty(true);
    };

    const save = async () => {
        if (isEmpty) {
            toast.error("Vui lòng ký tên trước khi lưu");
            return;
        }

        setIsSaving(true);
        try {
            // Get base64 data
            const dataUrl = sigPad.current?.getTrimmedCanvas().toDataURL("image/png");
            if (dataUrl) {
                await onSave(dataUrl);
                toast.success("Đã ký thành công!");
            }
        } catch (error) {
            console.error("Signature save error:", error);
            toast.error("Có lỗi xảy ra khi lưu chữ ký");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white overflow-hidden touch-none">
                <SignatureCanvas
                    ref={sigPad}
                    penColor="black"
                    canvasProps={{
                        className: "w-full h-[200px] cursor-crosshair",
                    }}
                    onBegin={() => setIsEmpty(false)}
                />
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground px-1">
                <p>Ký tên vào khung bên trên</p>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={clear}
                        disabled={isSaving || isEmpty}
                    >
                        <Eraser className="mr-2 h-4 w-4" />
                        Xóa
                    </Button>
                    <Button
                        size="sm"
                        onClick={save}
                        disabled={isSaving || isEmpty}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                        Xác nhận ký
                    </Button>
                </div>
            </div>
        </div>
    );
}
