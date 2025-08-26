

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Post } from '../types';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import { PaperAirplaneIcon, PhotoIcon, XMarkIcon, TrashIcon, ChatBubbleOvalLeftEllipsisIcon } from '@heroicons/react/24/outline';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢'];

const CreatePost: React.FC<{ onPostCreated: () => void }> = ({ onPostCreated }) => {
    const { createPost } = useAuth();
    const [content, setContent] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() && !imageFile) return;
        setLoading(true);
        try {
            await createPost(content, imageFile ?? undefined);
            setContent('');
            handleRemoveImage();
            onPostCreated();
        } catch (error) {
            console.error("Failed to create post:", error);
            alert("Erro ao criar post. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow-md border border-gray-200 space-y-3">
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escreva um novo aviso..."
                className="w-full p-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500"
                rows={3}
            />
            {preview && (
                <div className="relative">
                    <img src={preview} alt="Preview" className="w-full h-auto max-h-60 object-cover rounded-md" />
                    <button type="button" onClick={handleRemoveImage} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>
            )}
            <div className="flex justify-between items-center">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-full">
                    <PhotoIcon className="w-6 h-6" />
                </button>
                <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2">
                    {loading ? 'Publicando...' : 'Publicar'}
                    {!loading && <PaperAirplaneIcon className="w-5 h-5" />}
                </button>
            </div>
        </form>
    );
};

const PostCard: React.FC<{ post: Post; onUpdate: () => void; }> = ({ post, onUpdate }) => {
    const { user, deletePost, addComment, deleteComment, toggleReaction } = useAuth();
    const [newComment, setNewComment] = useState('');
    const [showComments, setShowComments] = useState(false);

    const timeAgo = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "a";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "m";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "min";
        return Math.floor(seconds) + "s";
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        await addComment(post.id, newComment);
        setNewComment('');
        onUpdate();
    };
    
    const userReaction = post.reactions.find(r => r.user_uid === user?.uid)?.emoji;

    return (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {post.author.photo ? <img src={post.author.photo} className="w-10 h-10 rounded-full object-cover" alt={post.author.fullName} /> : <UserCircleIcon className="w-10 h-10 text-gray-300" />}
                        <div>
                            <p className="font-bold text-gray-800">{post.author.fullName}</p>
                            <p className="text-xs text-gray-500">{timeAgo(post.created_at)}</p>
                        </div>
                    </div>
                    {user?.isAdmin && user.uid === post.author_uid && (
                        <button onClick={async () => { if (confirm('Tem certeza?')) { await deletePost(post.id); onUpdate(); } }} className="p-2 text-gray-400 hover:text-red-500 rounded-full"><TrashIcon className="w-5 h-5" /></button>
                    )}
                </div>
                <p className="my-4 text-gray-700 whitespace-pre-wrap">{post.content}</p>
            </div>
            {post.image_url && <img src={post.image_url} alt="Post content" className="w-full h-auto object-cover" />}
            <div className="p-4">
                 <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
                    <span>{post.reactions.length} reações</span>
                    <span>{post.comments.length} comentários</span>
                </div>
                <div className="border-t border-b border-gray-200 flex justify-around py-1">
                    {EMOJIS.map(emoji => (
                        <button key={emoji} onClick={async () => { await toggleReaction(post.id, emoji); onUpdate(); }} className={`p-2 rounded-lg text-xl transition-transform transform hover:scale-125 ${userReaction === emoji ? 'bg-blue-100' : 'hover:bg-gray-100'}`}>{emoji}</button>
                    ))}
                     <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 p-2 rounded-lg hover:bg-gray-100 text-gray-600">
                        <ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6"/>
                        <span className="font-semibold text-sm">Comentar</span>
                    </button>
                </div>
            </div>
            {showComments && (
                 <div className="p-4 bg-gray-50">
                     {post.comments.map(comment => (
                        <div key={comment.id} className="flex items-start gap-2 mb-3 group">
                            {comment.author.photo ? <img src={comment.author.photo} className="w-8 h-8 rounded-full object-cover" alt={comment.author.fullName} /> : <UserCircleIcon className="w-8 h-8 text-gray-300" />}
                            <div className="flex-grow bg-gray-100 rounded-lg p-2">
                                <p className="font-bold text-sm text-gray-800">{comment.author.fullName}</p>
                                <p className="text-sm text-gray-700">{comment.content}</p>
                            </div>
                            {(user?.uid === comment.author_uid || user?.isAdmin) && (
                                <button onClick={async () => { await deleteComment(comment.id); onUpdate(); }} className="p-1 text-gray-400 hover:text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><XMarkIcon className="w-4 h-4" /></button>
                            )}
                        </div>
                     ))}
                     <form onSubmit={handleCommentSubmit} className="flex items-center gap-2 mt-4">
                        {user?.photo ? <img src={user.photo} className="w-8 h-8 rounded-full object-cover" alt="Seu perfil" /> : <UserCircleIcon className="w-8 h-8 text-gray-300" />}
                        <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Escreva um comentário..." className="flex-grow p-2 border border-gray-300 rounded-full bg-white text-sm" />
                     </form>
                 </div>
            )}
        </div>
    );
};


const MyCourse: React.FC = () => {
    const { user, getPosts } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPosts = useCallback(async () => {
        try {
            const fetchedPosts = await getPosts();
            setPosts(fetchedPosts);
        } catch (error) {
            console.error("Failed to fetch posts:", error);
        } finally {
            setLoading(false);
        }
    }, [getPosts]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    return (
        <div className="flex-grow bg-gray-100 p-2 sm:p-4 space-y-4 overflow-y-auto">
            <h1 className="text-2xl font-bold text-gray-800 px-2">Mural do Curso</h1>
            {user?.isAdmin && <CreatePost onPostCreated={fetchPosts} />}
            {loading ? (
                <p className="text-center text-gray-500">Carregando mural...</p>
            ) : posts.length === 0 ? (
                <div className="text-center py-10">
                    <p className="text-gray-600">Nenhum aviso publicado ainda.</p>
                    <p className="text-sm text-gray-400">Quando um administrador postar algo, aparecerá aqui.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {posts.map(post => (
                        <PostCard key={post.id} post={post} onUpdate={fetchPosts} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyCourse;
