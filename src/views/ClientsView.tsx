import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  Search, UserPlus, Phone, MoreVertical, X, User, 
  CheckCircle, MessageSquare, TrendingUp, 
  Save, Trash2
} from 'lucide-react';
import { backendApi, type Client as BackendClient } from '../services/backend';

// --- Estilos de Feedback e Overlay ---
const Toast = styled.div<{ visible: boolean }>`
  position: fixed; bottom: 30px; right: 30px;
  background: #d4af37; color: #000; padding: 16px 28px;
  border-radius: 12px; font-weight: 900; display: flex;
  align-items: center; gap: 12px; box-shadow: 0 15px 35px rgba(0,0,0,0.6);
  transform: translateY(${props => props.visible ? '0' : '120px'});
  opacity: ${props => props.visible ? '1' : '0'};
  transition: 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); z-index: 10000;
`;

const DrawerOverlay = styled.div<{ open: boolean }>`
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(6px);
  opacity: ${props => props.open ? 1 : 0};
  visibility: ${props => props.open ? 'visible' : 'hidden'};
  transition: 0.4s ease; z-index: 1000;
`;

// --- Estilos do Drawer (Corrigido para sumir totalmente) ---
const DetailsDrawer = styled.div<{ open: boolean }>`
  position: fixed; top: 0; 
  right: ${props => props.open ? '0' : '-100%'}; // Garante que saia totalmente
  width: 100%; max-width: 500px; // Responsivo
  height: 100vh; background: #0a0a0a;
  border-left: 2px solid #d4af37; 
  box-shadow: -15px 0 50px rgba(0,0,0,0.9);
  transition: 0.6s cubic-bezier(0.16, 1, 0.3, 1); 
  z-index: 1001; padding: 40px; overflow-y: auto;
  visibility: ${props => props.open ? 'visible' : 'hidden'}; // CORREÇÃO AQUI
  pointer-events: ${props => props.open ? 'all' : 'none'};

  @media (max-width: 600px) {
    max-width: 100%;
    border-left: none;
  }

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #d4af37; border-radius: 10px; }
`;

// --- Estilos de UI ---
const FidelityBar = styled.div`
  width: 100%; height: 8px; background: #1a1a1a; border-radius: 10px;
  margin-top: 8px; position: relative; overflow: hidden;
`;

const Progress = styled.div<{ percent: number }>`
  width: ${props => props.percent}%; height: 100%;
  background: linear-gradient(90deg, #d4af37, #f2d06b); transition: 1.2s cubic-bezier(0.1, 0, 0.1, 1);
`;

const StatCard = styled.div`
  background: linear-gradient(145deg, #121212, #0a0a0a);
  padding: 22px; border-radius: 20px; border: 1px solid #1a1a1a;
  display: flex; flex-direction: column; gap: 8px;
  span { color: #555; font-size: 0.65rem; text-transform: uppercase; font-weight: 800; letter-spacing: 1.5px; }
  strong { color: #d4af37; font-size: 1.5rem; letter-spacing: -0.5px; }
`;

const Container = styled.div` padding: 40px; background-color: #050505; min-height: 100vh; color: white; `;
const Header = styled.div` 
  display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 50px; 
  @media (max-width: 900px) { flex-direction: column; align-items: flex-start; gap: 20px; }
`;

const TableContainer = styled.div` 
  background: #080808; border-radius: 24px; border: 1px solid #111; overflow-x: auto; 
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
`;

const Table = styled.table`
  width: 100%; border-collapse: collapse; min-width: 700px;
  th { padding: 24px; color: #d4af37; text-align: left; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #111; }
  td { padding: 24px; color: #999; border-bottom: 1px solid #0a0a0a; font-size: 0.95rem; }
  tbody tr { transition: 0.3s; cursor: pointer; &:hover { background: #0d0d0d; } }
`;

const InputGroup = styled.div`
  margin-bottom: 25px;
  label { display: flex; align-items: center; gap: 10px; color: #d4af37; font-size: 0.7rem; margin-bottom: 10px; font-weight: 800; text-transform: uppercase; }
  input {
    width: 100%; background: #111; border: 1px solid #1a1a1a; padding: 16px;
    border-radius: 14px; color: #fff; transition: 0.4s; font-size: 1rem;
    &:focus { border-color: #d4af37; outline: none; background: #151515; box-shadow: 0 0 15px rgba(212, 175, 55, 0.1); }
  }
`;

export const ClientsView = () => {
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clients, setClients] = useState<BackendClient[]>([]);

  const [newClient, setNewClient] = useState({ name: '', phone: '' });

  const loadClients = async () => {
    try {
      const data = await backendApi.listClients();
      setClients(data);
    } catch (error) {
      console.error('Falha ao carregar clientes do backend:', error);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleSave = async () => {
    if (!newClient.name || !newClient.phone) return;
    try {
      await backendApi.createClient({
        name: newClient.name,
        phone: newClient.phone,
      });
      await loadClients();
      setNewClient({ name: '', phone: '' });
      setShowModal(false);
      triggerToast();
    } catch (error) {
      console.error('Falha ao cadastrar cliente:', error);
      alert('Nao foi possivel cadastrar o cliente.');
    }
  };

  const triggerToast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const filteredClients = clients.filter((c: any) => 
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  return (
    <Container>
      <Header>
        <div>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1 }}>Meus <span style={{ color: '#d4af37' }}>Clientes</span></h1>
          <p style={{ color: '#555', marginTop: '10px', fontWeight: 600 }}>Gestão estratégica de base e fidelização.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={20} color="#d4af37" style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', padding: '16px 20px 16px 55px', borderRadius: '16px', color: '#fff', width: '320px', fontSize: '1rem' }}
              placeholder="Nome ou telefone..." value={search} onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button onClick={() => setShowModal(true)} style={{ background: '#d4af37', border: 'none', padding: '0 30px', borderRadius: '16px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', height: '56px', transition: '0.3s' }}>
            <UserPlus size={20}/> NOVO CLIENTE
          </button>
        </div>
      </Header>

      <TableContainer>
        <Table>
          <thead>
            <tr>
              <th>Identificação</th>
              <th>WhatsApp</th>
              <th>Última Visita</th>
              <th style={{ width: '250px' }}>Fidelidade (Meta: 10)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((client: any) => (
              <tr key={client.id} onClick={() => { setSelectedClient(client); setIsDrawerOpen(true); }}>
                <td>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>{client.name}</div>
                  <div style={{ fontSize: '0.7rem', color: '#444', marginTop: '4px', letterSpacing: '1px' }}>REF: #{client.id.slice(0, 8).toUpperCase()}</div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ padding: '8px', background: '#111', borderRadius: '8px' }}><Phone size={14} color="#d4af37" /></div>
                    {client.phone}
                  </div>
                </td>
                <td>{client.last_visit}</td>
                <td>
                  <div style={{ fontSize: '0.75rem', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                    <span style={{ color: '#444' }}>{client.total_cuts} serviços</span>
                    <span style={{color: '#d4af37'}}>{client.total_cuts * 10}%</span>
                  </div>
                  <FidelityBar><Progress percent={Math.min(client.total_cuts * 10, 100)} /></FidelityBar>
                </td>
                <td><MoreVertical size={20} color="#222" /></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableContainer>

      {/* Drawer Lateral (Totalmente Funcional) */}
      <DrawerOverlay open={isDrawerOpen} onClick={() => setIsDrawerOpen(false)} />
      <DetailsDrawer open={isDrawerOpen}>
        {selectedClient && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
              <div style={{ padding: '10px 20px', background: '#d4af37', borderRadius: '10px', color: '#000', fontWeight: 900, fontSize: '0.7rem' }}>PERFIL DO CLIENTE</div>
              <X color="#d4af37" size={30} cursor="pointer" onClick={() => setIsDrawerOpen(false)} />
            </div>

            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '5px' }}>{selectedClient.name}</h2>
            <p style={{ color: '#444', marginBottom: '40px', fontWeight: 700 }}>Membro desde Março 2026</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
              <StatCard>
                <span>Faturamento</span>
                <strong>R$ {selectedClient.spent?.toFixed(2)}</strong>
              </StatCard>
              <StatCard>
                <span>Média/Ticket</span>
                <strong>R$ {(selectedClient.spent / selectedClient.total_cuts || 0).toFixed(2)}</strong>
              </StatCard>
            </div>

            <InputGroup>
              <label><User size={14} /> Nome Completo</label>
              <input value={selectedClient.name} onChange={e => setSelectedClient({...selectedClient, name: e.target.value})} />
            </InputGroup>

            <InputGroup>
              <label><Phone size={14} /> Celular / WhatsApp</label>
              <input value={selectedClient.phone} onChange={e => setSelectedClient({...selectedClient, phone: e.target.value})} />
            </InputGroup>

            <div style={{ marginBottom: '40px' }}>
              <label style={{ color: '#d4af37', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <TrendingUp size={16} /> COMPORTAMENTO DE CONSUMO
              </label>
              <div style={{ background: '#080808', padding: '20px', borderRadius: '15px', border: '1px dashed #222' }}>
                <small style={{ color: '#555', textTransform: 'uppercase', fontSize: '0.6rem', fontWeight: 800 }}>Serviço mais solicitado</small>
                <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginTop: '5px' }}>{selectedClient.preferred}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <button onClick={async () => {
                try {
                  await backendApi.updateClient(selectedClient.id, {
                    name: selectedClient.name,
                    phone: selectedClient.phone,
                  });
                  await loadClients();
                  triggerToast();
                } catch (error) {
                  console.error('Falha ao atualizar cliente:', error);
                  alert('Nao foi possivel salvar as alteracoes.');
                }
              }}
                style={{ background: '#d4af37', border: 'none', padding: '20px', borderRadius: '16px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <Save size={20} /> SALVAR ALTERAÇÕES
              </button>
              
              <button onClick={() => window.open(`https://wa.me/${selectedClient.phone}`)}
                style={{ background: 'transparent', color: '#25D366', border: '2px solid #25D366', padding: '20px', borderRadius: '16px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <MessageSquare size={20} /> CHAMAR NO WHATSAPP
              </button>

              <button onClick={async () => {
                try {
                  await backendApi.deleteClient(selectedClient.id);
                  await loadClients();
                  setIsDrawerOpen(false);
                  triggerToast();
                } catch (error) {
                  console.error('Falha ao excluir cliente:', error);
                  alert('Nao foi possivel excluir o cliente.');
                }
              }}
                style={{ background: 'transparent', color: '#ff4444', border: 'none', padding: '10px', fontWeight: 800, cursor: 'pointer', marginTop: '20px' }}>
                <Trash2 size={16} style={{ marginBottom: '-3px', marginRight: '8px' }} /> EXCLUIR REGISTRO
              </button>
            </div>
          </>
        )}
      </DetailsDrawer>

      {/* Modal Novo Cliente (Estilo Moderno) */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div style={{ background: '#0a0a0a', border: '1px solid #d4af37', padding: '50px', borderRadius: '30px', width: '100%', maxWidth: '450px', boxShadow: '0 30px 60px rgba(0,0,0,0.8)' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '30px' }}>Novo <span style={{ color: '#d4af37' }}>Cliente</span></h2>
            <InputGroup>
              <label>Nome do Cliente</label>
              <input autoFocus value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} placeholder="Nome completo" />
            </InputGroup>
            <InputGroup>
              <label>Número com DDD</label>
              <input value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} placeholder="Ex: 11988887777" />
            </InputGroup>
            <div style={{ display: 'flex', gap: '15px', marginTop: '40px' }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, background: '#111', color: '#fff', border: 'none', padding: '18px', borderRadius: '14px', fontWeight: 700, cursor: 'pointer' }}>CANCELAR</button>
              <button onClick={handleSave} style={{ flex: 2, background: '#d4af37', color: '#000', border: 'none', padding: '18px', borderRadius: '14px', fontWeight: 900, cursor: 'pointer' }}>CADASTRAR</button>
            </div>
          </div>
        </div>
      )}

      <Toast visible={showToast}>
        <CheckCircle size={22} /> SUCESSO NO PROCESSAMENTO
      </Toast>
    </Container>
  );
};