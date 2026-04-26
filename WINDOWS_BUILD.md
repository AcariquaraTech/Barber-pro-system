# Build Multiplataforma - Guia Windows

O BarberPro System usa **Tauri 2**, que já suporta compilação para múltiplas plataformas.

## ✅ Testes em Linux (Validado)

```bash
npm run tauri:dev
```

## 🪟 Build para Windows

### Pré-requisitos no Windows

1. **Node.js 18+** (LTS recomendado)
   ```
   https://nodejs.org/
   ```

2. **Rust** (Tauri precisa do Rust para compilar)
   ```
   https://www.rust-lang.org/tools/install
   ```

3. **Microsoft C++ Build Tools** (obrigatório)
   ```
   https://visualstudio.microsoft.com/visual-cpp-build-tools/
   ```

4. **WebView2 Runtime** (para Tauri)
   ```
   https://developer.microsoft.com/en-us/microsoft-edge/webview2/
   ```

### Passo 1: Clonar o repositório

```bash
git clone git@github.com:AcariquaraTech/Barber-pro-system.git
cd barber-pro-system
```

### Passo 2: Instalar dependências

```bash
npm install
```

### Passo 3: Compilar para Windows

#### Desenvolvimento (com HMR)
```bash
npm run tauri:dev
```

Isso abrirá a aplicação em modo de desenvolvimento com hot-reload. Qualquer mudança no código será refletida instantaneamente.

#### Build de Produção (gera executável)
```bash
npm run tauri:build
```

Isso gerará:
- `src-tauri/target/release/barber-pro-system.exe` - Executável
- `src-tauri/target/release/bundle/msi/` - Instalador MSI (opcional)

### Passo 4: Empacotar (opcional)

Para criar um instalador MSI para distribuição:

```bash
npm run tauri:build
```

O instalador estará em:
```
src-tauri/target/release/bundle/msi/Barber-Pro-System_0.1.0_x64.msi
```

## 🔧 Troubleshooting

### Erro: "Rust não encontrado"
```bash
# Instale Rust
https://www.rust-lang.org/tools/install

# Reinicie o terminal após instalação
```

### Erro: "Microsoft C++ Build Tools não encontrado"
```bash
# Instale Microsoft C++ Build Tools
https://visualstudio.microsoft.com/visual-cpp-build-tools/

# Selecione "Desktop Development with C++" durante a instalação
```

### Erro: "WebView2 não encontrado"
```bash
# Instale WebView2 Runtime
https://developer.microsoft.com/en-us/microsoft-edge/webview2/

# Ativar auto-update no tauri.conf.json (recomendado para produção)
```

### Compilação lenta
- Primeira compilação leva 10-15 minutos (normal com Rust)
- Compilações posteriores são mais rápidas
- Build de release (-O3 otimizado) leva mais, mas resultará em executável menor

## 🔄 Multiplataforma

O `tauri.conf.json` já está configurado com:
```json
"targets": "all"
```

Isso permite compilar para:
- ✅ Windows (x86_64)
- ✅ macOS (Intel e Apple Silicon)
- ✅ Linux (AppImage, deb)

### Build para Linux (de Windows)

```bash
# Requer WSL 2 ou equivalente
cargo build --target x86_64-unknown-linux-gnu
```

### Build para macOS (de Windows)

Não é suportado nativamente. Use macOS ou CI/CD (GitHub Actions).

## 📦 Distribuição

### Opção 1: Arquivo executável
- Entregar: `barber-pro-system.exe`
- Usuário executa e cria atalho

### Opção 2: Instalador MSI
- Gerar em: `src-tauri/target/release/bundle/msi/`
- Melhor experiência: add/remove programs, atalhos automáticos

### Opção 3: GitHub Releases
```bash
# Push para GitHub cria builds automaticamente se CI está configurado
git push origin master
```

## 🧪 Modo de Testes

Para acelerar testes sem entrar com credenciais:

1. Renomeie `.env.test` para `.env`:
```bash
cp .env.test .env
```

2. Na tela de login, você verá botão **"Entrar em Modo de Testes"**

3. Selecione seu role (Dono, Colaborador, Cliente) e clique no botão

4. Acesso instantâneo sem credenciais (apenas para testes!)

## 📋 Checklist de Release

- [ ] Teste em Windows local (`npm run tauri:dev`)
- [ ] Teste login com modo de testes habilitado (⚡)
- [ ] Gere build de produção (`npm run tauri:build`)
- [ ] Teste o executável gerado
- [ ] Teste o instalador MSI
- [ ] Commit e push para GitHub
- [ ] Distribuir `.exe` ou `.msi` para a equipe

---

**Dúvidas?** Verifique logs em:
- Desenvolvimento: console do Tauri (F12)
- Produção: `%APPDATA%/barber-pro-system/`
