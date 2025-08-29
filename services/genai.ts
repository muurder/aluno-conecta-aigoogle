import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";

// Read the API key exclusively from the Vite environment variable as requested.
const API_KEY = import.meta.env.VITE_GENAI_API_KEY;

export const hasGenAIKey = !!API_KEY;

export type ChatMsg = {
    role: "user" | "model";
    text: string;
    id?: string;
    at?: number;
};

interface StreamAnswerParams {
    system?: string;
    history?: ChatMsg[];
    input: string;
    signal?: AbortSignal;
    temperature?: number;
    maxOutputTokens?: number;
}

export async function* streamAnswer({
    system,
    history = [],
    input,
    signal,
    temperature = 0.25,
    maxOutputTokens = 1024,
}: StreamAnswerParams): AsyncGenerator<string> {
    if (!hasGenAIKey) {
        console.warn("Gemini API key is not configured. Please add VITE_GENAI_API_KEY to your .env.local file.");
        yield "A chave de API do assistente não foi configurada.";
        return;
    }

    try {
        const ai = new GoogleGenAI({ apiKey: API_KEY! });

        const contents = history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }],
        }));
        contents.push({ role: "user", parts: [{ text: input }] });

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
            if (signal?.aborted) {
                throw new DOMException('Aborted by user', 'AbortError');
            }
            yield chunk.text;
        }
    } catch (error: any) {
        if (error.name === 'AbortError') {
             console.log("Stream aborted by user.");
             return;
        }
        console.error("Error streaming answer from Gemini:", error);
        yield "Desculpe, ocorreu um erro ao me comunicar com o assistente. Tente novamente.";
    }
}