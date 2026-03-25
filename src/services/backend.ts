import { invoke } from '@tauri-apps/api/core';

export type Barber = {
  id: string;
  matricula: string;
  nome: string;
  foto: string;
  escala: [number, number, number, number, number, number, number];
  unidade_id: string;
  servicos_habilitados: string[];
};

export type Service = {
  id: string;
  name: string;
  price: number;
  active: boolean;
};

export type Client = {
  id: string;
  name: string;
  phone: string;
  last_visit: string;
  total_cuts: number;
  spent: number;
  preferred: string;
};

export type Appointment = {
  id: string;
  client_name: string;
  client_phone: string;
  barber_id: string;
  barber_nome: string;
  service_name: string;
  service_price: number;
  date: string;
  time: string;
  status: 'reservado' | 'confirmado' | 'finalizado' | 'cancelado';
  amount_paid: number;
};

export type SaleRecord = {
  id: string;
  appointment_id: string | null;
  barbeiro: string;
  cliente: string;
  servico: string;
  valor: number;
  metodo: string;
  unidade: string;
  data: string;
  hora: string;
  timestamp: string;
};

const assertTauriRuntime = () => {
  const hasTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  if (!hasTauri) {
    throw new Error('Backend local disponivel apenas no runtime Tauri. Use npm run tauri dev.');
  }
};

export const backendApi = {
  async health() {
    assertTauriRuntime();
    return invoke<{ status: string; version: string }>('health');
  },

  async listBarbers() {
    assertTauriRuntime();
    return invoke<Barber[]>('list_barbers');
  },

  async listServices() {
    assertTauriRuntime();
    return invoke<Service[]>('list_services');
  },

  async listClients(search?: string) {
    assertTauriRuntime();
    return invoke<Client[]>('list_clients', { search });
  },

  async createClient(payload: { name: string; phone: string }) {
    assertTauriRuntime();
    return invoke<Client>('create_client', { payload });
  },

  async updateClient(id: string, payload: { name: string; phone: string }) {
    assertTauriRuntime();
    return invoke<Client>('update_client', { id, payload });
  },

  async deleteClient(id: string) {
    assertTauriRuntime();
    return invoke<boolean>('delete_client', { id });
  },

  async listAppointments(date?: string) {
    assertTauriRuntime();
    return invoke<Appointment[]>('list_appointments', { date });
  },

  async createAppointment(payload: {
    client_name: string;
    client_phone: string;
    barber_id: string;
    barber_nome: string;
    service_name: string;
    service_price: number;
    date: string;
    time: string;
  }) {
    assertTauriRuntime();
    return invoke<Appointment>('create_appointment', { payload });
  },

  async updateAppointmentStatus(id: string, status: Appointment['status']) {
    assertTauriRuntime();
    return invoke<Appointment>('update_appointment_status', { id, payload: { status } });
  },

  async finalizeAppointment(id: string, payload: {
    payment_method: string;
    amount_paid?: number;
    unidade?: string;
  }) {
    assertTauriRuntime();
    return invoke<SaleRecord>('finalize_appointment', { id, payload });
  },

  async createSale(payload: {
    barbeiro: string;
    cliente: string;
    servico: string;
    valor: number;
    metodo: string;
    unidade?: string;
  }) {
    assertTauriRuntime();
    return invoke<SaleRecord>('create_sale', { payload });
  },

  async listSales(start_timestamp?: string, end_timestamp?: string) {
    assertTauriRuntime();
    return invoke<SaleRecord[]>('list_sales', { startTimestamp: start_timestamp, endTimestamp: end_timestamp });
  },

  async syncCatalog(payload: {
    services: Array<{ name: string; price: number }>;
    barbers: Array<{ name: string }>;
  }) {
    assertTauriRuntime();
    return invoke<boolean>('sync_catalog', { payload });
  },
};
