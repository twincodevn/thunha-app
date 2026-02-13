
"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, Check, PenTool } from "lucide-react";

interface SignaturePadProps {
    onSave: (signatureData: string) => void;
}

export function SignaturePad({ onSave }: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set dimensions correctly for high DPI
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        ctx.scale(dpr, dpr);
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.strokeStyle = "#000000";
    }, []);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        setIsDrawing(true);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const { x, y } = getCoordinates(e, canvas);
        ctx.beginPath();
        ctx.moveTo(x, y);

        // Add subtle shadow for more "ink" feel
        ctx.shadowBlur = 1;
        ctx.shadowColor = "rgba(0,0,0,0.2)";
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const { x, y } = getCoordinates(e, canvas);
        ctx.lineTo(x, y);
        ctx.stroke();
        setHasSignature(true);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const clear = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        onSave(canvas.toDataURL("image/png"));
    };

    return (
        <div className="space-y-4">
            <div className="group relative border-2 border-dashed rounded-xl bg-slate-50/50 hover:bg-slate-50 hover:border-blue-400 transition-all duration-300 touch-none h-48 w-full overflow-hidden shadow-inner">
                {!hasSignature && !isDrawing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 pointer-events-none">
                        <PenTool className="h-8 w-8 mb-2 opacity-20" />
                        <p className="text-xs font-medium">Ký tên tại đây</p>
                    </div>
                )}
                <canvas
                    ref={canvasRef}
                    className="w-full h-full cursor-crosshair block absolute inset-0 z-10"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
            </div>
            <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={clear}>
                    <Eraser className="mr-2 h-4 w-4" /> Xóa
                </Button>
                <Button size="sm" onClick={handleSave} disabled={!hasSignature}>
                    <Check className="mr-2 h-4 w-4" /> Lưu chữ ký
                </Button>
            </div>
        </div>
    );
}
