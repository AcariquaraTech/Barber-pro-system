// Tipos de usuários do sistema
export type UserRole = 'admin' | 'collaborator' | 'client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  cpf?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser extends User {
  token: string;
  refreshToken: string;
  expiresAt: number;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
  cpf?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: number;
}

// Dados específicos por role
export interface AdminData extends User {
  role: 'admin';
  businessName?: string;
  cnpj?: string;
  unidades?: string[];
}

export interface CollaboratorData extends User {
  role: 'collaborator';
  matricula: string;
  servicosHabilitados: string[];
  escala: [number, number, number, number, number, number, number];
  adminId: string;
}

export interface ClientData extends User {
  role: 'client';
  preferredCollaborator?: string;
}

export interface PermissionSet {
  read: string[];
  write: string[];
  delete: string[];
}

export const ROLE_PERMISSIONS: Record<UserRole, PermissionSet> = {
  admin: {
    read: ['users', 'appointments', 'transactions', 'reports', 'services'],
    write: ['users', 'appointments', 'transactions', 'services', 'settings'],
    delete: ['users', 'appointments', 'transactions', 'services'],
  },
  collaborator: {
    read: ['own_appointments', 'own_services', 'clients'],
    write: ['own_appointments', 'own_services', 'own_schedule'],
    delete: ['own_appointments'],
  },
  client: {
    read: ['appointments', 'services', 'collaborators'],
    write: ['own_appointments', 'own_profile'],
    delete: ['own_appointments'],
  },
};
