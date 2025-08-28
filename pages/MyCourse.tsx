

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import firebase from 'firebase/compat/app';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import { PaperAirplaneIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';

// Define the shape of a chat message
interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: firebase.firestore.Timestamp | null;
  photoURL?: string | null; // User's profile photo
}

const GlobalChat: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to the bottom of the chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Set up Firestore listener for real-time messages
    useEffect(() => {
        const unsubscribe = db.collection('chat')
            .orderBy('timestamp', 'asc')
            .limitToLast(50) // To avoid loading too many messages at once
            .onSnapshot(snapshot => {
                const fetchedMessages = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as ChatMessage));
                setMessages(fetchedMessages);
                setLoading(false);
            }, error => {
                console.error("Error fetching chat messages:", error);
                setLoading(false);
            });
            
        return () => unsubscribe();
    }, []);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        const messageData = {
            userId: user.uid,
            userName: user.fullName,
            photoURL: user.photo || null,
            text: newMessage.trim(),
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        };

        try {
            await db.collection('chat').add(messageData);
            setNewMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-100">
             <header className="p-4 flex items-center text-gray-800 bg-white shadow-sm sticky top-0 z-10 border-b">
                <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full hover:bg-gray-100 md:hidden">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="font-bold text-lg">Chat Global</h1>
            </header>
            
            <main className="flex-grow p-4 overflow-y-auto pb-24">
                 {loading && <p className="text-center text-gray-500">Carregando chat...</p>}
                 <div className="space-y-4">
                    {messages.map(msg => {
                        const isCurrentUser = user?.uid === msg.userId;
                        return (
                             <div key={msg.id} className={`flex items-end gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                                {!isCurrentUser && (
                                    msg.photoURL ? 
                                    <img src={msg.photoURL} alt={msg.userName} className="w-8 h-8 rounded-full object-cover self-start flex-shrink-0" />
                                    : <UserCircleIcon className="w-8 h-8 text-gray-300 self-start flex-shrink-0" />
                                )}
                                <div>
                                    {!isCurrentUser && <p className="text-xs text-gray-500 ml-2 mb-0.5">{msg.userName.split(' ')[0]}</p>}
                                    <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl ${isCurrentUser ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 shadow-sm rounded-bl-none'}`}>
                                        <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                 <div ref={messagesEndRef} />
            </main>
            
            <footer className="fixed inset-x-0 bottom-[64px] max-w-sm mx-auto bg-gray-100/90 backdrop-blur-sm md:max-w-md lg:max-w-lg" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2 p-3 border-t border-gray-200">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Digite uma mensagem..."
                        className="flex-grow p-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="bg-blue-600 text-white rounded-full p-3 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors flex-shrink-0 shadow-md"
                        aria-label="Enviar mensagem"
                    >
                        <PaperAirplaneIcon className="h-6 w-6" />
                    </button>
                </form>
            </footer>
        </div>
    );
};

export default GlobalChat;
