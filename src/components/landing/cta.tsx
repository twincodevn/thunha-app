"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function CTA() {
    return (
        <section className="py-24 relative overflow-hidden">
            <motion.div
                className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600"
                animate={{
                    backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "linear"
                }}
                style={{ backgroundSize: '200% 200%' }}
            />

            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 mix-blend-overlay">
                <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
                </svg>
            </div>

            <div className="container px-4 md:px-6 relative z-10">
                <div className="flex flex-col items-center text-center space-y-6 max-w-2xl mx-auto">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white"
                    >
                        Sẵn sàng cách mạng hóa việc quản lý?
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-white/80 text-xl"
                    >
                        Đăng ký ngay hôm nay để nhận 14 ngày dùng thử miễn phí gói Pro. Không cần thẻ tín dụng.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col gap-3 min-[400px]:flex-row pt-4"
                    >
                        <Button size="lg" variant="secondary" className="shadow-lg group" asChild>
                            <Link href="/register">
                                Bắt đầu miễn phí
                                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white/10 hover:text-white" asChild>
                            <Link href="/login">
                                Đã có tài khoản?
                            </Link>
                        </Button>
                    </motion.div>
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="text-white/60 text-sm mt-4"
                    >
                        Hỗ trợ kỹ thuật 24/7 từ đội ngũ ThuNhà
                    </motion.p>
                </div>
            </div>
        </section>
    );
}
