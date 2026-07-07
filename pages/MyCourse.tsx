import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '@/firebase';
import firebase from 'firebase/compat/app';
import { 
  ArrowLeftIcon, 
  TrashIcon, 
  ArrowUturnLeftIcon, 
  PaperAirplaneIcon, 
  XMarkIcon,
  HeartIcon as HeartIconSolid
} from '@heroicons/react/24/solid';
import { 
  FaceSmileIcon, 
  HeartIcon as HeartIconOutline,
  UserCircleIcon,
  AcademicCapIcon,
  MapPinIcon,
  IdentificationIcon,
  CameraIcon
} from '@heroicons/react/24/outline';
import type { User } from '../types';

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  photoURL: string | null;
  text: string;
  imageUrl?: string | null;
  createdAt: any;
  replyTo: null | {
    messageId: string;
    userName: string;
    text: string;
  };
  reactions: Record<string, string[]>; // emoji -> array of userUids
}

interface PhotoLiker {
  id: string;
  likerName: string;
  likerPhoto: string | null;
  timestamp: any;
}

const EMOJI_LIBRARY = [
  '😀', '😂', '🥰', '😎', '🤔', '👍', '❤️', '🔥', '🎉', '🚀', 
  '👏', '👀', '🎓', '📚', '💻', '✨', '💡', '👋', '💩', '💯',
  '🙌', '🌟', '🥳', '😭', '🤯', '🙏', '🌈', '🍕', '🍻', '🎮'
];

const DEFAULT_5_REACTIONS = ['👍', '❤️', '😂', '🔥', '👏'];

// --- User Profile Modal Component ---
interface UserProfileModalProps {
  userId: string;
  onClose: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ userId, onClose }) => {
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [likes, setLikes] = useState<PhotoLiker[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [hasLiked, setHasLiked] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // 1. Fetch user profile
    const unsubProfile = db.collection('profiles').doc(userId).onSnapshot((doc) => {
      if (doc.exists) {
        setProfile({ uid: doc.id, ...doc.data() } as User);
      }
      setLoadingProfile(false);
    }, (err) => {
      console.error("Error loading profile:", err);
      setLoadingProfile(false);
    });

    // 2. Fetch photo likes
    const unsubLikes = db.collection('profiles')
      .doc(userId)
      .collection('photoLikes')
      .orderBy('timestamp', 'desc')
      .onSnapshot((snapshot) => {
        const list: PhotoLiker[] = [];
        let likedByMe = false;
        snapshot.forEach((doc) => {
          const data = doc.data();
          list.push({
            id: doc.id,
            likerName: data.likerName,
            likerPhoto: data.likerPhoto || null,
            timestamp: data.timestamp
          });
          if (doc.id === currentUser?.uid) {
            likedByMe = true;
          }
        });
        setLikes(list);
        setHasLiked(likedByMe);
      }, (err) => {
        console.error("Error loading photo likes:", err);
      });

    return () => {
      unsubProfile();
      unsubLikes();
    };
  }, [userId, currentUser]);

  const handleToggleLike = async () => {
    if (!currentUser || !profile) return;
    const likeRef = db.collection('profiles')
      .doc(userId)
      .collection('photoLikes')
      .doc(currentUser.uid);

    if (hasLiked) {
      // Remove like
      await likeRef.delete();
    } else {
      // Add like
      await likeRef.set({
        likerName: currentUser.fullName,
        likerPhoto: currentUser.photo || null,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  };

  if (loadingProfile) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl p-6 shadow-2xl flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-3 text-sm text-gray-500 font-medium">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl p-6 shadow-2xl text-center max-w-xs w-full">
          <p className="text-gray-800 font-bold">Perfil não encontrado.</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">Fechar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh] animate-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header decoration */}
        <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Details Container */}
        <div className="px-6 pb-6 flex-grow overflow-y-auto flex flex-col items-center relative -mt-12">
          {/* Profile Photo */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-200">
              {profile.photo ? (
                <img src={profile.photo} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserCircleIcon className="w-full h-full text-gray-400" />
              )}
            </div>

            {/* Like Button overlay */}
            <button 
              onClick={handleToggleLike}
              className="absolute -bottom-1 -right-1 bg-white p-2 rounded-full shadow-md text-red-500 hover:scale-110 active:scale-95 transition"
            >
              {hasLiked ? (
                <HeartIconSolid className="w-6 h-6 animate-pulse" />
              ) : (
                <HeartIconOutline className="w-6 h-6" />
              )}
            </button>
          </div>

          <h2 className="mt-3 text-xl font-bold text-gray-800 text-center">{profile.fullName}</h2>
          <p className="text-sm text-gray-500 text-center font-medium mt-0.5">{profile.email}</p>

          {/* Academic Info */}
          <div className="w-full mt-6 space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-3">
              <AcademicCapIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400 font-medium">Faculdade & Curso</p>
                <p className="text-sm font-semibold text-gray-700 leading-snug">{profile.university} — {profile.course}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPinIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400 font-medium">Campus</p>
                <p className="text-sm font-semibold text-gray-700">{profile.campus}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <IdentificationIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400 font-medium">RGM</p>
                <p className="text-sm font-mono font-semibold text-gray-700">{profile.rgm}</p>
              </div>
            </div>
          </div>

          {/* Likes List */}
          <div className="w-full mt-6 flex-grow">
            <div className="flex items-center gap-1.5 border-b pb-2 mb-3">
              <HeartIconSolid className="w-4 h-4 text-red-500" />
              <h3 className="font-bold text-sm text-gray-800">
                Curtidas na Foto ({likes.length})
              </h3>
            </div>

            {likes.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4 font-medium">Ninguém curtiu a foto ainda. Seja o primeiro!</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {likes.map((like) => (
                  <div key={like.id} className="flex items-center gap-2 bg-gray-50/50 p-2 rounded-xl border border-gray-100">
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200">
                      {like.likerPhoto ? (
                        <img src={like.likerPhoto} alt={like.likerName} className="w-full h-full object-cover" />
                      ) : (
                        <UserCircleIcon className="w-full h-full text-gray-400" />
                      )}
                    </div>
                    <span className="text-xs font-semibold text-gray-700 truncate flex-grow">{like.likerName}</span>
                    {like.id === currentUser?.uid && (
                      <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">Você</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


// Helper function to compress images client-side before upload
const compressImage = (file: File, options: { maxWidth: number; maxHeight: number; quality: number }): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onerror = reject;
        reader.onload = (e) => {
            const img = new Image();
            img.onerror = reject;
            img.onload = () => {
                let { width, height } = img;
                if (width > height) {
                    if (width > options.maxWidth) { height = Math.round((height * options.maxWidth) / width); width = options.maxWidth; }
                } else {
                    if (height > options.maxHeight) { width = Math.round((width * options.maxHeight) / height); height = options.maxHeight; }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error('Could not get canvas context.'));
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(
                    (blob) => {
                        if (!blob) return reject(new Error('Canvas to Blob conversion failed.'));
                        const compressedFile = new File([blob], file.name.split('.').slice(0, -1).join('.') + '.jpeg', { type: 'image/jpeg', lastModified: Date.now() });
                        resolve(compressedFile);
                    }, 'image/jpeg', options.quality
                );
            };
            img.src = e.target?.result as string;
        };
    });
};

// --- Main Chat Page Component ---
const MyCourse: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage['replyTo']>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);
  
  // Image sending states
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // Load chat messages
  useEffect(() => {
    const unsubscribe = db.collection('chat')
      .orderBy('createdAt', 'asc')
      .onSnapshot((snapshot) => {
        const loaded: ChatMessage[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          loaded.push({
            id: doc.id,
            userId: data.userId || '',
            userName: data.userName || 'Aluno Anônimo',
            photoURL: data.photoURL || null,
            text: data.text || '',
            imageUrl: data.imageUrl || null,
            createdAt: data.createdAt,
            replyTo: data.replyTo || null,
            reactions: data.reactions || {}
          });
        });
        setMessages(loaded);
      }, (err) => {
        console.error("Error loading chat messages:", err);
      });

    return () => unsubscribe();
  }, []);

  // Silent cleanup of messages older than 30 days (Admin-only)
  useEffect(() => {
    if (!user || !user.isAdmin) return;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const cleanupHistory = async () => {
      try {
        const snapshot = await db.collection('chat')
          .where('createdAt', '<', thirtyDaysAgo)
          .get();

        if (!snapshot.empty) {
          const batch = db.batch();
          snapshot.forEach((doc) => {
            const data = doc.data();
            batch.delete(doc.ref);
            if (data.imageUrl) {
              storage.refFromURL(data.imageUrl).delete().catch(e => console.error("Error deleting image file:", e));
            }
          });
          await batch.commit();
          console.log(`Successfully cleaned up ${snapshot.size} messages older than 30 days.`);
        }
      } catch (err) {
        console.error("Error running messages cleanup:", err);
      }
    };

    cleanupHistory();
  }, [user]);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (inputText.trim() === '' && !selectedImage) return;

    setIsSending(true);
    try {
      let imageUrl: string | null = null;

      if (selectedImage) {
        const randomPhotoId = Math.random().toString(36).substring(2, 15) + '_' + Date.now();
        const photoRef = storage.ref(`chat-photos/chat-${randomPhotoId}`);
        await photoRef.put(selectedImage, { contentType: selectedImage.type });
        imageUrl = await photoRef.getDownloadURL();
      }

      const msgData = {
        userId: user.uid,
        userName: user.fullName,
        photoURL: user.photo,
        text: inputText.trim(),
        imageUrl: imageUrl,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        replyTo: replyingTo,
        reactions: {}
      };

      setInputText('');
      setReplyingTo(null);
      setSelectedImage(null);
      setImagePreview(null);
      setShowEmojiPicker(false);
      messageInputRef.current?.focus();

      await db.collection('chat').add(msgData);
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string, imageUrl?: string | null) => {
    try {
      await db.collection('chat').doc(messageId).delete();
      if (imageUrl) {
        try {
          await storage.refFromURL(imageUrl).delete();
        } catch (err) {
          console.error("Error deleting image file:", err);
        }
      }
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  const handleSelectImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        alert("Por favor, selecione uma imagem.");
        return;
      }
      try {
        const compressed = await compressImage(file, { maxWidth: 800, maxHeight: 800, quality: 0.7 });
        setSelectedImage(compressed);
        setImagePreview(URL.createObjectURL(compressed));
      } catch (err) {
        console.error("Image compression failed:", err);
      }
    }
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    
    const msgRef = db.collection('chat').doc(messageId);
    const msgDoc = await msgRef.get();
    if (!msgDoc.exists) return;

    const data = msgDoc.data() as ChatMessage;
    const currentReactions = data.reactions || {};
    const uids = currentReactions[emoji] || [];

    let updatedUids: string[];
    if (uids.includes(user.uid)) {
      // Remove reaction
      updatedUids = uids.filter(uid => uid !== user.uid);
    } else {
      // Add reaction
      updatedUids = [...uids, user.uid];
    }

    await msgRef.update({
      [`reactions.${emoji}`]: updatedUids
    });
  };

  const handleInsertEmoji = (emoji: string) => {
    setInputText(prev => prev + emoji);
  };

  const formatMessageTime = (createdAt: any) => {
    if (!createdAt) return 'Enviando...';
    // Handle either serverTimestamp (snapshot has seconds) or standard timestamp
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
      {/* Header */}
      <header className="p-4 flex items-center text-gray-800 bg-white shadow-sm border-b sticky top-0 z-10 pt-[calc(env(safe-area-inset-top,0px)+1rem)]">
        <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full hover:bg-gray-100 transition">
          <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="font-bold text-md leading-none text-slate-800">Bate-papo dos Alunos</h1>
          <span className="text-[11px] text-green-500 font-semibold flex items-center gap-1.5 mt-0.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
            Online
          </span>
        </div>
      </header>

      {/* Message List */}
      <main className="flex-grow p-4 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-full mb-3">
              <FaceSmileIcon className="w-8 h-8" />
            </div>
            <p className="text-sm font-semibold text-gray-600">Seja o primeiro a enviar uma mensagem!</p>
            <p className="text-xs text-gray-400 mt-1">Converse com outros alunos da rede em tempo real.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.userId === user?.uid;
            
            return (
              <div 
                key={msg.id} 
                className={`flex gap-2.5 max-w-[85%] ${isOwnMessage ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Profile Photo */}
                <button 
                  onClick={() => setSelectedProfileId(msg.userId)}
                  className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 border shadow-sm flex-shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition"
                >
                  {msg.photoURL ? (
                    <img src={msg.photoURL} alt={msg.userName} className="w-full h-full object-cover" />
                  ) : (
                    <UserCircleIcon className="w-full h-full text-gray-400" />
                  )}
                </button>

                {/* Message Bubble Container */}
                <div className="flex flex-col space-y-1">
                  {/* Sender Name */}
                  {!isOwnMessage && (
                    <span className="text-xs font-semibold text-gray-500 ml-1 leading-none">{msg.userName}</span>
                  )}

                  {/* Message Bubble */}
                  <div 
                    className={`rounded-2xl px-4 py-2.5 shadow-sm text-sm relative group transition-all duration-300 ${
                      isOwnMessage 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                    }`}
                  >
                    {/* Reply Container */}
                    {msg.replyTo && (
                      <div 
                        className={`text-xs p-2 rounded-lg mb-2 border-l-4 leading-tight flex flex-col gap-0.5 ${
                          isOwnMessage 
                          ? 'bg-blue-700/50 text-blue-100 border-blue-300' 
                          : 'bg-slate-50 text-slate-500 border-slate-300'
                        }`}
                      >
                        <span className="font-bold">Em resposta a @{msg.replyTo.userName}</span>
                        <p className="truncate italic">"{msg.replyTo.text}"</p>
                      </div>
                    )}

                    {/* Message Image */}
                    {msg.imageUrl && (
                      <div className="my-2 rounded-xl overflow-hidden max-w-full border border-black/5 shadow-sm">
                        <img 
                          src={msg.imageUrl} 
                          alt="Foto compartilhada" 
                          className="max-h-60 object-cover w-full cursor-pointer hover:opacity-95 transition"
                          onClick={() => setActivePhotoUrl(msg.imageUrl || null)}
                        />
                      </div>
                    )}

                    {/* Message Text */}
                    {msg.text && <p className="break-words leading-relaxed">{msg.text}</p>}

                    {/* Footer Inside Bubble: Time & Actions */}
                    <div className="flex items-center justify-between gap-4 mt-1.5 pt-0.5 border-t border-white/10">
                      <span className={`text-[10px] ${isOwnMessage ? 'text-blue-100' : 'text-slate-400'}`}>
                        {formatMessageTime(msg.createdAt)}
                      </span>

                      {/* Hover/Touch actions */}
                      <div className="flex items-center gap-2.5 opacity-80 hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setReplyingTo({ messageId: msg.id, userName: msg.userName, text: msg.text || (msg.imageUrl ? "Foto" : "") })}
                          className={`hover:scale-110 active:scale-95 transition ${isOwnMessage ? 'text-blue-200 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}
                          title="Responder"
                        >
                          <ArrowUturnLeftIcon className="w-3.5 h-3.5" />
                        </button>
                        
                        {(isOwnMessage || user?.isAdmin) && (
                          <button 
                            onClick={() => handleDeleteMessage(msg.id, msg.imageUrl)}
                            className={`hover:scale-110 active:scale-95 transition ${isOwnMessage ? 'text-blue-200 hover:text-red-200' : 'text-slate-400 hover:text-red-500'}`}
                            title="Apagar"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Message Reactions display */}
                  <div className={`flex flex-wrap items-center gap-1 mt-1.5 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    {/* Render the 5 default reactions */}
                    {DEFAULT_5_REACTIONS.map((emoji) => {
                      const uids = msg.reactions[emoji] || [];
                      const count = uids.length;
                      const hasReacted = uids.includes(user?.uid || '');

                      return (
                        <button
                          key={emoji}
                          onClick={() => handleToggleReaction(msg.id, emoji)}
                          className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border shadow-sm transition-all duration-200 ${
                            count > 0
                              ? hasReacted 
                                ? 'bg-blue-50 text-blue-600 border-blue-200 font-bold scale-100' 
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                              : 'bg-white/40 text-gray-400 border-gray-100 hover:bg-white hover:text-gray-600 hover:border-gray-200 opacity-40 hover:opacity-100'
                          }`}
                          title={count > 0 ? `${count} reações` : 'Reagir'}
                        >
                          <span>{emoji}</span>
                          {count > 0 && <span className="font-mono font-semibold">{count}</span>}
                        </button>
                      );
                    })}

                    {/* Render other active reactions not in defaults */}
                    {Object.entries(msg.reactions).map(([emoji, uids]) => {
                      if (DEFAULT_5_REACTIONS.includes(emoji)) return null;
                      if (uids.length === 0) return null;
                      const hasReacted = uids.includes(user?.uid || '');

                      return (
                        <button
                          key={emoji}
                          onClick={() => handleToggleReaction(msg.id, emoji)}
                          className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border shadow-sm transition-all duration-200 ${
                            hasReacted 
                              ? 'bg-blue-50 text-blue-600 border-blue-200 font-bold' 
                              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <span>{emoji}</span>
                          <span className="font-mono font-semibold">{uids.length}</span>
                        </button>
                      );
                    })}

                    {/* "+" button for other emojis */}
                    <div className="relative inline-block">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveReactionMsgId(activeReactionMsgId === msg.id ? null : msg.id);
                        }}
                        className={`flex items-center justify-center w-5 h-5 text-xs text-gray-400 hover:text-gray-700 bg-white rounded-full border shadow-sm transition-all hover:scale-110 active:scale-90 ${
                          activeReactionMsgId === msg.id ? 'ring-2 ring-blue-400 border-transparent text-blue-600 font-bold' : ''
                        }`}
                        title="Outras reações"
                      >
                        <span>+</span>
                      </button>
                      
                      {/* React State-based Reaction Menu */}
                      {activeReactionMsgId === msg.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setActiveReactionMsgId(null)} />
                          <div className="absolute bottom-6 left-0 flex flex-wrap bg-white rounded-2xl shadow-xl border p-2 gap-2 z-50 animate-scale-up min-w-[200px] max-w-[240px]">
                            {EMOJI_LIBRARY.map((emoji) => {
                              const uids = msg.reactions[emoji] || [];
                              const hasReacted = uids.includes(user?.uid || '');

                              return (
                                <button
                                  key={emoji}
                                  onClick={() => handleToggleReaction(msg.id, emoji)}
                                  className={`hover:scale-125 transition p-1 text-base rounded-full ${
                                    hasReacted ? 'bg-blue-50 scale-110' : 'hover:bg-gray-100'
                                  }`}
                                >
                                  {emoji}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Composer Area */}
      <footer className="bg-white border-t p-3 z-30 w-full max-w-sm mx-auto md:max-w-md lg:max-w-lg">
        {/* Selected Image Preview Bar */}
        {imagePreview && (
          <div className="bg-slate-100 p-2 rounded-xl flex items-center justify-between border mb-2 animate-slide-up">
            <div className="flex items-center gap-3">
              <img src={imagePreview} alt="Preview" className="w-12 h-12 object-cover rounded-lg border shadow-sm" />
              <span className="text-xs text-gray-500 truncate max-w-[150px]">Foto selecionada</span>
            </div>
            <button 
              onClick={() => {
                setSelectedImage(null);
                setImagePreview(null);
              }} 
              className="p-1.5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 transition"
              type="button"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Reply Indicator Bar */}
        {replyingTo && (
          <div className="bg-blue-50 p-2 rounded-xl flex items-center justify-between border border-blue-100 mb-2 animate-slide-up">
            <div className="flex items-center gap-2 text-xs text-blue-800">
              <ArrowUturnLeftIcon className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
              <div className="truncate">
                <span className="font-bold">Respondendo a @{replyingTo.userName}:</span>
                <span className="italic ml-1">"{replyingTo.text}"</span>
              </div>
            </div>
            <button onClick={() => setReplyingTo(null)} className="p-1 rounded-full hover:bg-blue-100 text-blue-600 transition" type="button">
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Text Input Row */}
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          {/* Photo select button */}
          <label className="p-2.5 text-gray-400 hover:text-gray-600 cursor-pointer transition">
            <CameraIcon className="w-6 h-6" />
            <input 
              type="file" 
              accept="image/*" 
              className="sr-only" 
              onChange={handleSelectImage} 
              disabled={isSending}
            />
          </label>

          {/* Emoji Toggle button */}
          <button 
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`p-2.5 rounded-full transition ${showEmojiPicker ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            disabled={isSending}
          >
            <FaceSmileIcon className="w-6 h-6" />
          </button>

          {/* Text Input */}
          <input
            ref={messageInputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isSending ? "Enviando foto..." : "Escreva uma mensagem..."}
            className="flex-grow p-2.5 text-sm bg-slate-100 border border-transparent rounded-full focus:bg-white focus:border-blue-400 focus:outline-none transition-all shadow-inner"
            maxLength={1024}
            disabled={isSending}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={isSending || (inputText.trim() === '' && !selectedImage)}
            className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 active:scale-95 disabled:bg-gray-300 disabled:scale-100 disabled:cursor-not-allowed shadow-md transition"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-4.5 w-4.5 border-t-2 border-b-2 border-white"></div>
            ) : (
              <PaperAirplaneIcon className="w-4.5 h-4.5 transform -rotate-45" />
            )}
          </button>
        </form>

        {/* Emoji Library Drawer */}
        {showEmojiPicker && (
          <div className="bg-slate-50 border-t mt-2 rounded-2xl p-3 grid grid-cols-8 gap-2.5 max-h-48 overflow-y-auto shadow-inner animate-slide-up">
            {EMOJI_LIBRARY.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleInsertEmoji(emoji)}
                className="text-2xl p-1 hover:scale-125 transition duration-150 active:scale-95"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </footer>

      {/* Profile Modal */}
      {selectedProfileId && (
        <UserProfileModal 
          userId={selectedProfileId} 
          onClose={() => setSelectedProfileId(null)} 
        />
      )}

      {/* Fullscreen Photo Dialog */}
      {activePhotoUrl && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 cursor-pointer"
          onClick={() => setActivePhotoUrl(null)}
        >
          <div className="relative max-w-full max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setActivePhotoUrl(null)}
              className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition z-10"
              type="button"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            <img 
              src={activePhotoUrl} 
              alt="Ampliada" 
              className="max-w-full max-h-[90vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}

      {/* Extra Animations Styling */}
      <style>{`
        @keyframes modal {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-modal {
          animation: modal 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slide-up {
          animation: slide-up 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default MyCourse;
