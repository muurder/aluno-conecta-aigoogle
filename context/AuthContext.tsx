import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db, storage } from '../firebase';
import { 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut,
    type User as AuthUser 
} from 'firebase/auth';
import { 
    doc, 
    getDoc, 
    setDoc,
    updateDoc,
    collection,
    getDocs,
    deleteDoc,
    addDoc,
    query,
    orderBy,
    serverTimestamp,
    Timestamp,
    writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import type { User, Post, Comment, Reaction } from '../types';

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
  // Mural / Feed functions
  getPosts: () => Promise<Post[]>;
  createPost: (content: string, imageFile?: File) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<Comment>;
  deleteComment: (postId: string, commentId: string) => Promise<void>;
  toggleReaction: (postId: string, emoji: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        const userDocRef = doc(db, 'profiles', authUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setUser({ uid: userDoc.id, ...userDoc.data() } as User);
        } else {
          // Profile doesn't exist, maybe registration is incomplete
          console.error("User is authenticated, but no profile found in Firestore.");
          setUser(null);
        }
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

  const register = async (userData: Omit<User, 'uid' | 'email'>, email: string, pass: string): Promise<void> => {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const authUser = userCredential.user;

      // Ensure that status is 'pending' and isAdmin is false for any new registration
      const finalUserData = {
          ...userData,
          email: authUser.email!,
          status: 'pending' as const,
          isAdmin: false,
      };

      // Create a document in 'profiles' collection with the user's UID
      await setDoc(doc(db, 'profiles', authUser.uid), finalUserData);
  };
  
  const updateUser = async (newUserData: User) => {
    if (!newUserData.uid) throw new Error("User UID is required to update.");
    
    let photoURL = newUserData.photo;

    // Check if photo is a new base64 upload
    if (photoURL && photoURL.startsWith('data:image')) {
        const storageRef = ref(storage, `profile_photos/${newUserData.uid}`);
        const response = await fetch(photoURL);
        const blob = await response.blob();
        const snapshot = await uploadBytes(storageRef, blob);
        photoURL = await getDownloadURL(snapshot.ref);
    }
    
    const userDocRef = doc(db, 'profiles', newUserData.uid);
    await updateDoc(userDocRef, { ...newUserData, photo: photoURL });

    // Update local state if it's the current user
    if (user?.uid === newUserData.uid) {
        setUser({ ...newUserData, photo: photoURL });
    }
  };

  const getAllUsers = async (): Promise<User[]> => {
    const usersCol = collection(db, 'profiles');
    const userSnapshot = await getDocs(usersCol);
    return userSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
  };
  
  const deleteUser = async (uid: string) => {
    // This is a simplified delete. For a production app, you'd use a Cloud Function
    // to delete the user from Firebase Auth and also handle cascading deletes of their content.
    await deleteDoc(doc(db, 'profiles', uid));
  };

  const getPosts = async (): Promise<Post[]> => {
    const postsQuery = query(collection(db, 'posts'), orderBy('created_at', 'desc'));
    const postSnapshots = await getDocs(postsQuery);
    
    const posts: Post[] = [];
    for (const postDoc of postSnapshots.docs) {
      const postData = postDoc.data();
      const authorDoc = await getDoc(doc(db, 'profiles', postData.author_uid));
      const authorData = authorDoc.exists() ? authorDoc.data() : { fullName: 'Usuário Deletado', photo: null };

      // Fetch comments
      const commentsQuery = query(collection(db, `posts/${postDoc.id}/comments`), orderBy('created_at', 'asc'));
      const commentsSnapshot = await getDocs(commentsQuery);
      const comments: Comment[] = [];
      for(const commentDoc of commentsSnapshot.docs) {
          const commentData = commentDoc.data();
          const commentAuthorDoc = await getDoc(doc(db, 'profiles', commentData.author_uid));
          const commentAuthorData = commentAuthorDoc.exists() ? commentAuthorDoc.data() : { fullName: 'Usuário Deletado', photo: null };
          comments.push({
              id: commentDoc.id,
              ...commentData,
              author: { fullName: commentAuthorData.fullName, photo: commentAuthorData.photo }
          } as Comment);
      }

      // Fetch reactions
      const reactionsSnapshot = await getDocs(collection(db, `posts/${postDoc.id}/reactions`));
      const reactions = reactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reaction));

      posts.push({
        id: postDoc.id,
        ...postData,
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
      const imageRef = ref(storage, `posts/${Date.now()}_${imageFile.name}`);
      const snapshot = await uploadBytes(imageRef, imageFile);
      image_url = await getDownloadURL(snapshot.ref);
    }
    
    await addDoc(collection(db, 'posts'), {
      author_uid: user.uid,
      content,
      image_url,
      created_at: serverTimestamp()
    });
  };

  const deletePost = async (postId: string): Promise<void> => {
      const postDocRef = doc(db, 'posts', postId);
      const postDoc = await getDoc(postDocRef);
      if (!postDoc.exists()) return;

      const imageUrl = postDoc.data().image_url;
      if (imageUrl) {
          try {
              const imageRef = ref(storage, imageUrl);
              await deleteObject(imageRef);
          } catch (error) {
              console.error("Error deleting post image:", error);
          }
      }

      const batch = writeBatch(db);
      const commentsRef = collection(db, `posts/${postId}/comments`);
      const reactionsRef = collection(db, `posts/${postId}/reactions`);
      
      const commentsSnapshot = await getDocs(commentsRef);
      commentsSnapshot.forEach(doc => batch.delete(doc.ref));

      const reactionsSnapshot = await getDocs(reactionsRef);
      reactionsSnapshot.forEach(doc => batch.delete(doc.ref));
      
      await batch.commit();

      await deleteDoc(postDocRef);
  };
  
  const addComment = async (postId: string, content: string): Promise<Comment> => {
      if (!user) throw new Error("User not authenticated");
      const commentData = {
          post_id: postId,
          author_uid: user.uid,
          content,
          created_at: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, `posts/${postId}/comments`), commentData);
      
      return {
          id: docRef.id,
          ...commentData,
          created_at: new Date().toISOString(),
          author: { fullName: user.fullName, photo: user.photo },
      } as Comment;
  };
  
  const deleteComment = async (postId: string, commentId: string): Promise<void> => {
      await deleteDoc(doc(db, `posts/${postId}/comments`, commentId));
  };
  
  const toggleReaction = async (postId: string, emoji: string): Promise<void> => {
      if (!user) throw new Error("User not authenticated");
      const reactionRef = doc(db, `posts/${postId}/reactions`, user.uid);
      const reactionDoc = await getDoc(reactionRef);

      if (reactionDoc.exists() && reactionDoc.data().emoji === emoji) {
          await deleteDoc(reactionRef);
      } else {
          await setDoc(reactionRef, {
              post_id: postId,
              user_uid: user.uid,
              emoji: emoji
          });
      }
  };

  const value = {
    isAuthenticated: !!user,
    user,
    loading,
    login,
    logout,
    register,
    updateUser,
    getAllUsers,
    deleteUser,
    getPosts,
    createPost,
    deletePost,
    addComment,
    deleteComment,
    toggleReaction
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