import styled from 'styled-components';
import { CalendarDays, DollarSign, Scissors, Users, Wallet, Clock3, ShieldCheck, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Container = styled.div<{ $theme: any }>`
  padding: 32px;
  min-height: 100vh;
  background: linear-gradient(160deg, ${(props) => props.$theme.colors.background}, ${(props) => props.$theme.colors.secondary});
  color: ${(props) => props.$theme.colors.text};
`;

const Header = styled.div<{ $theme: any }>`
  margin-bottom: 24px;
  h1 {
    font-size: 2.1rem;
    margin: 0;
    letter-spacing: -0.8px;
  }
  p {
    margin: 8px 0 0;
    color: ${(props) => props.$theme.colors.textSecondary};
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
`;

const Card = styled.div<{ $theme: any }>`
  border: 1px solid ${(props) => `${props.$theme.colors.border}33`};
  border-radius: 16px;
  padding: 18px;
  background: radial-gradient(
      circle at top right,
      ${(props) => `${props.$theme.colors.primary}22`},
      transparent 60%
    ),
    ${(props) => props.$theme.colors.tertiary};

  h3 {
    margin: 0 0 6px;
    font-size: 1rem;
  }

  p {
    margin: 0;
    color: ${(props) => props.$theme.colors.textSecondary};
    font-size: 0.9rem;
  }
`;

const Value = styled.div<{ $theme: any }>`
  margin-top: 10px;
  font-size: 1.55rem;
  font-weight: 900;
  color: ${(props) => props.$theme.colors.primary};
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const AdminDashboardView = () => {
  const { currentTheme } = useTheme();
  return (
    <Container $theme={currentTheme}>
      <Header $theme={currentTheme}>
        <h1>Dashboard do Dono</h1>
        <p>Visão financeira, equipe e fechamento diário.</p>
      </Header>
      <Grid>
        <Card $theme={currentTheme}>
          <Row><Users size={18} color={currentTheme.colors.primary} /><h3>Colaboradores Ativos</h3></Row>
          <Value $theme={currentTheme}>8</Value>
          <p>Com escalas e horários monitorados.</p>
        </Card>
        <Card $theme={currentTheme}>
          <Row><DollarSign size={18} color={currentTheme.colors.primary} /><h3>Faturamento Hoje</h3></Row>
          <Value $theme={currentTheme}>R$ 2.450,00</Value>
          <p>Consolidado por método de pagamento.</p>
        </Card>
        <Card $theme={currentTheme}>
          <Row><Wallet size={18} color={currentTheme.colors.primary} /><h3>Caixa Disponível</h3></Row>
          <Value $theme={currentTheme}>R$ 1.980,00</Value>
          <p>Saldo operacional atual da unidade.</p>
        </Card>
        <Card $theme={currentTheme}>
          <Row><ShieldCheck size={18} color={currentTheme.colors.primary} /><h3>Ações do Dia</h3></Row>
          <Value $theme={currentTheme}>4 pendências</Value>
          <p>Fechamento, ajustes e aprovações.</p>
        </Card>
      </Grid>
    </Container>
  );
};

export const CollaboratorDashboardView = () => {
  const { currentTheme } = useTheme();
  return (
    <Container $theme={currentTheme}>
      <Header $theme={currentTheme}>
        <h1>Dashboard do Colaborador</h1>
        <p>Sua agenda, produtividade e serviços habilitados.</p>
      </Header>
      <Grid>
        <Card $theme={currentTheme}>
          <Row><CalendarDays size={18} color={currentTheme.colors.primary} /><h3>Agenda de Hoje</h3></Row>
          <Value $theme={currentTheme}>6 horários</Value>
          <p>3 confirmados e 3 reservados.</p>
        </Card>
        <Card $theme={currentTheme}>
          <Row><Clock3 size={18} color={currentTheme.colors.primary} /><h3>Próximo Atendimento</h3></Row>
          <Value $theme={currentTheme}>14:30</Value>
          <p>Corte social com João Alves.</p>
        </Card>
        <Card $theme={currentTheme}>
          <Row><Scissors size={18} color={currentTheme.colors.primary} /><h3>Serviços Cadastrados</h3></Row>
          <Value $theme={currentTheme}>5</Value>
          <p>Você pode editar seus próprios serviços.</p>
        </Card>
        <Card $theme={currentTheme}>
          <Row><Sparkles size={18} color={currentTheme.colors.primary} /><h3>Performance do Dia</h3></Row>
          <Value $theme={currentTheme}>R$ 620,00</Value>
          <p>Comissão estimada em atualização.</p>
        </Card>
      </Grid>
    </Container>
  );
};

export const ClientDashboardView = () => {
  const { currentTheme } = useTheme();
  return (
    <Container $theme={currentTheme}>
      <Header $theme={currentTheme}>
        <h1>Dashboard do Cliente</h1>
        <p>Escolha colaborador, serviço e acompanhe seus horários.</p>
      </Header>
      <Grid>
        <Card $theme={currentTheme}>
          <Row><CalendarDays size={18} color={currentTheme.colors.primary} /><h3>Próximo Horário</h3></Row>
          <Value $theme={currentTheme}>22/04 - 10:00</Value>
          <p>Com Felipe Silva para Corte + Barba.</p>
        </Card>
        <Card $theme={currentTheme}>
          <Row><Users size={18} color={currentTheme.colors.primary} /><h3>Colaboradores</h3></Row>
          <Value $theme={currentTheme}>8 disponíveis</Value>
          <p>Escolha pelo perfil e horário livre.</p>
        </Card>
        <Card $theme={currentTheme}>
          <Row><Scissors size={18} color={currentTheme.colors.primary} /><h3>Serviços</h3></Row>
          <Value $theme={currentTheme}>12 opções</Value>
          <p>Com duração e valores transparentes.</p>
        </Card>
        <Card $theme={currentTheme}>
          <Row><DollarSign size={18} color={currentTheme.colors.primary} /><h3>Pagamento</h3></Row>
          <Value $theme={currentTheme}>Pix / Cartão</Value>
          <p>Pague direto no fluxo da reserva.</p>
        </Card>
      </Grid>
    </Container>
  );
};
