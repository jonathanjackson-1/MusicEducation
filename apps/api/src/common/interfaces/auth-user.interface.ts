import { UserRole } from './user-role.enum';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  studioId: string;
  totpVerified?: boolean;
}
