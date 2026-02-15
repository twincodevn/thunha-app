"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function getPriceSuggestion(roomId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // 1. Rich query — fetch ALL available data for this room
    const room = await prisma.room.findUnique({
        where: { id: roomId, property: { userId: session.user.id } },
        include: {
            property: {
                include: {
                    rooms: {
                        select: {
                            id: true,
                            roomNumber: true,
                            baseRent: true,
                            area: true,
                            floor: true,
                            status: true,
                            deposit: true,
                        },
                    },
                },
            },
            assets: {
                select: {
                    name: true,
                    value: true,
                    status: true,
                },
            },
            roomTenants: {
                include: {
                    bills: {
                        where: { status: "PAID" },
                        select: { total: true, month: true, year: true },
                        orderBy: { createdAt: "desc" },
                        take: 12,
                    },
                    contracts: {
                        select: { startDate: true, endDate: true, status: true },
                        orderBy: { startDate: "desc" },
                        take: 5,
                    },
                    incidents: {
                        select: { status: true, priority: true, cost: true },
                    },
                },
                orderBy: { startDate: "desc" },
                take: 5,
            },
        },
    });

    if (!room) return { error: "Room not found" };

    // 2. Compute metrics from raw data
    const siblingRooms = room.property.rooms.filter((r) => r.id !== room.id);
    const occupiedRooms = room.property.rooms.filter((r) => r.status === "OCCUPIED");
    const totalRooms = room.property.rooms.length;
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms.length / totalRooms) * 100) : 0;

    const siblingPrices = siblingRooms.map((r) => r.baseRent).filter((p) => p > 0);
    const avgSiblingPrice = siblingPrices.length > 0
        ? Math.round(siblingPrices.reduce((a, b) => a + b, 0) / siblingPrices.length)
        : 0;

    const totalAssetValue = room.assets.reduce((sum, a) => sum + (a.value || 0), 0);
    const goodAssets = room.assets.filter((a) => a.status === "GOOD").length;
    const brokenAssets = room.assets.filter((a) => a.status === "BROKEN" || a.status === "REPAIR").length;

    const allBills = room.roomTenants.flatMap((rt) => rt.bills);
    const avgRevenue = allBills.length > 0
        ? Math.round(allBills.reduce((sum, b) => sum + b.total, 0) / allBills.length)
        : 0;

    const allContracts = room.roomTenants.flatMap((rt) => rt.contracts);
    const contractDurations = allContracts
        .filter((c) => c.startDate && c.endDate)
        .map((c) => {
            const months = (new Date(c.endDate!).getTime() - new Date(c.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30);
            return Math.round(months);
        });
    const avgContractDuration = contractDurations.length > 0
        ? Math.round(contractDurations.reduce((a, b) => a + b, 0) / contractDurations.length)
        : 0;

    const totalIncidents = room.roomTenants.flatMap((rt) => rt.incidents).length;
    const totalTenants = room.roomTenants.length;

    // Parse services
    let services: string[] = [];
    try {
        const svc = room.property.services as any;
        if (Array.isArray(svc)) {
            services = svc.map((s: any) => typeof s === "string" ? s : (s.name || s.label || JSON.stringify(s)));
        } else if (svc && typeof svc === "object") {
            services = Object.entries(svc)
                .filter(([, v]) => v)
                .map(([k]) => k);
        }
    } catch { /* ignore */ }

    // 3. Build comprehensive prompt
    const prompt = `Bạn là chuyên gia định giá bất động sản cho thuê tại Việt Nam. Hãy phân tích toàn diện và đưa ra gợi ý giá thuê cho phòng trọ sau.

=== THÔNG TIN PHÒNG ===
- Tên nhà: ${room.property.name}
- Địa chỉ: ${room.property.address}, ${room.property.city || "Chưa rõ"}
- Phòng số: ${room.roomNumber} | Tầng: ${room.floor}
- Diện tích: ${room.area || "Chưa rõ"} m²
- Giá thuê hiện tại: ${room.baseRent.toLocaleString()} VND/tháng
- Tiền cọc: ${room.deposit ? room.deposit.toLocaleString() + " VND" : "Chưa đặt"}

=== TIỆN NGHI & TÀI SẢN ===
- Tài sản trong phòng: ${room.assets.map((a) => `${a.name} (${a.status === "GOOD" ? "Tốt" : a.status === "REPAIR" ? "Cần sửa" : "Hỏng"})`).join(", ") || "Không có"}
- Tổng giá trị tài sản: ${totalAssetValue.toLocaleString()} VND
- Tình trạng: ${goodAssets} tốt, ${brokenAssets} cần sửa/hỏng
- Dịch vụ kèm: ${services.length > 0 ? services.join(", ") : "Cơ bản"}

=== GIÁ ĐIỆN/NƯỚC ===
- Giá điện: ${room.property.electricityRate.toLocaleString()} VND/kWh
- Giá nước: ${room.property.waterRate.toLocaleString()} VND/m³

=== SO SÁNH NỘI BỘ (các phòng cùng tòa) ===
- Tổng số phòng: ${totalRooms}
- Tỷ lệ lấp đầy: ${occupancyRate}%
- Giá trung bình các phòng khác: ${avgSiblingPrice > 0 ? avgSiblingPrice.toLocaleString() + " VND" : "Không có dữ liệu"}
- Dải giá phòng: ${siblingPrices.length > 0 ? Math.min(...siblingPrices).toLocaleString() + " - " + Math.max(...siblingPrices).toLocaleString() + " VND" : "N/A"}

=== LỊCH SỬ CHO THUÊ ===
- Số lượt thuê trước: ${totalTenants}
- Doanh thu thực thu trung bình: ${avgRevenue > 0 ? avgRevenue.toLocaleString() + " VND/tháng" : "Chưa có"}
- Thời gian thuê trung bình: ${avgContractDuration > 0 ? avgContractDuration + " tháng" : "Chưa có"}
- Số sự cố đã báo cáo: ${totalIncidents}

=== YÊU CẦU ===
Phân tích toàn diện và trả về JSON duy nhất (không markdown, không text khác):
{
  "suggestedPriceMin": 3000000,
  "suggestedPriceMax": 5000000,
  "marketAnalysis": "Phân tích ngắn gọn về giá phòng (tối đa 40 từ, tiếng Việt)",
  "confidence": "high",
  "adjustmentFactors": [
    {"factor": "Diện tích rộng", "impact": "increase", "detail": "Trên trung bình khu vực"},
    {"factor": "Tỷ lệ lấp đầy cao", "impact": "increase", "detail": "90% phòng đã thuê"},
    {"factor": "Thiếu tiện nghi", "impact": "decrease", "detail": "Không có máy lạnh"}
  ],
  "competitivePosition": "above_average"
}

Quy tắc:
- suggestedPriceMin/Max: số nguyên VND, dựa trên phân tích thực tế
- confidence: "high" | "medium" | "low"
- adjustmentFactors: 3-5 yếu tố, impact là "increase" hoặc "decrease"
- competitivePosition: "below_average" | "average" | "above_average" | "premium"
- Thay tất cả giá trị ví dụ bằng phân tích thực tế`;

    try {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        console.log("AI Price Intelligence Raw:", text);

        const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanedText);

        // Flexible extraction
        const data = {
            suggestedPriceMin: Number(parsed.suggestedPriceMin ?? parsed.suggested_price_min ?? parsed.minPrice ?? 0),
            suggestedPriceMax: Number(parsed.suggestedPriceMax ?? parsed.suggested_price_max ?? parsed.maxPrice ?? 0),
            marketAnalysis: String(parsed.marketAnalysis ?? parsed.market_analysis ?? parsed.analysis ?? "Không có phân tích"),
            confidence: (parsed.confidence ?? "medium") as "high" | "medium" | "low",
            adjustmentFactors: Array.isArray(parsed.adjustmentFactors)
                ? parsed.adjustmentFactors.map((f: any) => ({
                    factor: String(f.factor ?? f.name ?? ""),
                    impact: f.impact === "decrease" ? "decrease" as const : "increase" as const,
                    detail: String(f.detail ?? f.description ?? ""),
                }))
                : [],
            competitivePosition: (parsed.competitivePosition ?? parsed.competitive_position ?? "average") as
                "below_average" | "average" | "above_average" | "premium",
        };

        if (!data.suggestedPriceMin || !data.suggestedPriceMax) {
            console.error("Missing price data:", parsed);
            return { error: "AI trả về dữ liệu không hợp lệ. Vui lòng thử lại." };
        }

        return { success: true, data };
    } catch (error) {
        console.error("AI Price Intelligence Error:", error);
        return { error: "Không thể phân tích giá. Vui lòng thử lại." };
    }
}

export async function applyPriceSuggestion(roomId: string, newPrice: number) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    if (!newPrice || newPrice <= 0) {
        return { error: "Giá không hợp lệ" };
    }

    try {
        await prisma.room.update({
            where: { id: roomId, property: { userId: session.user.id } },
            data: { baseRent: newPrice },
        });

        return { success: true };
    } catch (error) {
        console.error("Apply Price Error:", error);
        return { error: "Không thể cập nhật giá. Vui lòng thử lại." };
    }
}
