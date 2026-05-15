import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import WS from 'ws';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

class NodeWebSocket extends WS {
  constructor(address: string | URL, protocols?: string | string[]) {
    super(address.toString(), protocols as any);
  }
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    transport: NodeWebSocket as any,
  },
});

