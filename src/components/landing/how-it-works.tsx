"use client";

import { motion } from "framer-motion";
import { UserPlus, Settings2, Sparkles, ArrowRight } from "lucide-react";

const steps = [
    {
        title: "Tạo tài khoản miễn phí",
        description: "Đăng ký chỉ mất 30 giây. Không cần thẻ tín dụng, không ràng buộc thẻ.",
        icon: UserPlus,
        color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30",
    },
    {
        title: "Thiết lập nhà trọ",
        description: "Thêm thông tin tòa nhà, số lượng phòng và biểu giá điện nước hiện tại.",
        icon: Settings2,
        color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30",
    },
    {
        title: "Tự động hóa mọi thứ",
        description: "ThuNhà sẽ tự động gửi hóa đơn, nhắc nợ và tổng hợp báo cáo tài chính cho bạn.",
        icon: Sparkles,
        color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30",
    },
];

export function HowItWorks() {
    return (
        <section className="py-24 bg-white dark:bg-slate-950 overflow-hidden">
            <div className="container px-4 md:px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4"
                    >
                        Quản lý dễ dàng qua 3 bước
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-muted-foreground text-lg"
                    >
                        Chuyển đổi từ sổ sách sang nền tảng số chưa bao giờ đơn giản thế.
                    </motion.p>
                </div>

                <div className="relative max-w-5xl mx-auto">
                    {/* Connecting Line */}
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 hidden md:block" />

                    <motion.div
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.5, ease: "easeInOut" }}
                        className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600 -translate-y-1/2 hidden md:block origin-left"
                    />

                    <div className="grid md:grid-cols-3 gap-8 relative z-10">
                        {steps.map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.2 }}
                                className="flex flex-col items-center text-center bg-white dark:bg-slate-950 p-6 rounded-2xl"
                            >
                                <motion.div
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    className={`w-20 h-20 rounded-full ${step.color} flex items-center justify-center mb-6 shadow-xl shadow-slate-200/50 dark:shadow-none ring-8 ring-white dark:ring-slate-950`}
                                >
                                    <step.icon className="w-10 h-10" />
                                </motion.div>
                                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                                <p className="text-muted-foreground">{step.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
