import { ReactNode } from 'react';
import styled from 'styled-components';
import { 
  Scissors, Calendar, DollarSign, Users, 
  Settings, BarChart3, Lock, Home 
} from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
  abaAtiva: string;
  setAbaAtiva: (aba: string) => void;
}

const AppGrid = styled.div`
  display: grid;
  grid-template-columns: 260px 1fr;
  height: 100vh;
  width: 100vw;
  background-color: #050505;
  color: #fff;
  overflow: hidden;
`;

const Sidebar = styled.aside`
  background-color: #080808;
  border-right: 1px solid #151515;
  display: flex;
  flex-direction: column;
  padding: 30px 20px;
  z-index: 10;
`;

const LogoArea = styled.div`
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
    color: #fff; 
    letter-spacing: 2px;
    text-transform: uppercase;

    strong {
      color: #d4af37;
    }
  }
`;

const NavMenu = styled.nav` 
  display: flex; 
  flex-direction: column; 
  gap: 8px; 
  flex: 1; 
`;

const NavItem = styled.button<{ active?: boolean; variant?: 'danger' | 'default' }>`
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
    if (props.active) return props.variant === 'danger' ? '#ff4d4d' : '#d4af37';
    return 'transparent';
  }};
  
  color: ${props => props.active ? '#000' : '#888'};
  
  &:hover { 
    background: ${props => {
      if (props.active) return props.variant === 'danger' ? '#ff3333' : '#d4af37';
      return '#111';
    }}; 
    color: ${props => props.active ? '#000' : '#fff'};
    transform: translateX(5px);
  }

  svg {
    width: 20px;
    height: 20px;
    transition: 0.3s;
    color: ${props => {
      if (props.active) return '#000';
      return props.variant === 'danger' ? '#ff4d4d' : '#d4af37';
    }};
  }
`;

const MainContent = styled.main` 
  height: 100%;
  width: 100%;
  position: relative;
  overflow-y: auto; 
  background-color: #050505;

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: #050505; }
  &::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
  &::-webkit-scrollbar-thumb:hover { background: #d4af37; }
`;

const FooterNav = styled.div`
  border-top: 1px solid #151515;
  padding-top: 20px;
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const MainLayout = ({ children, abaAtiva, setAbaAtiva }: MainLayoutProps) => {
  return (
    <AppGrid>
      <Sidebar>
        <LogoArea onClick={() => setAbaAtiva('home')}>
          <Scissors color="#d4af37" size={28} strokeWidth={2.5} />
          <span>BARBER <strong>PRO</strong></span>
        </LogoArea>

        <NavMenu>
          <NavItem active={abaAtiva === 'home'} onClick={() => setAbaAtiva('home')}>
            <Home /> Início
          </NavItem>

          <NavItem active={abaAtiva === 'agenda'} onClick={() => setAbaAtiva('agenda')}>
            <Calendar /> Agenda
          </NavItem>
          
          <NavItem active={abaAtiva === 'caixa'} onClick={() => setAbaAtiva('caixa')}>
            <DollarSign /> Caixa / Vendas
          </NavItem>

          <NavItem active={abaAtiva === 'clientes'} onClick={() => setAbaAtiva('clientes')}>
            <Users /> Clientes
          </NavItem>

          <NavItem active={abaAtiva === 'dashboard'} onClick={() => setAbaAtiva('dashboard')}>
            <BarChart3 /> Gestão ADM
          </NavItem>
        </NavMenu>

        <FooterNav>
          <NavItem 
            variant="danger" 
            active={abaAtiva === 'fechamento'} 
            onClick={() => setAbaAtiva('fechamento')}
          >
            <Lock /> Fechar Caixa
          </NavItem>

          <NavItem active={abaAtiva === 'config'} onClick={() => setAbaAtiva('config')}>
            <Settings /> Configurações
          </NavItem>
        </FooterNav>
      </Sidebar>

      <MainContent>
        {children}
      </MainContent>
    </AppGrid>
  );
};