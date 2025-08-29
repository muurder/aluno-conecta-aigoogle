

import type firebase from 'firebase/compat/app';


export const universityNames = [
  "Anhanguera", "Anhembi Morumbi", "Estacio", "Fiesp", "FMU", "São Judas", 
  "Unicid", "Unicsul", "Unifesp", "USP"
] as const;

export type UniversityName = typeof universityNames[number];

export type UserStatus = 'pending' | 'approved';

export interface User {
  uid: string; // Firebase Authentication User ID
  institutionalLogin: string;
  rgm: string;
  fullName: string;
  email: string; // User's real email for authentication
  university: UniversityName;
  course: string;
  campus: string;
  validity: string;
  photo: string | null;
  status: UserStatus;
  isAdmin?: boolean;
  theme?: string; // e.g., 'default', 'unicsul', etc.
  themeSource?: 'auto' | 'user' | 'admin' | 'system';
}

export interface Comment {
  id: string;
  post_id: string;
  author_uid: string;
  content: string;
  created_at: string;
  author: Pick<User, 'fullName' | 'photo'>;
}

export interface Reaction {
  id: string;
  post_id: string;
  user_uid: string;
  emoji: string;
}

export interface Post {
  id: string;
  author_uid: string;
  content: string;
  image_url: string | null;
  created_at: string;
  author: Pick<User, 'fullName' | 'photo'>;
  comments: Comment[];
  reactions: Reaction[];
}

export type NotificationType = 'info' | 'warning' | 'urgent';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  createdAt: { seconds: number; nanoseconds: number; }; // Firestore Timestamp
  active: boolean;
  read?: boolean;
  dismissed?: boolean;
}