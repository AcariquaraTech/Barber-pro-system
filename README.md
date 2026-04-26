# Barber Pro System

Sistema desktop para gestao de barbearia com frontend React + TypeScript e backend local em Rust (Tauri), persistindo dados em SQLite.

## Objetivo

- Operar agenda, caixa, clientes e dashboard em um unico app desktop.
- Manter dados locais (offline-first no dispositivo) com baixa latencia.
- Fornecer uma base modular para evolucao de regras de negocio.

## Stack Tecnica

### Frontend

- React 19
- TypeScript 5
- Vite 7
- styled-components 6
- lucide-react
- @tauri-apps/api (bridge com comandos Rust)

### Backend

- Tauri 2
- Rust edition 2021
- rusqlite (SQLite com feature bundled)
- serde / serde_json
- chrono
- uuid

## Arquitetura do Sistema

O app segue uma arquitetura em camadas:

1. UI (React): telas, componentes e estado de navegacao.
2. Service Layer (TypeScript): contrato unico de acesso ao backend em src/services/backend.ts.
3. IPC Tauri: chamadas invoke do frontend para comandos Rust.
4. Application Layer (Rust): validacoes, regras e fluxos transacionais em commands.rs.
5. Persistence Layer (SQLite): schema e indices definidos em db.rs.

Fluxo principal de chamada:

```text
View (React) -> backendApi (TS) -> invoke("command") -> command (Rust) -> SQLite
```

## Estrutura de Pastas

```text
.
├─ src/
│  ├─ @types/                 # Tipos de dominio no frontend
│  ├─ assets/                 # Imagens e recursos visuais
│  ├─ components/
│  │  ├─ Booking/             # Blocos de agenda/agendamento
│  │  ├─ Cashier/             # Blocos de caixa/PDV
│  │  ├─ Dashboard/           # Blocos de indicadores
│  │  └─ Layout/              # Layout principal
│  ├─ config/
│  │  └─ features.ts          # Feature flags e regras locais
│  ├─ hooks/                  # Hooks customizados
│  ├─ services/
│  │  ├─ backend.ts           # Contrato de integracao com comandos Tauri
│  │  └─ mockData.ts
│  ├─ store/                  # Estado compartilhado
│  └─ views/                  # Telas (Agenda, Caixa, Clientes, etc.)
└─ src-tauri/
	 ├─ src/
	 │  ├─ lib.rs               # Bootstrap Tauri e registro de comandos
	 │  └─ backend/
	 │     ├─ db.rs             # Inicializacao SQLite + migracoes
	 │     ├─ models.rs         # DTOs/contratos de entrada e saida
	 │     ├─ commands.rs       # Regras de negocio expostas ao frontend
	 │     └─ mod.rs            # Modulo e estado global
	 ├─ Cargo.toml
	 └─ tauri.conf.json
```

## Backend (Tauri + Rust + SQLite)

### Inicializacao

- O bootstrap ocorre em src-tauri/src/lib.rs.
- Na etapa setup, init_database cria/abre o arquivo SQLite e aplica migracoes.
- O caminho do banco e armazenado no AppState e injetado nos comandos.

### Banco de dados

Tabelas principais:

- barbers
- services
- clients
- appointments
- sales

Indices criados:

- idx_appointments_date
- idx_appointments_phone
- idx_appointments_barber
- idx_sales_timestamp

Observacoes tecnicas:

- PRAGMA foreign_keys = ON no startup.
- Status de appointments validado por CHECK:
	reservado | confirmado | finalizado | cancelado.

### Comandos expostos ao frontend

Registrados em lib.rs via tauri::generate_handler!:

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
- sync_catalog

### Regras de negocio relevantes

- create_appointment bloqueia conflito de horario por barbeiro/data/hora (exceto status cancelado).
- create_appointment faz upsert de cliente por telefone.
- finalize_appointment marca atendimento como finalizado e gera registro em sales.
- sync_catalog executa transacao para substituir catalogo de servicos e barbeiros.
- Telefone de cliente e normalizado para digitos ASCII.

## Contrato Frontend -> Backend

O frontend centraliza toda integracao no modulo src/services/backend.ts.

Pontos importantes:

- Todas as chamadas passam por assertTauriRuntime().
- Em execucao web pura (npm run dev), chamadas ao backend local geram erro esperado.
- Tipos de dominio expostos: Barber, Service, Client, Appointment, SaleRecord.

## Telas Integradas ao Backend Real

- Agenda
- Caixa
- Clientes
- Dashboard

## Requisitos de Ambiente

### Obrigatorios

- Node.js 20+
- npm 10+
- Rust toolchain estavel
- Tauri prerequisites do sistema operacional

### Windows (recomendado)

- Microsoft C++ Build Tools (MSVC)
- WebView2 Runtime instalado

## Scripts do Projeto

No package.json:

- npm run dev: inicia frontend Vite (navegador).
- npm run build: transpila TypeScript e gera dist de producao.
- npm run preview: serve build localmente.
- npm run tauri -- dev: inicia app desktop (frontend + backend).
- npm run tauri -- build: gera bundle desktop.

## Como Executar

1. Instalar dependencias JS:

```bash
npm install
```

2. Desenvolvimento web (somente UI):

```bash
npm run dev
```

3. Desenvolvimento desktop completo (recomendado):

```bash
npm run tauri -- dev
```

4. Build de producao:

```bash
npm run build
npm run tauri -- build
```

## Como Logar Nos 3 Ambientes (Perfis)

No sistema, os 3 ambientes sao perfis de acesso diferentes dentro do mesmo app:

- Dono da barbearia: role admin
- Colaborador: role collaborator
- Cliente: role client

### 1) Subir frontend e backend juntos (modo recomendado)

Use este comando para abrir o app desktop completo (React + Rust + SQLite):

```bash
npm run tauri:dev
```

Observacao: para testar login real e permissao por role, rode sempre nesse modo.

No Linux com VS Code instalado via Snap, este projeto ja limpa variaveis de ambiente de GTK/Snap automaticamente no script, evitando erro:

```text
symbol lookup error ... libpthread.so.0 ... __libc_pthread_init, version GLIBC_PRIVATE
```

### 2) Criar as 3 contas na tela de login

Na tela inicial de Login:

1. Clique em Nao tem conta? Registre-se.
2. Selecione o perfil:
	- Dono -> cria conta com role admin
	- Colaborador -> cria conta com role collaborator
	- Cliente -> cria conta com role client
3. Preencha nome, email, senha (e telefone se quiser) e conclua o cadastro.
4. Repita para os 3 perfis (emails diferentes).

### 3) Entrar com cada perfil

Depois de cadastrar, use Entrar com o email/senha de cada conta:

- Login como admin: acesso completo (clientes, vendas, sync de catalogo, fechamento de caixa).
- Login como collaborator: foco em agenda e operacao do colaborador.
- Login como client: foco em pagamentos e visao do cliente.

### 4) Testar somente frontend (sem backend)

Se quiser abrir so a interface no navegador:

```bash
npm run dev
```

Importante: nesse modo, chamadas do backend local (Tauri/Rust) nao funcionam.

### 5) ⚡ Modo de Testes - Login Sem Senha

Para acelerar testes durante a fase de desenvolvimento, o app suporta **login sem credenciais**.

#### Habilitar Modo de Testes

1. Abra o arquivo `.env` na raiz do projeto:

```bash
VITE_TEST_MODE=true
```

2. Reinicie a aplicacao:

```bash
npm run tauri:dev
```

3. Na tela de Login, agora aparecerá o botão **"⚡ Entrar em Modo de Testes"**

#### Como Usar

1. Selecione o perfil desejado:
   - 👔 **Dono** - acesso admin (clientes, vendas, fechamento)
   - ✂️ **Colaborador** - acesso de barbeiro (agenda, servicos)
   - 👤 **Cliente** - acesso de cliente (perfil)

2. Clique em **"Entrar em Modo de Testes"**

3. Acesso instantâneo sem pedir senha (apenas durante testes!)

#### ⚠️ Observações Importantes

- Modo de testes gera um **JWT mock local** que nao é validado pelo backend
- Use **APENAS durante fase de testes** - desabilite em producao
- Sessao de teste tem duração de **7 dias**
- Permissoes sao aplicadas normalmente (cada role tem acesso restrito)

#### Desabilitar Modo de Testes

Para produção, altere no `.env`:

```bash
VITE_TEST_MODE=false
```

### 6) Build local quando houver problema de permissao no tsc


Se npm run build falhar com erro de permissao no tsc, valide o TypeScript assim:

```bash
node ./node_modules/typescript/bin/tsc --noEmit
```

## 🪟 Build Multiplataforma

O app foi construído com **Tauri 2**, que suporta múltiplas plataformas.

### Plataformas Suportadas

- ✅ **Linux** (AppImage, .deb)
- ✅ **Windows** (exe, MSI)
- ✅ **macOS** (app, DMG - requer macOS)

### Build para Windows

**Pré-requisitos:**
- Node.js 18+
- Rust
- Microsoft C++ Build Tools
- WebView2 Runtime

**Comando:**

```bash
npm run tauri:build
```

Gera em: `src-tauri/target/release/barber-pro-system.exe`

**Guia detalhado:** Ver arquivo [WINDOWS_BUILD.md](./WINDOWS_BUILD.md)

### Build para Linux

```bash
npm run tauri:build
```

Gera em: `src-tauri/target/release/bundle/appimage/`

### Build para macOS

```bash
# Requer estar em um Mac
npm run tauri:build
```

Gera em: `src-tauri/target/release/bundle/macos/`

## Persistencia e Dados Locais

- O SQLite e criado no app_data_dir resolvido pelo Tauri.
- Nome atual do arquivo: barber_pro.db.
- Migracoes sao aplicadas automaticamente ao iniciar o app.

## Limitacoes Conhecidas

- O backend local so existe durante runtime Tauri.
- Se abrir apenas no navegador, nao ha IPC nem comandos Rust disponiveis.

## Diretrizes para Evolucao

- Manter novos acessos ao backend centralizados em src/services/backend.ts.
- Evitar logica de negocio nas views; concentrar em hooks/services no frontend e commands no backend.
- Para novas entidades persistidas, atualizar: db.rs, models.rs, commands.rs e tipos TS correspondentes.