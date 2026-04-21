import { useState } from 'react';
import styled, { createGlobalStyle, keyframes, css } from 'styled-components';
import { MainLayout } from './components/Layout/MainLayout';
import { LoginView } from './pages/LoginView';
import { Agenda } from './views/Agenda';
import { CashierView } from './views/CashierView'; 
import { ClientsView } from './views/ClientsView';
import { AdminDashboardView, CollaboratorDashboardView, ClientDashboardView } from './views/RoleDashboards';
import { ConfigView } from './views/ConfigView';
import { ClosureView } from './views/ClosureView';
import { LayoutGrid, Calendar, LogOut, ChevronRight, DollarSign } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';

// --- ESTILOS GLOBAIS ---
const GlobalStyle = createGlobalStyle<{ $theme?: any }>`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  body {
    background-color: ${props => props.$theme?.colors.background || '#050505'};
    color: ${props => props.$theme?.colors.text || '#ffffff'};
    font-family: ${props => props.$theme?.typography.fontFamily || "'Inter', sans-serif"};
    overflow-x: hidden;
  }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: ${props => props.$theme?.colors.background || '#050505'}; }
  ::-webkit-scrollbar-thumb { background: ${props => props.$theme?.colors.primary || '#d4af37'}; border-radius: 10px; }
`;

// --- ANIMAÇÕES ---
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideBg = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// --- COMPONENTES DE ESTILO ---
const PageWrapper = styled.div`
  animation: ${fadeIn} 0.5s ease-out;
  width: 100%;
  min-height: 100vh;
`;

const HomeContainer = styled.div<{ $theme: any }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 85vh;
  text-align: center;
  padding: 20px;
  background: radial-gradient(circle at center, ${(props) => `${props.$theme.colors.primary}22`} 0%, transparent 70%);
`;

const Badge = styled.span<{ $theme: any }>`
  background: ${(props) => `${props.$theme.colors.primary}22`};
  color: ${(props) => props.$theme.colors.primary};
  padding: 6px 16px;
  border-radius: 50px;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 2px;
  margin-bottom: 20px;
  border: 1px solid ${(props) => `${props.$theme.colors.primary}44`};
`;

const MainTitle = styled.h1<{ $theme: any }>`
  font-size: clamp(3rem, 10vw, 5.5rem);
  font-weight: 900;
  letter-spacing: -2px;
  line-height: 1;
  margin-bottom: 15px;
  background: linear-gradient(
    to right,
    ${(props) => props.$theme.colors.text} 20%,
    ${(props) => props.$theme.colors.primary} 50%,
    ${(props) => props.$theme.colors.text} 80%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ${slideBg} 5s linear infinite;

  span {
    -webkit-text-stroke: 1px ${(props) => props.$theme.colors.text};
    -webkit-text-fill-color: transparent;
  }
`;

const Subtitle = styled.p<{ $theme?: any }>`
  color: ${(props) => props.$theme?.colors.textSecondary || '#888'};
  font-size: 1.1rem;
  max-width: 600px;
  line-height: 1.6;
  margin-bottom: 40px;
`;

const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  width: 100%;
  max-width: 900px;
  margin-top: 20px;
`;

const QuickButton = styled.button<{ $variant?: 'gold' | 'dark' | 'danger'; $theme: any }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 25px;
  border-radius: 16px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255,255,255,0.05);
  
  ${props => props.$variant === 'gold' && css`
    background: ${props.$theme.colors.primary};
    color: ${props.$theme.colors.background};
    &:hover { transform: translateY(-5px); box-shadow: 0 10px 20px ${props.$theme.colors.primary}44; }
  `}

  ${props => props.$variant === 'dark' && css`
    background: ${props.$theme.colors.secondary};
    color: ${props.$theme.colors.text};
    &:hover {
      background: ${props.$theme.colors.tertiary};
      border-color: ${props.$theme.colors.primary};
      transform: translateY(-5px);
    }
  `}

  ${props => props.$variant === 'danger' && css`
    background: ${props.$theme.colors.danger}14;
    color: ${props.$theme.colors.danger};
    border-color: ${props.$theme.colors.danger}33;
    &:hover { background: ${props.$theme.colors.danger}22; transform: translateY(-5px); }
  `}
`;

function AppContent() {
  const [abaAtiva, setAbaAtiva] = useState('home');
  const [dadosPagamento, setDadosPagamento] = useState<any>(null);
  const { isAuthenticated, user } = useAuth();
  const { currentTheme } = useTheme();

  if (!isAuthenticated) {
    return (
      <>
        <GlobalStyle $theme={currentTheme} />
        <LoginView />
      </>
    );
  }

  // 1. Recebe os dados da Agenda e pula para o Caixa
  const enviarParaOCaixa = (dados: any) => {
    setDadosPagamento(dados);
    setAbaAtiva('caixa');
  };

  // 2. Limpa o estado e volta para a agenda após sucesso no caixa
  const finalizarFluxoCaixa = () => {
    setDadosPagamento(null);
    setAbaAtiva('agenda'); 
  };

  const renderConteudo = () => {
    const role = user?.role || 'client';

    switch (abaAtiva) {
      case 'home':
        return (
          <HomeContainer $theme={currentTheme}>
            <Badge $theme={currentTheme}>SISTEMA DE GESTÃO PROFISSIONAL</Badge>
            <MainTitle $theme={currentTheme}>BARBER <span>PRO</span></MainTitle>
            <Subtitle $theme={currentTheme}>
              Controle sua barbearia com a precisão de uma navalha. 
              Agendamentos inteligentes e financeiro em tempo real para todo o time.
            </Subtitle>
            
            <ActionGrid>
              {(role === 'admin' || role === 'collaborator') && (
                <QuickButton $theme={currentTheme} $variant="gold" onClick={() => setAbaAtiva('agenda')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Calendar size={20} /> ABRIR AGENDA
                  </div>
                  <ChevronRight size={18} />
                </QuickButton>
              )}

              {(role === 'admin' || role === 'client') && (
                <QuickButton $theme={currentTheme} $variant="dark" onClick={() => { setDadosPagamento(null); setAbaAtiva('caixa'); }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <DollarSign size={20} /> {role === 'client' ? 'PAGAMENTO' : 'CAIXA / PDV'}
                  </div>
                  <ChevronRight size={18} />
                </QuickButton>
              )}

              <QuickButton $theme={currentTheme} $variant="dark" onClick={() => setAbaAtiva('dashboard')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <LayoutGrid size={20} /> DASHBOARD
                </div>
                <ChevronRight size={18} />
              </QuickButton>

              {role === 'admin' && (
                <QuickButton $theme={currentTheme} $variant="danger" onClick={() => setAbaAtiva('fechamento')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <LogOut size={20} /> FECHAR DIA
                  </div>
                  <ChevronRight size={18} />
                </QuickButton>
              )}
            </ActionGrid>
          </HomeContainer>
        );
      
      case 'agenda': 
        return role === 'admin' || role === 'collaborator'
          ? <Agenda onFinalizarAtendimento={enviarParaOCaixa} />
          : <HomeContainer $theme={currentTheme}><Subtitle $theme={currentTheme}>Acesso restrito para este perfil.</Subtitle></HomeContainer>;
      
      case 'caixa': 
        return (
          <CashierView 
            dadosIniciais={dadosPagamento} 
            onSuccess={finalizarFluxoCaixa} 
          />
        );
      
      case 'clientes': 
        return role === 'admin'
          ? <ClientsView />
          : <HomeContainer $theme={currentTheme}><Subtitle $theme={currentTheme}>Acesso restrito para este perfil.</Subtitle></HomeContainer>;
      
      case 'dashboard': 
        if (role === 'admin') return <AdminDashboardView />;
        if (role === 'collaborator') return <CollaboratorDashboardView />;
        return <ClientDashboardView />;
      
      case 'config': 
        return <ConfigView />;
      
      case 'fechamento': 
        return role === 'admin'
          ? <ClosureView />
          : <HomeContainer $theme={currentTheme}><Subtitle $theme={currentTheme}>Acesso restrito para este perfil.</Subtitle></HomeContainer>;
      
      default: 
        return null;
    }
  };

  return (
    <>
      <GlobalStyle $theme={currentTheme} />
      {/* 3. Passamos setAbaAtiva para o Layout para que o menu lateral também funcione */}
      <MainLayout abaAtiva={abaAtiva} setAbaAtiva={(novaAba: string) => {
        // Se mudar de aba pelo menu, limpamos dados pendentes de pagamento por segurança
        if (novaAba !== 'caixa') setDadosPagamento(null);
        setAbaAtiva(novaAba);
      }}>
        <PageWrapper key={abaAtiva}>
          {renderConteudo()}
        </PageWrapper>
      </MainLayout>
    </>
  );
}

function App() {
  return <AppContent />;
}

export default App;