import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  CreditCard, Banknote, CheckCircle, 
  Smartphone, Plus, Trash2, ShoppingBag 
} from 'lucide-react';

// --- ESTILOS ---
const Container = styled.div`
  width: 100%;
  height: calc(100vh - 70px);
  background: #080808;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  overflow: hidden;

  @media (max-width: 1100px) {
    height: auto;
    overflow-y: auto;
    align-items: flex-start;
  }
`;

const Wrapper = styled.div`
  width: 100%;
  max-width: 1200px;
  height: 100%;
  max-height: 850px;
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 30px;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
    max-height: none;
  }
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 25px;
  overflow-y: auto;
  padding-right: 10px;

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
`;

const GlassCard = styled.div`
  background: #111;
  border: 1px solid #1a1a1a;
  border-radius: 20px;
  padding: 30px;
`;

const ResumoHeader = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  border-left: 4px solid #d4af37;
  padding-left: 20px;

  .label { color: #555; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 1px; }
  .value { color: #fff; font-size: 1.1rem; font-weight: 600; }
`;

const PaymentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 15px;
`;

const MethodButton = styled.button<{ active: boolean }>`
  background: ${props => props.active ? '#d4af37' : '#0d0d0d'};
  border: 1px solid ${props => props.active ? '#fff' : '#1a1a1a'};
  border-radius: 16px;
  aspect-ratio: 1 / 0.85;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  span { color: ${props => props.active ? '#000' : '#888'}; font-weight: 900; font-size: 0.75rem; text-transform: uppercase; }
  svg { color: ${props => props.active ? '#000' : '#fff'}; width: 28px; height: 28px; }

  &:hover { transform: translateY(-5px); border-color: #d4af37; }
`;

const SidebarVenda = styled(GlassCard)`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: #0d0d0d;
  height: 100%;
`;

const TotalBox = styled.div`
  background: #d4af37;
  border-radius: 18px;
  padding: 30px;
  text-align: center;
  margin: 25px 0;

  small { color: #000; font-weight: 900; font-size: 0.75rem; text-transform: uppercase; opacity: 0.7; }
  div { color: #000; font-size: 3.2rem; font-weight: 950; letter-spacing: -2px; line-height: 1; margin-top: 5px; }
`;

const FinalizeButton = styled.button`
  width: 100%;
  padding: 22px;
  border-radius: 14px;
  background: #fff;
  color: #000;
  border: none;
  font-weight: 900;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  cursor: pointer;
  transition: 0.3s;
  text-transform: uppercase;

  &:hover { background: #d4af37; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(212, 175, 55, 0.2); }
  &:disabled { background: #222; color: #444; cursor: not-allowed; transform: none; }
`;

const ExtraItemRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 12px 15px;
  background: #151515;
  border-radius: 12px;
  margin-top: 10px;
  font-size: 0.9rem;
  border: 1px solid #1a1a1a;
`;

// --- INTERFACES ---
interface CashierProps {
  dadosIniciais: {
    cliente: string;
    servico: string;
    valor: number;
    barbeiro: string;
    idAgendamento?: string | number; // ID para vincular à agenda
    isGratis?: boolean;
  } | null;
  onSuccess: () => void; // Chamada ao terminar tudo
}

export const CashierView = ({ dadosIniciais, onSuccess }: CashierProps) => {
  const [metodo, setMetodo] = useState('pix');
  const [itensExtras, setItensExtras] = useState<any[]>([]);
  const [totalGeral, setTotalGeral] = useState(0);

  useEffect(() => {
    const valorBase = dadosIniciais?.valor || 0;
    const adicional = itensExtras.reduce((acc, item) => acc + (Number(item.price) || 0), 0);
    setTotalGeral(valorBase + adicional);
  }, [dadosIniciais, itensExtras]);

  const handleAddProdutoExtra = () => {
    const nome = prompt("Nome do produto/serviço extra:");
    const preco = prompt("Preço (ex: 25.00):");
    
    if (nome && preco) {
      const valorNum = parseFloat(preco.replace(',', '.'));
      if (isNaN(valorNum)) return alert("Preço inválido!");
      
      setItensExtras([...itensExtras, { 
        id: Date.now(), 
        name: nome, 
        price: valorNum 
      }]);
    }
  };

  const finalizarVenda = () => {
    if (!dadosIniciais) return;

    // 1. Criar o objeto da venda para o financeiro
    const vendaRealizada = {
      id: `venda-${Date.now()}`,
      cliente: dadosIniciais.cliente,
      servico: dadosIniciais.servico,
      barbeiro: dadosIniciais.barbeiro,
      metodo: metodo,
      valorBase: dadosIniciais.valor,
      valorExtras: itensExtras.reduce((acc, item) => acc + item.price, 0),
      valorTotal: totalGeral,
      isGratis: dadosIniciais.isGratis || false,
      data: new Date().toLocaleDateString('pt-BR'),
      hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date().toISOString(),
      itens: itensExtras
    };

    // 2. Salvar no histórico de vendas (Financeiro)
    const historico = JSON.parse(localStorage.getItem('@BarberPro:vendas') || '[]');
    localStorage.setItem('@BarberPro:vendas', JSON.stringify([...historico, vendaRealizada]));

    // 3. Notificar sucesso e voltar para a agenda
    alert(`✅ Venda de R$ ${totalGeral.toFixed(2)} finalizada com sucesso!`);
    
    setItensExtras([]);
    setMetodo('pix');
    
    // Chama a função do App.tsx para trocar de aba
    onSuccess();
  };

  if (!dadosIniciais) {
    return (
      <Container>
        <div style={{ textAlign: 'center' }}>
          <ShoppingBag size={64} color="#151515" style={{ marginBottom: '20px' }} />
          <h2 style={{ color: '#d4af37', fontWeight: 900, letterSpacing: '2px' }}>CAIXA LIVRE</h2>
          <p style={{ color: '#444', fontWeight: 600 }}>Aguardando comando da agenda...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Wrapper>
        <MainContent>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ color: '#fff', fontSize: '2rem', fontWeight: 300 }}>
              Finalizar <strong style={{ color: '#d4af37', fontWeight: 900 }}>Venda</strong>
            </h1>
            <span style={{ color: '#333', fontSize: '0.8rem', fontWeight: 800 }}>SISTEMA PDV v3.5</span>
          </div>

          <GlassCard>
            <ResumoHeader>
              <div>
                <div className="label">Cliente</div>
                <div className="value">{dadosIniciais.cliente}</div>
              </div>
              <div>
                <div className="label">Profissional</div>
                <div className="value">{dadosIniciais.barbeiro}</div>
              </div>
              <div>
                <div className="label">Serviço Principal</div>
                <div className="value">{dadosIniciais.servico}</div>
              </div>
              <div>
                <div className="label">Valor do Serviço</div>
                <div className="value" style={{ color: dadosIniciais.isGratis ? '#00ff88' : '#d4af37' }}>
                  {dadosIniciais.isGratis ? 'GRÁTIS (FIDELIDADE)' : `R$ ${dadosIniciais.valor.toFixed(2)}`}
                </div>
              </div>
            </ResumoHeader>
          </GlassCard>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <p style={{ color: '#444', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '1px' }}>ITENS ADICIONAIS / PRODUTOS</p>
              <button 
                onClick={handleAddProdutoExtra}
                style={{ background: 'transparent', border: '1px solid #d4af37', color: '#d4af37', padding: '5px 12px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}>
                <Plus size={12} style={{ marginRight: '5px', verticalAlign: 'middle' }} /> ADICIONAR ITEM
              </button>
            </div>
            
            {itensExtras.map(item => (
              <ExtraItemRow key={item.id}>
                <span style={{ fontWeight: 600, color: '#fff' }}>{item.name}</span>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <span style={{ fontWeight: 900, color: '#00ff88' }}>R$ {item.price.toFixed(2)}</span>
                  <Trash2 
                    size={16} 
                    color="#ff4d4d" 
                    style={{ cursor: 'pointer' }} 
                    onClick={() => setItensExtras(itensExtras.filter(i => i.id !== item.id))} 
                  />
                </div>
              </ExtraItemRow>
            ))}
            {itensExtras.length === 0 && <p style={{color: '#333', fontSize: '0.8rem', fontStyle: 'italic'}}>Nenhum produto extra adicionado.</p>}
          </div>

          <div>
            <p style={{ color: '#444', fontWeight: 900, fontSize: '0.75rem', marginBottom: '15px', letterSpacing: '1px' }}>FORMA DE PAGAMENTO</p>
            <PaymentGrid>
              {['pix', 'debito', 'credito', 'dinheiro'].map((m) => (
                <MethodButton 
                  key={m}
                  active={metodo === m} 
                  onClick={() => setMetodo(m)}
                >
                  {m === 'pix' && <Smartphone />}
                  {m === 'dinheiro' && <Banknote />}
                  {(m === 'debito' || m === 'credito') && <CreditCard />}
                  <span>{m}</span>
                </MethodButton>
              ))}
            </PaymentGrid>
          </div>
        </MainContent>

        <SidebarVenda>
          <div>
            <h3 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 900, marginBottom: '5px' }}>Check-out</h3>
            <p style={{ color: '#444', fontSize: '0.85rem', marginBottom: '25px', fontWeight: 600 }}>Revise os valores antes de confirmar.</p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid #1a1a1a' }}>
              <span style={{ color: '#555', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>Serviço</span>
              <span style={{ color: '#fff', fontWeight: 700 }}>R$ {dadosIniciais.valor.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid #1a1a1a' }}>
              <span style={{ color: '#555', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>Produtos Extras</span>
              <span style={{ color: '#00ff88', fontWeight: 700 }}>
                R$ {itensExtras.reduce((acc, i) => acc + i.price, 0).toFixed(2)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', color: '#d4af37' }}>
              <span style={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>Método</span>
              <span style={{ fontWeight: 900, textTransform: 'uppercase' }}>{metodo}</span>
            </div>
          </div>

          <div>
            <TotalBox>
              <small>Valor Total a Pagar</small>
              <div>R$ {totalGeral.toFixed(2)}</div>
            </TotalBox>

            <FinalizeButton onClick={finalizarVenda}>
              <CheckCircle size={22} /> CONCLUÍDO
            </FinalizeButton>
          </div>
        </SidebarVenda>
      </Wrapper>
    </Container>
  );
};