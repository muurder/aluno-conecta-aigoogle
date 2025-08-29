import React, { useState, useEffect, useRef, useCallback, useMemo, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasGenAIKey, streamAnswer, ChatMsg } from '../services/genai';
import {
    ArrowLeftIcon,
    PaperAirplaneIcon,
    StopCircleIcon,
    ClipboardIcon,
    CheckIcon
} from '@heroicons/react/24/solid';

const QUICK_ACTIONS = [
    "Gerar 2ª via do boleto",
    "Como acessar o AVA?",
    "Próxima aula e horários",
    "Como emitir carteirinha?",
    "Trancar/Destrancar matrícula"
];

const AIAvatar: React.FC = () => (
    <div className="w-8 h-8 rounded-full bg-[var(--surface)] border border-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm p-1">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="text-[var(--primary)]">
            <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 1.828.504 3.55 1.348 5.095.342 1.241 1.519 1.905 2.66 1.905H6.44l4.5 4.5c.944.945 2.56.276 2.56-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.536 3.536 3.536 9.213 0 12.749a.75.75 0 11-1.06-1.06c2.953-2.953 2.953-7.737 0-10.63-1.06-1.06z" />
            <path d="M16.464 7.226a.75.75 0 011.06 0c2.209 2.209 2.209 5.791 0 8a.75.75 0 11-1.06-1.06c1.626-1.626 1.626-4.308 0-5.933a.75.75 0 010-1.06z" />
        </svg>
    </div>
);


const UserAvatar: React.FC = () => {
    const { user } = useAuth();
    const initials = user?.fullName.split(' ').slice(0, 2).map(n => n[0]).join('') || 'U';

    return (
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden" style={{ minWidth: 32, minHeight: 32 }}>
            {user?.photo ? (
                <img src={user.photo} alt="User" className="w-full h-full object-cover" />
            ) : (
                <span className="text-sm font-bold text-gray-600">{initials}</span>
            )}
        </div>
    );
};

const MessageBubble: React.FC<{ msg: ChatMsg }> = ({ msg }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(msg.text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    
    const isUser = msg.role === 'user';

    return (
        <div className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && <AIAvatar />}
            <div
                className={`group relative max-w-[85%] px-4 py-2 rounded-2xl shadow-sm border border-black/5 ${
                    isUser
                        ? 'bg-[var(--primary)] text-[var(--on-primary)] rounded-br-none'
                        : 'bg-[var(--surface)] text-[var(--text)] rounded-bl-none'
                }`}
            >
                <p className="text-sm whitespace-pre-wrap" style={{ wordBreak: 'break-word' }}>{msg.text.trim()}</p>
                 {!isUser && msg.text.length > 0 && (
                     <button
                        onClick={handleCopy}
                        style={{ minHeight: 28, minWidth: 28 }}
                        className="absolute -top-3 -right-3 p-1 bg-gray-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        aria-label="Copiar mensagem"
                    >
                        {copied ? <CheckIcon className="w-4 h-4" /> : <ClipboardIcon className="w-4 h-4" />}
                    </button>
                 )}
            </div>
            {isUser && <UserAvatar />}
        </div>
    );
};


export default function SupportAI() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChatMsg[]>([]);
    const [input, setInput] = useState('');
    const [partialResponse, setPartialResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    
    const composerRef = React.useRef<HTMLFormElement>(null);
    const [composerH, setComposerH] = React.useState(64);
    const BOTTOM_NAV_H = 64; 

    React.useLayoutEffect(() => {
      const el = composerRef.current;
      if (!el) return;
      const ro = new ResizeObserver(() => setComposerH(el.offsetHeight));
      ro.observe(el);
      return () => ro.disconnect();
    }, []);

    const storageKey = useMemo(() => `supportAI.history.${user?.uid || 'anon'}`, [user]);

    // Load history from localStorage on mount or create welcome message
    useEffect(() => {
        const storedHistory = localStorage.getItem(storageKey);
        if (storedHistory) {
            setMessages(JSON.parse(storedHistory));
        } else if (user) {
            const universityContext = user.university ? ` com assuntos da ${user.university}` : '';
            setMessages([{
                role: 'model',
                text: `Olá, ${user.fullName.split(' ')[0]}! Sou seu assistente virtual. Como posso te ajudar hoje${universityContext}?`
            }]);
        }
    }, [user, storageKey]);

    // Save history to localStorage on change
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem(storageKey, JSON.stringify(messages));
        }
    }, [messages, storageKey]);

    // Auto-scroll to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, partialResponse]);

    const systemPrompt = `Você é um assistente virtual amigável e prestativo para o "Portal do Aluno". Seu nome é "Portal Bot". Responda a perguntas sobre a vida acadêmica, serviços universitários e procedimentos administrativos. Mantenha as respostas concisas, claras e em português do Brasil. Se não souber a resposta, diga que não possui essa informação. ${user?.university ? `Universidade do aluno: ${user.university}.` : ''}`;

    const handleSend = useCallback(async (messageText: string) => {
        if (loading || !messageText.trim()) return;

        const newUserMessage: ChatMsg = { role: 'user', text: messageText, at: Date.now() };
        const nextHistory = [...messages, newUserMessage];
        setMessages(nextHistory);
        setError(null);
        setLoading(true);
        setPartialResponse('');

        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;
        let fullResponse = '';

        try {
            const stream = streamAnswer({
                system: systemPrompt,
                history: messages,
                input: messageText,
                signal,
            });

            for await (const chunk of stream) {
                fullResponse += chunk;
                setPartialResponse(fullResponse);
            }
            
            if (fullResponse) {
                setMessages(prev => [...prev, { role: 'model', text: fullResponse, at: Date.now() }]);
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                 setError("Desculpe, ocorreu um erro. Tente novamente.");
                 console.error(err);
            }
        } finally {
            setLoading(false);
            setPartialResponse('');
            abortControllerRef.current = null;
        }
    }, [loading, messages, systemPrompt]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSend(input);
        setInput('');
    };
    
    const handleQuickAction = (action: string) => {
        setInput(''); // Clear input in case user was typing
        handleSend(action);
    };

    const handleCancel = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setMessages(prev => [...prev, { role: 'model', text: `${partialResponse} \n\n⏹️ Geração cancelada.`}]);
            setPartialResponse('');
            setLoading(false);
            abortControllerRef.current = null;
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };
    
    // Auto-resize textarea
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [input]);

    return (
        <div className="flex flex-col bg-[var(--background)]" style={{ minHeight: '100dvh' }}>
            <header className="p-2 flex items-center text-[var(--text)] bg-[var(--surface)] shadow-sm sticky top-0 z-20 border-b">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100" style={{minHeight: 44, minWidth: 44}}>
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="font-bold text-lg text-center flex-grow">Assistente Virtual</h1>
                <div className="w-12 flex justify-center">
                    {loading && (
                        <button onClick={handleCancel} className="p-2 rounded-full hover:bg-red-100 text-red-600" aria-label="Parar geração" style={{minHeight: 44, minWidth: 44}}>
                            <StopCircleIcon className="w-6 h-6" />
                        </button>
                    )}
                </div>
            </header>
            
            <div className="flex-grow p-4 overflow-y-auto" style={{ flex: 1, paddingBottom: `calc(${composerH + BOTTOM_NAV_H}px + env(safe-area-inset-bottom))` }}>
                {messages.length <= 1 && (
                    <div className="mb-6">
                        <h2 className="text-sm font-semibold text-center text-[var(--muted)] mb-3">Sugestões rápidas</h2>
                        <div className="flex flex-wrap justify-center gap-2">
                            {QUICK_ACTIONS.map(action => (
                                <button key={action} onClick={() => handleQuickAction(action)} className="px-3 py-1.5 bg-[var(--surface)] text-[var(--text)] text-sm rounded-full border border-gray-200 hover:bg-gray-100 transition" style={{minHeight: 44}}>
                                    {action}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <MessageBubble key={index} msg={msg} />
                    ))}
                    {partialResponse && (
                         <div className="flex items-end gap-2 justify-start" aria-live="polite">
                            <AIAvatar />
                            <div className="max-w-[85%] px-4 py-2 rounded-2xl bg-[var(--surface)] text-[var(--text)] rounded-bl-none border border-black/5 shadow-sm">
                                <p className="text-sm whitespace-pre-wrap" style={{ wordBreak: 'break-word' }}>{partialResponse.trim()}<span className="inline-block w-1 h-4 bg-[var(--text)] animate-pulse ml-1"></span></p>
                            </div>
                        </div>
                    )}
                     {loading && !partialResponse && (
                        <div className="flex items-end gap-2 justify-start">
                            <AIAvatar />
                            <div className="px-4 py-3 rounded-2xl bg-[var(--surface)] text-[var(--text)] rounded-bl-none border border-black/5 shadow-sm">
                                <div className="flex items-center space-x-1" role="status" aria-label="Assistente digitando">
                                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>
            </div>

            <form
                ref={composerRef}
                onSubmit={handleSubmit}
                className="sticky bottom-0 max-w-sm mx-auto w-full bg-[var(--surface)] border-t border-gray-200"
                style={{
                    padding: '12px',
                    paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
                }}
            >
                {!hasGenAIKey ? (
                    <p className="text-center text-sm text-red-600 bg-red-100 p-2 rounded-lg">A chave da API do assistente não foi configurada.</p>
                ) : (
                <div className="flex items-end space-x-2">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Digite sua mensagem..."
                        className="flex-grow p-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition shadow-sm resize-none max-h-32 bg-[var(--surface)] text-[var(--text)]"
                        rows={1}
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        className="bg-[var(--primary)] text-[var(--on-primary)] rounded-full p-3 flex items-center justify-center hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)]"
                        disabled={loading || !input.trim()}
                        aria-label="Enviar mensagem"
                        style={{ minHeight: 44, minWidth: 44 }}
                    >
                        <PaperAirplaneIcon className="h-5 w-5" />
                    </button>
                </div>
                )}
                {error && <p className="text-xs text-center text-red-600 mt-2 px-2">{error}</p>}
                <p className="text-xs text-center text-[var(--muted)] mt-2 px-2">Pergunte sobre matrícula, boletos, horários, carteirinha, AVA, documentos.</p>
            </form>
        </div>
    );
};