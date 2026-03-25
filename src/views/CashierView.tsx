import { useState, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import { 
  User, 
  Scissors, 
  CheckCircle, 
  Hash,
  CreditCard,
  Banknote,
  QrCode
} from 'lucide-react';
import { backendApi, type Barber, type Service } from '../services/backend';

// --- INTERFACE DE PROPS ---
interface CashierViewProps {
  dadosIniciais?: {
    barbeiro: string;
    cliente: string;
    servico: string;
    valor: number;
    idAgendamento?: string | number;
    isGratis?: boolean;
  } | null;
  onSuccess?: () => void;
}

// --- ESTILOS (Mantidos conforme seu padrão) ---
const Container = styled.div`
  padding: 30px;
  background: #050505;
  min-height: 100vh;
  color: white;
  font-family: 'Inter', sans-serif;
`;

const POSGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 25px;
  margin-top: 20px;
  @media (max-width: 1100px) { grid-template-columns: 1fr; }
`;

const Card = styled.div`
  background: #0a0a0a;
  border-radius: 20px;
  border: 1px solid #1a1a1a;
  padding: 25px;
`;

const SectionTitle = styled.h3`
  font-size: 0.75rem;
  color: #555;
  font-weight: 800;
  margin-bottom: 15px;
  text-transform: uppercase;
  letter-spacing: 1px;
  display: flex;
  align-items: center; gap: 8px;
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  background: #111;
  border: 1px solid #222;
  border-radius: 12px;
  padding: 0 15px;
  margin-bottom: 20px;
  transition: 0.2s;
  &:focus-within { border-color: #d4af37; box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.1); }
  input {
    background: transparent; border: none; color: white;
    padding: 15px; width: 100%; outline: none; font-size: 0.9rem;
  }
`;

const ServiceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
`;

const ServiceItem = styled.button<{ $active: boolean }>`
  background: ${props => props.$active ? 'rgba(212, 175, 55, 0.1)' : '#0d0d0d'};
  border: 2px solid ${props => props.$active ? '#d4af37' : '#1a1a1a'};
  color: white; padding: 20px; border-radius: 16px; cursor: pointer;
  transition: 0.2s; text-align: left; display: flex; flex-direction: column; gap: 5px;
  &:hover { border-color: #d4af37; }
  strong { font-size: 1rem; color: ${props => props.$active ? '#d4af37' : 'white'}; }
  span { font-size: 0.8rem; color: #555; font-weight: 700; }
`;

const PaymentGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-top: 10px;
`;

const PayButton = styled.button<{ $active: boolean }>`
  background: ${props => props.$active ? '#d4af37' : '#111'};
  border: 1px solid ${props => props.$active ? '#d4af37' : '#222'};
  color: ${props => props.$active ? 'black' : '#555'};
  padding: 12px; border-radius: 10px; cursor: pointer;
  display: flex; flex-direction: column; align-items: center; gap: 5px;
  font-size: 0.7rem; font-weight: 800; transition: 0.2s;
`;

const FinalizeButton = styled.button`
  width: 100%; background: #d4af37; color: black; border: none;
  padding: 20px; border-radius: 15px; font-weight: 900; font-size: 1rem;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  gap: 10px; margin-top: 25px; box-shadow: 0 10px 20px rgba(212, 175, 55, 0.15);
  &:disabled { opacity: 0.2; cursor: not-allowed; filter: grayscale(1); }
`;

export const CashierView = ({ dadosIniciais, onSuccess }: CashierViewProps) => {
  const [barberInput, setBarberInput] = useState('');
  const [clientName, setClientName] = useState('');
  const [selectedService, setSelectedService] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Barber[]>([]);

  useEffect(() => {
    const loadBase = async () => {
      try {
        const [servicesData, barbersData] = await Promise.all([
          backendApi.listServices(),
          backendApi.listBarbers(),
        ]);
        setServices(servicesData);
        setStaff(barbersData);
      } catch (error) {
        console.error('Falha ao carregar dados base do caixa:', error);
      }
    };

    loadBase();
  }, []);

  // Sincronização robusta com a Agenda
  useEffect(() => {
    if (dadosIniciais) {
      setBarberInput(dadosIniciais.barbeiro || '');
      setClientName(dadosIniciais.cliente || '');
      
      // Busca o serviço mas PRIORIZA o valor enviado (importante para cortes grátis)
      const servicoNome = dadosIniciais.servico || '';
      const servicoEncontrado = services.find(s => 
        s.name.toLowerCase() === servicoNome.toLowerCase()
      );

      if (servicoEncontrado) {
        setSelectedService({
          ...servicoEncontrado,
          price: dadosIniciais.valor // Sobrescreve com o valor da agenda (pode ser 0)
        });
      } else {
        setSelectedService({ 
          id: Date.now(), 
          name: servicoNome || 'Serviço Externo', 
          price: dadosIniciais.valor 
        });
      }
    }
  }, [dadosIniciais, services]);

  // Identificação com proteção contra strings vazias
  const identifiedBarberName = useMemo(() => {
    if (!barberInput) return null;
    
    const inputClean = barberInput.toLowerCase();
    const found = staff.find(s => 
      s.id.toLowerCase() === inputClean || 
      s.matricula.toLowerCase() === inputClean ||
      s.nome.toLowerCase().includes(inputClean)
    );

    if (found) return found.nome;
    if (dadosIniciais && barberInput === dadosIniciais.barbeiro) return barberInput;

    return null;
  }, [barberInput, staff, dadosIniciais]);

  const handleFinishSale = async () => {
    if (!selectedService || !identifiedBarberName) return;

    try {
      if (dadosIniciais?.idAgendamento) {
        await backendApi.finalizeAppointment(String(dadosIniciais.idAgendamento), {
          payment_method: paymentMethod,
          amount_paid: selectedService.price,
          unidade: 'Matriz Center',
        });
      } else {
        await backendApi.createSale({
          barbeiro: identifiedBarberName,
          cliente: clientName || 'Consumidor Final',
          servico: selectedService.name,
          valor: selectedService.price,
          metodo: paymentMethod,
          unidade: 'Matriz Center',
        });
      }

      alert(`✅ Venda Finalizada: R$ ${selectedService.price.toFixed(2)}`);

      setBarberInput('');
      setClientName('');
      setSelectedService(null);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Falha ao registrar venda:', error);
      alert('Nao foi possivel concluir a venda no backend.');
    }
  };

  return (
    <Container>
      <header>
        <h1 style={{ fontWeight: 900, fontSize: '2rem', letterSpacing: '-1px' }}>
          CAIXA <span style={{ color: '#d4af37' }}>{dadosIniciais ? 'AGENDADO' : 'LIVRE'}</span>
        </h1>
        <p style={{ color: '#666', fontWeight: 700 }}>
          {dadosIniciais ? `Finalizando atendimento de ${dadosIniciais.cliente}` : 'Venda rápida de balcão'}
        </p>
      </header>

      <POSGrid>
        <div>
          <Card>
            <SectionTitle><User size={16}/> Profissional e Cliente</SectionTitle>
            <InputWrapper>
              <Hash size={20} color={identifiedBarberName ? "#00ff88" : "#444"} />
              <input 
                placeholder="Matrícula ou Nome do Barbeiro..." 
                value={barberInput}
                onChange={(e) => setBarberInput(e.target.value)}
              />
              {identifiedBarberName && <CheckCircle size={20} color="#00ff88" />}
            </InputWrapper>

            <InputWrapper>
              <User size={20} color="#444" />
              <input 
                placeholder="Nome do Cliente" 
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </InputWrapper>

            <SectionTitle style={{ marginTop: '30px' }}><Scissors size={16}/> Serviço</SectionTitle>
            <ServiceGrid>
              {services.map((s, idx) => (
                <ServiceItem 
                  key={s.id} 
                  $active={selectedService?.name === s.name}
                  onClick={() => setSelectedService(s)}
                >
                  <span>CÓD: {String(idx + 1).padStart(3, '0')}</span>
                  <strong>{s.name}</strong>
                  <div style={{ marginTop: '10px', fontWeight: 900 }}>R$ {Number(s.price).toFixed(2)}</div>
                </ServiceItem>
              ))}
            </ServiceGrid>
          </Card>
        </div>

        <aside>
          <Card style={{ position: 'sticky', top: '20px', borderColor: identifiedBarberName ? '#d4af37' : '#1a1a1a' }}>
            <SectionTitle>Resumo</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '25px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#555' }}>Barbeiro:</span>
                <span style={{ fontWeight: 700, color: identifiedBarberName ? '#00ff88' : '#ff4444' }}>
                  {identifiedBarberName || 'Pendente'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#555' }}>Serviço:</span>
                <span style={{ textAlign: 'right' }}>{selectedService?.name || '---'}</span>
              </div>
            </div>

            <SectionTitle>Pagamento</SectionTitle>
            <PaymentGrid>
              {['Pix', 'Cartão', 'Dinheiro'].map(method => (
                <PayButton 
                  key={method}
                  $active={paymentMethod === method} 
                  onClick={() => setPaymentMethod(method)}
                >
                  {method === 'Pix' && <QrCode size={18} />}
                  {method === 'Cartão' && <CreditCard size={18} />}
                  {method === 'Dinheiro' && <Banknote size={18} />}
                  {method.toUpperCase()}
                </PayButton>
              ))}
            </PaymentGrid>

            <div style={{ background: '#050505', padding: '20px', borderRadius: '15px', marginTop: '25px', textAlign: 'center', border: '1px solid #1a1a1a' }}>
              <span style={{ color: '#555', fontSize: '0.7rem', fontWeight: 800 }}>VALOR TOTAL</span>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#d4af37' }}>
                R$ {selectedService?.price?.toFixed(2) || '0,00'}
              </div>
              {selectedService?.price === 0 && (
                <div style={{ color: '#00ff88', fontSize: '0.7rem', fontWeight: 800 }}>FIDELIDADE ATIVA (GRÁTIS)</div>
              )}
            </div>

            <FinalizeButton 
              disabled={!selectedService || !identifiedBarberName}
              onClick={handleFinishSale}
            >
              <CheckCircle size={20} /> CONCLUIR VENDA
            </FinalizeButton>
          </Card>
        </aside>
      </POSGrid>
    </Container>
  );
};