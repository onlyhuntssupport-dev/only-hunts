export type UserRole = 'HUNTER' | 'OUTFITTER' | 'ADMIN';

export interface AppUser {
  uid: string;
  email: string | null;
  role: UserRole;
  displayName: string | null;
  photoURL: string | null;
}
