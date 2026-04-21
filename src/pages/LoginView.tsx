import React, { useState } from 'react';
import styled from 'styled-components';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../@types/auth';
import { LogIn, UserPlus } from 'lucide-react';
import { ThemeName } from '../themes';

interface LoginViewProps {
  onLoginSuccess?: () => void;
}

const Container = styled.div<{ $bgFrom: string; $bgTo: string }>`
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, ${props => props.$bgFrom} 0%, ${props => props.$bgTo} 100%);
  padding: 20px;
`;

const Card = styled.div<{ $primary: string }>`
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  max-width: 450px;
  width: 100%;

  @media (min-width: 768px) {
    display: flex;
    max-width: 900px;
    height: 500px;
  }
`;

const BrandSection = styled.div<{ $primary: string }>`
  background: linear-gradient(135deg, ${props => props.$primary} 0%, ${props => props.$primary}dd 100%);
  color: white;
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  min-height: 300px;
  @media (max-width: 767px) {
    display: none;
  }
`;

const FormSection = styled.div`
  padding: 40px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const Title = styled.h1`
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  font-size: 0.95rem;
  opacity: 0.9;
  margin-bottom: 30px;
`;

const RoleSelector = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
  margin-bottom: 25px;
`;

const RoleButton = styled.button<{ $active: boolean; $primary: string }>`
  padding: 10px;
  border: 2px solid ${props => (props.$active ? props.$primary : '#ddd')};
  background: ${props => (props.$active ? props.$primary : 'white')};
  color: ${props => (props.$active ? 'white' : '#333')};
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.85rem;

  &:hover {
    border-color: ${props => props.$primary};
  }
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 6px;
  color: #333;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.className?.includes('error') ? '#ff4d4d' : '#d4af37'};
    box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
  }
`;

const SubmitButton = styled.button<{ $primary: string }>`
  width: 100%;
  padding: 12px;
  background: ${props => props.$primary};
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ToggleButton = styled.button`
  width: 100%;
  padding: 10px;
  margin-top: 15px;
  background: none;
  border: 2px solid #ddd;
  border-radius: 8px;
  color: #666;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: #333;
    color: #333;
  }
`;

const ErrorMsg = styled.div`
  background: #ffebee;
  color: #c62828;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 15px;
  font-size: 0.9rem;
`;

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { currentTheme } = useTheme();
  const { login, register, isLoading, error } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [role, setRole] = useState<UserRole>('client');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegisterMode) {
        await register({
          ...formData,
          role,
        });
      } else {
        await login({
          email: formData.email,
          password: formData.password,
        });
      }
      onLoginSuccess?.();
    } catch {
      // Erro é gerenciado pelo contexto
    }
  };

  const bgGradient: Record<ThemeName, { from: string; to: string }> = {
    barber: { from: '#1a1a1a', to: '#d4af37' },
    esthetician: { from: '#ffc0e0', to: '#e91e63' },
    nails: { from: '#b3e5fc', to: '#00bcd4' },
  };

  const themeKey = (currentTheme.name as ThemeName) || 'barber';
  const grad = bgGradient[themeKey] || bgGradient.barber;

  return (
    <Container $bgFrom={grad.from} $bgTo={grad.to}>
      <Card $primary={currentTheme.colors.primary}>
        <BrandSection $primary={currentTheme.colors.primary}>
          <Title>BarberPro System</Title>
          <Subtitle>
            {isRegisterMode ? 'Crie sua conta' : 'Bem-vindo'}
          </Subtitle>
          <p style={{ fontSize: '3rem', margin: '20px 0 0 0' }}>
            {role === 'admin' ? '👔' : role === 'collaborator' ? '✂️' : '👤'}
          </p>
        </BrandSection>

        <FormSection>
          <Title style={{ color: '#333', marginBottom: '8px' }}>
            {isRegisterMode ? 'Criar Conta' : 'Entrar'}
          </Title>
          <Subtitle style={{ color: '#666' }}>
            {role === 'admin'
              ? 'Dono da Barbearia'
              : role === 'collaborator'
                ? 'Barbeiro/Esteticista'
                : 'Cliente'}
          </Subtitle>

          {error && <ErrorMsg>{error}</ErrorMsg>}

          <RoleSelector>
            <RoleButton
              $active={role === 'admin'}
              $primary={currentTheme.colors.primary}
              onClick={() => setRole('admin')}
            >
              👔 Dono
            </RoleButton>
            <RoleButton
              $active={role === 'collaborator'}
              $primary={currentTheme.colors.primary}
              onClick={() => setRole('collaborator')}
            >
              ✂️ Colaborador
            </RoleButton>
            <RoleButton
              $active={role === 'client'}
              $primary={currentTheme.colors.primary}
              onClick={() => setRole('client')}
            >
              👤 Cliente
            </RoleButton>
          </RoleSelector>

          <form onSubmit={handleSubmit}>
            {isRegisterMode && (
              <FormGroup>
                <Label>Nome</Label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Seu nome"
                  required
                />
              </FormGroup>
            )}

            <FormGroup>
              <Label>Email</Label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="seu@email.com"
                required
              />
            </FormGroup>

            {isRegisterMode && (
              <FormGroup>
                <Label>Telefone</Label>
                <Input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="(11) 99999-9999"
                />
              </FormGroup>
            )}

            <FormGroup>
              <Label>Senha</Label>
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Sua senha"
                required
              />
            </FormGroup>

            <SubmitButton
              type="submit"
              disabled={isLoading}
              $primary={currentTheme.colors.primary}
            >
              {isLoading ? (
                <>Processando...</>
              ) : isRegisterMode ? (
                <>
                  <UserPlus size={18} /> Criar Conta
                </>
              ) : (
                <>
                  <LogIn size={18} /> Entrar
                </>
              )}
            </SubmitButton>

            <ToggleButton
              type="button"
              onClick={() => setIsRegisterMode(!isRegisterMode)}
            >
              {isRegisterMode ? 'Já tem conta? Faça login' : 'Não tem conta? Registre-se'}
            </ToggleButton>
          </form>
        </FormSection>
      </Card>
    </Container>
  );
};
