import { supabase } from '../supabaseClient.js';

export interface WalkIn {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  unitId?: string;
  unitName?: string;
  serviceId: string;
  serviceName: string;
  paymentAmount: number;
  amountReceived: number;
  changeAmount: number;
  paymentMethod: 'cash' | 'card' | 'gcash' | 'other';
  customerName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

function mapWalkIn(row: any): WalkIn {
  return {
    id: row.id,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    unitId: row.unit_id ?? undefined,
    unitName: row.unit_name ?? undefined,
    serviceId: row.service_id,
    serviceName: row.service_name,
    paymentAmount: Number(row.payment_amount),
    amountReceived: Number(row.amount_received),
    changeAmount: Number(row.change_amount),
    paymentMethod: row.payment_method,
    customerName: row.customer_name ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class WalkInService {
  async createWalkIn(walkIn: Omit<WalkIn, 'id' | 'createdAt' | 'updatedAt'>): Promise<WalkIn> {
    const id = `walkin-${Date.now()}`;
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('walkins')
      .insert([
        {
          id,
          date: walkIn.date,
          start_time: walkIn.startTime,
          end_time: walkIn.endTime,
          unit_id: walkIn.unitId ?? null,
          unit_name: walkIn.unitName ?? null,
          service_id: walkIn.serviceId,
          service_name: walkIn.serviceName,
          payment_amount: walkIn.paymentAmount,
          amount_received: walkIn.amountReceived,
          change_amount: walkIn.changeAmount,
          payment_method: walkIn.paymentMethod,
          customer_name: walkIn.customerName ?? null,
          notes: walkIn.notes ?? null,
          created_at: now,
          updated_at: now,
        },
      ])
      .select()
      .single();

    if (error || !data) throw new Error(error?.message || 'Failed to create walk-in');
    return mapWalkIn(data);
  }

  async getAllWalkIns(): Promise<WalkIn[]> {
    const { data, error } = await supabase.from('walkins').select().order('date', { ascending: true }).order('start_time', { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map(mapWalkIn);
  }

  async deleteWalkIn(id: string): Promise<boolean> {
    const { error, count } = await supabase.from('walkins').delete().eq('id', id).select();
    if (error) throw new Error(error.message);
    return count !== null ? count > 0 : true;
  }
}
