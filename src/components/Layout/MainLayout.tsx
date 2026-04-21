import { ReactNode } from 'react';
import styled from 'styled-components';
import { 
  Scissors, Calendar, DollarSign, Users, 
  Settings, BarChart3, Lock, Home, LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface MainLayoutProps {
  children: ReactNode;
  abaAtiva: string;
  setAbaAtiva: (aba: string) => void;
}

const AppGrid = styled.div<{ $theme: any }>`
  display: grid;
  grid-template-columns: 260px 1fr;
  height: 100vh;
  width: 100vw;
  background-color: ${(props) => props.$theme.colors.background};
  color: ${(props) => props.$theme.colors.text};
  overflow: hidden;
`;

const Sidebar = styled.aside<{ $theme: any }>`
  background-color: ${(props) => props.$theme.colors.secondary};
  border-right: 1px solid ${(props) => `${props.$theme.colors.border}33`};
  display: flex;
  flex-direction: column;
  padding: 30px 20px;
  z-index: 10;
`;

const LogoArea = styled.div<{ $theme: any }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 35px;
  margin-bottom: 25px;
  padding-left: 10px;
  cursor: pointer;
  transition: 0.3s;
  
  &:hover { opacity: 0.8; }
  
  span { 
    font-weight: 900; 
    font-size: 1.2rem; 
    color: ${(props) => props.$theme.colors.text};
    letter-spacing: 2px;
    text-transform: uppercase;

    strong {
      color: ${(props) => props.$theme.colors.primary};
    }
  }
`;

const NavMenu = styled.nav` 
  display: flex; 
  flex-direction: column; 
  gap: 8px; 
  flex: 1; 
`;

const NavItem = styled.button<{ active?: boolean; variant?: 'danger' | 'default'; $theme: any }>`
  display: flex; 
  align-items: center; 
  gap: 15px; 
  padding: 14px 18px; 
  border-radius: 12px;
  border: none; 
  cursor: pointer; 
  font-weight: ${props => props.active ? '800' : '500'}; 
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.9rem;
  
  /* Estilo dinâmico baseado se está ativo ou se é o botão de fechar */
  background: ${props => {
    if (props.active) return props.variant === 'danger' ? props.$theme.colors.danger : props.$theme.colors.primary;
    return 'transparent';
  }};
  
  color: ${props => props.active ? props.$theme.colors.background : props.$theme.colors.textSecondary};
  
  &:hover { 
    background: ${props => {
      if (props.active) return props.variant === 'danger' ? props.$theme.colors.danger : props.$theme.colors.primary;
      return `${props.$theme.colors.border}22`;
    }}; 
    color: ${props => props.active ? props.$theme.colors.background : props.$theme.colors.text};
    transform: translateX(5px);
  }

  svg {
    width: 20px;
    height: 20px;
    transition: 0.3s;
    color: ${props => {
      if (props.active) return props.$theme.colors.background;
      return props.variant === 'danger' ? props.$theme.colors.danger : props.$theme.colors.primary;
    }};
  }
`;

const MainContent = styled.main<{ $theme: any }>` 
  height: 100%;
  width: 100%;
  position: relative;
  overflow-y: auto; 
  background-color: ${(props) => props.$theme.colors.background};

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: ${(props) => props.$theme.colors.background}; }
  &::-webkit-scrollbar-thumb { background: ${(props) => props.$theme.colors.tertiary}; border-radius: 10px; }
  &::-webkit-scrollbar-thumb:hover { background: ${(props) => props.$theme.colors.primary}; }
`;

const FooterNav = styled.div<{ $theme: any }>`
  border-top: 1px solid ${(props) => `${props.$theme.colors.border}33`};
  padding-top: 20px;
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const MainLayout = ({ children, abaAtiva, setAbaAtiva }: MainLayoutProps) => {
  const { user, logout } = useAuth();
  const { currentTheme } = useTheme();
  const role = user?.role || 'client';

  const canSeeAgenda = role === 'admin' || role === 'collaborator';
  const canSeeCashier = role === 'admin' || role === 'client';
  const canSeeClients = role === 'admin';
  const canSeeDashboard = true;
  const canSeeClosing = role === 'admin';
  const canSeeConfig = role === 'admin' || role === 'collaborator';

  return (
    <AppGrid $theme={currentTheme}>
      <Sidebar $theme={currentTheme}>
        <LogoArea $theme={currentTheme} onClick={() => setAbaAtiva('home')}>
          <Scissors color={currentTheme.colors.primary} size={28} strokeWidth={2.5} />
          <span>BARBER <strong>PRO</strong></span>
        </LogoArea>

        <NavMenu>
          <NavItem $theme={currentTheme} active={abaAtiva === 'home'} onClick={() => setAbaAtiva('home')}>
            <Home /> Início
          </NavItem>

          {canSeeAgenda && (
            <NavItem $theme={currentTheme} active={abaAtiva === 'agenda'} onClick={() => setAbaAtiva('agenda')}>
              <Calendar /> {role === 'collaborator' ? 'Minha Agenda' : 'Agenda'}
            </NavItem>
          )}

          {canSeeCashier && (
            <NavItem $theme={currentTheme} active={abaAtiva === 'caixa'} onClick={() => setAbaAtiva('caixa')}>
              <DollarSign /> {role === 'client' ? 'Pagamento' : 'Caixa / Vendas'}
            </NavItem>
          )}

          {canSeeClients && (
            <NavItem $theme={currentTheme} active={abaAtiva === 'clientes'} onClick={() => setAbaAtiva('clientes')}>
              <Users /> Clientes
            </NavItem>
          )}

          {canSeeDashboard && (
            <NavItem $theme={currentTheme} active={abaAtiva === 'dashboard'} onClick={() => setAbaAtiva('dashboard')}>
              <BarChart3 /> {role === 'admin' ? 'Gestão ADM' : role === 'collaborator' ? 'Meu Painel' : 'Meu Painel'}
            </NavItem>
          )}
        </NavMenu>

        <FooterNav $theme={currentTheme}>
          {canSeeClosing && (
            <NavItem 
              $theme={currentTheme}
              variant="danger" 
              active={abaAtiva === 'fechamento'} 
              onClick={() => setAbaAtiva('fechamento')}
            >
              <Lock /> Fechar Caixa
            </NavItem>
          )}

          {canSeeConfig && (
            <NavItem $theme={currentTheme} active={abaAtiva === 'config'} onClick={() => setAbaAtiva('config')}>
              <Settings /> Configurações
            </NavItem>
          )}

          <NavItem $theme={currentTheme} onClick={logout}>
            <LogOut /> Sair
          </NavItem>
        </FooterNav>
      </Sidebar>

      <MainContent $theme={currentTheme}>
        {children}
      </MainContent>
    </AppGrid>
  );
};