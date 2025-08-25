
export const universityNames = [
  "Anhanguera", "Anhembi Morumbi", "Estacio", "Fiesp", "FMU", "São Judas", 
  "Unicid", "Unicsul", "Unifesp", "USP"
] as const;

export type UniversityName = typeof universityNames[number];

export type UserStatus = 'pending' | 'approved';

export interface User {
  uid: string; // Firebase Authentication User ID
  login: string;
  rgm: string;
  fullName: string;
  email: string;
  university: UniversityName;
  course: string;
  campus: string;
  validity: string;
  photo: string | null;
  status: UserStatus;
  isAdmin?: boolean;
}