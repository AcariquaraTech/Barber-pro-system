import { useState } from 'react';
import styled, { createGlobalStyle, keyframes, css } from 'styled-components';
import { MainLayout } from './components/Layout/MainLayout';
import { Agenda } from './views/Agenda';
import { CashierView } from './views/CashierView'; 
import { ClientsView } from './views/ClientsView';
import { DashboardView } from './views/DashboardView';
import { ConfigView } from './views/ConfigView';
import { ClosureView } from './views/ClosureView';
import { LayoutGrid, Calendar, LogOut, ChevronRight, DollarSign } from 'lucide-react';

// --- ESTILOS GLOBAIS ---
const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  body {
    background-color: #050505;
    color: #ffffff;
    font-family: 'Inter', sans-serif;
    overflow-x: hidden;
  }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #050505; }
  ::-webkit-scrollbar-thumb { background: #d4af37; border-radius: 10px; }
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

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 85vh;
  text-align: center;
  padding: 20px;
  background: radial-gradient(circle at center, rgba(212, 175, 55, 0.05) 0%, transparent 70%);
`;

const Badge = styled.span`
  background: rgba(212, 175, 55, 0.1);
  color: #d4af37;
  padding: 6px 16px;
  border-radius: 50px;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 2px;
  margin-bottom: 20px;
  border: 1px solid rgba(212, 175, 55, 0.2);
`;

const MainTitle = styled.h1`
  font-size: clamp(3rem, 10vw, 5.5rem);
  font-weight: 900;
  letter-spacing: -2px;
  line-height: 1;
  margin-bottom: 15px;
  background: linear-gradient(to right, #fff 20%, #d4af37 50%, #fff 80%);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ${slideBg} 5s linear infinite;

  span {
    -webkit-text-stroke: 1px #fff;
    -webkit-text-fill-color: transparent;
  }
`;

const Subtitle = styled.p`
  color: #888;
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

const QuickButton = styled.button<{ $variant?: 'gold' | 'dark' | 'danger' }>`
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
    background: #d4af37;
    color: #000;
    &:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(212, 175, 55, 0.2); }
  `}

  ${props => props.$variant === 'dark' && css`
    background: #111;
    color: #fff;
    &:hover { background: #1a1a1a; border-color: #d4af37; transform: translateY(-5px); }
  `}

  ${props => props.$variant === 'danger' && css`
    background: rgba(255, 77, 77, 0.05);
    color: #ff4d4d;
    border-color: rgba(255, 77, 77, 0.1);
    &:hover { background: rgba(255, 77, 77, 0.1); transform: translateY(-5px); }
  `}
`;

function App() {
  const [abaAtiva, setAbaAtiva] = useState('home');
  const [dadosPagamento, setDadosPagamento] = useState<any>(null);

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
    switch (abaAtiva) {
      case 'home':
        return (
          <HomeContainer>
            <Badge>SISTEMA DE GESTÃO PROFISSIONAL</Badge>
            <MainTitle>BARBER <span>PRO</span></MainTitle>
            <Subtitle>
              Controle sua barbearia com a precisão de uma navalha. 
              Agendamentos inteligentes, financeiro em tempo real e fidelização de elite.
            </Subtitle>
            
            <ActionGrid>
              <QuickButton $variant="gold" onClick={() => setAbaAtiva('agenda')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Calendar size={20} /> ABRIR AGENDA
                </div>
                <ChevronRight size={18} />
              </QuickButton>

              <QuickButton $variant="dark" onClick={() => { setDadosPagamento(null); setAbaAtiva('caixa'); }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <DollarSign size={20} /> CAIXA / PDV
                </div>
                <ChevronRight size={18} />
              </QuickButton>

              <QuickButton $variant="dark" onClick={() => setAbaAtiva('dashboard')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <LayoutGrid size={20} /> DASHBOARD
                </div>
                <ChevronRight size={18} />
              </QuickButton>

              <QuickButton $variant="danger" onClick={() => setAbaAtiva('fechamento')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <LogOut size={20} /> FECHAR DIA
                </div>
                <ChevronRight size={18} />
              </QuickButton>
            </ActionGrid>
          </HomeContainer>
        );
      
      case 'agenda': 
        return <Agenda onFinalizarAtendimento={enviarParaOCaixa} />;
      
      case 'caixa': 
        return (
          <CashierView 
            dadosIniciais={dadosPagamento} 
            onSuccess={finalizarFluxoCaixa} 
          />
        );
      
      case 'clientes': 
        return <ClientsView />;
      
      case 'dashboard': 
        return <DashboardView />;
      
      case 'config': 
        return <ConfigView />;
      
      case 'fechamento': 
        return <ClosureView />;
      
      default: 
        return null;
    }
  };

  return (
    <>
      <GlobalStyle />
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

export default App;