import dotenv from 'dotenv';
import { supabase } from '../supabaseClient.js';

dotenv.config();

const DEFAULT_ADMIN_SETTINGS = [
  { key: 'maintenanceMode', value: false },
  { key: 'allowGuestCheckout', value: true },
  { key: 'emailNotifications', value: true },
  { key: 'liveAgentAvailable', value: false },
  { key: 'liveAgentName', value: 'Lara' },
  { key: 'businessHours', value: '10:00 - 22:00' },
  { key: 'defaultCurrency', value: 'PHP' },
];

const DEFAULT_PRODUCTS = [
  {
    id: 'prod-1',
    name: 'Signature Burger',
    description: 'Juicy beef patty with lettuce, tomato, cheese, and special sauce.',
    price: 9.99,
    category: 'Food',
    image_url: '/images/signature-burger.png',
    rating: 4.7,
    visible: true,
  },
  {
    id: 'prod-2',
    name: 'Classic Fries',
    description: 'Crispy golden fries with seasoned salt.',
    price: 3.99,
    category: 'Side',
    image_url: '/images/classic-fries.png',
    rating: 4.4,
    visible: true,
  },
];

const DEFAULT_RESERVATION_UNITS = [
  {
    id: 'unit-1',
    service_id: 'dining',
    name: 'Indoor Table',
    description: 'Comfortable indoor table seating.',
    image_url: '/images/indoor-table.png',
    active: true,
  },
  {
    id: 'unit-2',
    service_id: 'patio',
    name: 'Patio Lounge',
    description: 'Relaxing patio seating with fresh air.',
    image_url: '/images/patio-lounge.png',
    active: true,
  },
];

const DEFAULT_ADMIN_USER = {
  email: process.env.ADMIN_EMAIL || 'admin@demo.com',
  password: process.env.ADMIN_PASSWORD || 'admin123',
  name: 'Administrator',
  role: 'admin' as const,
};

export async function initializeDatabase() {
  await testConnection();
  await initializeAdminSettings();
  await seedProducts();
  await seedReservationUnits();
  await seedAdminUser();
}

async function testConnection() {
  const { error } = await supabase.from('users').select('id').limit(1);
  if (error) {
    throw new Error(`Supabase connection failed: ${error.message}`);
  }
}

async function initializeAdminSettings() {
  const { data, error } = await supabase.from('admin_settings').select('key');
  if (error) {
    throw new Error(`Failed to read admin settings: ${error.message}`);
  }

  const existingKeys = new Set((data || []).map((row: any) => row.key));
  const entries = DEFAULT_ADMIN_SETTINGS.filter((setting) => !existingKeys.has(setting.key))
    .map((setting) => ({ key: setting.key, value: setting.value }));

  if (entries.length === 0) {
    return;
  }

  const { error: insertError } = await supabase.from('admin_settings').upsert(entries);
  if (insertError) {
    throw new Error(`Failed to seed admin settings: ${insertError.message}`);
  }
}

async function seedProducts() {
  const { data, error } = await supabase.from('products').select('id').limit(1);
  if (error) {
    throw new Error(`Failed to read products: ${error.message}`);
  }

  if (data && data.length > 0) {
    return;
  }

  const insertPayload = DEFAULT_PRODUCTS.map((product) => ({
    ...product,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  const { error: insertError } = await supabase.from('products').insert(insertPayload);
  if (insertError) {
    throw new Error(`Failed to seed products: ${insertError.message}`);
  }
}

async function seedReservationUnits() {
  const { data, error } = await supabase.from('reservation_units').select('id').limit(1);
  if (error) {
    throw new Error(`Failed to read reservation units: ${error.message}`);
  }

  if (data && data.length > 0) {
    return;
  }

  const insertPayload = DEFAULT_RESERVATION_UNITS.map((unit) => ({
    ...unit,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  const { error: insertError } = await supabase.from('reservation_units').insert(insertPayload);
  if (insertError) {
    throw new Error(`Failed to seed reservation units: ${insertError.message}`);
  }
}

async function seedAdminUser() {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .ilike('email', DEFAULT_ADMIN_USER.email)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to query users for admin seed: ${error.message}`);
  }

  if (data) {
    return;
  }

  const now = new Date().toISOString();
  const { error: insertError } = await supabase.from('users').insert([
    {
      id: `user-${Date.now()}`,
      email: DEFAULT_ADMIN_USER.email.toLowerCase(),
      password: DEFAULT_ADMIN_USER.password,
      name: DEFAULT_ADMIN_USER.name,
      role: DEFAULT_ADMIN_USER.role,
      created_at: now,
      updated_at: now,
    },
  ]);

  if (insertError) {
    throw new Error(`Failed to seed admin user: ${insertError.message}`);
  }
}
