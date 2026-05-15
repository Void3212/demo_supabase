import { supabase } from '../supabaseClient.js';

export type OrderStatus = 'pending' | 'accepted' | 'rejected' | 'shipped' | 'delivered';

export interface OrderItem {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    imageUrl: string;
  };
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryAddress: string;
  status: OrderStatus;
  createdAt: string;
  estimatedDeliveryTime: string;
  acceptedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  rejectionReason?: string;
  notes?: string;
}

function mapOrder(row: any): Order {
  return {
    id: row.id,
    userId: row.user_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone ?? undefined,
    items: row.items,
    subtotal: Number(row.subtotal),
    deliveryFee: Number(row.delivery_fee),
    total: Number(row.total),
    deliveryAddress: row.delivery_address,
    status: row.status,
    createdAt: row.created_at,
    estimatedDeliveryTime: row.estimated_delivery_time,
    acceptedAt: row.accepted_at ?? undefined,
    shippedAt: row.shipped_at ?? undefined,
    deliveredAt: row.delivered_at ?? undefined,
    rejectionReason: row.rejection_reason ?? undefined,
    notes: row.notes ?? undefined,
  };
}

export const OrderService = {
  async createOrder(order: Order): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .insert([
        {
          ...order,
          user_id: order.userId,
          customer_name: order.customerName,
          customer_email: order.customerEmail,
          customer_phone: order.customerPhone || null,
          delivery_fee: order.deliveryFee,
          delivery_address: order.deliveryAddress,
          estimated_delivery_time: order.estimatedDeliveryTime,
          rejection_reason: order.rejectionReason || null,
          created_at: order.createdAt,
          updated_at: order.createdAt,
        },
      ])
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Failed to create order');
    }
    return mapOrder(data);
  },

  async getOrders(): Promise<Order[]> {
    const { data, error } = await supabase.from('orders').select().order('created_at', { ascending: false });
    if (error) {
      throw new Error(error.message);
    }
    return (data || []).map(mapOrder);
  },

  async getOrder(orderId: string): Promise<Order | null> {
    const { data, error } = await supabase.from('orders').select().eq('id', orderId).single();
    if (error) {
      throw new Error(error.message);
    }
    return data ? mapOrder(data) : null;
  },

  async getOrdersByUser(userId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select()
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }
    return (data || []).map(mapOrder);
  },

  async updateOrderStatus(orderId: string, status: OrderStatus, rejectionReason?: string): Promise<Order | null> {
    const updatePayload: any = { status };

    if (status === 'accepted') {
      updatePayload.accepted_at = new Date().toISOString();
      updatePayload.rejection_reason = null;
    }
    if (status === 'shipped') {
      updatePayload.shipped_at = new Date().toISOString();
    }
    if (status === 'delivered') {
      updatePayload.delivered_at = new Date().toISOString();
    }
    if (status === 'rejected') {
      updatePayload.rejection_reason = rejectionReason || 'No reason provided';
    }

    updatePayload.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return data ? mapOrder(data) : null;
  },

  async deleteOrder(orderId: string): Promise<boolean> {
    const { error, count } = await supabase.from('orders').delete().eq('id', orderId).select();
    if (error) {
      throw new Error(error.message);
    }
    return count !== null ? count > 0 : true;
  },
};
