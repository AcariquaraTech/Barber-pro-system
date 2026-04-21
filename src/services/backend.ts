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

export type UserRole = 'admin' | 'collaborator' | 'client';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  created_at: string;
};

export type AuthResponse = {
  user: AuthUser;
  token: string;
  refresh_token: string;
  expires_at: number;
};

export type CashierTransactionInput = {
  barbeiro: string;
  cliente: string;
  servico: string;
  valor: number;
  metodo: 'cash' | 'credit_card' | 'debit_card' | 'pix';
  unidade?: string;
};

export type CashierSummary = {
  closing_id: string;
  total_cash: number;
  total_card: number;
  total_pix: number;
  total_revenue: number;
  transaction_count: number;
};

const assertTauriRuntime = () => {
  const hasTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  if (!hasTauri) {
    throw new Error('Backend local disponivel apenas no runtime Tauri. Use npm run tauri dev.');
  }
};

const getToken = () => {
  const raw = localStorage.getItem('auth_user');
  if (!raw) {
    throw new Error('Sessão não encontrada. Faça login novamente.');
  }
  const parsed = JSON.parse(raw);
  if (!parsed?.token) {
    throw new Error('Token de sessão inválido.');
  }
  return parsed.token as string;
};

export const backendApi = {
  async login(payload: { email: string; password: string }) {
    assertTauriRuntime();
    return invoke<AuthResponse>('login', { payload });
  },

  async register(payload: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    phone?: string;
    cpf?: string;
  }) {
    assertTauriRuntime();
    return invoke<AuthResponse>('register', { payload });
  },

  async verifyToken(token: string) {
    assertTauriRuntime();
    return invoke<[string, string]>('verify_token', { token });
  },

  async refreshSession(refresh_token: string) {
    assertTauriRuntime();
    return invoke<AuthResponse>('refresh_session', { payload: { refresh_token } });
  },

  async logout(refresh_token: string) {
    assertTauriRuntime();
    return invoke<boolean>('logout', { payload: { refresh_token } });
  },

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
    return invoke<Client[]>('list_clients_secure', { token: getToken(), search });
  },

  async createClient(payload: { name: string; phone: string }) {
    assertTauriRuntime();
    return invoke<Client>('create_client_secure', { token: getToken(), payload });
  },

  async updateClient(id: string, payload: { name: string; phone: string }) {
    assertTauriRuntime();
    return invoke<Client>('update_client_secure', { token: getToken(), id, payload });
  },

  async deleteClient(id: string) {
    assertTauriRuntime();
    return invoke<boolean>('delete_client_secure', { token: getToken(), id });
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
    return invoke<SaleRecord[]>('list_sales_secure', {
      token: getToken(),
      startTimestamp: start_timestamp,
      endTimestamp: end_timestamp,
    });
  },

  async syncCatalog(payload: {
    services: Array<{ name: string; price: number }>;
    barbers: Array<{ name: string }>;
  }) {
    assertTauriRuntime();
    return invoke<boolean>('sync_catalog_secure', { token: getToken(), payload });
  },

  async closeCashier(payload: {
    opening_balance: number;
    notes?: string;
    transactions: CashierTransactionInput[];
  }) {
    assertTauriRuntime();
    return invoke<CashierSummary>('close_cashier', { token: getToken(), payload });
  },
};
