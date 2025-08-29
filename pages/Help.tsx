import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { streamAnswer, type ChatMsg, hasGenAIKey } from "../services/genai";
import { PaperAirplaneIcon, StopIcon, ClipboardIcon } from "@heroicons/react/24/outline";
import { UNIVERSITY_LOGOS } from "../constants";

const LS_KEY = (uid?: string) => `supportAI.history.${uid || "anon"}`;

function UserAvatar({ user }: { user: any }) {
  if (user?.photo) return <img src={user.photo} alt="Foto do usuário" className="w-8 h-8 rounded-full" />;
  const initials = (user?.fullName || "Você").split(" ").map((p: string) => p[0]).slice(0, 2).join("").toUpperCase();
  return <div className="w-8 h-8 rounded-full bg-[var(--secondary)] text-[var(--on-secondary)] grid place-items-center text-xs font-semibold">{initials}</div>;
}

function AIBadge({ university }: { university?: string }) {
  const logo = university && (UNIVERSITY_LOGOS as any)[university];
  return (
    <div className="w-8 h-8 rounded-full bg-[var(--accent)] grid place-items-center overflow-hidden">
      {logo ? <img src={logo} alt="AI" className="w-5 h-5 object-contain" /> : <span className="text-[var(--on-primary)] text-xs font-bold">AI</span>}
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1 align-middle" aria-label="Digitando">
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.2s]"></span>
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.1s]"></span>
      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
    </span>
  );
}

const QUICK = [
  "Gerar 2ª via do boleto",
  "Como acessar o AVA?",
  "Próxima aula e horários",
  "Como emitir carteirinha?",
  "Trancar/Destrancar matrícula",
];

export default function SupportAI() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [partial, setPartial] = useState("");
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // load history
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY(user?.uid));
      const arr: ChatMsg[] | null = raw ? JSON.parse(raw) : null;
      if (arr && Array.isArray(arr) && arr.length) setMessages(arr);
      else setMessages([{ role: "model", text: `Olá${user?.fullName ? ", " + user.fullName.split(" ")[0] : ""}! Sou seu assistente virtual. Como posso te ajudar hoje${user?.university ? " com assuntos da " + user.university + "?" : "?"}` }]);
    } catch {}
  }, [user?.uid]);

  // persist history
  useEffect(() => {
    try { localStorage.setItem(LS_KEY(user?.uid), JSON.stringify(messages)); } catch {}
  }, [messages, user?.uid]);

  const systemPrompt = useMemo(() => {
    const uni = user?.university || undefined;
    return [
      "Você é um assistente do Portal do Aluno. Responda em PT-BR, objetivo e amigável.",
      "Se a dúvida for acadêmica: explique passos, documentos e onde clicar no app (Início, AVA, Horários, Financeiro, Carteirinha, Perfil).",
      "Peça esclarecimentos quando necessário e proponha próximos passos.",
      uni ? `Universidade do aluno: ${uni}. Adeque exemplos/termos ao contexto da instituição.` : "",
      "Se o assunto envolver pagamentos, alerte para conferir boletos no Financeiro do app e evitar links externos.",
    ].filter(Boolean).join("\n");
  }, [user?.university]);

  function scrollToEnd() { endRef.current?.scrollIntoView({ behavior: "smooth" }); }

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const question = input.trim();
    if (!question || loading) return;
    if (!hasGenAIKey) { setError("A chave de API do assistente não foi configurada (VITE_GENAI_API_KEY)."); return; }
    setError(null);
    setLoading(true);
    setPartial("");
    const nextHistory = [...messages, { role: "user", text: question, at: Date.now() } as ChatMsg];
    setMessages(nextHistory);
    setInput("");

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      let acc = "";
      for await (const token of streamAnswer({ system: systemPrompt, history: nextHistory, input: question, signal: abortRef.current.signal })) {
        acc += token;
        setPartial(acc);
        scrollToEnd();
      }
      setMessages(h => [...h, { role: "model", text: acc || "...", at: Date.now() }]);
      setPartial("");
    } catch (err: any) {
      if (err?.name === "AbortError") {
        setMessages(h => [...h, { role: "model", text: "⏹️ Geração cancelada.", at: Date.now() }]);
      } else {
        console.error(err);
        setMessages(h => [...h, { role: "model", text: "Desculpe, houve um problema para responder agora. Tente novamente.", at: Date.now() }]);
      }
      setPartial("");
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function handleQuick(q: string) { setInput(q); setTimeout(() => handleSend(), 0); }
  function handleCopy(text: string) { navigator.clipboard?.writeText(text).catch(() => {}); }
  function cancelStream() { abortRef.current?.abort(); }
  useEffect(() => { scrollToEnd(); }, [messages.length, partial]);

  return (
    <div className="flex flex-col h-full bg-[var(--background)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--surface)] border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <h1 className="text-lg font-semibold text-[var(--text)]">Assistente Virtual</h1>
        <div className="ml-auto flex items-center gap-2">
          {loading ? (
            <button onClick={cancelStream} className="inline-flex items-center gap-1 px-3 h-9 rounded-lg bg-red-600 text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-400">
              <StopIcon className="w-4 h-4" /> Parar
            </button>
          ) : null}
        </div>
      </div>

      {/* Quick actions */}
      {messages.length <= 1 && (
        <div className="px-4 pt-3 pb-1 flex gap-2 flex-wrap justify-center">
          {QUICK.map(q => (
            <button key={q} onClick={() => handleQuick(q)} className="px-3 py-1.5 rounded-full text-sm bg-[var(--surface)] border border-gray-200 text-[var(--text)] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]">
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} items-start gap-2`}>
            {m.role === "model" ? <AIBadge university={user?.university} /> : <div className="opacity-0 w-8" />}
            <div className={`${m.role === "user" ? "bg-[var(--primary)] text-[var(--on-primary)]" : "bg-[var(--surface)] text-[var(--text)]"} max-w-[80%] px-4 py-3 rounded-2xl shadow-sm border border-gray-200`}>
              <p className="whitespace-pre-wrap text-sm leading-6">{m.text}</p>
              <div className="mt-1 flex gap-2 opacity-70">
                <button onClick={() => handleCopy(m.text)} className="inline-flex items-center gap-1 text-[11px] hover:opacity-100">
                  <ClipboardIcon className="w-3.5 h-3.5" /> Copiar
                </button>
              </div>
            </div>
            {m.role === "user" ? <UserAvatar user={user} /> : <div className="opacity-0 w-8" />}
          </div>
        ))}

        {partial && (
          <div className="flex justify-start items-start gap-2" aria-live="polite">
            <AIBadge university={user?.university} />
            <div className="bg-[var(--surface)] text-[var(--text)] max-w-[80%] px-4 py-3 rounded-2xl shadow-sm border border-gray-200">
              <p className="whitespace-pre-wrap text-sm leading-6">{partial}</p>
              <div className="mt-1 text-[11px] text-gray-500"><TypingDots /></div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Error */}
      {error && <div className="px-4 pb-2 text-xs text-red-600">{error}</div>}

      {/* Composer */}
      <form onSubmit={handleSend} className="p-3 bg-[var(--surface)] border-t border-gray-200">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem... (Shift+Enter para quebrar linha)"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            className="flex-1 resize-none min-h-[44px] max-h-40 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent bg-white"
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || !hasGenAIKey}
            className="h-11 px-4 rounded-xl inline-flex items-center justify-center bg-[var(--primary)] text-[var(--on-primary)] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            aria-label="Enviar"
            title={hasGenAIKey ? "Enviar" : "Configure VITE_GENAI_API_KEY e redeploy"}
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
        <p className="mt-1 text-[11px] text-[var(--muted)]">
          Dica: pergunte sobre matrícula, boletos, horários, carteirinha, AVA, documentos.
        </p>
      </form>
    </div>
  );
}
