import type { User } from '../domain/model';

export function getUserIdentityKey(user: Pick<User, 'backendId' | 'email' | 'id'>) {
  return user.backendId || user.email.toLowerCase() || user.id;
}
