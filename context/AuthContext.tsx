



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
  register: (userData: Omit<User, 'uid' | 'email'>, email: string, pass: string) => Promise<User>;
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

  const register = async (userData: Omit<User, 'uid' | 'email'>, email: string, pass: string): Promise<User> => {
      // Step 1: Create the user in auth.users. The DB trigger will create the basic profile row.
      const { data, error: signUpError } = await supabase.auth.signUp({
          email: email,
          password: pass,
      });

      if (signUpError) throw signUpError;
      if (!data.user) throw new Error("User creation failed, Supabase user is null.");

      // Step 2: Immediately sign in to establish a session. This is crucial for RLS policies to work.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: pass,
      });

      if (signInError) {
        console.error("Error signing in after registration:", signInError);
        // Even if sign-in fails, the user was created. This is a state to handle,
        // but for now, we throw to indicate a problem with the registration flow.
        throw new Error("Could not sign in after creating account. Profile update aborted.");
      }

      // Step 3: Prepare the full user object for the app state.
      const fullUser: User = {
          uid: data.user.id,
          email: data.user.email!,
          ...userData
      };

      // Step 4: Prepare the data to UPDATE the profile row created by the trigger.
      const profileUpdateData = {
          institutional_login: userData.institutionalLogin,
          rgm: userData.rgm,
          full_name: userData.fullName,
          university: userData.university,
          course: userData.course,
          campus: userData.campus,
          validity: userData.validity,
          photo: userData.photo,
          status: userData.status,
      };
      
      // Step 5: Update the new profile with the rest of the form data. This should now succeed due to the active session.
      const { error: updateError } = await supabase
          .from('profiles')
          .update(profileUpdateData)
          .eq('uid', data.user.id);
      
      if (updateError) {
          console.error("Error updating profile after sign up:", updateError);
          // This is a critical error. The user exists in auth, but their profile is incomplete.
          // In a real-world app, you might want a cleanup process or a retry mechanism.
          throw updateError;
      }
      
      setUser(fullUser);
      return fullUser;
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
