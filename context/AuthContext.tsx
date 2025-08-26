import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db, storage } from '../firebase';
import type { User, Post, Comment, Reaction } from '../types';
import { 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut,
    User as FirebaseAuthUser
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
import { 
    ref, 
    uploadString, 
    getDownloadURL, 
    deleteObject,
    uploadBytes
} from 'firebase/storage';

const mapFirestoreDocToUser = (docData: any, uid: string, authUser: FirebaseAuthUser): User => ({
    uid,
    email: authUser.email!,
    institutionalLogin: docData.institutionalLogin,
    rgm: docData.rgm,
    fullName: docData.fullName,
    university: docData.university,
    course: docData.course,
    campus: docData.campus,
    validity: docData.validity,
    photo: docData.photo,
    status: docData.status,
    isAdmin: docData.isAdmin || false,
});

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  profileError: string | null;
  login: (email: string, pass:string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: Omit<User, 'uid' | 'email'>, email: string, pass: string) => Promise<void>;
  updateUser: (newUserData: User) => Promise<void>;
  getAllUsers: () => Promise<User[]>;
  deleteUser: (uid: string) => Promise<void>;
  getPosts: () => Promise<Post[]>;
  createPost: (content: string, imageFile?: File) => Promise<void>;
  deletePost: (postId: string, imageUrl?: string | null) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<Comment>;
  deleteComment: (postId: string, commentId: string) => Promise<void>;
  toggleReaction: (postId: string, emoji: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
        if (authUser) {
            const userDocRef = doc(db, 'users', authUser.uid);
            try {
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setUser(mapFirestoreDocToUser(userDoc.data(), authUser.uid, authUser));
                    setProfileError(null);
                } else {
                    console.error("User profile not found in Firestore for UID:", authUser.uid);
                    setProfileError('no_profile');
                    setUser(null);
                }
            } catch (error) {
                console.error("Error fetching user profile from Firestore:", error);
                setProfileError('generic');
                setUser(null);
            }
        } else {
            setUser(null);
            setProfileError(null);
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    setProfileError(null);
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const register = async (userData: Omit<User, 'uid' | 'email'>, email: string, pass: string) => {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const newUser = userCredential.user;
      
      let photoURL: string | null = null;
      if (userData.photo && userData.photo.startsWith('data:image')) {
          const storageRef = ref(storage, `profile_photos/${newUser.uid}`);
          await uploadString(storageRef, userData.photo, 'data_url');
          photoURL = await getDownloadURL(storageRef);
      }
      
      const userProfileData = {
        ...userData,
        photo: photoURL,
        email: email,
        isAdmin: false,
      };

      await setDoc(doc(db, 'users', newUser.uid), userProfileData);
  };
  
  const updateUser = async (newUserData: User) => {
      let finalUserData = { ...newUserData };

      if (newUserData.photo && newUserData.photo.startsWith('data:image')) {
          const storageRef = ref(storage, `profile_photos/${newUserData.uid}`);
          await uploadString(storageRef, newUserData.photo, 'data_url');
          const photoURL = await getDownloadURL(storageRef);
          finalUserData.photo = photoURL;
      }
      
      const userDocRef = doc(db, 'users', newUserData.uid);
      await updateDoc(userDocRef, finalUserData);
      
      if (user?.uid === newUserData.uid) {
          setUser(finalUserData);
      }
  };

  const getAllUsers = async (): Promise<User[]> => {
    const usersCollection = collection(db, 'users');
    const userSnapshot = await getDocs(usersCollection);
    return userSnapshot.docs.map(doc => ({
      ...doc.data(),
      uid: doc.id
    } as User));
  };

  const deleteUser = async (uid: string) => {
    const userDocRef = doc(db, 'users', uid);
    await deleteDoc(userDocRef);
  };

  const getPosts = async (): Promise<Post[]> => {
    const postsQuery = query(collection(db, 'posts'), orderBy('created_at', 'desc'));
    const postSnapshot = await getDocs(postsQuery);

    const posts: Post[] = await Promise.all(postSnapshot.docs.map(async (postDoc) => {
        const postData = postDoc.data();
        
        const authorDoc = await getDoc(doc(db, 'users', postData.author_uid));
        const author = authorDoc.exists() ? { fullName: authorDoc.data().fullName, photo: authorDoc.data().photo } : { fullName: 'Unknown', photo: null };

        const commentsQuery = query(collection(db, 'posts', postDoc.id, 'comments'), orderBy('created_at', 'asc'));
        const commentsSnapshot = await getDocs(commentsQuery);
        const comments: Comment[] = await Promise.all(commentsSnapshot.docs.map(async (commentDoc) => {
            const commentData = commentDoc.data();
            const commentAuthorDoc = await getDoc(doc(db, 'users', commentData.author_uid));
            const commentAuthor = commentAuthorDoc.exists() ? { fullName: commentAuthorDoc.data().fullName, photo: commentAuthorDoc.data().photo } : { fullName: 'Unknown', photo: null };
            return {
                id: commentDoc.id,
                ...commentData,
                created_at: (commentData.created_at as Timestamp)?.toDate().toISOString() ?? new Date().toISOString(),
                author: commentAuthor,
            } as Comment;
        }));

        const reactionsSnapshot = await getDocs(collection(db, 'posts', postDoc.id, 'reactions'));
        const reactions: Reaction[] = reactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reaction));

        return {
            id: postDoc.id,
            ...postData,
            created_at: (postData.created_at as Timestamp)?.toDate().toISOString() ?? new Date().toISOString(),
            author,
            comments,
            reactions,
        } as Post;
    }));

    return posts;
  };

  const createPost = async (content: string, imageFile?: File) => {
    if (!user) throw new Error("User must be logged in.");

    let imageUrl: string | null = null;
    if (imageFile) {
        const fileName = `post_images/${user.uid}/${Date.now()}_${imageFile.name}`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
    }
    
    await addDoc(collection(db, 'posts'), {
        author_uid: user.uid,
        content,
        image_url: imageUrl,
        created_at: serverTimestamp()
    });
  };

  const deletePost = async (postId: string, imageUrl?: string | null) => {
    const postRef = doc(db, 'posts', postId);
    await deleteDoc(postRef);

    if (imageUrl) {
        try {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);
        } catch (error) {
            console.error("Failed to delete post image from storage:", error);
        }
    }
  };

  const addComment = async (postId: string, content: string): Promise<Comment> => {
    if (!user) throw new Error("User must be logged in.");
    const commentData = {
        post_id: postId,
        author_uid: user.uid,
        content,
        created_at: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, 'posts', postId, 'comments'), commentData);
    
    return {
        ...commentData,
        id: docRef.id,
        created_at: new Date().toISOString(),
        author: { fullName: user.fullName, photo: user.photo }
    };
  };

  const deleteComment = async (postId: string, commentId: string) => {
    await deleteDoc(doc(db, 'posts', postId, 'comments', commentId));
  };
  
  const toggleReaction = async (postId: string, emoji: string) => {
    if (!user) throw new Error("User must be logged in.");
    
    const reactionRef = doc(db, 'posts', postId, 'reactions', user.uid);
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

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, loading, login, logout, register, updateUser, getAllUsers, deleteUser, profileError, getPosts, createPost, deletePost, addComment, deleteComment, toggleReaction }}>
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
