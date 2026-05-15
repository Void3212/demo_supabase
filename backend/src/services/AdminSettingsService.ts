import { supabase } from '../supabaseClient.js';

export interface AdminSettings {
  maintenanceMode: boolean;
  allowGuestCheckout: boolean;
  emailNotifications: boolean;
  liveAgentAvailable: boolean;
  liveAgentName: string;
  businessHours: string;
  defaultCurrency: string;
}

const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  maintenanceMode: false,
  allowGuestCheckout: true,
  emailNotifications: true,
  liveAgentAvailable: false,
  liveAgentName: 'Lara',
  businessHours: '10:00 - 22:00',
  defaultCurrency: 'PHP',
};

export class AdminSettingsService {
  async getSettings(): Promise<AdminSettings> {
    const { data, error } = await supabase.from('admin_settings').select('key, value');
    if (error) {
      throw new Error(error.message);
    }

    const settings: Record<string, any> = { ...DEFAULT_ADMIN_SETTINGS };
    for (const row of data || []) {
      settings[row.key] = row.value;
    }
    return settings as AdminSettings;
  }

  async updateSettings(updates: Partial<AdminSettings>): Promise<AdminSettings> {
    const entries = Object.entries(updates)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => ({ key, value }));

    if (entries.length === 0) {
      return this.getSettings();
    }

    const { error } = await supabase.from('admin_settings').upsert(entries);
    if (error) {
      throw new Error(error.message);
    }

    return this.getSettings();
  }
}
