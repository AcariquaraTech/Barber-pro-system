import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, LoginPayload, RegisterPayload, UserRole, ROLE_PERMISSIONS, PermissionSet } from '../@types/auth';
import { backendApi } from '../services/backend';
import { testLogin as generateTestLogin } from '../utils/testLogin';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  testLogin: (role: UserRole) => Promise<void>;
  hasPermission: (action: string, resource: string) => boolean;
  canAccess: (roles: UserRole[]) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    // Recuperar usuário do localStorage se existir
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Verificar se token não expirou
      if (parsed.expiresAt > Date.now()) {
        return parsed;
      }
      localStorage.removeItem('auth_user');
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Limpar token expirado periodicamente
  useEffect(() => {
    if (!user) return;

    const timer = setInterval(async () => {
      const msToExpire = user.expiresAt - Date.now();
      if (msToExpire <= 2 * 60 * 1000) {
        try {
          const response = await backendApi.refreshSession(user.refreshToken);
          const renewedUser: AuthUser = {
            id: response.user.id,
            email: response.user.email,
            name: response.user.name,
            role: response.user.role,
            phone: response.user.phone,
            token: response.token,
            refreshToken: response.refresh_token,
            expiresAt: response.expires_at,
            createdAt: response.user.created_at,
            updatedAt: response.user.created_at,
          };
          setUser(renewedUser);
          localStorage.setItem('auth_user', JSON.stringify(renewedUser));
        } catch {
          logout();
        }
      }
    }, 60000); // Verificar a cada minuto

    return () => clearInterval(timer);
  }, [user]);

  const login = async (payload: LoginPayload) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await backendApi.login(payload);
      const authUser: AuthUser = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        role: response.user.role,
        phone: response.user.phone,
        token: response.token,
        refreshToken: response.refresh_token,
        expiresAt: response.expires_at,
        createdAt: response.user.created_at,
        updatedAt: response.user.created_at,
      };

      setUser(authUser);
      localStorage.setItem('auth_user', JSON.stringify(authUser));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await backendApi.register(payload);
      const authUser: AuthUser = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        role: response.user.role,
        phone: response.user.phone,
        cpf: payload.cpf,
        token: response.token,
        refreshToken: response.refresh_token,
        expiresAt: response.expires_at,
        createdAt: response.user.created_at,
        updatedAt: response.user.created_at,
      };

      setUser(authUser);
      localStorage.setItem('auth_user', JSON.stringify(authUser));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    if (user?.refreshToken) {
      backendApi.logout(user.refreshToken).catch(() => undefined);
    }
    setUser(null);
    localStorage.removeItem('auth_user');
    setError(null);
  };

  const testLogin = async (role: UserRole) => {
    setIsLoading(true);
    setError(null);

    try {
      const testUser = generateTestLogin({ role });
      setUser(testUser);
      localStorage.setItem('auth_user', JSON.stringify(testUser));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login em modo de testes');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = (action: string, resource: string): boolean => {
    if (!user) return false;
    const permissions = ROLE_PERMISSIONS[user.role];
    const actions: Record<string, keyof PermissionSet> = {
      read: 'read',
      write: 'write',
      delete: 'delete',
    };
    const actionKey = actions[action];
    if (!actionKey) return false;
    return permissions[actionKey].includes(resource);
  };

  const canAccess = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        register,
        logout,
        testLogin,
        hasPermission,
        canAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};
