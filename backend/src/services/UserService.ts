import bcrypt from 'bcryptjs';
import { CreateUserInput, UpdateUserInput } from '../dto/UserDto';
import { User } from '../models/User';
import { IUserRepository } from '../repositories/UserRepository';

export class UserService {
  constructor(private readonly userRepository: IUserRepository) {}

  async getUsers(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async createUser(userData: CreateUserInput): Promise<User> {
    if (await this.userRepository.isEmailInUse(userData.email) || await this.userRepository.isUsernameInUse(userData.username)) {
      throw new Error('User already exists');
    }

    const passwordHash = await bcrypt.hash(userData.password, 10);
    return this.userRepository.create({
      fullName: userData.fullName,
      username: userData.username,
      email: userData.email,
      passwordHash,
      role: userData.role,
      status: userData.status,
    });
  }

  async updateUser(id: string, userData: UpdateUserInput): Promise<User | null> {
    if (userData.email && await this.userRepository.isEmailInUse(userData.email, id)) {
      throw new Error('User already exists');
    }
    if (userData.username && await this.userRepository.isUsernameInUse(userData.username, id)) {
      throw new Error('User already exists');
    }

    const { password, ...userFields } = userData;
    return this.userRepository.update(id, {
      ...userFields,
      ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
    });
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.userRepository.delete(id);
  }

  async deleteUsers(ids: string[]): Promise<number> {
    return this.userRepository.deleteMany(ids);
  }
}
