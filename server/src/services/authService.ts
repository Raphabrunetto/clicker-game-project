import { userRepository } from '../repositories/userRepository';
import bcrypt from 'bcryptjs';

export interface RegisterDTO {
  email: string;
  password: string;
  username?: string | undefined;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export const authService = {
  register: async ({ email, password, username }: RegisterDTO) => {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      return { ok: false as const, reason: 'EMAIL_IN_USE' };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await userRepository.createWithInitialGameState({
      email,
      // Only pass username if defined (exactOptionalPropertyTypes)
      ...(username !== undefined ? { username } : {}),
      passwordHash,
    } as any);

    return { ok: true as const, user };
  },

  validateCredentials: async ({ email, password }: LoginDTO) => {
    const user = await userRepository.findByEmail(email);
    if (!user) return { ok: false as const };

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return { ok: false as const };

    return { ok: true as const, user };
  },
};
