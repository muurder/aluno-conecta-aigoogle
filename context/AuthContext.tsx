

import React, { createContext, useState, useContext, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import { auth, db } from '../firebase';
import type { User } from '../types';

// Define Firebase User type for v8/compat mode
type FirebaseUser = firebase.User;

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (email: string, pass:string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: Omit<User, 'uid'>, pass: string) => Promise<User>;
  updateUser: (newUserData: User) => Promise<void>;
  getAllUsers: () => Promise<User[]>;
  deleteUser: (uid: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Função auxiliar para buscar dados do Firestore
const getUserProfile = async (firebaseUser: FirebaseUser): Promise<User | null> => {
    const userDocRef = db.collection('users').doc(firebaseUser.uid);
    const userDoc = await userDocRef.get();
    if (userDoc.exists) {
        return userDoc.data() as User;
    }
    return null;
}


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const userProfile = await getUserProfile(firebaseUser);
        setUser(userProfile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    // A lógica foi simplificada para usar o e-mail diretamente.
    // Isso remove a necessidade de uma consulta prévia ao Firestore,
    // que estava sendo bloqueada pelas regras de segurança para usuários não autenticados.
    await auth.signInWithEmailAndPassword(email, pass);
  };

  const logout = async () => {
    await auth.signOut();
  };

  const register = async (userData: Omit<User, 'uid'>, pass: string): Promise<User> => {
    // O "primeiro usuário é admin" foi removido. Essa verificação exigia
    // permissão de leitura na coleção de usuários antes da autenticação,
    // o que causava o erro 'permission-denied'.
    // O primeiro usuário agora deve ser definido como admin manualmente no console do Firebase.
    const userCredential = await auth.createUserWithEmailAndPassword(userData.email, pass);
    const firebaseUser = userCredential.user;

    if (!firebaseUser) {
        throw new Error("User creation failed, Firebase user is null.");
    }
    
    const newUser: User = {
        uid: firebaseUser.uid,
        ...userData, // userData from registration form already has status: 'pending'
    };
    
    await db.collection('users').doc(firebaseUser.uid).set(newUser);
    setUser(newUser);
    return newUser;
  };
  
  const updateUser = async (newUserData: User) => {
      const userDocRef = db.collection('users').doc(newUserData.uid);
      await userDocRef.update({ ...newUserData });
      if (user?.uid === newUserData.uid) {
          setUser(newUserData);
      }
  };

  const getAllUsers = async (): Promise<User[]> => {
    const usersCol = db.collection('users');
    const userSnapshot = await usersCol.get();
    const userList = userSnapshot.docs.map(doc => doc.data() as User);
    return userList;
  };

  const deleteUser = async (uid: string) => {
    // ATENÇÃO: Isso deleta apenas o perfil do Firestore.
    // Deletar o usuário da Autenticação do Firebase requer privilégios de admin
    // e geralmente é feito a partir de um backend (Cloud Function) por segurança.
    const userDocRef = db.collection('users').doc(uid);
    await userDocRef.delete();
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, loading, login, logout, register, updateUser, getAllUsers, deleteUser }}>
      {!loading && children}
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