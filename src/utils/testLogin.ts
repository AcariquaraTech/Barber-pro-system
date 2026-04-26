/**
 * Utilitários para modo de testes
 * Gera tokens JWT mock para testes rápidos sem chamar o backend
 */

import { AuthUser, UserRole } from '../@types/auth';

interface TestLoginPayload {
  role: UserRole;
  name?: string;
  email?: string;
}

/**
 * Gera um JWT mock para testes locais
 * Este token NÃO é verificado contra o backend
 * Use apenas para testes - desabilitar antes de produção
 */
function generateMockJWT(role: UserRole): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 7 * 24 * 60 * 60; // 7 dias
  
  const payload = btoa(JSON.stringify({
    sub: `test-user-${role}`,
    role,
    iat: now,
    exp: now + expiresIn,
  }));

  // Signature mock (não validada)
  const signature = btoa('test-signature');

  return `${header}.${payload}.${signature}`;
}

/**
 * Faz login em modo de testes (sem credenciais)
 */
export function testLogin(payload: TestLoginPayload): AuthUser {
  const role = payload.role || 'client';
  const name = payload.name || {
    admin: 'Gerente Teste',
    collaborator: 'Barbeiro Teste',
    client: 'Cliente Teste',
  }[role];
  
  const email = payload.email || `test-${role}@barber.test`;

  const mockUser: AuthUser = {
    id: `test-${role}-${Date.now()}`,
    email,
    name,
    role,
    phone: '(11) 99999-9999',
    token: generateMockJWT(role),
    refreshToken: generateMockJWT(role),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 dias
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return mockUser;
}

/**
 * Verifica se modo de testes está habilitado
 */
export function isTestModeEnabled(): boolean {
  return import.meta.env.VITE_TEST_MODE === 'true';
}
