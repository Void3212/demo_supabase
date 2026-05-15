import { supabase } from '../supabaseClient.js';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  rating: number;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
}

function mapProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    category: row.category,
    imageUrl: row.image_url,
    rating: Number(row.rating),
    visible: Boolean(row.visible),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class ProductService {
  async createProduct(product: Omit<Product, 'createdAt' | 'updatedAt'>): Promise<Product> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('products')
      .insert([{ ...product, visible: Boolean(product.visible), created_at: now, updated_at: now }])
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to create product');
    }

    return mapProduct(data);
  }

  async getProduct(id: string): Promise<Product | null> {
    const { data, error } = await supabase.from('products').select().eq('id', id).single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data ? mapProduct(data) : null;
  }

  async getAllProducts(): Promise<Product[]> {
    const { data, error } = await supabase.from('products').select().order('name', { ascending: true });
    if (error) {
      throw new Error(error.message);
    }
    return (data || []).map(mapProduct);
  }

  async updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<Product | null> {
    const payload: any = { ...updates };
    if (payload.visible !== undefined) {
      payload.visible = Boolean(payload.visible);
    }
    payload.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return data ? mapProduct(data) : null;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const { error, count } = await supabase.from('products').delete().eq('id', id).select();
    if (error) {
      throw new Error(error.message);
    }
    return count !== null ? count > 0 : true;
  }
}
