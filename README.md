src/
├── @types/          # Tipagem TypeScript (Contratos de dados)
├── assets/          # Imagens, logos e ícones dos barbeiros
├── components/      # Componentes reutilizáveis (Botões, Inputs)
│   ├── Layout/      # Sidebar, Header (fixos)
│   ├── Booking/     # Calendário e seleção de barbeiro
│   ├── Cashier/     # Parte de fechamento de caixa
│   └── Dashboard/   # Gráficos de faturamento
├── config/          # Regras de negócio (Modularização ON/OFF)
├── hooks/           # Lógica reaproveitável (Contagem de cortes, WhatsApp)
├── services/        # Conexão com Banco de Dados (API ou Supabase)
├── store/           # Estado Global (Qual unidade está aberta agora?)
└── views/           # As páginas completas do sistema

## Backend Profissional (Tauri + Rust + SQLite)

O projeto agora possui backend local profissional em Rust, executando dentro do Tauri, com persistencia em SQLite.

### Arquitetura backend

- src-tauri/src/backend/db.rs
	- inicializacao do banco
	- migracoes SQL
	- base limpa por padrao (sem seeds automaticos)
- src-tauri/src/backend/models.rs
	- contratos de entrada e saida dos comandos
- src-tauri/src/backend/commands.rs
	- comandos expostos para o frontend via invoke
- src-tauri/src/lib.rs
	- bootstrap do estado global e registro dos comandos

### Entidades persistidas

- barbers
- services
- clients
- appointments
- sales

### Comandos disponiveis

- health
- list_barbers
- list_services
- list_clients
- create_client
- update_client
- delete_client
- list_appointments
- create_appointment
- update_appointment_status
- finalize_appointment
- create_sale
- list_sales

### Frontend integrado ao backend

As telas abaixo ja consomem backend real via src/services/backend.ts:

- Agenda
- Caixa
- Clientes
- Dashboard

### Como executar

1. Instale dependencias do frontend:

	 npm install

2. Rode em modo desktop (frontend + backend):

	 npm run tauri dev

3. Build de producao:

	 npm run build

### Observacao importante

O backend em Rust/Tauri funciona no runtime Tauri. Se abrir apenas no navegador com npm run dev, as chamadas de backend nao estarao disponiveis.