import { supabase } from '../supabaseClient.js';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  phone?: string;
  address?: string;
  profileImage?: string | null;
  role: 'customer' | 'admin';
  createdAt: string;
  updatedAt: string;
}

function mapUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    password: row.password,
    name: row.name,
    phone: row.phone ?? undefined,
    address: row.address ?? undefined,
    profileImage: row.profile_image ?? undefined,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class UserService {
  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const { data: existing, error: existsError } = await supabase
      .from('users')
      .select('id')
      .ilike('email', user.email)
      .single();

    if (existsError && existsError.code !== 'PGRST116') {
      throw new Error(existsError.message);
    }
    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    const id = `user-${Date.now()}`;
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          id,
          email: user.email.toLowerCase(),
          password: user.password,
          name: user.name,
          phone: user.phone ?? null,
          address: user.address ?? null,
          profile_image: user.profileImage ?? null,
          role: user.role,
          created_at: now,
          updated_at: now,
        },
      ])
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to create user');
    }

    return mapUser(data);
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select()
      .ilike('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }
    return data ? mapUser(data) : null;
  }

  async validateCredentials(email: string, password: string): Promise<User> {
    const user = await this.findByEmail(email);
    if (!user || user.password !== password) {
      throw new Error('Invalid email or password.');
    }
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase.from('users').select();
    if (error) {
      throw new Error(error.message);
    }
    return (data || []).map(mapUser);
  }

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase.from('users').select().eq('id', id).single();
    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }
    return data ? mapUser(data) : null;
  }
}
