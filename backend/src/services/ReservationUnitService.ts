import { supabase } from '../supabaseClient.js';

export interface ReservationUnit {
  id: string;
  serviceId: string;
  name: string;
  description: string;
  imageUrl: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

function mapReservationUnit(row: any): ReservationUnit {
  return {
    id: row.id,
    serviceId: row.service_id,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url,
    active: Boolean(row.active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class ReservationUnitService {
  async createUnit(unit: Omit<ReservationUnit, 'createdAt' | 'updatedAt'>): Promise<ReservationUnit> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('reservation_units')
      .insert([
        {
          id: unit.id,
          service_id: unit.serviceId,
          name: unit.name,
          description: unit.description,
          image_url: unit.imageUrl,
          active: Boolean(unit.active),
          created_at: now,
          updated_at: now,
        },
      ])
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to create reservation unit');
    }

    return mapReservationUnit(data);
  }

  async getUnit(id: string): Promise<ReservationUnit | null> {
    const { data, error } = await supabase.from('reservation_units').select().eq('id', id).single();
    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }
    return data ? mapReservationUnit(data) : null;
  }

  async getAllUnits(): Promise<ReservationUnit[]> {
    const { data, error } = await supabase.from('reservation_units').select().order('service_id', { ascending: true }).order('name', { ascending: true });
    if (error) {
      throw new Error(error.message);
    }
    return (data || []).map(mapReservationUnit);
  }

  async getUnitsByService(serviceId: string): Promise<ReservationUnit[]> {
    const { data, error } = await supabase
      .from('reservation_units')
      .select()
      .eq('service_id', serviceId)
      .eq('active', true)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }
    return (data || []).map(mapReservationUnit);
  }

  async updateUnit(id: string, updates: Partial<Omit<ReservationUnit, 'id' | 'createdAt'>>): Promise<ReservationUnit | null> {
    const payload: any = {};

    if (updates.serviceId !== undefined) payload.service_id = updates.serviceId;
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl;
    if (updates.active !== undefined) payload.active = Boolean(updates.active);

    if (Object.keys(payload).length === 0) {
      return this.getUnit(id);
    }

    payload.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('reservation_units')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return data ? mapReservationUnit(data) : null;
  }

  async deleteUnit(id: string): Promise<boolean> {
    const { error, count } = await supabase.from('reservation_units').delete().eq('id', id).select();
    if (error) {
      throw new Error(error.message);
    }
    return count !== null ? count > 0 : true;
  }
}
