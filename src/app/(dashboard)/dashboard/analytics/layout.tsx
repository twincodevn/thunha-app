import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Phân tích",
    description: "Báo cáo doanh thu và hiệu quả kinh doanh",
};

export default function AnalyticsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
