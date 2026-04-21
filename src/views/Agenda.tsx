import { useState, useEffect, useMemo } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { 
  User, Phone, Scissors, 
  Clock, Check, DollarSign,
} from 'lucide-react';
import { backendApi, type Appointment, type Barber, type Service } from '../services/backend';

// --- ANIMAÇÕES ---
const goldGlow = keyframes`
  0% { box-shadow: 0 0 10px #d4af37; border-color: #d4af37; }
  50% { box-shadow: 0 0 30px #ffea00; border-color: #ffea00; }
  100% { box-shadow: 0 0 10px #d4af37; border-color: #d4af37; }
`;

// --- ESTILOS ---
const Container = styled.div`
  display: flex; flex-direction: column; align-items: center; gap: 30px;
  padding: 20px; width: 100%; max-width: 1200px; margin: 0 auto; color: #fff;
`;

const GlassHeader = styled.div`
  background: rgba(26, 26, 26, 0.9); backdrop-filter: blur(10px);
  padding: 25px; border-radius: 16px; border: 1px solid rgba(212, 175, 55, 0.3);
  display: flex; justify-content: space-between; align-items: center; width: 100%;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  @media (max-width: 600px) { flex-direction: column; gap: 15px; text-align: center; }
`;

const DateInput = styled.input`
  background: #000; color: #fff; border: 1px solid #d4af37; padding: 12px;
  border-radius: 8px; font-family: inherit; outline: none;
  &::-webkit-calendar-picker-indicator { filter: invert(1); cursor: pointer; }
`;

const GridBarbeiros = styled.div`
  display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 25px; width: 100%;
`;

const CardBarbeiro = styled.div`
  background: #1a1a1a; border-radius: 20px; padding: 25px; border: 1px solid #333;
  transition: all 0.3s ease;
  &:hover { border-color: #d4af37; transform: translateY(-5px); }
`;

const SlotGrid = styled.div`
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 20px;
`;

const TimeSlot = styled.button<{ $status?: string; $passou?: boolean }>`
  background: ${props => 
    props.$status === 'reservado' ? 'rgba(255, 165, 0, 0.15)' : 
    props.$status === 'confirmado' ? 'rgba(0, 255, 136, 0.15)' :
    props.$status === 'finalizado' ? 'rgba(212, 175, 55, 0.2)' :
    props.$passou ? '#111' : '#262626'};
  
  color: ${props => 
    props.$status === 'reservado' ? '#ffa500' : 
    props.$status === 'confirmado' ? '#00ff88' :
    props.$status === 'finalizado' ? '#d4af37' :
    props.$passou ? '#444' : '#fff'};

  border: 1px solid ${props => 
    props.$status === 'reservado' ? '#ffa500' : 
    props.$status === 'confirmado' ? '#00ff88' :
    props.$status === 'finalizado' ? '#d4af37' :
    props.$passou ? '#222' : '#333'};

  padding: 14px; border-radius: 12px; font-weight: bold; transition: 0.2s;
  cursor: ${props => (props.$passou && props.$status === 'vazio') ? 'not-allowed' : 'pointer'};
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; border-style: solid;

  &:hover {
    background: ${props => props.$status === 'vazio' && !props.$passou ? '#d4af37' : ''};
    color: ${props => props.$status === 'vazio' && !props.$passou ? '#000' : ''};
  }
`;

const Overlay = styled.div`
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.85); backdrop-filter: blur(8px);
  display: flex; justify-content: center; align-items: center; z-index: 1000;
`;

const Modal = styled.div<{ $isVip?: boolean }>`
  background: #0d0d0d; padding: 30px; border-radius: 24px; border: 1px solid #d4af37;
  width: 95%; max-width: 450px; box-shadow: 0 0 60px rgba(0,0,0,1);
  ${props => props.$isVip && css`
    animation: ${goldGlow} 1.5s infinite;
    border-width: 2px;
  `}
`;

const FormGroup = styled.div`
  margin-bottom: 20px; display: flex; flex-direction: column; gap: 8px;
  label { color: #d4af37; font-size: 0.7rem; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; display: flex; align-items: center; gap: 5px; }
  input, select { 
    background: #000; border: 1px solid #333; color: #fff; padding: 14px; border-radius: 8px; font-size: 1rem;
    &:focus { border-color: #d4af37; outline: none; }
  }
`;

const InfoCard = styled.div`
  background: #000; border: 1px solid #222; border-radius: 12px; padding: 20px;
  p { margin: 8px 0; font-size: 0.9rem; }
`;

interface AgendaProps {
  onFinalizarAtendimento: (dados: any) => void;
}

export const Agenda = ({ onFinalizarAtendimento }: AgendaProps) => {
  const [agendamentos, setAgendamentos] = useState<Appointment[]>([]);
  const [barbeiros, setBarbeiros] = useState<Barber[]>([]);
  const [servicos, setServicos] = useState<Service[]>([]);
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [horaAtual, setHoraAtual] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [selecao, setSelecao] = useState<any>(null);
  const [formData, setFormData] = useState({ nome: '', whatsapp: '', servico: '' });

  const horarios = useMemo(() => [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", 
    "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", 
    "16:00", "16:30", "17:00", "17:30"
  ], []);

  const toLocalIsoDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const carregarBase = async () => {
    try {
      const [barbeirosData, servicosData] = await Promise.all([
        backendApi.listBarbers(),
        backendApi.listServices(),
      ]);

      setBarbeiros(barbeirosData);
      setServicos(servicosData);

      if (!formData.servico && servicosData.length > 0) {
        setFormData((prev) => ({ ...prev, servico: servicosData[0].name }));
      }
    } catch (error) {
      console.error('Erro ao carregar barbeiros/servicos:', error);
    }
  };

  const carregarAgendamentos = async () => {
    try {
      const data = await backendApi.listAppointments(toLocalIsoDate(dataSelecionada));
      setAgendamentos(data);
    } catch (error) {
      console.error('Erro ao carregar agenda:', error);
    }
  };

  useEffect(() => {
    carregarBase();
  }, []);

  useEffect(() => {
    carregarAgendamentos();
  }, [dataSelecionada]);

  useEffect(() => {
    const timer = setInterval(() => setHoraAtual(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const estaTrabalhando = (escala: number[], data: Date) => escala[data.getDay()] === 1;

  const handleSlotClick = (barbeiro: any, hora: string, agendado: any) => {
    if (agendado) {
      setSelecao(agendado);
      setIsManageOpen(true);
    } else {
      const hoje = new Date().toDateString();
      const agoraHora = horaAtual.getHours().toString().padStart(2, '0') + ":" + horaAtual.getMinutes().toString().padStart(2, '0');
      if (dataSelecionada.toDateString() === hoje && hora < agoraHora) return;

      setSelecao({ barbeiroId: barbeiro.id, barbeiroNome: barbeiro.nome, hora });
      setIsModalOpen(true);
    }
  };

  const salvarAgendamento = async () => {
    if (!formData.nome || !formData.whatsapp) return alert("Preencha os dados!");
    const servicoSelecionado = servicos.find((s) => s.name === formData.servico);
    if (!servicoSelecionado) return alert('Servico invalido');

    try {
      await backendApi.createAppointment({
        client_name: formData.nome,
        client_phone: formData.whatsapp,
        barber_id: selecao.barbeiroId,
        barber_nome: selecao.barbeiroNome,
        service_name: formData.servico,
        service_price: servicoSelecionado.price,
        date: toLocalIsoDate(dataSelecionada),
        time: selecao.hora,
      });

      await carregarAgendamentos();
      setIsModalOpen(false);
      setFormData({ nome: '', whatsapp: '', servico: servicos[0]?.name || '' });
    } catch (error: any) {
      alert(error?.message || 'Nao foi possivel salvar o agendamento.');
    }
  };

  const enviarAoCaixa = () => {
    if (!selecao) return;

    // Envia os dados estruturados para o CashierView
    onFinalizarAtendimento({
      barbeiro: selecao.barber_nome || selecao.barbeiroNome,
      cliente: selecao.client_name,
      servico: selecao.service_name,
      valor: selecao.service_price || 0,
      idAgendamento: selecao.id,
    });

    setIsManageOpen(false);
  };

  const hojeStr = new Date().toDateString();
  const horaMinutoStr = horaAtual.getHours().toString().padStart(2, '0') + ":" + horaAtual.getMinutes().toString().padStart(2, '0');

  return (
    <Container>
      <GlassHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div>
            <h3 style={{ margin: 0 }}>Agenda de Atendimentos</h3>
            <div style={{ color: '#888', marginTop: '5px', fontSize: '0.9rem' }}>
              Selecione uma data para visualizar e gerenciar horários.
            </div>
          </div>
        </div>
        <DateInput 
          type="date" 
          value={toLocalIsoDate(dataSelecionada)} 
          onChange={(e) => setDataSelecionada(new Date(e.target.value + 'T12:00:00'))} 
        />
      </GlassHeader>

      <GridBarbeiros>
        {barbeiros.filter(b => estaTrabalhando(b.escala, dataSelecionada)).map(barbeiro => (
          <CardBarbeiro key={barbeiro.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
              <img src={barbeiro.foto} alt="" style={{ width: '50px', height: '50px', borderRadius: '50%', border: '2px solid #d4af37', objectFit: 'cover' }} />
              <h3 style={{ margin: 0 }}>{barbeiro.nome}</h3>
            </div>
            <SlotGrid>
              {horarios.map(hora => {
                const agend = agendamentos.find(a => a.date === toLocalIsoDate(dataSelecionada) && a.time === hora && a.barber_id === barbeiro.id);
                const passou = dataSelecionada.toDateString() === hojeStr && hora < horaMinutoStr;
                return (
                  <TimeSlot 
                    key={hora} 
                    $status={agend?.status || 'vazio'} 
                    $passou={passou}
                    onClick={() => handleSlotClick(barbeiro, hora, agend)}
                  >
                    {agend?.status === 'reservado' && <Clock size={14}/>}
                    {agend?.status === 'confirmado' && <Check size={14}/>}
                    {agend?.status === 'finalizado' && <DollarSign size={14}/>}
                    {!agend && hora}
                  </TimeSlot>
                );
              })}
            </SlotGrid>
          </CardBarbeiro>
        ))}
      </GridBarbeiros>

      {isModalOpen && (
        <Overlay onClick={() => setIsModalOpen(false)}>
          <Modal onClick={e => e.stopPropagation()}>
            <h2 style={{ color: '#d4af37', marginBottom: '20px' }}>Novo Agendamento</h2>
            <FormGroup>
              <label><User size={14}/> Cliente</label>
              <input value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} placeholder="Nome Completo" />
            </FormGroup>
            <FormGroup>
              <label><Phone size={14}/> WhatsApp</label>
              <input value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} placeholder="DD9XXXXXXXX" />
            </FormGroup>
            <FormGroup>
              <label><Scissors size={14}/> Serviço</label>
              <select value={formData.servico} onChange={e => setFormData({...formData, servico: e.target.value})}>
                {servicos.map(s => <option key={s.id} value={s.name}>{s.name} - R${s.price.toFixed(2)}</option>)}
              </select>
            </FormGroup>
            <button onClick={salvarAgendamento} style={{ width: '100%', background: '#d4af37', border: 'none', padding: '15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>CONFIRMAR RESERVA</button>
          </Modal>
        </Overlay>
      )}

      {isManageOpen && selecao && (
        <Overlay onClick={() => setIsManageOpen(false)}>
          <Modal onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: '#d4af37', margin: 0 }}>
                {selecao.status === 'finalizado' ? 'Atendimento Pago' : 'Gerenciar Horário'}
              </h2>
              {selecao.status === 'finalizado' ? <DollarSign color="#00ff88" /> : <Clock color="#d4af37" />}
            </div>
            
            <InfoCard>
              <p><strong>Cliente:</strong> {selecao.client_name}</p>
              <p><strong>Serviço:</strong> {selecao.service_name}</p>
              <p><strong>Barbeiro:</strong> {selecao.barber_nome || selecao.barbeiroNome}</p>
              <p><strong>Status:</strong> <span style={{color: '#d4af37'}}>{selecao.status?.toUpperCase()}</span></p>
              <p style={{ color: '#d4af37', fontWeight: 'bold', fontSize: '1.1rem', marginTop: '10px' }}>
                Valor: R$ {(selecao.service_price || 0).toFixed(2)}
              </p>
            </InfoCard>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
              {selecao.status !== 'finalizado' ? (
                <>
                  <button onClick={async () => {
                    await backendApi.updateAppointmentStatus(selecao.id, 'confirmado');
                    await carregarAgendamentos();
                    setIsManageOpen(false);
                  }} style={{ background: '#00ff88', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: selecao.status === 'reservado' ? 'block' : 'none' }}>CONFIRMAR PRESENÇA</button>
                  
                  <button 
                    onClick={enviarAoCaixa} 
                    style={{ background: '#d4af37', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', color: '#000' }}
                  >
                    FINALIZAR E RECEBER NO CAIXA
                  </button>

                  <button onClick={async () => {
                    if (confirm("Deseja realmente cancelar?")) {
                      await backendApi.updateAppointmentStatus(selecao.id, 'cancelado');
                      await carregarAgendamentos();
                      setIsManageOpen(false);
                    }
                  }} style={{ background: 'transparent', border: '1px solid #ff4d4d', color: '#ff4d4d', padding: '12px', borderRadius: '8px', cursor: 'pointer' }}>CANCELAR HORÁRIO</button>
                </>
              ) : (
                <button onClick={() => setIsManageOpen(false)} style={{ background: '#333', border: 'none', padding: '12px', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>FECHAR</button>
              )}
            </div>
          </Modal>
        </Overlay>
      )}
    </Container>
  );
};