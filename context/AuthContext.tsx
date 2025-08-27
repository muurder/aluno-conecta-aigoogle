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
    Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
        const userDocRef = doc(db, 'profile', authUser.uid);
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

      const profileData: Omit<User, 'uid'> = {
        ...userData,
        email: authUser.email!,
        isAdmin: false,
        status: 'pending',
      };
      
      await setDoc(doc(db, 'profile', authUser.uid), profileData);
  };
  
  const updateUser = async (newUserData: User) => {
      const userDocRef = doc(db, 'profile', newUserData.uid);
      await updateDoc(userDocRef, newUserData);

      if (user?.uid === newUserData.uid) {
          setUser(newUserData);
      }
  };

  const getAllUsers = async (): Promise<User[]> => {
    const usersCollection = collection(db, 'profile');
    const userSnapshot = await getDocs(usersCollection);
    return userSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
  };

  const deleteUser = async (uid: string) => {
    // Note: This only deletes the user's profile from Firestore.
    // Deleting the actual Firebase Auth user requires admin privileges via a backend function.
    await deleteDoc(doc(db, 'profile', uid));
  };

  // Helper to fetch a single user profile
  const getUserProfile = async (uid: string): Promise<Pick<User, 'fullName' | 'photo'>> => {
      const userDoc = await getDoc(doc(db, 'profile', uid));
      if(userDoc.exists()){
          const data = userDoc.data();
          return { fullName: data.fullName, photo: data.photo };
      }
      return { fullName: 'Usuário Desconhecido', photo: null };
  }

  const getPosts = async (): Promise<Post[]> => {
      const postsQuery = query(collection(db, 'posts'), orderBy('created_at', 'desc'));
      const postsSnapshot = await getDocs(postsQuery);
      
      const posts: Post[] = await Promise.all(postsSnapshot.docs.map(async (postDoc) => {
          const postData = postDoc.data();
          
          // Fetch author
          const author = await getUserProfile(postData.author_uid);

          // Fetch comments
          const commentsQuery = query(collection(db, 'posts', postDoc.id, 'comments'), orderBy('created_at', 'asc'));
          const commentsSnapshot = await getDocs(commentsQuery);
          const comments: Comment[] = await Promise.all(commentsSnapshot.docs.map(async (commentDoc) => {
              const commentData = commentDoc.data();
              const commentAuthor = await getUserProfile(commentData.author_uid);
              return {
                  id: commentDoc.id,
                  author: commentAuthor,
                  ...commentData
              } as Comment;
          }));

          // Fetch reactions
          const reactionsSnapshot = await getDocs(collection(db, 'posts', postDoc.id, 'reactions'));
          const reactions: Reaction[] = reactionsSnapshot.docs.map(reactionDoc => ({ id: reactionDoc.id, ...reactionDoc.data() } as Reaction));
          
          // Convert Firestore Timestamp to string for consistency
          const createdAt = (postData.created_at as Timestamp)?.toDate().toISOString() || new Date().toISOString();

          return {
              id: postDoc.id,
              author,
              comments,
              reactions,
              ...postData,
              created_at: createdAt
          } as Post;
      }));
      return posts;
  };

  const createPost = async (content: string, imageFile?: File) => {
    if (!user) throw new Error("User must be logged in to create a post.");

    let imageUrl: string | null = null;
    if (imageFile) {
      const fileName = `${user.uid}/${Date.now()}_${imageFile.name}`;
      const storageRef = ref(storage, `post_images/${fileName}`);
      await uploadBytes(storageRef, imageFile);
      imageUrl = await getDownloadURL(storageRef);
    }

    await addDoc(collection(db, 'posts'), {
        author_uid: user.uid,
        content,
        image_url: imageUrl,
        created_at: serverTimestamp(),
    });
  };

  const deletePost = async (postId: string) => {
    await deleteDoc(doc(db, 'posts', postId));
  };

  const addComment = async (postId: string, content: string): Promise<Comment> => {
    if (!user) throw new Error("User must be logged in to comment.");
    
    const commentData = { 
        post_id: postId, 
        author_uid: user.uid, 
        content,
        created_at: serverTimestamp() 
    };

    const docRef = await addDoc(collection(db, 'posts', postId, 'comments'), commentData);
    
    // Return a complete comment object as expected by the UI
    return {
        id: docRef.id,
        ...commentData,
        created_at: new Date().toISOString(),
        author: { fullName: user.fullName, photo: user.photo }
    };
  };

  const deleteComment = async (postId: string, commentId: string) => {
     await deleteDoc(doc(db, 'posts', postId, 'comments', commentId));
  };

  const toggleReaction = async (postId: string, emoji: string) => {
    if (!user) throw new Error("User must be logged in to react.");
    
    const reactionRef = doc(db, 'posts', postId, 'reactions', user.uid);
    const reactionSnap = await getDoc(reactionRef);

    if (reactionSnap.exists() && reactionSnap.data().emoji === emoji) {
      // User is removing their existing reaction
      await deleteDoc(reactionRef);
    } else {
      // User is adding a new reaction or changing their existing one
      await setDoc(reactionRef, {
        post_id: postId,
        user_uid: user.uid,
        emoji: emoji,
      });
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, loading, login, logout, register, updateUser, getAllUsers, deleteUser, getPosts, createPost, deletePost, addComment, deleteComment, toggleReaction }}>
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