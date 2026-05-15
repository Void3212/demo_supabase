import { supabase } from '../supabaseClient.js';

export interface Reservation {
  id: string;
  userId: string;
  userName?: string;
  date: string;
  time: string;
  partySize: number;
  unitId?: string;
  unitName?: string;
  serviceId?: string;
  specialRequests?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export class ReservationService {
  private mapReservation(row: any): Reservation {
    return {
      id: row.id,
      userId: row.user_id,
      userName: row.users?.name ?? row.user_name ?? undefined,
      date: row.date,
      time: row.time,
      partySize: Number(row.party_size),
      unitId: row.unit_id ?? undefined,
      unitName: row.unit_name ?? undefined,
      serviceId: row.service_id ?? undefined,
      specialRequests: row.special_requests ?? undefined,
      status: row.status as Reservation['status'],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private async ensureUserExists(userId: string): Promise<void> {
    const { data, error } = await supabase.from('users').select('id').eq('id', userId).single();
    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }

    if (!data) {
      const now = new Date().toISOString();
      const email = `${userId}@local.chillingan`;
      const { error: insertError } = await supabase.from('users').insert([
        {
          id: userId,
          email,
          password: 'local-user',
          name: 'Guest',
          role: 'customer',
          created_at: now,
          updated_at: now,
        },
      ]);
      if (insertError) {
        throw new Error(insertError.message);
      }
    }
  }

  async createReservation(reservation: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Reservation> {
    await this.ensureUserExists(reservation.userId);
    const id = `res_${Date.now()}`;
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('reservations')
      .insert([
        {
          id,
          user_id: reservation.userId,
          date: reservation.date,
          time: reservation.time,
          party_size: reservation.partySize,
          unit_id: reservation.unitId ?? null,
          unit_name: reservation.unitName ?? null,
          service_id: reservation.serviceId ?? null,
          special_requests: reservation.specialRequests ?? null,
          status: 'pending',
          created_at: now,
          updated_at: now,
        },
      ])
      .select('*, users(name)')
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to create reservation');
    }

    return this.mapReservation(data);
  }

  async getReservation(id: string): Promise<Reservation | null> {
    const { data, error } = await supabase
      .from('reservations')
      .select('*, users(name)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data ? this.mapReservation(data) : null;
  }

  async getUserReservations(userId: string): Promise<Reservation[]> {
    const { data, error } = await supabase
      .from('reservations')
      .select('*, users(name)')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('time', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }
    return ((data || []) as any[]).map((row) => this.mapReservation(row));
  }

  async getAllReservations(): Promise<Reservation[]> {
    const { data, error } = await supabase
      .from('reservations')
      .select('*, users(name)')
      .order('date', { ascending: false })
      .order('time', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }
    return ((data || []) as any[]).map((row) => this.mapReservation(row));
  }

  async updateReservation(id: string, updates: Partial<Omit<Reservation, 'id' | 'createdAt'>>): Promise<Reservation | null> {
    const payload: any = { ...updates };
    if (payload.partySize !== undefined) payload.party_size = payload.partySize;
    if (payload.userId !== undefined) payload.user_id = payload.userId;
    if (payload.unitId !== undefined) payload.unit_id = payload.unitId;
    if (payload.unitName !== undefined) payload.unit_name = payload.unitName;
    if (payload.serviceId !== undefined) payload.service_id = payload.serviceId;
    if (payload.specialRequests !== undefined) payload.special_requests = payload.specialRequests;
    if (payload.userName !== undefined) delete payload.userName;
    delete payload.id;
    delete payload.createdAt;

    payload.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('reservations')
      .update(payload)
      .eq('id', id)
      .select('*, users(name)')
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return data ? this.mapReservation(data) : null;
  }

  async deleteReservation(id: string): Promise<boolean> {
    const { error, count } = await supabase.from('reservations').delete().eq('id', id).select();
    if (error) {
      throw new Error(error.message);
    }
    return count !== null ? count > 0 : true;
  }

  async getReservationsByDateRange(startDate: string, endDate: string): Promise<Reservation[]> {
    const { data, error } = await supabase
      .from('reservations')
      .select('*, users(name)')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }
    return ((data || []) as any[]).map((row) => this.mapReservation(row));
  }

  async checkAvailability(date: string, time: string, partySize: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('reservations')
      .select('party_size')
      .eq('date', date)
      .eq('time', time)
      .neq('status', 'cancelled');

    if (error) {
      throw new Error(error.message);
    }

    const currentPartySize = (data || []).reduce((acc: number, row: any) => acc + Number(row.party_size), 0);
    return currentPartySize + partySize <= 30;
  }
}
