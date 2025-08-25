
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import type { User } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (login: string, pass: string) => boolean;
  logout: () => void;
  register: (userData: User) => void;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('user');
    }
  }, []);

  const login = (login: string, pass: string): boolean => {
    try {
      const storedUsers = JSON.parse(localStorage.getItem('users') || '{}');
      const userData = storedUsers[login];
      if (userData && userData.password === pass) {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to login", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const register = (userData: User) => {
    try {
      const storedUsers = JSON.parse(localStorage.getItem('users') || '{}');
      storedUsers[userData.login] = userData;
      localStorage.setItem('users', JSON.stringify(storedUsers));
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
       console.error("Failed to register", error);
    }
  };
  
  const updateUser = useCallback((userData: User) => {
    try {
        const storedUsers = JSON.parse(localStorage.getItem('users') || '{}');
        const currentUserLogin = user?.login;

        if(currentUserLogin && currentUserLogin !== userData.login) {
            delete storedUsers[currentUserLogin];
        }

        storedUsers[userData.login] = userData;
        localStorage.setItem('users', JSON.stringify(storedUsers));
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    } catch(error) {
        console.error("Failed to update user", error);
    }
  }, [user]);


  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, login, logout, register, updateUser }}>
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
