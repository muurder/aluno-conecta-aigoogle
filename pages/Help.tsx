import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UNIVERSITY_LOGOS } from "../constants";
import { streamAnswer, type ChatMsg, hasGenAIKey } from "../services/genai";
import { PaperAirplaneIcon, StopIcon, ClipboardIcon, ArrowLeftIcon } from "@heroicons/react/24/solid";

const LS_KEY = (uid?: string) => `supportAI.history.${uid || "anon"}`;

function UserAvatar({ user }: { user: any }) {
  if (user?.photo) return <img src={user.photo} alt="Você" className="w-8 h-8 rounded-full object-cover" />;
  const initials = (user?.fullName || "Você").split(" ").map((p: string) => p[0]).slice(0, 2).join("").toUpperCase();
  return <div className="w-8 h-8 rounded-full bg-[var(--secondary)] text-[var(--on-secondary)] grid place-items-center text-xs font-semibold">{initials}</div>;
}

function AIBadge({ university }: { university?: string }) {
  const logo = university && (UNIVERSITY_LOGOS as any)[university];
  return (
    <div className="w-8 h-8 rounded-full bg-[var(--accent)] grid place-items-center overflow-hidden flex-shrink-0">
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

const QUICK_ACTIONS = [
  "Gerar 2ª via do boleto",
  "Como acessar o AVA?",
  "Próxima aula e horários",
  "Como emitir carteirinha?",
  "Trancar/Destrancar matrícula",
];

export default function SupportAI() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [partial, setPartial] = useState("");
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY(user?.uid));
      const arr: ChatMsg[] | null = raw ? JSON.parse(raw) : null;
      if (arr && Array.isArray(arr) && arr.length) {
        setMessages(arr);
      } else {
        setMessages([{ role: "model", text: `Olá${user?.fullName ? ", " + user.fullName.split(" ")[0] : ""}! Sou seu assistente virtual. Como posso te ajudar hoje${user?.university ? " com assuntos da " + user.university + "?" : "?"}` }]);
      }
    } catch {
        setMessages([{ role: "model", text: `Olá${user?.fullName ? ", " + user.fullName.split(" ")[0] : ""}! Sou seu assistente virtual. Como posso te ajudar hoje${user?.university ? " com assuntos da " + user.university + "?" : "?"}` }]);
    }
  }, [user]);

  useEffect(() => {
    if (messages.length > 0) {
        try { localStorage.setItem(LS_KEY(user?.uid), JSON.stringify(messages)); } catch {}
    }
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
        setMessages(h => [...h, { role: "model", text: partial + "\n\n⏹️ Geração cancelada.", at: Date.now() }]);
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

  function handleQuick(q: string) { setInput(q); setTimeout(() => document.querySelector<HTMLFormElement>('form[data-testid="chat-form"]')?.requestSubmit(), 50); }
  function handleCopy(text: string) { navigator.clipboard?.writeText(text).catch(() => {}); }
  function cancelStream() { abortRef.current?.abort(); }
  useEffect(() => { scrollToEnd(); }, [messages.length, partial]);

  return (
    <div className="flex flex-col h-full bg-[var(--background)]">
      <header className="p-2 flex items-center text-[var(--text)] bg-[var(--surface)] shadow-sm sticky top-0 z-20 border-b">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100">
              <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <h1 className="font-bold text-lg text-center flex-grow">Assistente Virtual</h1>
          <div className="w-10">
              {loading && (
                  <button onClick={cancelStream} className="p-2 rounded-full hover:bg-red-100 text-red-600" aria-label="Parar geração">
                      <StopIcon className="w-6 h-6" />
                  </button>
              )}
          </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
        {messages.length <= 1 && (
          <div className="mb-6">
              <h2 className="text-sm font-semibold text-center text-[var(--muted)] mb-3">Sugestões rápidas</h2>
              <div className="flex flex-wrap justify-center gap-2">
                  {QUICK_ACTIONS.map(q => (
                    <button key={q} onClick={() => handleQuick(q)} className="px-3 py-1.5 bg-[var(--surface)] text-[var(--text)] text-sm rounded-full border border-gray-200 hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-[var(--accent)]">
                      {q}
                    </button>
                  ))}
              </div>
          </div>
        )}
        
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} items-start gap-2 group`}>
            {m.role === "model" && <AIBadge university={user?.university} />}
            <div className={`relative ${m.role === "user" ? "bg-[var(--primary)] text-[var(--on-primary)]" : "bg-[var(--surface)] text-[var(--text)]"} max-w-[80%] px-4 py-3 rounded-2xl shadow-sm border border-black/5`}>
              <p className="whitespace-pre-wrap text-sm leading-6">{m.text}</p>
              <button onClick={() => handleCopy(m.text)} className="absolute -top-2 -right-2 p-1 bg-gray-600/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Copiar mensagem">
                <ClipboardIcon className="w-3.5 h-3.5" />
              </button>
            </div>
            {m.role === "user" && <UserAvatar user={user} />}
          </div>
        ))}

        {partial && (
          <div className="flex justify-start items-start gap-2" aria-live="polite">
            <AIBadge university={user?.university} />
            <div className="bg-[var(--surface)] text-[var(--text)] max-w-[80%] px-4 py-3 rounded-2xl shadow-sm border border-black/5">
              <p className="whitespace-pre-wrap text-sm leading-6">{partial}<span className="inline-block w-1 h-4 bg-[var(--text)] animate-pulse ml-1"></span></p>
            </div>
          </div>
        )}

         {loading && !partial && (
            <div className="flex items-end gap-2 justify-start">
                <AIBadge university={user?.university} />
                <div className="px-4 py-3 rounded-2xl bg-[var(--surface)] text-[var(--text)] rounded-bl-none border border-black/5 shadow-sm">
                    <TypingDots />
                </div>
            </div>
        )}

        <div ref={endRef} />
      </div>

      <footer className="fixed inset-x-0 bottom-0 max-w-sm mx-auto bg-[var(--surface)]/80 backdrop-blur-sm" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="p-3 border-t border-gray-200">
            {error && <p className="text-center text-xs text-red-600 mb-2">{error}</p>}
            
            <form onSubmit={handleSend} data-testid="chat-form" className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite sua mensagem..."
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                className="flex-1 resize-none min-h-[44px] max-h-40 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent bg-white disabled:bg-gray-100"
                disabled={!hasGenAIKey}
              />
              <button
                type="submit"
                disabled={loading || !input.trim() || !hasGenAIKey}
                className="h-11 w-11 flex-shrink-0 rounded-xl inline-flex items-center justify-center bg-[var(--primary)] text-[var(--on-primary)] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                aria-label="Enviar"
                title={hasGenAIKey ? "Enviar" : "Configure VITE_GENAI_API_KEY e reinicie o projeto"}
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </form>
            <p className="mt-1 text-[11px] text-[var(--muted)] text-center px-2">
              Dica: pergunte sobre matrícula, boletos, horários, carteirinha, AVA, documentos.
            </p>
          </div>
      </footer>
    </div>
  );
}
