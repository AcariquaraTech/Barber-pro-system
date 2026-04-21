import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../@types/auth';
import styled from 'styled-components';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  fallback?: React.ReactNode;
}

const UnauthorizedContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #050505;
  color: #fff;
  flex-direction: column;
  text-align: center;
  gap: 20px;

  h1 {
    font-size: 2rem;
    margin-bottom: 10px;
  }

  p {
    color: #888;
    max-width: 500px;
  }
`;

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles,
  fallback,
}) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <UnauthorizedContainer>
        <h1>🔒 Acesso Negado</h1>
        <p>Você precisa fazer login para acessar esta página.</p>
      </UnauthorizedContainer>
    );
  }

  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <UnauthorizedContainer>
        <h1>🚫 Sem Permissão</h1>
        <p>Sua conta não tem acesso a este recurso.</p>
        <p style={{ fontSize: '0.9rem' }}>
          Seu role: <strong>{user.role}</strong>
        </p>
      </UnauthorizedContainer>
    );
  }

  return <>{children}</>;
};
