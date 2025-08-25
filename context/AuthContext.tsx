
import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import type { User } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: Omit<User, 'uid'>, pass: string) => Promise<void>;
  updateUser: (newUserData: User) => Promise<void>;
  getAllUsers: () => Promise<User[]>;
  deleteUser: (uid: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Função auxiliar para buscar dados do Firestore
const getUserProfile = async (firebaseUser: FirebaseUser): Promise<User | null> => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
        return userDoc.data() as User;
    }
    // Caso de admin pré-existente ou erro de sincronia
    if (firebaseUser.email === 'admin@portal.com') {
        const adminProfile: User = {
            uid: firebaseUser.uid,
            login: 'admin',
            fullName: 'Administrator',
            email: 'admin@portal.com',
            university: 'Anhanguera',
            course: 'System Admin',
            campus: 'Santana',
            validity: '12/2099',
            photo: null,
            status: 'approved',
            isAdmin: true,
            rgm: '000000'
        };
        await setDoc(userDocRef, adminProfile);
        return adminProfile;
    }
    return null;
}


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
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
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const register = async (userData: Omit<User, 'uid'>, pass: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, pass);
    const firebaseUser = userCredential.user;
    
    const newUser: User = {
        uid: firebaseUser.uid,
        ...userData,
    };
    
    await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
    setUser(newUser);
  };
  
  const updateUser = async (newUserData: User) => {
      const userDocRef = doc(db, 'users', newUserData.uid);
      await updateDoc(userDocRef, { ...newUserData });
      if (user?.uid === newUserData.uid) {
          setUser(newUserData);
      }
  };

  const getAllUsers = async (): Promise<User[]> => {
    const usersCol = collection(db, 'users');
    const userSnapshot = await getDocs(usersCol);
    const userList = userSnapshot.docs.map(doc => doc.data() as User);
    return userList;
  };

  const deleteUser = async (uid: string) => {
    // ATENÇÃO: Isso deleta apenas o perfil do Firestore.
    // Deletar o usuário da Autenticação do Firebase requer privilégios de admin
    // e geralmente é feito a partir de um backend (Cloud Function) por segurança.
    const userDocRef = doc(db, 'users', uid);
    await deleteDoc(userDocRef);
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