import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabase';
import type { User, Post, Comment, Reaction } from '../types';
import type { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';

// Helper to map Supabase profile data (snake_case) to our app's User type (camelCase)
const mapSupabaseProfileToUser = (profile: any, authUser: SupabaseUser): User => {
    return {
        uid: authUser.id,
        email: authUser.email!,
        institutionalLogin: profile.institutional_login,
        rgm: profile.rgm,
        fullName: profile.full_name,
        university: profile.university,
        course: profile.course,
        campus: profile.campus,
        validity: profile.validity,
        photo: profile.photo,
        status: profile.status,
        isAdmin: profile.is_admin,
    };
};

// Helper to map our app's User type to Supabase profile data
const mapUserToSupabaseProfile = (user: User) => {
    return {
        uid: user.uid,
        institutional_login: user.institutionalLogin,
        rgm: user.rgm,
        full_name: user.fullName,
        email: user.email,
        university: user.university,
        course: user.course,
        campus: user.campus,
        validity: user.validity,
        photo: user.photo,
        status: user.status,
        is_admin: user.isAdmin,
    };
};


interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  profileError: string | null;
  login: (email: string, pass:string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: Omit<User, 'uid' | 'email'>, email: string, pass: string) => Promise<void>;
  updateUser: (newUserData: User) => Promise<void>;
  getAllUsers: () => Promise<User[]>;
  deleteUser: (uid: string) => Promise<void>;
  // Mural / Feed functions
  getPosts: () => Promise<Post[]>;
  createPost: (content: string, imageFile?: File) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<Comment>;
  deleteComment: (commentId: string) => Promise<void>;
  toggleReaction: (postId: string, emoji: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    // onAuthStateChange é chamado uma vez na inscrição com a sessão inicial.
    // Isso lida tanto com o carregamento inicial quanto com eventos de autenticação subsequentes.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('uid', session.user.id)
            .single();

          if (error) {
            console.error("Error fetching profile:", error.message);
            if (error.message.toLowerCase().includes('network')) {
              setProfileError('cors');
            } else if (error.code === 'PGRST116') { // 'exact one row not found'
              console.error("Profile not found for user:", session.user.id);
              setProfileError('no_profile');
            } else {
              setProfileError('generic');
            }
            setUser(null);
          } else if (profile) {
            setUser(mapSupabaseProfileToUser(profile, session.user));
            setProfileError(null);
          } else {
             console.error("Profile found was null, but no error reported from Supabase for user:", session.user.id);
             setProfileError('no_profile');
             setUser(null);
          }
        } else {
          // Nenhuma sessão ou usuário desconectado
          setUser(null);
          setProfileError(null);
        }
        // O carregamento inicial termina após a primeira verificação do estado de autenticação.
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);


  const login = async (email: string, pass: string) => {
    setProfileError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const register = async (userData: Omit<User, 'uid' | 'email'>, email: string, pass: string): Promise<void> => {
      const userMetaData = {
        full_name: userData.fullName,
        institutional_login: userData.institutionalLogin,
        rgm: userData.rgm,
        university: userData.university,
        course: userData.course,
        campus: userData.campus,
        validity: userData.validity,
        photo: userData.photo,
        status: 'pending',
      };
      
      const { error: signUpError } = await supabase.auth.signUp({
          email: email,
          password: pass,
          options: {
              data: userMetaData
          }
      });

      if (signUpError) throw signUpError;
  };
  
  const updateUser = async (newUserData: User) => {
      const profileData = mapUserToSupabaseProfile(newUserData);
      const { uid, ...updateData } = profileData; 

      const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('uid', newUserData.uid);

      if (error) throw error;

      if (user?.uid === newUserData.uid) {
          setUser(newUserData);
      }
  };

  const getAllUsers = async (): Promise<User[]> => {
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*');

    if (error) {
      console.error("Error fetching all users:", error);
      throw error;
    }
    
    return profiles.map(profile => ({
      uid: profile.uid,
      email: profile.email,
      institutionalLogin: profile.institutional_login,
      rgm: profile.rgm,
      fullName: profile.full_name,
      university: profile.university,
      course: profile.course,
      campus: profile.campus,
      validity: profile.validity,
      photo: profile.photo,
      status: profile.status,
      isAdmin: profile.is_admin,
    }));
  };

  const deleteUser = async (uid: string) => {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('uid', uid);
    
    if (error) throw error;
  };

  // Mural / Feed functions
  const getPosts = async (): Promise<Post[]> => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles (full_name, photo),
          comments (
            *,
            author:profiles (full_name, photo)
          ),
          reactions (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as Post[];
  };

  const createPost = async (content: string, imageFile?: File) => {
    if (!user) throw new Error("User must be logged in to create a post.");

    let imageUrl: string | null = null;
    if (imageFile) {
      const fileName = `${user.uid}/${Date.now()}_${imageFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('post_images')
        .upload(fileName, imageFile);
      
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('post_images')
        .getPublicUrl(fileName);
      imageUrl = publicUrl;
    }

    const { error: postError } = await supabase
      .from('posts')
      .insert({
        author_uid: user.uid,
        content,
        image_url: imageUrl,
      });
    
    if (postError) throw postError;
  };

  const deletePost = async (postId: string) => {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);
    
    if (error) throw error;
  };

  const addComment = async (postId: string, content: string): Promise<Comment> => {
    if (!user) throw new Error("User must be logged in to comment.");
    
    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: postId, author_uid: user.uid, content })
      .select(`
        *,
        author:profiles (full_name, photo)
      `)
      .single();
      
    if (error) throw error;
    return data as unknown as Comment;
  };

  const deleteComment = async (commentId: string) => {
     const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);
    
    if (error) throw error;
  };

  const toggleReaction = async (postId: string, emoji: string) => {
    if (!user) throw new Error("User must be logged in to react.");
    
    // Check if a reaction from this user already exists on this post
    const { data: existingReaction, error: fetchError } = await supabase
      .from('reactions')
      .select('id, emoji')
      .eq('post_id', postId)
      .eq('user_uid', user.uid)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = 'exact one row not found'
      throw fetchError;
    }

    // If reaction exists and is the same emoji, delete it (unlike)
    if (existingReaction && existingReaction.emoji === emoji) {
      const { error: deleteError } = await supabase
        .from('reactions')
        .delete()
        .eq('id', existingReaction.id);
      if (deleteError) throw deleteError;
    } else {
        // Upsert: update if exists, insert if not. This handles changing reaction emoji or adding a new one.
        const { error: upsertError } = await supabase
            .from('reactions')
            .upsert({
                id: existingReaction?.id, // Supabase needs id for update, will ignore for insert
                post_id: postId,
                user_uid: user.uid,
                emoji: emoji,
            }, { onConflict: 'post_id,user_uid' });
        
        if (upsertError) throw upsertError;
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, loading, login, logout, register, updateUser, getAllUsers, deleteUser, profileError, getPosts, createPost, deletePost, addComment, deleteComment, toggleReaction }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};