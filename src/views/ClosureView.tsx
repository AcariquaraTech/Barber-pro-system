import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  Lock, Printer, Users, 
  Calculator, AlertTriangle, ArrowDownCircle, ArrowUpCircle, DollarSign, Plus
} from 'lucide-react';

// --- ESTILOS ---
const Container = styled.div`
  padding: 40px;
  max-width: 1100px;
  margin: 0 auto;
  color: white;
  @media print { padding: 0; background: white; color: black; }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 40px;
  @media print { display: none; }
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
`;

const StatCard = styled.div<{ color?: string }>`
  background: #0d0d0d;
  padding: 25px;
  border-radius: 20px;
  border: 1px solid #1a1a1a;
  
  label { color: #555; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; display: block; margin-bottom: 10px; }
  .value { font-size: 1.8rem; font-weight: 900; color: ${props => props.color || '#fff'}; }
  .detail { color: #d4af37; font-size: 0.8rem; margin-top: 5px; font-weight: 600; }
`;

const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 40px;
  @media print { display: none; }
`;

const MiniCard = styled.div<{ type: 'sangria' | 'reforço' }>`
  background: #0a0a0a;
  padding: 20px;
  border-radius: 18px;
  border: 1px solid #111;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: 0.3s;
  &:hover { 
    border-color: ${props => props.type === 'sangria' ? '#ff4d4d' : '#4dff88'};
    transform: translateY(-3px);
  }
`;

const TableCard = styled.div`
  background: #0a0a0a;
  border-radius: 24px;
  border: 1px solid #111;
  overflow: hidden;
  margin-bottom: 30px;
  @media print { border: 1px solid #eee; background: white; color: black; }
`;

const TableHeader = styled.div`
  padding: 20px 30px;
  background: #111;
  border-bottom: 1px solid #1a1a1a;
  display: flex;
  justify-content: space-between;
  align-items: center;
  h3 { font-size: 1rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  th { text-align: left; padding: 20px 30px; color: #444; font-size: 0.7rem; text-transform: uppercase; border-bottom: 1px solid #111; }
  td { padding: 20px 30px; border-bottom: 1px solid #0f0f0f; font-size: 0.9rem; }
  tr:last-child td { border: none; }
`;

const Badge = styled.span`
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 800;
  background: #1a1a1a;
  color: #d4af37;
  text-transform: uppercase;
  border: 1px solid #222;
`;

const CloseButton = styled.button`
  background: #ff4d4d;
  color: #fff;
  border: none;
  padding: 15px 30px;
  border-radius: 12px;
  font-weight: 900;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: 0.3s;
  &:hover { transform: scale(1.05); background: #ff3333; }
`;

export const ClosureView = () => {
  const [report, setReport] = useState<any>({
    vendas: [],
    porBarbeiro: {},
    porMetodo: {},
    faturamento: 0,
    totalFidelidade: 0
  });
  const [movimentacoes, setMovimentacoes] = useState<any[]>([]);

  const carregarDados = () => {
    const historicoDia = JSON.parse(localStorage.getItem('@barberpro:vendas') || '[]');
    const movs = JSON.parse(localStorage.getItem('@barberpro:movimentacoes') || '[]');
    setMovimentacoes(movs);
    
    const analise = historicoDia.reduce((acc: any, venda: any) => {
      // CORREÇÃO: Usando 'venda' em vez de 'v'
      const valorFinal = venda.valorTotal || venda.valor || 0;

      if (!acc.porBarbeiro[venda.barbeiro]) {
        acc.porBarbeiro[venda.barbeiro] = { soma: 0, qtd: 0, servicos: [] };
      }
      acc.porBarbeiro[venda.barbeiro].soma += valorFinal;
      acc.porBarbeiro[venda.barbeiro].qtd += 1;
      acc.porBarbeiro[venda.barbeiro].servicos.push(venda.servico);

      acc.porMetodo[venda.metodo] = (acc.porMetodo[venda.metodo] || 0) + valorFinal;
      
      if (venda.isGratis) acc.totalFidelidade += 1;

      acc.faturamento += valorFinal;
      return acc;
    }, { porBarbeiro: {}, porMetodo: {}, faturamento: 0, totalFidelidade: 0 });

    setReport({ ...analise, vendas: historicoDia });
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const totalMov = movimentacoes.reduce((acc, m) => m.tipo === 'sangria' ? acc - m.valor : acc + m.valor, 0);
  const saldoFinal = report.faturamento + totalMov;

  const handleMovimentacao = (tipo: 'sangria' | 'reforço') => {
    const valor = prompt(`Valor da ${tipo.toUpperCase()}:`);
    const motivo = prompt(`Motivo/Descrição da ${tipo.toUpperCase()}:`);
    
    if (valor && motivo) {
      const novaMov = { 
        id: Date.now(), 
        tipo, 
        valor: Number(valor.replace(',', '.')), 
        motivo, 
        hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) 
      };
      const atualizadas = [...movimentacoes, novaMov];
      setMovimentacoes(atualizadas);
      localStorage.setItem('@barberpro:movimentacoes', JSON.stringify(atualizadas));
    }
  };

  const handleZerarCaixa = () => {
    if (report.vendas.length === 0 && movimentacoes.length === 0) {
        return alert("Não há movimentações para fechar hoje.");
    }

    if (window.confirm("CONFIRMAR FECHAMENTO? Os dados serão enviados para o histórico permanente e o caixa será zerado.")) {
      const historicoGeral = JSON.parse(localStorage.getItem('@barberpro:historico_geral') || '[]');
      
      const resumoHoje = {
        id: Date.now(),
        data: new Date().toLocaleDateString('pt-BR'),
        timestamp: new Date().toISOString(),
        faturamentoBruto: report.faturamento,
        totalSangrias: movimentacoes.filter(m => m.tipo === 'sangria').reduce((a, b) => a + b.valor, 0),
        saldoFinal: saldoFinal,
        vendas: report.vendas,
        movimentacoes: movimentacoes,
        servicosGratis: report.totalFidelidade
      };

      localStorage.setItem('@barberpro:historico_geral', JSON.stringify([...historicoGeral, resumoHoje]));
      localStorage.setItem('@barberpro:vendas', '[]');
      localStorage.setItem('@barberpro:movimentacoes', '[]');
      
      alert("Caixa fechado com sucesso!");
      window.location.href = '/'; 
    }
  };

  return (
    <Container>
      <Header>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 950 }}>Fechar <span style={{ color: '#d4af37' }}>Caixa</span></h1>
          <p style={{ color: '#555', fontWeight: 600 }}>Revise as finanças antes de encerrar o expediente.</p>
        </div>
        <button 
          onClick={() => window.print()}
          style={{ background: '#111', border: '1px solid #222', color: '#fff', padding: '12px 25px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
          <Printer size={18} /> IMPRIMIR RELATÓRIO
        </button>
      </Header>

      <SummaryGrid>
        <StatCard>
          <label>Vendas Totais</label>
          <div className="value">R$ {report.faturamento.toFixed(2)}</div>
          <div className="detail">{report.vendas.length} atendimentos</div>
        </StatCard>
        <StatCard color={totalMov < 0 ? '#ff4d4d' : '#4dff88'}>
          <label>Movimentações Extras</label>
          <div className="value">R$ {totalMov.toFixed(2)}</div>
          <div className="detail">{movimentacoes.length} entradas/saídas</div>
        </StatCard>
        <StatCard color="#d4af37">
          <label>Saldo Líquido</label>
          <div className="value">R$ {saldoFinal.toFixed(2)}</div>
          <div className="detail">Total em mãos/conta</div>
        </StatCard>
        <StatCard color="#00ff88">
          <label>Prêmios Fidelidade</label>
          <div className="value">{report.totalFidelidade}</div>
          <div className="detail">Serviços grátis hoje</div>
        </StatCard>
      </SummaryGrid>

      <ActionGrid>
        <MiniCard type="reforço" onClick={() => handleMovimentacao('reforço')}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <ArrowUpCircle color="#4dff88" size={32} />
            <div>
              <div style={{ fontWeight: 800 }}>REFORÇO / ENTRADA</div>
              <small style={{ color: '#444' }}>Adicionar troco ao caixa</small>
            </div>
          </div>
          <Plus size={20} color="#333" />
        </MiniCard>
        <MiniCard type="sangria" onClick={() => handleMovimentacao('sangria')}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <ArrowDownCircle color="#ff4d4d" size={32} />
            <div>
              <div style={{ fontWeight: 800 }}>SANGRIA / RETIRADA</div>
              <small style={{ color: '#444' }}>Retirar dinheiro para despesas</small>
            </div>
          </div>
          <Plus size={20} color="#333" />
        </MiniCard>
      </ActionGrid>

      <TableCard>
        <TableHeader>
          <h3>Produção da Equipe</h3>
          <Users size={18} color="#d4af37" />
        </TableHeader>
        <Table>
          <thead>
            <tr>
              <th>Barbeiro</th>
              <th>Atendimentos</th>
              <th>Principais Serviços</th>
              <th>Faturamento Bruto</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(report.porBarbeiro).map(([nome, dados]: any) => (
              <tr key={nome}>
                <td style={{ fontWeight: 700 }}>{nome}</td>
                <td>{dados.qtd}</td>
                <td style={{ color: '#666', fontSize: '0.8rem' }}>
                  {Array.from(new Set(dados.servicos)).slice(0, 3).join(', ')}...
                </td>
                <td style={{ fontWeight: 900, color: '#d4af37' }}>R$ {dados.soma.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableCard>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        <TableCard>
          <TableHeader>
            <h3>Faturamento por Método</h3>
            <Calculator size={18} color="#d4af37" />
          </TableHeader>
          <Table>
            <tbody>
              {Object.entries(report.porMetodo).map(([metodo, valor]: any) => (
                <tr key={metodo}>
                  <td><Badge>{metodo}</Badge></td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>R$ {valor.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableCard>

        <TableCard>
          <TableHeader>
            <h3>Log de Entradas/Saídas</h3>
            <DollarSign size={18} color="#d4af37" />
          </TableHeader>
          <Table>
            <tbody>
              {movimentacoes.map(m => (
                <tr key={m.id}>
                  <td style={{ color: m.tipo === 'sangria' ? '#ff4d4d' : '#4dff88', fontWeight: 800, fontSize: '0.7rem' }}>
                    {m.tipo.toUpperCase()}
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>{m.motivo}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>
                    {m.tipo === 'sangria' ? '-' : '+'} R$ {m.valor.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableCard>
      </div>

      <div style={{ marginTop: '60px', padding: '30px', border: '1px solid #1a1a1a', borderRadius: '24px', background: 'rgba(255, 77, 77, 0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ff4d4d', fontWeight: 900 }}>
            <AlertTriangle size={20} /> ENCERRAR DIA
          </h4>
          <p style={{ color: '#444', fontSize: '0.85rem', marginTop: '5px' }}>
            Isso limpará as vendas atuais e enviará tudo para a Gestão ADM.
          </p>
        </div>
        <CloseButton onClick={handleZerarCaixa}>
          <Lock size={18} /> CONFIRMAR E RESETAR
        </CloseButton>
      </div>
    </Container>
  );
};