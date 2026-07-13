import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import firebase from 'firebase/compat/app';
import {
    ArrowLeftIcon,
    PaperAirplaneIcon
} from '@heroicons/react/24/solid';

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

const AdminAvatar: React.FC = () => (
    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm font-bold text-xs uppercase" style={{ minWidth: 32, minHeight: 32 }}>
        AD
    </div>
);

interface Message {
    role: 'user' | 'admin' | 'model';
    text: string;
    at?: number;
}

const MessageBubble: React.FC<{ msg: Message }> = ({ msg }) => {
    const isUser = msg.role === 'user';

    return (
        <div className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && <AdminAvatar />}
            <div
                className={`group relative max-w-[85%] px-4 py-2 rounded-2xl shadow-sm border border-slate-200/30 text-left ${
                    isUser
                        ? 'bg-[var(--primary)] text-[var(--on-primary)] rounded-br-none'
                        : 'bg-[var(--surface)] text-[var(--text)] rounded-bl-none'
                }`}
            >
                <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ wordBreak: 'break-word' }}>{msg.text.trim()}</p>
            </div>
            {isUser && <UserAvatar />}
        </div>
    );
};

export default function SupportAI() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    
    const composerRef = useRef<HTMLFormElement>(null);
    const [composerH, setComposerH] = useState(64);
    const BOTTOM_NAV_H = 64; 

    React.useLayoutEffect(() => {
      const el = composerRef.current;
      if (!el) return;
      const ro = new ResizeObserver(() => setComposerH(el.offsetHeight));
      ro.observe(el);
      return () => ro.disconnect();
    }, []);

    // Subscribe to support messages in real-time
    useEffect(() => {
        if (!user) return;

        // Ensure support chat session document exists in Firestore
        const chatDocRef = db.collection('support_chats').doc(user.uid);
        chatDocRef.get().then(doc => {
            if (!doc.exists) {
                chatDocRef.set({
                    userId: user.uid,
                    userName: user.fullName,
                    userPhoto: user.photo || null,
                    lastMessage: 'Conversa de suporte iniciada',
                    lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
                    unreadCountForAdmin: 0
                });
            }
        });

        const unsub = chatDocRef.collection('messages')
            .orderBy('timestamp', 'asc')
            .onSnapshot((snapshot) => {
                const list = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        role: data.role as 'user' | 'admin',
                        text: data.text,
                        at: data.timestamp ? data.timestamp.toMillis() : Date.now()
                    };
                });
                
                if (list.length === 0) {
                    setMessages([{
                        role: 'model',
                        text: `Olá, ${user.fullName.split(' ')[0]}! Este é o suporte oficial do Portal do Estudante. Escreva sua dúvida ou problema abaixo para falar diretamente com o Administrador Master.`
                    }]);
                } else {
                    setMessages(list);
                }
            }, (err) => {
                console.error("Error reading support messages:", err);
                setError("Não foi possível carregar as mensagens de suporte.");
            });

        return () => unsub();
    }, [user]);

    // Auto-scroll to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !user || loading) return;

        const messageText = input;
        setInput('');
        setLoading(true);
        setError(null);

        try {
            const chatDocRef = db.collection('support_chats').doc(user.uid);
            
            // Add message to subcollection
            await chatDocRef.collection('messages').add({
                role: 'user',
                text: messageText,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Update parent support chat tracking document
            await chatDocRef.set({
                lastMessage: messageText,
                lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
                unreadCountForAdmin: firebase.firestore.FieldValue.increment(1)
            }, { merge: true });

        } catch (err: any) {
            console.error("Error sending message to support:", err);
            setError("Erro ao enviar mensagem. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend(e);
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
        <div className="flex flex-col bg-[var(--background)] h-full overflow-hidden">
            <header className="p-2 flex items-center text-[var(--text)] bg-[var(--surface)] shadow-sm sticky top-0 z-20 border-b pt-[calc(env(safe-area-inset-top,0px)+0.5rem)]">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100" style={{minHeight: 44, minWidth: 44}}>
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="font-bold text-lg text-center flex-grow">Ajuda e Suporte</h1>
                <div className="w-12"></div>
            </header>
            
            <div className="flex-grow overflow-y-auto p-4" style={{ flex: 1, paddingBottom: `calc(${composerH + BOTTOM_NAV_H}px + env(safe-area-inset-bottom, 0px))` }}>
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <MessageBubble key={index} msg={msg} />
                    ))}
                    <div ref={chatEndRef} />
                </div>
            </div>

            <form
                ref={composerRef}
                onSubmit={handleSend}
                className="sticky bottom-0 max-w-sm mx-auto w-full bg-[var(--surface)] border-t border-gray-200"
                style={{
                    padding: '12px',
                    paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
                }}
            >
                <div className="flex items-end space-x-2">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Digite sua mensagem para o admin..."
                        className="flex-grow p-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition shadow-sm resize-none max-h-32 bg-[var(--surface)] text-[var(--text)] text-xs"
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
                {error && <p className="text-xs text-center text-red-650 mt-2 px-2">{error}</p>}
                <p className="text-xs text-center text-[var(--muted)] mt-2 px-2">Suas mensagens são entregues em tempo real ao administrador master do portal.</p>
            </form>
        </div>
    );
}