"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";

const testimonials = [
    {
        content: "Phần mềm rất dễ sử dụng. Từ ngày dùng ThuNhà, tôi tiết kiệm được cả buổi tối mỗi khi đến kỳ thu tiền trọ.",
        author: "Nguyễn Văn A",
        role: "Chủ nhà trọ 20 phòng tại Q. Bình Thạnh",
        initials: "NA",
    },
    {
        content: "Tính năng gửi hóa đơn qua Zalo rất tiện lợi. Khách thuê nhận được ngay và thanh toán nhanh hơn hẳn.",
        author: "Trần Thị B",
        role: "Quản lý chuỗi căn hộ dịch vụ",
        initials: "TB",
    },
    {
        content: "Giao diện đẹp, hiện đại. Thích nhất là tính năng tự tính tiền điện nước, không còn sợ sai sót như tính tay nữa.",
        author: "Lê Văn C",
        role: "Chủ nhà trọ sinh viên",
        initials: "LC",
    },
];

export function Testimonials() {
    return (
        <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
            <div className="container px-4 md:px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl mb-4">
                        Khách hàng nói gì về chúng tôi
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        Gia nhập cộng đồng hơn 1,000 chủ nhà trọ đang sử dụng ThuNhà mỗi ngày.
                    </p>
                </div>
                <div className="grid gap-8 md:grid-cols-3">
                    {testimonials.map((testimonial, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <Card className="h-full border-none shadow-md">
                                <CardContent className="pt-8 flex flex-col h-full">
                                    <div className="mb-6 relative">
                                        <svg className="absolute top-0 left-0 transform -translate-x-3 -translate-y-4 h-8 w-8 text-blue-100 dark:text-blue-900" fill="currentColor" viewBox="0 0 32 32" aria-hidden="true">
                                            <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                                        </svg>
                                        <p className="relative z-10 text-muted-foreground italic">
                                            "{testimonial.content}"
                                        </p>
                                    </div>
                                    <div className="mt-auto flex items-center gap-4">
                                        <Avatar className="h-10 w-10 border">
                                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${testimonial.initials}`} />
                                            <AvatarFallback>{testimonial.initials}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-sm">{testimonial.author}</p>
                                            <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
