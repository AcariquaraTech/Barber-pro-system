import { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { 
  Scissors, User, Plus, Trash2, Save, 
  Settings, ShieldCheck, CheckCircle, Loader2, Target, TrendingUp
} from 'lucide-react';
import { backendApi } from '../services/backend';

// --- Animações ---
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// --- Estilos ---
const Container = styled.div`
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
  animation: ${fadeIn} 0.5s ease-out;
  @media (max-width: 768px) { padding: 20px; }
`;

const Header = styled.header`
  margin-bottom: 40px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  
  h1 { font-size: 2.8rem; font-weight: 900; letter-spacing: -1px; }
  p { color: #555; font-weight: 600; margin-top: 8px; }
  @media (max-width: 768px) { flex-direction: column; align-items: flex-start; gap: 20px; }
`;

const TabNav = styled.div`
  display: flex;
  gap: 8px;
  background: #0a0a0a;
  padding: 6px;
  border-radius: 16px;
  margin-bottom: 30px;
  width: fit-content;
  border: 1px solid #111;
`;

const TabButton = styled.button<{ active: boolean }>`
  background: ${props => props.active ? '#d4af37' : 'transparent'};
  border: none;
  padding: 12px 24px;
  color: ${props => props.active ? '#000' : '#555'};
  border-radius: 12px;
  font-weight: 800;
  font-size: 0.75rem;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 8px;
  &:hover { color: ${props => props.active ? '#000' : '#d4af37'}; }
`;

const ConfigCard = styled.div`
  background: linear-gradient(145deg, #0a0a0a, #050505);
  border: 1px solid #151515;
  border-radius: 28px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
  animation: ${fadeIn} 0.4s ease-out;
  @media (max-width: 768px) { padding: 20px; }
`;

const ItemRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 150px 50px;
  gap: 20px;
  align-items: center;
  background: #0d0d0d;
  padding: 10px 20px;
  border-radius: 18px;
  margin-bottom: 12px;
  border: 1px solid #111;
  transition: 0.3s;
  &:focus-within { border-color: #d4af37; background: #111; }
  @media (max-width: 500px) {
    grid-template-columns: 1fr 40px;
    gap: 10px;
    & > div:nth-child(2) { grid-column: span 2; }
  }
`;

const StyledInput = styled.input`
  background: transparent;
  border: none;
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  padding: 12px 0;
  width: 100%;
  &:focus { outline: none; }
  &::placeholder { color: #333; }
`;

const PriceInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: #050505;
  padding: 0 15px;
  border-radius: 12px;
  border: 1px solid #1a1a1a;
  span { color: #d4af37; font-weight: 900; font-size: 0.8rem; }
  input { width: 80px; text-align: right; }
`;

const AddButton = styled.button`
  background: rgba(212, 175, 55, 0.03);
  border: 2px dashed #1a1a1a;
  color: #d4af37;
  width: 100%;
  padding: 20px;
  border-radius: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-weight: 800;
  margin-top: 20px;
  transition: 0.3s;
  &:hover { 
    border-color: #d4af37; 
    background: rgba(212, 175, 55, 0.08);
    transform: translateY(-2px);
  }
`;

const MetaCard = styled.div`
  background: #080808;
  border: 1px solid #111;
  padding: 25px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
  
  .info {
    display: flex;
    align-items: center;
    gap: 15px;
    .icon { background: #111; padding: 12px; border-radius: 12px; color: #d4af37; }
    h4 { font-weight: 800; color: #fff; margin-bottom: 4px; }
    p { color: #444; font-size: 0.85rem; }
  }
`;

const SaveFloating = styled.button<{ visible: boolean }>`
  position: fixed;
  bottom: 40px;
  right: 40px;
  background: #d4af37;
  color: #000;
  border: none;
  padding: 16px 32px;
  border-radius: 50px;
  font-weight: 900;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 10px 30px rgba(212, 175, 55, 0.3);
  cursor: pointer;
  transform: translateY(${props => props.visible ? '0' : '100px'});
  opacity: ${props => props.visible ? '1' : '0'};
  transition: 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  z-index: 1000;
  .loader { animation: ${rotate} 1s linear infinite; }
`;

export const ConfigView = () => {
  const [activeTab, setActiveTab] = useState('servicos');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [services, setServices] = useState<Array<{ id: string; name: string; price: string }>>([]);
  const [barbers, setBarbers] = useState<Array<{ id: string; name: string }>>([]);

  const [metaCortes, setMetaCortes] = useState(() => {
    return localStorage.getItem('@barberpro:metaCortes') || '20';
  });

  const loadConfigData = async () => {
    try {
      setIsLoading(true);
      const [servicesData, barbersData] = await Promise.all([
        backendApi.listServices(),
        backendApi.listBarbers(),
      ]);

      setServices(
        servicesData.map((s) => ({
          id: s.id,
          name: s.name,
          price: Number(s.price || 0).toFixed(2),
        }))
      );

      setBarbers(
        barbersData.map((b) => ({
          id: b.id,
          name: b.nome,
        }))
      );
    } catch (error) {
      console.error('Falha ao carregar configuracoes do backend:', error);
      alert('Nao foi possivel carregar configuracoes do backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfigData();
  }, []);

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await backendApi.syncCatalog({
        services: services
          .map((s) => ({ name: s.name.trim(), price: Number(s.price || 0) }))
          .filter((s) => s.name.length > 0),
        barbers: barbers
          .map((b) => ({ name: b.name.trim() }))
          .filter((b) => b.name.length > 0),
      });

      localStorage.setItem('@barberpro:metaCortes', metaCortes);
      await loadConfigData();
      setIsSaving(false);
      setHasChanges(false);
    } catch (error) {
      console.error('Falha ao salvar configuracoes:', error);
      setIsSaving(false);
      alert('Nao foi possivel salvar no backend.');
    }
  };

  const updateService = (index: number, field: string, value: string) => {
    const newServices = [...services];
    newServices[index] = { ...newServices[index], [field]: value };
    setServices(newServices);
    setHasChanges(true);
  };

  const updateBarber = (index: number, value: string) => {
    const newBarbers = [...barbers];
    newBarbers[index].name = value;
    setBarbers(newBarbers);
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <Container>
        <div style={{ color: '#777', fontWeight: 700 }}>Carregando configuracoes...</div>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <div>
          <h1 style={{ color: '#fff' }}>Configurações</h1>
          <p>Gestão de catálogo, equipe e metas da unidade.</p>
        </div>
        <ShieldCheck size={40} color="#222" />
      </Header>

      <TabNav>
        <TabButton active={activeTab === 'servicos'} onClick={() => setActiveTab('servicos')}>
          <Scissors size={16} /> Serviços
        </TabButton>
        <TabButton active={activeTab === 'equipe'} onClick={() => setActiveTab('equipe')}>
          <User size={16} /> Equipe
        </TabButton>
        <TabButton active={activeTab === 'geral'} onClick={() => setActiveTab('geral')}>
          <Settings size={16} /> Sistema
        </TabButton>
      </TabNav>

      {activeTab === 'servicos' && (
        <ConfigCard>
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '1.4rem', color: '#fff' }}>Catálogo de Serviços</h3>
            <p style={{ color: '#444', fontSize: '0.9rem' }}>Defina os serviços que aparecem no checkout e na agenda.</p>
          </div>
          
          {services.map((service, index) => (
            <ItemRow key={service.id}>
              <StyledInput 
                placeholder="Ex: Corte Social"
                value={service.name} 
                onChange={(e) => updateService(index, 'name', e.target.value)}
              />
              <PriceInputWrapper>
                <span>R$</span>
                <StyledInput 
                  type="number"
                  placeholder="0.00"
                  value={service.price} 
                  onChange={(e) => updateService(index, 'price', e.target.value)}
                />
              </PriceInputWrapper>
              <Trash2 
                size={18} 
                color="#333" 
                cursor="pointer" 
                onClick={() => { setServices(services.filter((s) => s.id !== service.id)); setHasChanges(true); }} 
              />
            </ItemRow>
          ))}
          
          <AddButton onClick={() => { setServices([...services, { id: `tmp-${Date.now()}`, name: '', price: '' }]); setHasChanges(true); }}>
            <Plus size={18} /> NOVO SERVIÇO
          </AddButton>
        </ConfigCard>
      )}

      {activeTab === 'equipe' && (
        <ConfigCard>
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '1.4rem', color: '#fff' }}>Profissionais</h3>
            <p style={{ color: '#444', fontSize: '0.9rem' }}>Gerencie os barbeiros ativos na sua unidade.</p>
          </div>
          
          {barbers.map((barber, index) => (
            <ItemRow style={{ gridTemplateColumns: '1fr 50px' }} key={barber.id}>
              <StyledInput 
                placeholder="Nome do profissional"
                value={barber.name} 
                onChange={(e) => updateBarber(index, e.target.value)}
              />
              <Trash2 
                size={18} 
                color="#333" 
                cursor="pointer" 
                onClick={() => { setBarbers(barbers.filter((b) => b.id !== barber.id)); setHasChanges(true); }} 
              />
            </ItemRow>
          ))}
          
          <AddButton onClick={() => { setBarbers([...barbers, { id: `tmp-${Date.now()}`, name: '' }]); setHasChanges(true); }}>
            <Plus size={18} /> ADICIONAR BARBEIRO
          </AddButton>
        </ConfigCard>
      )}

      {activeTab === 'geral' && (
        <ConfigCard>
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '1.4rem', color: '#fff' }}>Metas & Performance</h3>
            <p style={{ color: '#444', fontSize: '0.9rem' }}>Configurações de objetivos diários da unidade.</p>
          </div>

          <MetaCard>
            <div className="info">
              <div className="icon"><Target size={24} /></div>
              <div>
                <h4>Meta de Cortes Diária</h4>
                <p>Quantidade de atendimentos ideal para o dia.</p>
              </div>
            </div>
            <PriceInputWrapper style={{ width: '120px' }}>
              <StyledInput 
                type="number"
                value={metaCortes}
                onChange={(e) => { setMetaCortes(e.target.value); setHasChanges(true); }}
                style={{ textAlign: 'center' }}
              />
              <TrendingUp size={16} color="#333" />
            </PriceInputWrapper>
          </MetaCard>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', marginTop: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '30px', background: '#080808', borderRadius: '24px', border: '1px solid #111' }}>
              <div style={{ padding: '15px', background: '#111', borderRadius: '15px' }}>
                <CheckCircle color="#d4af37" size={30} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>Sincronização Ativa</div>
                <p style={{ color: '#444', fontSize: '0.85rem' }}>Seus dados estão sendo salvos localmente de forma segura.</p>
              </div>
            </div>
            
            <div style={{ padding: '20px', borderTop: '1px solid #111', color: '#222', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '2px', textAlign: 'center' }}>
              BARBER PRO SYSTEM • VERSÃO 3.5.0-GOLD
            </div>
          </div>
        </ConfigCard>
      )}

      <SaveFloating visible={hasChanges} onClick={handleSaveAll}>
        {isSaving ? (
          <>
            <Loader2 className="loader" size={20} /> SALVANDO...
          </>
        ) : (
          <>
            <Save size={20} /> SALVAR ALTERAÇÕES
          </>
        )}
      </SaveFloating>
    </Container>
  );
};