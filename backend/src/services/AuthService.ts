import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { LoginDto, RegisterDto } from '../dto/LoginDto';
import { User } from '../models/User';
import { IUserRepository } from '../repositories/UserRepository';

export class AuthService {
  constructor(private readonly userRepository: IUserRepository) {}

  async register({ fullName, username, email, password, chatId, telegramUsername }: RegisterDto): Promise<{ user: User; token: string }> {
    if (await this.userRepository.isEmailInUse(email) || await this.userRepository.isUsernameInUse(username)) {
      throw new Error('User already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const createdUser = await this.userRepository.create({
      fullName,
      username,
      email,
      passwordHash,
      role: 'viewer',
      status: 'active',
      chatId,
      telegramUsername,
    });

    const token = this.generateToken(createdUser);
    return { user: createdUser, token };
  }

  async login({ identifier, password }: LoginDto): Promise<{ user: User; token: string }> {
    const user = await this.userRepository.findByIdentifier(identifier);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (user.status !== 'active') {
      throw new Error('Account is inactive');
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      throw new Error('Invalid credentials');
    }

    return { user, token: this.generateToken(user) };
  }

  getUserById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  private generateToken(user: User): string {
    const signOptions: SignOptions = {
      expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
    };

    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      env.jwtSecret,
      signOptions,
    );
  }
}
