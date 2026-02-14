"use client";

import { useChat } from "ai/react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, X, Send, Loader2, Bot, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ChatWidgetProps {
    context?: string;
    title?: string;
}

export function ChatWidget({ context, title = "Hỗ trợ viên ảo" }: ChatWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
        body: { context },
    });
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-50 bg-indigo-600 hover:bg-indigo-700"
                size="icon"
            >
                <MessageCircle className="h-8 w-8 text-white" />
            </Button>
        );
    }

    return (
        <Card className="fixed bottom-4 right-4 w-[350px] md:w-[400px] h-[500px] shadow-xl z-50 flex flex-col animate-in slide-in-from-bottom-5">
            <CardHeader className="bg-indigo-600 text-white p-4 rounded-t-lg flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                    <Bot className="h-6 w-6" />
                    <CardTitle className="text-base font-medium">{title}</CardTitle>
                </div>
                <Button variant="ghost" size="icon" className="text-white hover:bg-indigo-700 h-8 w-8" onClick={() => setIsOpen(false)}>
                    <X className="h-5 w-5" />
                </Button>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden bg-slate-50 relative">
                <ScrollArea className="h-full p-4">
                    <div className="space-y-4" ref={scrollRef}>
                        {messages.length === 0 && (
                            <div className="text-center text-muted-foreground text-sm mt-8">
                                <p>Xin chào! Tôi có thể giúp gì cho bạn về phòng trọ này?</p>
                            </div>
                        )}
                        {messages.map((m) => (
                            <div
                                key={m.id}
                                className={cn(
                                    "flex w-full mb-4",
                                    m.role === "user" ? "justify-end" : "justify-start"
                                )}
                            >
                                <div
                                    className={cn(
                                        "flex gap-2 max-w-[80%]",
                                        m.role === "user" ? "flex-row-reverse" : "flex-row"
                                    )}
                                >
                                    <div className={cn(
                                        "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                                        m.role === "user" ? "bg-indigo-100" : "bg-white border"
                                    )}>
                                        {m.role === "user" ? <User className="h-4 w-4 text-indigo-600" /> : <Bot className="h-4 w-4 text-indigo-600" />}
                                    </div>
                                    <div
                                        className={cn(
                                            "rounded-lg p-3 text-sm shadow-sm",
                                            m.role === "user"
                                                ? "bg-indigo-600 text-white"
                                                : "bg-white text-slate-800 border"
                                        )}
                                    >
                                        {m.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start w-full">
                                <div className="flex gap-2 max-w-[80%]">
                                    <div className="h-8 w-8 rounded-full bg-white border flex items-center justify-center shrink-0">
                                        <Bot className="h-4 w-4 text-indigo-600" />
                                    </div>
                                    <div className="bg-white border rounded-lg p-3 shadow-sm">
                                        <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="p-3 bg-white border-t">
                <form onSubmit={handleSubmit} className="flex gap-2 w-full">
                    <Input
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Nhập câu hỏi..."
                        className="flex-1 focus-visible:ring-indigo-500"
                    />
                    <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="bg-indigo-600 hover:bg-indigo-700">
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </CardFooter>
        </Card>
    );
}
