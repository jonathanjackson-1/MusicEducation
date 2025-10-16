import { Injectable } from '@nestjs/common';
import { AuthUser } from '../interfaces/auth-user.interface';
import { UserRole } from '../interfaces/user-role.enum';

export enum PolicyAction {
  Manage = 'manage',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
}

@Injectable()
export class PolicyService {
  can(user: AuthUser, action: PolicyAction, subject: string, resourceOwnerId?: string) {
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    if (subject === 'Assignment' && action === PolicyAction.Read) {
      if (user.role === UserRole.STUDENT) {
        return user.id === resourceOwnerId;
      }
      return true;
    }

    if (subject === 'Assignment' && action !== PolicyAction.Read) {
      return user.role === UserRole.ADMIN || user.role === UserRole.EDUCATOR;
    }

    if (subject === 'User') {
      if (user.role === UserRole.ADMIN) {
        return true;
      }
      return user.id === resourceOwnerId;
    }

    if (subject === 'PracticeLog') {
      if (user.role === UserRole.STUDENT || user.role === UserRole.PARENT) {
        return user.id === resourceOwnerId;
      }
      if (user.role === UserRole.EDUCATOR) {
        return action !== PolicyAction.Delete;
      }
    }

    if (subject === 'Lesson') {
      if (user.role === UserRole.EDUCATOR || user.role === UserRole.ADMIN) {
        return true;
      }
      if (user.role === UserRole.STUDENT) {
        return action === PolicyAction.Read && user.id === resourceOwnerId;
      }
    }

    if (subject === 'BookingRequest') {
      if (user.role === UserRole.ADMIN || user.role === UserRole.EDUCATOR) {
        return true;
      }
      return user.id === resourceOwnerId;
    }

    return false;
  }
}
