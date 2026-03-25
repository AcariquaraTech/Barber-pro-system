import { useState, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import { 
   Users, DollarSign, ArrowUpRight, 
  Calendar, Star, MapPin, LayoutDashboard, 
  Globe, Clock, Activity 
} from 'lucide-react';
import { backendApi, type SaleRecord } from '../services/backend';

// --- ESTILOS ---
const Container = styled.div`
  padding: 40px;
  background-color: #050505;
  min-height: 100vh;
  color: white;
  font-family: 'Inter', sans-serif;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  flex-wrap: wrap;
  gap: 20px;
`;

const Controls = styled.div`
  display: flex;
  gap: 15px;
`;

const UnitSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: #0a0a0a;
  padding: 8px 16px;
  border-radius: 12px;
  border: 1px solid #1a1a1a;
  
  select {
    background: transparent;
    color: white;
    border: none;
    outline: none;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    appearance: none;
    option { background: #0a0a0a; color: white; }
  }
`;

const GridTop = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  background: #0a0a0a;
  padding: 25px;
  border-radius: 20px;
  border: 1px solid #111;

  .label-group {
    display: flex;
    justify-content: space-between;
    span { color: #555; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
    .icon { color: #d4af37; opacity: 0.6; }
  }
  h2 { font-size: 1.6rem; margin: 12px 0 4px 0; font-weight: 900; }
  .trend { font-size: 0.7rem; font-weight: 700; color: #00ff88; display: flex; align-items: center; gap: 4px; }
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 380px;
  gap: 25px;
  margin-bottom: 25px;
  @media (max-width: 1300px) { grid-template-columns: 1fr 1fr; }
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`;

const Card = styled.div`
  background: #0a0a0a;
  padding: 25px;
  border-radius: 24px;
  border: 1px solid #111;
  h3 { font-size: 0.85rem; font-weight: 800; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; color: #efefef; }
`;

const PeakChart = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 140px;
  padding-top: 20px;
  gap: 4px;
`;

// Usamos $height com prefixo para o Styled Components não passar para o HTML (evita erro no console)
const PeakBar = styled.div<{ $percent: number }>`
  flex: 1;
  height: ${props => Math.max(props.$percent, 10)}%;
  background: ${props => props.$percent > 60 ? '#d4af37' : '#1a1a1a'};
  border-radius: 4px;
  transition: 0.3s ease;
  &:hover { background: #d4af37; opacity: 0.8; }
`;

const ProgressRow = styled.div`
  margin-bottom: 20px;
  .info { display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 8px; }
  .bar-bg { height: 8px; background: #111; border-radius: 10px; overflow: hidden; }
  .bar-fill { height: 100%; background: #d4af37; border-radius: 10px; transition: width 1s ease-in-out; }
`;

// --- COMPONENTE ---
export const DashboardView = () => {
  const [selectedUnit, setSelectedUnit] = useState('all');
  const [period, setPeriod] = useState('mensal');
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const units = ['Matriz Center', 'Shopping Barber', 'Barra Premium', 'Vila Gold'];

  useEffect(() => {
    const loadSales = async () => {
      try {
        const data = await backendApi.listSales();
        setSales(data);
      } catch (error) {
        console.error('Falha ao carregar vendas do backend:', error);
      }
    };

    loadSales();
  }, []);

  // Dados Simulados ou LocalStorage
  const rawData = useMemo(() => {
    return sales.map(v => ({
      ...v,
      valor: Number(v.valor || 0),
      unidade: v.unidade || units[0],
      hora: v.hora || '14:00'
    }));
  }, [sales]);

  const filtered = useMemo(() => {
    return selectedUnit === 'all' ? rawData : rawData.filter((v: any) => v.unidade === selectedUnit);
  }, [rawData, selectedUnit]);

  const metrics = useMemo(() => {
    const total = filtered.reduce((acc, v) => acc + v.valor, 0);
    
    // Performance Barbeiros
    const bMap: any = {};
    filtered.forEach((v: any) => {
      const n = v.barbeiro || 'Equipe';
      if (!bMap[n]) bMap[n] = { name: n, total: 0, count: 0 };
      bMap[n].total += v.valor;
      bMap[n].count += 1;
    });

    // Pico de Horário (Gráfico de barras)
    const hours = new Array(12).fill(0);
    filtered.forEach((v: any) => {
      const h = parseInt(v.hora.split(':')[0]);
      if (h >= 9 && h <= 20) hours[h - 9]++;
    });
    const maxHour = Math.max(...hours) || 1;

    return {
      total,
      atendimentos: filtered.length,
      ticket: filtered.length > 0 ? total / filtered.length : 0,
      ranking: Object.values(bMap).sort((a: any, b: any) => b.total - a.total).slice(0, 4),
      peak: hours.map(h => (h / maxHour) * 100),
      unidades: units.map(u => ({
        name: u,
        val: rawData.filter(v => v.unidade === u).reduce((acc, v) => acc + v.valor, 0)
      }))
    };
  }, [filtered, rawData]);

  return (
    <Container>
      <Header>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-1.5px', margin: 0 }}>
            DASHBOARD <span style={{ color: '#d4af37' }}>EXECUTIVE</span>
          </h1>
          <p style={{ color: '#555', fontWeight: 600, fontSize: '0.8rem', marginTop: '5px' }}>
            Controle de Performance Multiusuário
          </p>
        </div>

        <Controls>
          <UnitSelector>
            <Calendar size={16} color="#d4af37" />
            <select value={period} onChange={e => setPeriod(e.target.value)}>
              <option value="mensal">Faturamento Mensal</option>
              <option value="semanal">Faturamento Semanal</option>
              <option value="anual">Faturamento Anual</option>
            </select>
          </UnitSelector>
          
          <UnitSelector>
            <MapPin size={16} color="#d4af37" />
            <select value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)}>
              <option value="all">Rede Completa</option>
              {units.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </UnitSelector>
        </Controls>
      </Header>

      <GridTop>
        <StatCard>
          <div className="label-group"><span>Receita {period}</span><DollarSign size={16} className="icon"/></div>
          <h2>R$ {metrics.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
          <div className="trend"><ArrowUpRight size={14}/> +12% vs anterior</div>
        </StatCard>
        
        <StatCard>
          <div className="label-group"><span>Atendimentos</span><Users size={16} className="icon"/></div>
          <h2>{metrics.atendimentos}</h2>
          <div className="trend"><ArrowUpRight size={14}/> Fluxo estável</div>
        </StatCard>
        
        <StatCard>
          <div className="label-group"><span>Ticket Médio</span><Activity size={16} className="icon"/></div>
          <h2>R$ {metrics.ticket.toFixed(2)}</h2>
          <div className="trend" style={{ color: '#d4af37' }}>Foco em Upsell</div>
        </StatCard>
        
        <StatCard>
          <div className="label-group"><span>Unidades Ativas</span><Globe size={16} className="icon"/></div>
          <h2>{selectedUnit === 'all' ? units.length : '1'}</h2>
          <div className="trend">Monitoramento Real</div>
        </StatCard>
      </GridTop>

      <MainGrid>
        <Card>
          <h3><Clock size={18} color="#d4af37"/> Pico de Horário (Fluxo)</h3>
          <PeakChart>
            {metrics.peak.map((p, i) => <PeakBar key={i} $percent={p} />)}
          </PeakChart>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', color: '#444', fontSize: '0.7rem', fontWeight: 700 }}>
            <span>09h</span><span>12h</span><span>15h</span><span>18h</span><span>21h</span>
          </div>
        </Card>

        <Card>
          <h3><Star size={18} color="#d4af37"/> Performance da Equipe</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#444', fontSize: '0.6rem', borderBottom: '1px solid #111' }}>
                <th style={{ paddingBottom: '10px' }}>BARBEIRO</th>
                <th style={{ paddingBottom: '10px' }}>QTD</th>
                <th style={{ paddingBottom: '10px' }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {metrics.ranking.map((b: any, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #0a0a0a' }}>
                  <td style={{ padding: '15px 0', fontSize: '0.8rem', fontWeight: 700 }}>{b.name}</td>
                  <td style={{ fontSize: '0.8rem', color: '#888' }}>{b.count}</td>
                  <td style={{ color: '#d4af37', fontWeight: 900, fontSize: '0.85rem' }}>R$ {b.total.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <h3><LayoutDashboard size={18} color="#d4af37"/> Receita por Unidade</h3>
          {metrics.unidades.map((u, i) => (
            <ProgressRow key={i}>
              <div className="info">
                <span style={{ fontWeight: 600 }}>{u.name}</span>
                <span style={{ fontWeight: 900, color: '#d4af37' }}>R$ {u.val.toLocaleString()}</span>
              </div>
              <div className="bar-bg">
                <div className="bar-fill" style={{ width: `${(u.val / (metrics.total || 1)) * 100}%` }} />
              </div>
            </ProgressRow>
          ))}
        </Card>
      </MainGrid>
    </Container>
  );
};