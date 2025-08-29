import { GoogleGenAI, HarmCategory, HarmBlockThreshold, Content } from "@google/genai";

const API_KEY = import.meta.env.VITE_GENAI_API_KEY || "";
export const hasGenAIKey = !!API_KEY;

export type ChatMsg = { role: "user" | "model"; text: string; id?: string; at?: number };

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
    console.warn("[genai] Gemini API key is not configured (VITE_GENAI_API_KEY)");
    yield "A chave de API do assistente não foi configurada.";
    return;
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const contents: Content[] = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
  }));
  contents.push({ role: 'user', parts: [{ text: input }] });

  const safety = [
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    // FIX: Corrected the HarmCategory enum value from 'HARM_CATEGORY_SEXUAL_CONTENT' to 'HARM_CATEGORY_SEXUALLY_EXPLICIT' to match the Gemini API specification.
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  ];

  try {
    const response = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        systemInstruction: system,
        temperature,
        maxOutputTokens,
        safetySettings: safety
      },
    });

    for await (const chunk of response) {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      const text = chunk.text;
      if (text) yield text;
    }
  } catch (err: any) {
    if (err?.name === "AbortError") return;
    console.error("[genai] stream error:", err);
    yield "Desculpe, ocorreu um erro ao me comunicar com o assistente. Tente novamente em instantes.";
  }
}
