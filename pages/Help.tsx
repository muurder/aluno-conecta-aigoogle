
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UNIVERSITY_LOGOS } from '../constants';
import { hasGenAIKey, streamAnswer, ChatMsg } from '../services/genai';
import { ArrowLeftIcon, PaperAirplaneIcon, StopCircleIcon, ClipboardIcon, CheckIcon } from '@heroicons/react/24/solid';

const QUICK_ACTIONS = [
    "Gerar 2ª via do boleto",
    "Como acessar o AVA?",
    "Próxima aula e horários",
    "Como emitir carteirinha?",
    "Trancar/Destrancar matrícula"
];

const AIAvatar: React.FC = () => {
    const { user } = useAuth();
    const logoSrc = user?.university ? UNIVERSITY_LOGOS[user.university] : null;

    return (
        <div className="w-8 h-8 rounded-full bg-[var(--surface)] border border-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm">
            {logoSrc ? (
                <img src={logoSrc} alt={`${user!.university} logo`} className="w-5 h-5 object-contain" />
            ) : (
                <span className="text-sm font-bold text-[var(--primary)]">AI</span>
            )}
        </div>
    );
};

const UserAvatar: React.FC = () => {
    const { user } = useAuth();
    const initials = user?.fullName.split(' ').slice(0, 2).map(n => n[0]).join('') || 'U';

    return (
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
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
                <p className="text-sm whitespace-pre-wrap">{msg.text.trim()}</p>
                <button
                    onClick={handleCopy}
                    className="absolute -top-2 -right-2 p-1 bg-gray-600/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Copiar mensagem"
                >
                    {copied ? <CheckIcon className="w-3 h-3" /> : <ClipboardIcon className="w-3 h-3" />}
                </button>
            </div>
            {isUser && <UserAvatar />}
        </div>
    );
};

const SupportAI: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChatMsg[]>([]);
    const [input, setInput] = useState('');
    const [partialResponse, setPartialResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Load history from localStorage on mount
    useEffect(() => {
        const storageKey = `supportAI.history.${user?.uid || 'anon'}`;
        const storedHistory = localStorage.getItem(storageKey);
        if (storedHistory) {
            setMessages(JSON.parse(storedHistory));
        }
    }, [user]);

    // Save history to localStorage on change
    useEffect(() => {
        if (messages.length > 0) {
            const storageKey = `supportAI.history.${user?.uid || 'anon'}`;
            localStorage.setItem(storageKey, JSON.stringify(messages));
        }
    }, [messages, user]);
    
    // Initial welcome message
    useEffect(() => {
        if (messages.length === 0 && user) {
            const universityContext = user.university ? ` com assuntos da ${user.university}` : '';
            setMessages([{
                role: 'model',
                text: `Olá, ${user.fullName.split(' ')[0]}! Sou seu assistente virtual. Como posso te ajudar hoje${universityContext}?`
            }]);
        }
    }, [user, messages.length]);


    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, partialResponse, loading]);

    const systemPrompt = `Você é um assistente virtual amigável e prestativo para o "Portal do Aluno". Seu nome é "Portal Bot". Responda a perguntas sobre a vida acadêmica, serviços universitários e procedimentos administrativos. Mantenha as respostas concisas, claras e em português do Brasil. Se não souber a resposta, diga que não possui essa informação. ${user?.university ? `A universidade do aluno é: ${user.university}.` : ''}`;

    const handleSend = useCallback(async (messageText: string) => {
        if (loading || !messageText.trim()) return;

        const newUserMessage: ChatMsg = { role: 'user', text: messageText, at: Date.now() };
        setMessages(prev => [...prev, newUserMessage]);
        setError(null);
        setLoading(true);
        setPartialResponse('');

        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        try {
            const stream = streamAnswer({
                system: systemPrompt,
                history: messages,
                input: messageText,
                signal,
            });

            for await (const chunk of stream) {
                setPartialResponse(prev => prev + chunk);
            }
            
            setMessages(prev => [...prev, { role: 'model', text: partialResponse, at: Date.now() }]);

        } catch (err) {
            setError("Desculpe, ocorreu um erro. Tente novamente.");
            console.error(err);
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
        setInput(action);
        handleSend(action);
    };

    const handleCancel = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setLoading(false);
            setMessages(prev => [...prev, { role: 'model', text: `${partialResponse} \n\n⏹️ Geração cancelada.`}]);
            setPartialResponse('');
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="flex-grow flex flex-col bg-[var(--background)]">
            <header className="p-2 flex items-center text-[var(--text)] bg-[var(--surface)] shadow-sm sticky top-0 z-20 border-b">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="font-bold text-lg text-center flex-grow">Assistente Virtual</h1>
                <div className="w-10">
                    {loading && (
                        <button onClick={handleCancel} className="p-2 rounded-full hover:bg-red-100 text-red-600" aria-label="Parar geração">
                            <StopCircleIcon className="w-6 h-6" />
                        </button>
                    )}
                </div>
            </header>
            
            <div className="flex-grow p-4 overflow-y-auto pb-28">
                {messages.length <= 1 && (
                    <div className="mb-6">
                        <h2 className="text-sm font-semibold text-center text-[var(--muted)] mb-3">Sugestões rápidas</h2>
                        <div className="flex flex-wrap justify-center gap-2">
                            {QUICK_ACTIONS.map(action => (
                                <button key={action} onClick={() => handleQuickAction(action)} className="px-3 py-1.5 bg-[var(--surface)] text-[var(--text)] text-sm rounded-full border border-gray-200 hover:bg-gray-100 transition">
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
                                <p className="text-sm whitespace-pre-wrap">{partialResponse.trim()}<span className="inline-block w-1 h-4 bg-[var(--text)] animate-pulse ml-1"></span></p>
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

            <footer className="fixed inset-x-0 bottom-0 max-w-sm mx-auto bg-[var(--background)]/80 backdrop-blur-sm" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                <div className="p-3 border-t border-gray-200">
                    {!hasGenAIKey ? (
                        <p className="text-center text-sm text-red-600 bg-red-100 p-2 rounded-lg">A chave da API do assistente não foi configurada.</p>
                    ) : (
                    <form onSubmit={handleSubmit} className="flex items-end space-x-2">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Digite sua mensagem..."
                            className="flex-grow p-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition shadow-sm resize-none max-h-32"
                            rows={1}
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            className="bg-[var(--primary)] text-[var(--on-primary)] rounded-full p-3 w-11 h-11 flex items-center justify-center hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent)]"
                            disabled={loading || !input.trim()}
                            aria-label="Enviar mensagem"
                        >
                            <PaperAirplaneIcon className="h-5 w-5" />
                        </button>
                    </form>
                    )}
                     <p className="text-xs text-center text-[var(--muted)] mt-2 px-2">Pergunte sobre matrícula, boletos, horários, carteirinha, AVA, documentos.</p>
                </div>
            </footer>
        </div>
    );
};

export default SupportAI;
