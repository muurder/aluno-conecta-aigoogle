import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'https://esm.sh/react-router-dom@6.23.1?deps=react';
import { useAuth } from '../context/AuthContext';
import { GoogleGenAI } from 'https://esm.sh/@google/genai';
import { ArrowLeftIcon, PaperAirplaneIcon } from 'https://esm.sh/@heroicons/react@2.1.3/24/solid?deps=react';

// The API key is injected by the environment and should not be hardcoded.
// @ts-ignore
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

        try {
            if (!API_KEY) {
                throw new Error("API key for Gemini is not configured.");
            }
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
            const errorMessage: Message = { sender: 'ai', text: "Desculpe, não consegui processar sua solicitação no momento. Tente novamente mais tarde." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="min-h-full flex flex-col bg-gray-100">
            <header className="p-4 flex items-center text-gray-700 bg-white shadow-sm sticky top-0 z-20">
                <button onClick={() => navigate(-1)} className="mr-4">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="font-semibold text-lg">Assistente Virtual</h1>
            </header>

            <div className="flex-grow p-4 overflow-y-auto pb-24">
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0" aria-hidden="true">AI</div>}
                            <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 shadow-sm rounded-bl-none'}`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.text.trim()}</p>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex items-end gap-2 justify-start">
                             <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0" aria-hidden="true">AI</div>
                            <div className="max-w-xs px-4 py-3 rounded-2xl bg-white text-gray-800 shadow-sm rounded-bl-none">
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

            <footer className="fixed inset-x-0 bottom-0 max-w-sm mx-auto bg-gray-100/90 backdrop-blur-sm" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2 p-3 border-t border-gray-200">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Digite sua pergunta..."
                        className="flex-grow p-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        className="bg-blue-600 text-white rounded-full p-3 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors flex-shrink-0 shadow-md"
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