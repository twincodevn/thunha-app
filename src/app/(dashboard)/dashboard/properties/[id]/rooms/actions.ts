"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export async function getPriceSuggestion(roomId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const room = await prisma.room.findUnique({
        where: { id: roomId, property: { userId: session.user.id } },
        include: { property: true, assets: true },
    });

    if (!room) return { error: "Room not found" };

    try {
        const prompt = `
            You are a real estate expert in Vietnam.
            Suggest a competitive rental price range for this room:
            - Type: ${room.property.name}
            - Location: ${room.property.address}, ${room.property.city || "Unknown"}
            - Area: ${room.area || "Unknown"} m2
            - Floor: ${room.floor}
            - Current Price: ${room.baseRent} VND
            - Amenities/Assets: ${room.assets.map((a) => a.name).join(", ") || "Basic"}
            
            Return ONLY a valid JSON object:
            {
                "suggestedPriceMin": number,
                "suggestedPriceMax": number,
                "marketAnalysis": "short explanation (max 30 words) in Vietnamese"
            }
        `;

        const { text } = await generateText({
            model: google("gemini-1.5-flash"),
            prompt: prompt,
            maxTokens: 300,
            temperature: 0.3,
        });

        const cleanText = text.replace(/```json|```/g, "").trim();
        const suggestion = JSON.parse(cleanText);

        return { success: true, data: suggestion };
    } catch (error) {
        console.error("AI Price Suggestion Error:", error);
        return { error: "Failed to generate suggestion" };
    }
}
