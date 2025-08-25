
import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc, query, where } from 'firebase/firestore';
import type { User } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (login: string, pass:string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: Omit<User, 'uid'>, pass: string) => Promise<User>;
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

  const login = async (login: string, pass: string) => {
    // 1. Query Firestore for the user with the given login
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('login', '==', login));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        // No user found with that login, throw an error to be caught by the Login page
        throw new Error('User not found');
    }

    // 2. Get the email from the found user document
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data() as User;
    const email = userData.email;

    // 3. Sign in with the retrieved email and provided password
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const register = async (userData: Omit<User, 'uid'>, pass: string): Promise<User> => {
    // Verifica se este é o primeiro usuário a se registrar
    const usersCol = collection(db, 'users');
    const userSnapshot = await getDocs(usersCol);
    const isFirstUser = userSnapshot.empty;

    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, pass);
    const firebaseUser = userCredential.user;
    
    const newUser: User = {
        uid: firebaseUser.uid,
        ...userData,
    };

    // Se for o primeiro usuário, torna-o um admin e aprova automaticamente
    if (isFirstUser) {
        newUser.isAdmin = true;
        newUser.status = 'approved';
    }
    
    await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
    setUser(newUser);
    return newUser;
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