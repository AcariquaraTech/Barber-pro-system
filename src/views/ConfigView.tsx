import { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { 
  Scissors, User, Plus, Trash2, Save, 
  Settings, ShieldCheck, CheckCircle, Loader2, Target, TrendingUp, Palette
} from 'lucide-react';
import { backendApi } from '../services/backend';
import { useTheme } from '../context/ThemeContext';

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
const Container = styled.div<{ $theme: any }>`
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
  color: ${(props) => props.$theme.colors.text};
  animation: ${fadeIn} 0.5s ease-out;
  @media (max-width: 768px) { padding: 20px; }
`;

const Header = styled.header<{ $theme: any }>`
  margin-bottom: 40px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  
  h1 { font-size: 2.8rem; font-weight: 900; letter-spacing: -1px; }
  p { color: ${(props) => props.$theme.colors.textSecondary}; font-weight: 600; margin-top: 8px; }
  @media (max-width: 768px) { flex-direction: column; align-items: flex-start; gap: 20px; }
`;

const TabNav = styled.div<{ $theme: any }>`
  display: flex;
  gap: 8px;
  background: ${(props) => props.$theme.colors.secondary};
  padding: 6px;
  border-radius: 16px;
  margin-bottom: 30px;
  width: fit-content;
  border: 1px solid ${(props) => `${props.$theme.colors.border}22`};
`;

const TabButton = styled.button<{ active: boolean; $theme: any }>`
  background: ${props => props.active ? props.$theme.colors.primary : 'transparent'};
  border: none;
  padding: 12px 24px;
  color: ${props => props.active ? props.$theme.colors.background : props.$theme.colors.textSecondary};
  border-radius: 12px;
  font-weight: 800;
  font-size: 0.75rem;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 8px;
  &:hover { color: ${props => props.active ? props.$theme.colors.background : props.$theme.colors.primary}; }
`;

const ConfigCard = styled.div<{ $theme: any }>`
  background: linear-gradient(145deg, ${(props) => props.$theme.colors.secondary}, ${(props) => props.$theme.colors.background});
  border: 1px solid ${(props) => `${props.$theme.colors.border}33`};
  border-radius: 28px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
  animation: ${fadeIn} 0.4s ease-out;
  @media (max-width: 768px) { padding: 20px; }
`;

const ItemRow = styled.div<{ $theme: any }>`
  display: grid;
  grid-template-columns: 1fr 150px 50px;
  gap: 20px;
  align-items: center;
  background: ${(props) => props.$theme.colors.tertiary};
  padding: 10px 20px;
  border-radius: 18px;
  margin-bottom: 12px;
  border: 1px solid ${(props) => `${props.$theme.colors.border}22`};
  transition: 0.3s;
  &:focus-within { border-color: ${(props) => props.$theme.colors.primary}; background: ${(props) => props.$theme.colors.secondary}; }
  @media (max-width: 500px) {
    grid-template-columns: 1fr 40px;
    gap: 10px;
    & > div:nth-child(2) { grid-column: span 2; }
  }
`;

const StyledInput = styled.input<{ $theme?: any }>`
  background: transparent;
  border: none;
  color: ${(props) => props.$theme?.colors.text || '#fff'};
  font-size: 1rem;
  font-weight: 600;
  padding: 12px 0;
  width: 100%;
  &:focus { outline: none; }
  &::placeholder { color: ${(props) => props.$theme?.colors.textSecondary || '#333'}; }
`;

const PriceInputWrapper = styled.div<{ $theme: any }>`
  display: flex;
  align-items: center;
  gap: 8px;
  background: ${(props) => props.$theme.colors.background};
  padding: 0 15px;
  border-radius: 12px;
  border: 1px solid ${(props) => `${props.$theme.colors.border}33`};
  span { color: ${(props) => props.$theme.colors.primary}; font-weight: 900; font-size: 0.8rem; }
  input { width: 80px; text-align: right; }
`;

const AddButton = styled.button<{ $theme: any }>`
  background: ${(props) => `${props.$theme.colors.primary}10`};
  border: 2px dashed ${(props) => `${props.$theme.colors.border}33`};
  color: ${(props) => props.$theme.colors.primary};
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
    border-color: ${(props) => props.$theme.colors.primary}; 
    background: ${(props) => `${props.$theme.colors.primary}22`};
    transform: translateY(-2px);
  }
`;

const MetaCard = styled.div<{ $theme: any }>`
  background: ${(props) => props.$theme.colors.tertiary};
  border: 1px solid ${(props) => `${props.$theme.colors.border}22`};
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
    .icon { background: ${(props) => props.$theme.colors.secondary}; padding: 12px; border-radius: 12px; color: ${(props) => props.$theme.colors.primary}; }
    h4 { font-weight: 800; color: ${(props) => props.$theme.colors.text}; margin-bottom: 4px; }
    p { color: ${(props) => props.$theme.colors.textSecondary}; font-size: 0.85rem; }
  }
`;

const SaveFloating = styled.button<{ visible: boolean; $theme: any }>`
  position: fixed;
  bottom: 40px;
  right: 40px;
  background: ${(props) => props.$theme.colors.primary};
  color: ${(props) => props.$theme.colors.background};
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
  const { themeName, setTheme, availableThemes, currentTheme } = useTheme();
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
      <Container $theme={currentTheme}>
        <div style={{ color: currentTheme.colors.textSecondary, fontWeight: 700 }}>Carregando configuracoes...</div>
      </Container>
    );
  }

  return (
    <Container $theme={currentTheme}>
      <Header $theme={currentTheme}>
        <div>
          <h1 style={{ color: currentTheme.colors.text }}>Configurações</h1>
          <p>Gestão de catálogo, equipe e metas da unidade.</p>
        </div>
        <ShieldCheck size={40} color={currentTheme.colors.textSecondary} />
      </Header>

      <TabNav $theme={currentTheme}>
        <TabButton $theme={currentTheme} active={activeTab === 'servicos'} onClick={() => setActiveTab('servicos')}>
          <Scissors size={16} /> Serviços
        </TabButton>
        <TabButton $theme={currentTheme} active={activeTab === 'equipe'} onClick={() => setActiveTab('equipe')}>
          <User size={16} /> Equipe
        </TabButton>
        <TabButton $theme={currentTheme} active={activeTab === 'geral'} onClick={() => setActiveTab('geral')}>
          <Settings size={16} /> Sistema
        </TabButton>
        <TabButton $theme={currentTheme} active={activeTab === 'tema'} onClick={() => setActiveTab('tema')}>
          <Palette size={16} /> Tema
        </TabButton>
      </TabNav>

      {activeTab === 'servicos' && (
        <ConfigCard $theme={currentTheme}>
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '1.4rem', color: currentTheme.colors.text }}>Catálogo de Serviços</h3>
            <p style={{ color: currentTheme.colors.textSecondary, fontSize: '0.9rem' }}>Defina os serviços que aparecem no checkout e na agenda.</p>
          </div>
          
          {services.map((service, index) => (
            <ItemRow $theme={currentTheme} key={service.id}>
              <StyledInput 
                $theme={currentTheme}
                placeholder="Ex: Corte Social"
                value={service.name} 
                onChange={(e) => updateService(index, 'name', e.target.value)}
              />
              <PriceInputWrapper $theme={currentTheme}>
                <span>R$</span>
                <StyledInput 
                  $theme={currentTheme}
                  type="number"
                  placeholder="0.00"
                  value={service.price} 
                  onChange={(e) => updateService(index, 'price', e.target.value)}
                />
              </PriceInputWrapper>
              <Trash2 
                size={18} 
                color={currentTheme.colors.textSecondary} 
                cursor="pointer" 
                onClick={() => { setServices(services.filter((s) => s.id !== service.id)); setHasChanges(true); }} 
              />
            </ItemRow>
          ))}
          
          <AddButton $theme={currentTheme} onClick={() => { setServices([...services, { id: `tmp-${Date.now()}`, name: '', price: '' }]); setHasChanges(true); }}>
            <Plus size={18} /> NOVO SERVIÇO
          </AddButton>
        </ConfigCard>
      )}

      {activeTab === 'equipe' && (
        <ConfigCard $theme={currentTheme}>
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '1.4rem', color: currentTheme.colors.text }}>Profissionais</h3>
            <p style={{ color: currentTheme.colors.textSecondary, fontSize: '0.9rem' }}>Gerencie os barbeiros ativos na sua unidade.</p>
          </div>
          
          {barbers.map((barber, index) => (
            <ItemRow $theme={currentTheme} style={{ gridTemplateColumns: '1fr 50px' }} key={barber.id}>
              <StyledInput 
                $theme={currentTheme}
                placeholder="Nome do profissional"
                value={barber.name} 
                onChange={(e) => updateBarber(index, e.target.value)}
              />
              <Trash2 
                size={18} 
                color={currentTheme.colors.textSecondary} 
                cursor="pointer" 
                onClick={() => { setBarbers(barbers.filter((b) => b.id !== barber.id)); setHasChanges(true); }} 
              />
            </ItemRow>
          ))}
          
          <AddButton $theme={currentTheme} onClick={() => { setBarbers([...barbers, { id: `tmp-${Date.now()}`, name: '' }]); setHasChanges(true); }}>
            <Plus size={18} /> ADICIONAR BARBEIRO
          </AddButton>
        </ConfigCard>
      )}

      {activeTab === 'geral' && (
        <ConfigCard $theme={currentTheme}>
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '1.4rem', color: currentTheme.colors.text }}>Metas & Performance</h3>
            <p style={{ color: currentTheme.colors.textSecondary, fontSize: '0.9rem' }}>Configurações de objetivos diários da unidade.</p>
          </div>

          <MetaCard $theme={currentTheme}>
            <div className="info">
              <div className="icon"><Target size={24} /></div>
              <div>
                <h4>Meta de Cortes Diária</h4>
                <p>Quantidade de atendimentos ideal para o dia.</p>
              </div>
            </div>
            <PriceInputWrapper $theme={currentTheme} style={{ width: '120px' }}>
              <StyledInput 
                $theme={currentTheme}
                type="number"
                value={metaCortes}
                onChange={(e) => { setMetaCortes(e.target.value); setHasChanges(true); }}
                style={{ textAlign: 'center' }}
              />
              <TrendingUp size={16} color={currentTheme.colors.textSecondary} />
            </PriceInputWrapper>
          </MetaCard>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', marginTop: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '30px', background: currentTheme.colors.tertiary, borderRadius: '24px', border: `1px solid ${currentTheme.colors.border}22` }}>
              <div style={{ padding: '15px', background: currentTheme.colors.secondary, borderRadius: '15px' }}>
                <CheckCircle color={currentTheme.colors.primary} size={30} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: currentTheme.colors.text }}>Sincronização Ativa</div>
                <p style={{ color: currentTheme.colors.textSecondary, fontSize: '0.85rem' }}>Seus dados estão sendo salvos localmente de forma segura.</p>
              </div>
            </div>
            
            <div style={{ padding: '20px', borderTop: `1px solid ${currentTheme.colors.border}22`, color: currentTheme.colors.textSecondary, fontSize: '0.75rem', fontWeight: 800, letterSpacing: '2px', textAlign: 'center' }}>
              BARBER PRO SYSTEM • VERSÃO 3.5.0-GOLD
            </div>
          </div>
        </ConfigCard>
      )}

      {activeTab === 'tema' && (
        <ConfigCard $theme={currentTheme}>
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '1.4rem', color: currentTheme.colors.text }}>Tema e Layout</h3>
            <p style={{ color: currentTheme.colors.textSecondary, fontSize: '0.9rem' }}>
              Escolha a aparência principal do sistema para seu nicho.
            </p>
          </div>

          <div style={{ display: 'grid', gap: '14px' }}>
            {availableThemes.map((theme) => (
              <button
                key={theme.name}
                onClick={() => {
                  setTheme(theme.name);
                  setHasChanges(true);
                }}
                style={{
                  background: themeName === theme.name ? `${currentTheme.colors.primary}22` : currentTheme.colors.tertiary,
                  border: themeName === theme.name ? `2px solid ${currentTheme.colors.primary}` : `1px solid ${currentTheme.colors.border}33`,
                  color: currentTheme.colors.text,
                  borderRadius: '14px',
                  textAlign: 'left',
                  padding: '16px 20px',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                {theme.label}
              </button>
            ))}
          </div>
        </ConfigCard>
      )}

      <SaveFloating $theme={currentTheme} visible={hasChanges} onClick={handleSaveAll}>
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