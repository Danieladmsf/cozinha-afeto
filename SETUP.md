# 🚀 Setup Rápido - Cozinha Afeto

## Para a próxima I.A. - Instruções de Deploy

### 1. Configuração Inicial
```bash
# Clone e instale dependências
git clone https://github.com/Danieladmsf/cozinha-afeto.git
cd cozinha-afeto
npm install
```

### 2. Firebase Setup
1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Crie novo projeto ou use existente
3. Configure:
   - **Firestore Database** (modo produção)
   - **Authentication** (Email/Password)
   - **Storage** (para uploads)
4. Copie config do Firebase para `lib/firebase.js`

### 3. Variáveis de Ambiente
```bash
# Copie o arquivo exemplo
cp .env.example .env.local

# Configure as variáveis Firebase
# NEXT_PUBLIC_FIREBASE_API_KEY=...
# NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
# etc.
```

### 4. Deploy Rápido

#### Vercel (Recomendado)
```bash
# Instale Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configure environment variables no dashboard Vercel
```

#### Firebase Hosting
```bash
# Instale Firebase CLI
npm install -g firebase-tools

# Login e configure
firebase login
firebase init hosting

# Deploy
npm run build
firebase deploy
```

### 5. Estrutura de Dados Firestore

Coleções principais:
- `clientes` - {nome, email, telefone, endereco, ativo}
- `receitas` - {nome, ingredientes[], instrucoes, categoria}
- `cardapios` - {semana, cliente, receitas[], ativo}
- `pedidos` - {clienteId, itens[], data, status}
- `ingredientes` - {nome, categoria, unidade, preco}

### 6. Primeira Configuração
1. Acesse `/dashboard` após deploy
2. Configure categorias em `/categorias`
3. Cadastre ingredientes em `/ingredientes`
4. Crie receitas em `/receitas`
5. Configure cardápio em `/cardapio`

### 7. Portal do Cliente
- URL: `/portal/[clienteId]`
- Cadastro automático: `/portal/[clienteId]/cadastro`
- Pedidos: `/portal/[clienteId]/orders`

### 8. Scripts Úteis
```bash
npm run dev          # Desenvolvimento local
npm run build        # Build produção
npm run start        # Servidor produção
npm run lint         # Verificar código
```

### 9. Troubleshooting
- **Build Error**: Verifique variáveis de ambiente
- **Firebase Error**: Confirme regras Firestore
- **Deploy Error**: Verifique .gitignore (node_modules, .env, .next)

### 10. Próximos Passos
- [ ] Configurar regras de segurança Firestore
- [ ] Implementar backup automático
- [ ] Configurar monitoramento
- [ ] Otimizar performance (lazy loading)
- [ ] Implementar testes automatizados

## 📱 URLs Importantes
- Dashboard: `/dashboard`
- Clientes: `/clientes`
- Cardápio: `/cardapio`
- Receitas: `/receitas`
- Portal Cliente: `/portal/[id]`

## 🔧 Comandos Git Rápidos
```bash
# Atualizar projeto
git add .
git commit -m "feat: nova funcionalidade"
git push origin main

# Deploy automático (se configurado)
# Vercel: push para main = deploy automático
# Firebase: firebase deploy
```