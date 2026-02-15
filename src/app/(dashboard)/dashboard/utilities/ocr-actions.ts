"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * AI OCR Meter Reading
 * Uses Google Cloud Vision API or falls back to Gemini for meter reading OCR
 * Upload an image of an electricity/water meter → extract the reading number
 */
export async function ocrMeterReading(imageBase64: string): Promise<{
    reading: number | null;
    confidence: number;
    error?: string;
}> {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return { reading: null, confidence: 0, error: "AI API key not configured" };
    }

    try {
        // Use Gemini Vision to read the meter
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: `Analyze this image of an electricity or water meter. Extract the current meter reading number only.
                                    
Rules:
- Return ONLY the number shown on the meter display
- If the image is unclear, return your best estimate
- Format: Return a JSON object with "reading" (number) and "confidence" (0-100)
- If you cannot read the meter at all, return {"reading": null, "confidence": 0}

Response format (JSON only):
{"reading": 12345, "confidence": 85}`,
                                },
                                {
                                    inlineData: {
                                        mimeType: "image/jpeg",
                                        data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
                                    },
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 100,
                    },
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "";

        // Parse JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return { reading: null, confidence: 0, error: "Could not parse AI response" };
        }

        const parsed = JSON.parse(jsonMatch[0]);
        return {
            reading: parsed.reading,
            confidence: parsed.confidence || 0,
        };
    } catch (error) {
        console.error("[OCR] Error:", error);
        return { reading: null, confidence: 0, error: "OCR processing failed" };
    }
}
