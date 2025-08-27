import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleGenAI } from '@google/genai';
import { ArrowLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';

// The API key is now securely read from environment variables
const API_KEY = process.env.API_KEY;

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

const Help: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialMessageSent, setInitialMessageSent] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (user && !initialMessageSent) {
            setMessages([
                { sender: 'ai', text: `Olá, ${user.fullName?.split(' ')[0]}! Sou seu assistente virtual. Como posso te ajudar hoje com assuntos da ${user.university}?` }
            ]);
            setInitialMessageSent(true);
        }
    }, [user, initialMessageSent]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage: Message = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        if (!API_KEY) {
            console.error("A chave de API para o Gemini (API_KEY) não está configurada no ambiente.");
            const errorMessage: Message = { sender: 'ai', text: "Desculpe, o assistente virtual está temporariamente indisponível." };
            setMessages(prev => [...prev, errorMessage]);
            setLoading(false);
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: API_KEY });
            
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: input,
                config: {
                    systemInstruction: `You are a friendly and helpful virtual assistant for students of ${user?.university}. Your name is "Portal Bot". Answer questions about academic life, university services, and administrative procedures. Keep your answers concise, clear, and in Brazilian Portuguese. If you don't know the answer, say you don't have that information.`,
                },
            });
            
            const aiMessage: Message = { sender: 'ai', text: response.text };
            setMessages(prev => [...prev, aiMessage]);

        } catch (error) {
            console.error("Error fetching AI response:", error);
            const errorMessage: Message = { sender: 'ai', text: "Desculpe, ocorreu um erro ao me comunicar com o assistente. Por favor, tente novamente mais tarde." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="flex-grow flex flex-col bg-slate-100 h-screen">
            <header className="p-4 flex items-center text-text-dark bg-background shadow-sm sticky top-0 z-20 border-b border-slate-200">
                <button onClick={() => navigate(-1)} className="mr-4 text-text-light hover:text-primary">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="font-semibold text-lg">Assistente Virtual</h1>
            </header>

            <main className="flex-grow p-4 overflow-y-auto pb-28">
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white font-bold text-sm flex-shrink-0" aria-hidden="true">AI</div>}
                            <div className={`max-w-[85%] px-4 py-2 rounded-2xl shadow-sm ${msg.sender === 'user' ? 'bg-primary text-white rounded-br-lg' : 'bg-white text-text-dark rounded-bl-lg'}`}>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text.trim()}</p>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex items-end gap-2 justify-start">
                             <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white font-bold text-sm flex-shrink-0" aria-hidden="true">AI</div>
                            <div className="max-w-xs px-4 py-3 rounded-2xl bg-white text-text-dark shadow-sm rounded-bl-lg">
                                <div className="flex items-center space-x-1" role="status" aria-label="Assistente digitando">
                                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>
            </main>

            <footer className="fixed inset-x-0 bottom-0 bg-background/80 backdrop-blur-sm z-10" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2 p-3 border-t border-slate-200">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Digite sua pergunta..."
                        className="flex-grow p-3 border border-slate-300 rounded-full focus:ring-2 focus:ring-primary focus:border-primary transition shadow-sm bg-white"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        className="bg-primary text-white rounded-full p-3 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors flex-shrink-0 shadow-md"
                        disabled={loading || !input.trim()}
                        aria-label="Enviar mensagem"
                    >
                        <PaperAirplaneIcon className="h-6 w-6" />
                    </button>
                </form>
            </footer>
        </div>
    );
};

export default Help;
