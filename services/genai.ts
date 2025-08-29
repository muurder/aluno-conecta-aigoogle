import { GoogleGenAI, HarmCategory, HarmBlockThreshold, GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY;

export const hasGenAIKey = !!API_KEY;

export type ChatMsg = {
    role: "user" | "model";
    text: string;
    id?: string;
    at?: number;
};

interface StreamAnswerParams {
    system?: string;
    history: ChatMsg[];
    input: string;
    signal: AbortSignal;
    temperature?: number;
    maxOutputTokens?: number;
}

export async function* streamAnswer({
    system,
    history,
    input,
    signal,
    temperature = 0.25,
    maxOutputTokens = 1024,
}: StreamAnswerParams): AsyncGenerator<string> {
    if (!hasGenAIKey) {
        console.error("Gemini API key is not configured.");
        yield "Desculpe, o assistente virtual está temporariamente indisponível. A chave de API não foi configurada.";
        return;
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY! });

    // The Gemini API expects the history in a specific format.
    // We map our application's message format to the API's format.
    const contents = history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }],
    }));
    contents.push({ role: "user", parts: [{ text: input }] });

    try {
        const response = await ai.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: contents,
            config: {
                systemInstruction: system,
                temperature,
                maxOutputTokens,
                safetySettings: [
                    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                ],
            },
        });

        for await (const chunk of response) {
            // Check for the abort signal on each iteration to allow cancellation.
            if (signal.aborted) {
                break;
            }
            yield chunk.text;
        }
    } catch (error) {
        console.error("Error streaming answer from Gemini:", error);
        yield "Desculpe, ocorreu um erro ao me comunicar com o assistente. Por favor, tente novamente mais tarde.";
    }
}
