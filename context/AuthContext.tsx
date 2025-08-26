

import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabase';
import type { User } from '../types';
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
  login: (email: string, pass:string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: Omit<User, 'uid' | 'email'>, email: string, pass: string) => Promise<void>;
  updateUser: (newUserData: User) => Promise<void>;
  getAllUsers: () => Promise<User[]>;
  deleteUser: (uid: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getUserProfile = async (supabaseUser: SupabaseUser): Promise<User | null> => {
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('uid', supabaseUser.id)
        .single();
    
    if (error) {
        console.error("Error fetching user profile:", error.message);
        return null;
    }
    
    if (profile) {
        return mapSupabaseProfileToUser(profile, supabaseUser);
    }
    return null;
}


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getInitialSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const userProfile = await getUserProfile(session.user);
            setUser(userProfile);
        }
        setLoading(false);
    };
    
    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setLoading(true);
        if (event === 'SIGNED_IN' && session?.user) {
          const userProfile = await getUserProfile(session.user);
          setUser(userProfile);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const register = async (userData: Omit<User, 'uid' | 'email'>, email: string, pass: string): Promise<void> => {
      // Prepara os dados do usuário para serem enviados como metadados.
      // As chaves devem corresponder ao que o gatilho SQL espera (snake_case).
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
      
      // Cria o usuário na autenticação, passando todos os dados do perfil em `options.data`.
      // O gatilho no banco de dados lerá esses dados para criar a linha completa na tabela 'profiles'.
      const { error: signUpError } = await supabase.auth.signUp({
          email: email,
          password: pass,
          options: {
              data: userMetaData
          }
      });

      if (signUpError) throw signUpError;

      // Não é mais necessário fazer login ou atualizar o perfil manualmente.
      // O gatilho cuida de tudo. O usuário receberá um e-mail de confirmação do Supabase.
  };
  
  const updateUser = async (newUserData: User) => {
      const profileData = mapUserToSupabaseProfile(newUserData);
      // Remove uid from the update payload as it's the primary key and shouldn't be changed
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
    
    // In Supabase, we can't easily fetch the auth user email for all users from the client
    // due to security policies. We'll use the email stored in the profile.
    return profiles.map(profile => ({
      uid: profile.uid,
      email: profile.email, // Using email from profile table
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
    // SECURITY NOTE: This deletes only the profile from the database.
    // Deleting the actual user from Supabase Auth requires admin privileges and
    // should be done from a secure backend environment (e.g., a Supabase Edge Function)
    // to avoid exposing service_role keys on the client.
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('uid', uid);
    
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, loading, login, logout, register, updateUser, getAllUsers, deleteUser }}>
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