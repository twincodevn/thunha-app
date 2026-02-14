"use client";

import { motion } from "framer-motion";
import { Building2, Users, Zap, Receipt, BarChart3, Shield } from "lucide-react";

const features = [
    {
        icon: Building2,
        title: "Quản lý phòng",
        description: "Theo dõi tình trạng trống, đang thuê và bảo trì. Sơ đồ trực quan, dễ quản lý.",
        color: "text-blue-600 bg-blue-100",
    },
    {
        icon: Users,
        title: "Quản lý khách thuê",
        description: "Lưu trữ hồ sơ, hợp đồng, và lịch sử thuê. Tìm kiếm nhanh chóng.",
        color: "text-green-600 bg-green-100",
    },
    {
        icon: Zap,
        title: "Tính tiền tự động",
        description: "Chỉ cần nhập chỉ số điện nước, hệ thống tự tính tiền theo giá bậc thang hoặc cố định.",
        color: "text-amber-600 bg-amber-100",
    },
    {
        icon: Receipt,
        title: "Xuất hóa đơn PDF",
        description: "Tạo hóa đơn chuyên nghiệp gửi qua Zalo/Email. Tích hợp mã QR thanh toán.",
        color: "text-purple-600 bg-purple-100",
    },
    {
        icon: BarChart3,
        title: "Báo cáo thống kê",
        description: "Nắm bắt doanh thu, lợi nhuận và chi phí hàng tháng qua biểu đồ trực quan.",
        color: "text-indigo-600 bg-indigo-100",
    },
    {
        icon: Shield,
        title: "Bảo mật dữ liệu",
        description: "Dữ liệu được mã hóa an toàn. Sao lưu tự động hàng ngày.",
        color: "text-rose-600 bg-rose-100",
    },
];

export function Features() {
    return (
        <section id="features" className="py-24 bg-slate-50 dark:bg-slate-950/50">
            <div className="container px-4 md:px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-4"
                    >
                        Mọi tính năng bạn cần
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-muted-foreground text-lg"
                    >
                        Được thiết kế riêng cho chủ nhà trọ Việt Nam, đơn giản hóa mọi quy trình quản lý.
                    </motion.p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.05 }}
                            whileHover={{ y: -5 }}
                            className="group relative overflow-hidden rounded-2xl border bg-background p-6 hover:shadow-lg transition-all"
                        >
                            <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${feature.color} transition-colors group-hover:scale-110 duration-300`}>
                                <feature.icon className="h-6 w-6" />
                            </div>
                            <h3 className="mb-2 text-xl font-bold">{feature.title}</h3>
                            <p className="text-muted-foreground">{feature.description}</p>

                            {/* Hover Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
