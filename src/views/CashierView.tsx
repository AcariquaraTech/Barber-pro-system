import React, { useMemo, useState } from 'react';
import styled, { css } from 'styled-components';
import { useTheme } from '../context/ThemeContext';
import {
  Banknote,
  Check,
  CreditCard,
  DollarSign,
  Minus,
  Plus,
  RotateCcw,
  Smartphone,
  X,
} from 'lucide-react';
import { backendApi } from '../services/backend';

interface CashierTransaction {
  id: string;
  description: string;
  amount: number;
  method: 'cash' | 'credit_card' | 'debit_card' | 'pix';
  timestamp: Date;
  notes?: string;
}

interface CashierViewProps {
  dadosIniciais?: {
    barbeiro?: string;
    cliente?: string;
    servico?: string;
    valor?: number;
    idAgendamento?: string | number;
  } | null;
  onSuccess?: () => void;
}

const Container = styled.div<{ $theme: any }>`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  padding: 24px;
  background: ${(props) => props.$theme.colors.background};
  color: ${(props) => props.$theme.colors.text};
  min-height: 100vh;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const Section = styled.div<{ $theme: any }>`
  background: ${(props) => props.$theme.colors.secondary};
  border-radius: ${(props) => props.$theme.borderRadius.large};
  padding: 20px;
  border: 1px solid ${(props) => props.$theme.colors.border}22;
`;

const Title = styled.h2<{ $theme: any }>`
  font-size: ${(props) => props.$theme.typography.sizes.h3};
  color: ${(props) => props.$theme.colors.text};
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;

  svg {
    color: ${(props) => props.$theme.colors.primary};
  }
`;

const InputGroup = styled.div`
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label<{ $theme: any }>`
  font-weight: 600;
  font-size: 0.9rem;
  color: ${(props) => props.$theme.colors.textSecondary};
`;

const Input = styled.input<{ $theme: any }>`
  padding: 12px;
  border: 2px solid ${(props) => props.$theme.colors.border}33;
  border-radius: 8px;
  background: ${(props) => props.$theme.colors.background};
  color: ${(props) => props.$theme.colors.text};
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: ${(props) => props.$theme.colors.primary};
    box-shadow: 0 0 0 3px ${(props) => props.$theme.colors.primary}22;
  }
`;

const TextArea = styled.textarea<{ $theme: any }>`
  padding: 12px;
  border: 2px solid ${(props) => props.$theme.colors.border}33;
  border-radius: 8px;
  background: ${(props) => props.$theme.colors.background};
  color: ${(props) => props.$theme.colors.text};
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;

  &:focus {
    outline: none;
    border-color: ${(props) => props.$theme.colors.primary};
  }
`;

const PaymentMethodGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
`;

const PaymentButton = styled.button<{ $active: boolean; $theme: any }>`
  padding: 16px;
  border: 2px solid
    ${(props) => (props.$active ? props.$theme.colors.primary : props.$theme.colors.border)}33;
  background: ${(props) => (props.$active ? `${props.$theme.colors.primary}22` : 'transparent')};
  color: ${(props) => props.$theme.colors.text};
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;

  svg {
    color: ${(props) => (props.$active ? props.$theme.colors.primary : props.$theme.colors.textSecondary)};
  }

  &:hover {
    border-color: ${(props) => props.$theme.colors.primary};
  }
`;

const TransactionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
`;

const TransactionItem = styled.div<{ $theme: any }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: ${(props) => props.$theme.colors.background};
  border-radius: 8px;
  border-left: 4px solid ${(props) => props.$theme.colors.primary};
`;

const TransactionAmount = styled.div<{ $theme: any }>`
  font-weight: 700;
  color: ${(props) => props.$theme.colors.primary};
  font-size: 1.1rem;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin: 20px 0;
`;

const SummaryCard = styled.div<{ $theme: any; $color?: string }>`
  background: ${(props) => props.$theme.colors.background};
  padding: 16px;
  border-radius: 12px;
  border: 2px solid ${(props) => props.$color || props.$theme.colors.border}33;
  text-align: center;

  > div:first-child {
    font-size: 0.9rem;
    color: ${(props) => props.$theme.colors.textSecondary};
    margin-bottom: 8px;
  }

  > div:last-child {
    font-size: 1.6rem;
    font-weight: 700;
    color: ${(props) => props.$color || props.$theme.colors.primary};
  }
`;

const ActionButtons = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 20px;
`;

const Button = styled.button<{ $theme: any; $variant?: 'primary' | 'danger' | 'secondary' }>`
  padding: 14px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  ${(props) =>
    props.$variant === 'primary' && css`
      background: ${props.$theme.colors.primary};
      color: ${props.$theme.colors.background};

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px ${props.$theme.colors.primary}44;
      }
    `}

  ${(props) =>
    props.$variant === 'danger' && css`
      background: #ff4d4d;
      color: white;

      &:hover {
        background: #e63946;
      }
    `}

  ${(props) =>
    props.$variant === 'secondary' && css`
      background: ${props.$theme.colors.border}22;
      color: ${props.$theme.colors.text};

      &:hover {
        background: ${props.$theme.colors.border}44;
      }
    `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const CashierView: React.FC<CashierViewProps> = ({ dadosIniciais, onSuccess }) => {
  const { currentTheme } = useTheme();
  const [transactions, setTransactions] = useState<CashierTransaction[]>(() => {
    if (!dadosIniciais) return [];
    return [
      {
        id: crypto.randomUUID(),
        description: `${dadosIniciais.servico || 'Serviço'} - ${dadosIniciais.cliente || 'Cliente'}`,
        amount: Number(dadosIniciais.valor || 0),
        method: 'pix',
        timestamp: new Date(),
      },
    ];
  });
  const [selectedMethod, setSelectedMethod] = useState<'cash' | 'credit_card' | 'debit_card' | 'pix'>('cash');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  const summary = useMemo(() => {
    const totals = {
      cash: 0,
      credit_card: 0,
      debit_card: 0,
      pix: 0,
      total: 0,
    };

    transactions.forEach((t) => {
      totals[t.method] += t.amount;
      totals.total += t.amount;
    });

    return totals;
  }, [transactions]);

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = Number(amount);
    if (!description.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Preencha os campos corretamente.');
      return;
    }

    const newTransaction: CashierTransaction = {
      id: crypto.randomUUID(),
      description: description.trim(),
      amount: parsedAmount,
      method: selectedMethod,
      timestamp: new Date(),
      notes: notes.trim() || undefined,
    };

    setTransactions((prev) => [...prev, newTransaction]);
    setDescription('');
    setAmount('');
    setNotes('');
  };

  const handleRemoveTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleClear = () => {
    if (confirm('Limpar todas as transações?')) {
      setTransactions([]);
    }
  };

  const handleCloseCashier = async () => {
    if (!transactions.length) {
      alert('Nenhuma transação registrada.');
      return;
    }

    setIsClosing(true);
    try {
      const summary = await backendApi.closeCashier({
        opening_balance: 0,
        notes: notes.trim() || undefined,
        transactions: transactions.map((t) => ({
          barbeiro: dadosIniciais?.barbeiro || 'Atendimento Balcão',
          cliente: dadosIniciais?.cliente || 'Consumidor Final',
          servico: t.description,
          valor: t.amount,
          metodo: t.method,
          unidade: 'Matriz Center',
        })),
      });

      alert(`Caixa fechado com sucesso. Total: ${formatCurrency(summary.total_revenue)}`);
      setTransactions([]);
      onSuccess?.();
    } catch (error: any) {
      alert(error?.message || 'Falha ao fechar caixa.');
    } finally {
      setIsClosing(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getPaymentMethodLabel = (method: string) => {
    const labels = {
      cash: 'Dinheiro',
      credit_card: 'Crédito',
      debit_card: 'Débito',
      pix: 'Pix',
    };
    return labels[method as keyof typeof labels] || method;
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <Banknote size={20} />;
      case 'credit_card':
      case 'debit_card':
        return <CreditCard size={20} />;
      case 'pix':
        return <Smartphone size={20} />;
      default:
        return <DollarSign size={20} />;
    }
  };

  return (
    <Container $theme={currentTheme}>
      <Section $theme={currentTheme}>
        <Title $theme={currentTheme}>
          <DollarSign size={24} />
          Registrar Transação
        </Title>

        <form onSubmit={handleAddTransaction}>
          <InputGroup>
            <Label $theme={currentTheme}>Descrição</Label>
            <Input
              $theme={currentTheme}
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Corte + Barba"
            />
          </InputGroup>

          <InputGroup>
            <Label $theme={currentTheme}>Valor (R$)</Label>
            <Input
              $theme={currentTheme}
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </InputGroup>

          <InputGroup>
            <Label $theme={currentTheme}>Método de Pagamento</Label>
            <PaymentMethodGrid>
              {(['cash', 'credit_card', 'debit_card', 'pix'] as const).map((method) => (
                <PaymentButton
                  key={method}
                  $theme={currentTheme}
                  $active={selectedMethod === method}
                  onClick={() => setSelectedMethod(method)}
                  type="button"
                >
                  {getPaymentMethodIcon(method)}
                  {getPaymentMethodLabel(method)}
                </PaymentButton>
              ))}
            </PaymentMethodGrid>
          </InputGroup>

          <InputGroup>
            <Label $theme={currentTheme}>Observações</Label>
            <TextArea
              $theme={currentTheme}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações opcionais"
            />
          </InputGroup>

          <Button $theme={currentTheme} $variant="primary" type="submit">
            <Plus size={18} />
            Adicionar
          </Button>
        </form>

        <ActionButtons>
          <Button $theme={currentTheme} $variant="secondary" onClick={handleClear}>
            <RotateCcw size={18} />
            Limpar
          </Button>
          <Button $theme={currentTheme} $variant="danger" onClick={() => alert('Em breve')}>
            <Minus size={18} />
            Devolução
          </Button>
        </ActionButtons>
      </Section>

      <Section $theme={currentTheme}>
        <Title $theme={currentTheme}>
          <Check size={24} />
          Resumo do Caixa
        </Title>

        <SummaryGrid>
          <SummaryCard $theme={currentTheme} $color="#4CAF50">
            <div>Dinheiro</div>
            <div>{formatCurrency(summary.cash)}</div>
          </SummaryCard>
          <SummaryCard $theme={currentTheme} $color="#2196F3">
            <div>Crédito</div>
            <div>{formatCurrency(summary.credit_card)}</div>
          </SummaryCard>
          <SummaryCard $theme={currentTheme} $color="#FF9800">
            <div>Débito</div>
            <div>{formatCurrency(summary.debit_card)}</div>
          </SummaryCard>
          <SummaryCard $theme={currentTheme} $color="#9C27B0">
            <div>Pix</div>
            <div>{formatCurrency(summary.pix)}</div>
          </SummaryCard>
        </SummaryGrid>

        <SummaryCard $theme={currentTheme}>
          <div>Total</div>
          <div style={{ fontSize: '2rem' }}>{formatCurrency(summary.total)}</div>
        </SummaryCard>

        <Title $theme={currentTheme} style={{ marginTop: '30px' }}>
          Transações
        </Title>

        {transactions.length === 0 ? (
          <p style={{ color: currentTheme.colors.textSecondary, textAlign: 'center', padding: '20px' }}>
            Nenhuma transação registrada.
          </p>
        ) : (
          <TransactionList>
            {transactions.map((t) => (
              <TransactionItem key={t.id} $theme={currentTheme}>
                <div>
                  <div style={{ fontWeight: 600 }}>{t.description}</div>
                  <div style={{ fontSize: '0.85rem', color: currentTheme.colors.textSecondary }}>
                    {getPaymentMethodLabel(t.method)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <TransactionAmount $theme={currentTheme}>{formatCurrency(t.amount)}</TransactionAmount>
                  <button
                    onClick={() => handleRemoveTransaction(t.id)}
                    style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: '4px' }}
                  >
                    <X size={18} />
                  </button>
                </div>
              </TransactionItem>
            ))}
          </TransactionList>
        )}

        <Button
          $theme={currentTheme}
          $variant="primary"
          onClick={handleCloseCashier}
          disabled={isClosing || !transactions.length}
          style={{ width: '100%', marginTop: '20px' }}
        >
          <Check size={18} />
          {isClosing ? 'Processando...' : 'Fechar Caixa'}
        </Button>
      </Section>
    </Container>
  );
};
