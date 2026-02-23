import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ReportsClient } from "./page-client";

async function getReportData(userId: string) {
    const currentYear = new Date().getFullYear();

    const properties = await prisma.property.findMany({
        where: { userId },
        include: {
            rooms: {
                include: {
                    roomTenants: {
                        include: {
                            bills: {
                                where: { year: currentYear }
                            }
                        }
                    }
                }
            }
        }
    });

    // 1. Monthly Revenue Trend (All properties)
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        paid: 0,
        unpaid: 0,
        expected: 0,
    }));

    // 2. Property Breakdown
    const propertyData = properties.map(p => ({
        id: p.id,
        name: p.name,
        paid: 0,
        unpaid: 0,
        expected: 0,
    }));

    properties.forEach((property, pIndex) => {
        property.rooms.forEach(room => {
            room.roomTenants.forEach(rt => {
                rt.bills.forEach(bill => {
                    const monthIdx = bill.month - 1;
                    const total = Number(bill.total);

                    // Monthly Array
                    monthlyData[monthIdx].expected += total;
                    if (bill.status === "PAID") {
                        monthlyData[monthIdx].paid += total;
                    } else if (bill.status === "PENDING" || bill.status === "OVERDUE") {
                        monthlyData[monthIdx].unpaid += total;
                    }

                    // Property Array
                    propertyData[pIndex].expected += total;
                    if (bill.status === "PAID") {
                        propertyData[pIndex].paid += total;
                    } else if (bill.status === "PENDING" || bill.status === "OVERDUE") {
                        propertyData[pIndex].unpaid += total;
                    }
                });
            });
        });
    });

    return {
        currentYear,
        monthlyData,
        propertyData,
    };
}

export default async function ReportsPage() {
    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }

    const data = await getReportData(session.user.id);

    return <ReportsClient initialData={data} />;
}
