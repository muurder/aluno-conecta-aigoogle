
import React, { createContext, useState, useContext, useEffect } from 'https://esm.sh/react@18.2.0';
import type { User } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (login: string, pass: string) => boolean;
  logout: () => void;
  register: (userData: User) => void;
  updateUser: (userData: User, originalLogin: string) => void;
  getAllUsers: () => User[];
  deleteUser: (login: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const storedUsers = JSON.parse(localStorage.getItem('users') || '{}');
      if (!storedUsers['admin']) {
        storedUsers['admin'] = {
            login: 'admin',
            password: 'admin',
            fullName: 'Administrator',
            email: 'admin@portal.com',
            university: 'Anhanguera',
            course: 'System Admin',
            campus: 'Santana',
            validity: '12/2099',
            photo: null,
            status: 'approved',
            isAdmin: true
        };
        localStorage.setItem('users', JSON.stringify(storedUsers));
      }
    } catch (error) {
        console.error("Failed to initialize admin user", error);
    }

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
  
  const updateUser = (newUserData: User, originalLogin: string) => {
    try {
        const storedUsers = JSON.parse(localStorage.getItem('users') || '{}');
        const oldUserData = storedUsers[originalLogin];

        // Preserve password if not provided in new data
        if (!newUserData.password && oldUserData?.password) {
            newUserData.password = oldUserData.password;
        }

        if (originalLogin !== newUserData.login && storedUsers[originalLogin]) {
            delete storedUsers[originalLogin];
        }
        storedUsers[newUserData.login] = newUserData;
        localStorage.setItem('users', JSON.stringify(storedUsers));
        
        if (user?.login === originalLogin) {
            setUser(newUserData);
            localStorage.setItem('user', JSON.stringify(newUserData));
        }
    } catch(error) {
        console.error("Failed to update user", error);
    }
  };

  const getAllUsers = (): User[] => {
    try {
        const storedUsers = JSON.parse(localStorage.getItem('users') || '{}');
        return Object.values(storedUsers);
    } catch (error) {
        console.error("Failed to get all users", error);
        return [];
    }
  };

  const deleteUser = (login: string) => {
    try {
        const storedUsers = JSON.parse(localStorage.getItem('users') || '{}');
        delete storedUsers[login];
        localStorage.setItem('users', JSON.stringify(storedUsers));
    } catch (error) {
        console.error("Failed to delete user", error);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, login, logout, register, updateUser, getAllUsers, deleteUser }}>
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