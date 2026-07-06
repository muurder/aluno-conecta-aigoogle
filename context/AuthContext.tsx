import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { auth, db, storage } from '@/firebase';
import { useTheme } from './ThemeContext';
import firebase from 'firebase/compat/app';
import type { User, Post, Comment, Reaction, NotificationType } from '../types';

type QuerySnapshot = firebase.firestore.QuerySnapshot;
type Timestamp = firebase.firestore.Timestamp;
type AuthUser = firebase.User;

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

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (email: string, pass:string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: Omit<User, 'uid' | 'email'>, email: string, pass: string, photoFile?: File) => Promise<void>;
  updateUser: (uid: string, dataToUpdate: Partial<User>, photoFile?: File) => Promise<void>;
  changePassword: (newPass: string) => Promise<void>;
  getAllUsers: () => Promise<User[]>;
  deleteUser: (uid: string) => Promise<void>;
  getPosts: () => Promise<Post[]>;
  createPost: (content: string, imageFile?: File) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<Comment>;
  deleteComment: (postId: string, commentId: string) => Promise<void>;
  toggleReaction: (postId: string, emoji: string) => Promise<void>;
  createNotification: (message: string, type: NotificationType) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isInitialSnapshot = useRef(true);
  const { setCurrentThemeById, resetToDefaultTheme } = useTheme();

  const ensureProfileExists = async (authUser: AuthUser) => {
    if (!authUser) return;
    const userDocRef = db.collection('profiles').doc(authUser.uid);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      const fullName = authUser.displayName || authUser.email?.split('@')[0] || "Aluno Google";
      const email = authUser.email || "";
      const institutionalLogin = fullName
        .trim()
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '.');
      const randomPart = Math.floor(10000000 + Math.random() * 90000000).toString();
      const digit = Math.floor(Math.random() * 10);
      const rgm = `${randomPart}-${digit}`;
      const today = new Date();
      const futureDate = new Date();
      futureDate.setFullYear(today.getFullYear() + 1);
      const month = (futureDate.getMonth() + 1).toString().padStart(2, '0');
      const year = futureDate.getFullYear();
      const validity = `${month}/${year}`;
      const defaultProfile = {
        fullName,
        email,
        institutionalLogin,
        rgm,
        university: "São Judas" as const,
        course: "Ciência da Computação",
        campus: "Mooca",
        validity,
        photo: authUser.photoURL || null,
        status: 'pending' as const,
        isAdmin: false,
        theme: 'saojudas',
        themeSource: 'auto' as const,
        createdAt: new Date().toISOString(),
        lastAccess: new Date().toISOString(),
        accessCount: 1,
        gender: 'outro' as const,
      };
      await userDocRef.set(defaultProfile);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      if (authUser) {
        const userDocRef = db.collection('profiles').doc(authUser.uid);
        const userDoc = await userDocRef.get();

        if (userDoc.exists) {
          const userData = { uid: userDoc.id, ...(userDoc.data() as object) } as User;
          setUser(userData);
          if (userData.theme) {
            setCurrentThemeById(userData.theme);
          } else {
            resetToDefaultTheme();
          }
          const sessionLoggedKey = `session_logged_${authUser.uid}`;
          if (!sessionStorage.getItem(sessionLoggedKey)) {
            sessionStorage.setItem(sessionLoggedKey, 'true');
            userDocRef.update({
              lastAccess: new Date().toISOString(),
              accessCount: firebase.firestore.FieldValue.increment(1)
            }).catch(err => console.error("Error updating access logs:", err));
          }
        } else {
          await ensureProfileExists(authUser);
          const refreshedDoc = await userDocRef.get();
          if (refreshedDoc.exists) {
            const userData = { uid: refreshedDoc.id, ...(refreshedDoc.data() as object) } as User;
            setUser(userData);
            setCurrentThemeById('saojudas');
          } else {
            setUser(null);
            resetToDefaultTheme();
          }
        }
      } else {
        setUser(null);
        resetToDefaultTheme();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setCurrentThemeById, resetToDefaultTheme]);

  useEffect(() => {
    let isActive = true;
    const handleRedirect = async () => {
      try {
        const result = await auth.getRedirectResult();
        if (!isActive) return;
        const authUser = result.user;
        if (authUser) {
          await ensureProfileExists(authUser);
        }
      } catch (err) {
        console.error("Erro no redirect do Google:", err);
      }
    };
    handleRedirect();
    return () => { isActive = false; };
  }, []);

  useEffect(() => {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }

      const q = db.collection("profiles").where("status", "==", "pending");
      const unsubscribe = q.onSnapshot((snapshot: QuerySnapshot) => {
        if (isInitialSnapshot.current) {
          isInitialSnapshot.current = false;
          return;
        }

        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const newUser = change.doc.data() as User;
            
            if (Notification.permission === 'granted') {
              new Notification("Nova solicitação de cadastro", {
                body: `${newUser.fullName} acabou de se cadastrar e aguarda aprovação.`,
                icon: newUser.photo || '/vite.svg',
              });
            }
          }
        });
      });

      return () => {
        unsubscribe();
        isInitialSnapshot.current = true;
      };
  }, [user]);

  const login = async (email: string, pass: string) => {
    await auth.signInWithEmailAndPassword(email, pass);
  };

  const loginWithGoogle = async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    const isCapacitor = typeof window !== 'undefined' && !!(window as any).Capacitor;

    if (isCapacitor) {
      await auth.signInWithRedirect(provider);
    } else {
      try {
        await auth.signInWithPopup(provider);
      } catch (err) {
        console.error("Google popup error:", err);
        if ((err as any)?.code === 'auth/popup-blocked') {
          await auth.signInWithRedirect(provider);
          return;
        }
        throw err;
      }
    }
  };

  const logout = async () => {
    await auth.signOut();
  };

  const register = async (userData: Omit<User, 'uid' | 'email'>, email: string, pass: string, photoFile?: File): Promise<void> => {
      const userCredential = await auth.createUserWithEmailAndPassword(email, pass);
      const authUser = userCredential.user;
      if (!authUser) throw new Error("User creation failed.");

      let photoURL: string | null = null;
      if (photoFile) {
          try {
              const compressedPhoto = await compressImage(photoFile, { maxWidth: 500, maxHeight: 500, quality: 0.6 });
              const photoRef = storage.ref(`profile-photos/${authUser.uid}/profile-photo`);
              const snapshot = await photoRef.put(compressedPhoto, { contentType: 'image/jpeg' });
              photoURL = await snapshot.ref.getDownloadURL();
          } catch (err) {
              console.error("Profile picture compression failed, uploading raw file instead:", err);
              const photoRef = storage.ref(`profile-photos/${authUser.uid}/profile-photo`);
              const snapshot = await photoRef.put(photoFile, { contentType: photoFile.type });
              photoURL = await snapshot.ref.getDownloadURL();
          }
      }

      const { photo, ...restOfUserData } = userData;

      const finalUserData: Partial<User> = {
          ...restOfUserData,
          email: authUser.email!,
          status: 'pending' as const,
          isAdmin: false,
          photo: photoURL,
          createdAt: new Date().toISOString(),
          lastAccess: new Date().toISOString(),
          accessCount: 1,
          gender: 'outro' as const,
      };
      
      await db.collection('profiles').doc(authUser.uid).set(finalUserData);
  };
  
  const updateUser = async (uid: string, dataToUpdate: Partial<User>, photoFile?: File) => {
      if (!uid) throw new Error("User UID is required to update.");

      const finalUpdateData = { ...dataToUpdate };
      
      // Remove uid from the update payload if it exists, as it's the doc key.
      delete finalUpdateData.uid;

      if (photoFile) {
          try {
              const compressedPhoto = await compressImage(photoFile, { maxWidth: 500, maxHeight: 500, quality: 0.6 });
              const photoRef = storage.ref(`profile-photos/${uid}/profile-photo`);
              const snapshot = await photoRef.put(compressedPhoto, { contentType: 'image/jpeg' });
              finalUpdateData.photo = await snapshot.ref.getDownloadURL();
          } catch (err) {
              console.error("Profile picture update compression failed, uploading raw instead:", err);
              const photoRef = storage.ref(`profile-photos/${uid}/profile-photo`);
              const snapshot = await photoRef.put(photoFile, { contentType: photoFile.type });
              finalUpdateData.photo = await snapshot.ref.getDownloadURL();
          }
      }
      
      const userDocRef = db.collection('profiles').doc(uid);
      await userDocRef.update(finalUpdateData);

      if (user?.uid === uid) {
          const updatedUserDoc = await userDocRef.get();
          if (updatedUserDoc.exists) {
              const updatedUserData = { uid: updatedUserDoc.id, ...updatedUserDoc.data() } as User;
              setUser(updatedUserData);
              if (updatedUserData.theme) {
                setCurrentThemeById(updatedUserData.theme);
              }
          }
      }
  };

  const changePassword = async (newPass: string) => {
    const authUser = auth.currentUser;
    if (!authUser) throw new Error("User not authenticated.");
    await authUser.updatePassword(newPass);
  };

  const getAllUsers = async (): Promise<User[]> => {
      const usersCol = db.collection('profiles');
      const userSnapshot = await usersCol.get();
      return userSnapshot.docs.map(doc => ({ uid: doc.id, ...(doc.data() as object) } as User));
  };
  
  const deleteUser = async (uid: string) => {
      await db.collection('profiles').doc(uid).delete();
  };

  const getPosts = async (): Promise<Post[]> => {
      const postsQuery = db.collection('posts').orderBy('created_at', 'desc');
      const postSnapshots = await postsQuery.get();
      
      const posts: Post[] = [];
      for (const postDoc of postSnapshots.docs) {
        const postData = postDoc.data() as { author_uid: string; created_at: Timestamp; [key: string]: any };
        const authorDoc = await db.collection('profiles').doc(postData.author_uid).get();
        const authorData = authorDoc.exists ? authorDoc.data() as Pick<User, 'fullName' | 'photo'> : { fullName: 'Usuário Deletado', photo: null };

        const commentsQuery = db.collection(`posts/${postDoc.id}/comments`).orderBy('created_at', 'asc');
        const commentsSnapshot = await commentsQuery.get();
        const comments: Comment[] = [];
        for(const commentDoc of commentsSnapshot.docs) {
            const commentData = commentDoc.data() as { author_uid: string; [key: string]: any };
            const commentAuthorDoc = await db.collection('profiles').doc(commentData.author_uid).get();
            const commentAuthorData = commentAuthorDoc.exists ? commentAuthorDoc.data() as Pick<User, 'fullName' | 'photo'> : { fullName: 'Usuário Deletado', photo: null };
            comments.push({
                id: commentDoc.id,
                ...(commentData as object),
                author: { fullName: commentAuthorData.fullName, photo: commentAuthorData.photo }
            } as Comment);
        }

        const reactionsSnapshot = await db.collection(`posts/${postDoc.id}/reactions`).get();
        const reactions = reactionsSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) } as Reaction));

        posts.push({
          id: postDoc.id,
          ...(postData as object),
          created_at: (postData.created_at as Timestamp).toDate().toISOString(),
          author: { fullName: authorData.fullName, photo: authorData.photo },
          comments,
          reactions
        } as Post);
      }
      return posts;
  };

  const createPost = async (content: string, imageFile?: File): Promise<void> => {
    if (!user) throw new Error("User not authenticated");
    let image_url: string | null = null;
    if (imageFile) {
      try {
        const compressedPostImg = await compressImage(imageFile, { maxWidth: 800, maxHeight: 800, quality: 0.6 });
        const imageRef = storage.ref(`posts/${Date.now()}_${imageFile.name.split('.').slice(0, -1).join('.')}.jpeg`);
        const snapshot = await imageRef.put(compressedPostImg, { contentType: 'image/jpeg' });
        image_url = await snapshot.ref.getDownloadURL();
      } catch (err) {
        console.error("Post image compression failed, uploading raw instead:", err);
        const imageRef = storage.ref(`posts/${Date.now()}_${imageFile.name}`);
        const snapshot = await photoRef.put(imageFile, { contentType: imageFile.type });
        image_url = await snapshot.ref.getDownloadURL();
      }
    }
    
    await db.collection('posts').add({
      author_uid: user.uid,
      content,
      image_url,
      created_at: firebase.firestore.FieldValue.serverTimestamp()
    });
  };

  const deletePost = async (postId: string): Promise<void> => {
      const postDocRef = db.collection('posts').doc(postId);
      const postDoc = await postDocRef.get();
      if (!postDoc.exists) return;

      const imageUrl = (postDoc.data() as { image_url?: string | null }).image_url;
      if (imageUrl) {
          try {
              const imageRef = storage.refFromURL(imageUrl);
              await imageRef.delete();
          } catch (error) {
              console.error("Error deleting post image:", error);
          }
      }

      const batch = db.batch();
      const commentsRef = db.collection(`posts/${postId}/comments`);
      const reactionsRef = db.collection(`posts/${postId}/reactions`);
      
      const commentsSnapshot = await commentsRef.get();
      commentsSnapshot.forEach(doc => batch.delete(doc.ref));

      const reactionsSnapshot = await reactionsRef.get();
      reactionsSnapshot.forEach(doc => batch.delete(doc.ref));
      
      await batch.commit();

      await postDocRef.delete();
  };
  
  const addComment = async (postId: string, content: string): Promise<Comment> => {
      if (!user) throw new Error("User not authenticated");
      const commentData = {
          post_id: postId,
          author_uid: user.uid,
          content,
          created_at: firebase.firestore.FieldValue.serverTimestamp(),
      };
      const docRef = await db.collection(`posts/${postId}/comments`).add(commentData);
      
      return {
          id: docRef.id,
          ...commentData,
          created_at: new Date().toISOString(),
          author: { fullName: user.fullName, photo: user.photo },
      } as Comment;
  };
  
  const deleteComment = async (postId: string, commentId: string): Promise<void> => {
      await db.collection(`posts/${postId}/comments`).doc(commentId).delete();
  };
  
  const toggleReaction = async (postId: string, emoji: string): Promise<void> => {
      if (!user) throw new Error("User not authenticated");
      const reactionRef = db.collection(`posts/${postId}/reactions`).doc(user.uid);
      const reactionDoc = await reactionRef.get();

      if (reactionDoc.exists && (reactionDoc.data() as { emoji: string }).emoji === emoji) {
          await reactionRef.delete();
      } else {
          await reactionRef.set({
              post_id: postId,
              user_uid: user.uid,
              emoji: emoji
          });
      }
  };

  const createNotification = async (message: string, type: NotificationType) => {
      const notificationsRef = db.collection('notifications');
      await notificationsRef.add({
          message,
          type,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          active: true,
      });
  };
  
  const deleteNotification = async (notificationId: string) => {
      await db.collection('notifications').doc(notificationId).delete();
  };

  const value = {
    isAuthenticated: !!user,
    user,
    loading,
    login,
    loginWithGoogle,
    logout,
    register,
    updateUser,
    changePassword,
    getAllUsers,
    deleteUser,
    getPosts,
    createPost,
    deletePost,
    addComment,
    deleteComment,
    toggleReaction,
    createNotification,
    deleteNotification,
  };
  
  return (
    <AuthContext.Provider value={value}>
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
