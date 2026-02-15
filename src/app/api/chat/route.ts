import { google } from "@ai-sdk/google";
import { streamText } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages, context } = await req.json();

    // Context contains property/room info passed from the client
    const systemPrompt = `
    You are a helpful AI assistant for specific rental property.
    Context about the property:
    ${context || "No specific context provided."}

    Your instructions:
    1. Answer questions based ONLY on the provided context.
    2. If the answer is not in the context, politely say you don't know and suggest contacting the landlord.
    3. Be friendly, professional, and concise.
    4. Answer in Vietnamese.
    `;

    const result = streamText({
        model: google("gemini-1.5-flash"),
        messages,
        system: systemPrompt,
    });

    return (result as any).toDataStreamResponse();
}
