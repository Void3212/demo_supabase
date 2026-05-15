import { supabase } from '../supabaseClient.js';

export type LiveChatRequestStatus = 'waiting' | 'connected' | 'closed';

export interface SupportChatRequest {
  id: string;
  status: LiveChatRequestStatus;
  customerMessages: string[];
  adminMessages: string[];
  requestedAt: number;
  updatedAt: number;
}

function mapChatRequest(row: any): SupportChatRequest {
  return {
    id: row.id,
    status: row.status,
    customerMessages: row.customer_messages ?? [],
    adminMessages: row.admin_messages ?? [],
    requestedAt: Number(row.requested_at),
    updatedAt: Number(row.updated_at),
  };
}

export class SupportChatService {
  async getRequests(): Promise<SupportChatRequest[]> {
    const { data, error } = await supabase.from('support_chat_requests').select().order('updated_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(mapChatRequest);
  }

  async getOpenRequest(): Promise<SupportChatRequest | null> {
    const { data, error } = await supabase
      .from('support_chat_requests')
      .select()
      .in('status', ['waiting', 'connected'])
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data ? mapChatRequest(data) : null;
  }

  async getRequestById(id: string): Promise<SupportChatRequest | null> {
    const { data, error } = await supabase.from('support_chat_requests').select().eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data ? mapChatRequest(data) : null;
  }

  async createRequest(request: SupportChatRequest): Promise<SupportChatRequest> {
    const { data, error } = await supabase
      .from('support_chat_requests')
      .insert([
        {
          id: request.id,
          status: request.status,
          customer_messages: request.customerMessages,
          admin_messages: request.adminMessages,
          requested_at: request.requestedAt,
          updated_at: request.updatedAt,
        },
      ])
      .select()
      .single();

    if (error || !data) throw new Error(error?.message || 'Failed to create support chat request');
    return mapChatRequest(data);
  }

  async updateRequest(id: string, updates: Partial<Omit<SupportChatRequest, 'id'>>): Promise<SupportChatRequest | null> {
    const payload: any = {};
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.customerMessages !== undefined) payload.customer_messages = updates.customerMessages;
    if (updates.adminMessages !== undefined) payload.admin_messages = updates.adminMessages;
    if (updates.requestedAt !== undefined) payload.requested_at = updates.requestedAt;
    if (updates.updatedAt !== undefined) payload.updated_at = updates.updatedAt;

    if (Object.keys(payload).length === 0) {
      return this.getRequestById(id);
    }

    const { data, error } = await supabase.from('support_chat_requests').update(payload).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data ? mapChatRequest(data) : null;
  }
}
