# 🔄 Template de Projeto - Danieladmsf

## Usando este projeto como base para outros

### 🚀 Setup Rápido
```bash
# 1. Criar novo repo no GitHub: danieladmsf/[NOME-PROJETO]
# 2. Clonar como template
git clone https://github.com/Danieladmsf/cozinha-afeto.git [NOME-PROJETO]
cd [NOME-PROJETO]

# 3. Reconfigurar Git
git remote remove origin
git remote add origin https://github.com/Danieladmsf/[NOME-PROJETO].git

# 4. Primeiro push
git add .
git commit -m "feat: projeto inicial baseado em template"
git push -u origin main
```

### 📝 Checklist de Personalização

#### Arquivos Principais
- [ ] `README.md` - Título, descrição, funcionalidades específicas
- [ ] `package.json` - name, description, version
- [ ] `SETUP.md` - URLs e instruções específicas do projeto
- [ ] `.env.example` - Variáveis específicas

#### Firebase
- [ ] Criar novo projeto Firebase
- [ ] Configurar Firestore com collections específicas
- [ ] Atualizar `lib/firebase.js` com novas credenciais
- [ ] Configurar regras de segurança

#### Branding/UI
- [ ] `tailwind.config.js` - Cores do tema
- [ ] `app/globals.css` - Estilos customizados
- [ ] `public/` - Logos, favicon, imagens
- [ ] Textos e labels nas páginas

#### Funcionalidades
- [ ] `app/` - Adaptar/remover páginas desnecessárias
- [ ] `components/` - Personalizar componentes
- [ ] `lib/` - Ajustar constantes e utilitários
- [ ] `hooks/` - Adaptar lógica de negócio

### 🏗️ Estrutura Base Reutilizável

#### ✅ O que MANTER:
- Estrutura Next.js 14 + App Router
- Sistema de componentes shadcn/ui
- Configuração Tailwind CSS
- Setup Firebase (Firestore + Auth)
- Hooks organizados por módulo
- Sistema de navegação
- Design responsivo

#### 🔄 O que ADAPTAR:
- Collections Firestore específicas
- Páginas e rotas conforme negócio
- Componentes de domínio específico
- Textos, labels e mensagens
- Cores e branding
- Lógica de negócio nos hooks

#### ❌ O que REMOVER:
- Funcionalidades específicas (ex: receitas, cardápio)
- Componentes não utilizados
- Páginas desnecessárias
- Dados mockados específicos

### 🎯 Casos de Uso Comuns

#### E-commerce
- `app/produtos/` → catálogo
- `app/carrinho/` → carrinho de compras
- `app/pedidos/` → histórico de pedidos
- Collections: `produtos`, `pedidos`, `usuarios`

#### Sistema de Gestão
- `app/dashboard/` → métricas específicas
- `app/clientes/` → CRM
- `app/relatorios/` → analytics
- Collections: `clientes`, `vendas`, `produtos`

#### Portal de Serviços
- `app/servicos/` → catálogo de serviços
- `app/agendamentos/` → agenda
- `app/clientes/` → base de clientes
- Collections: `servicos`, `agendamentos`, `profissionais`

### 🔧 Scripts de Automação

#### Renomear Projeto
```bash
# Script para renomear rapidamente
find . -name "*.json" -exec sed -i 's/cozinha-afeto/[NOVO-NOME]/g' {} \;
find . -name "*.md" -exec sed -i 's/Cozinha Afeto/[NOVO-TITULO]/g' {} \;
```

#### Limpar Funcionalidades Específicas
```bash
# Remover módulos específicos de cozinha
rm -rf app/receitas app/cardapio app/ingredientes
rm -rf components/receitas components/cardapio components/ingredientes
rm -rf hooks/receitas hooks/cardapio hooks/ingredientes
```

### 📋 Template Package.json
```json
{
  "name": "[nome-projeto]",
  "version": "1.0.0",
  "description": "[Descrição do projeto]",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

### 🔥 Template Firebase Collections
```javascript
// Estrutura genérica para qualquer projeto
const collections = {
  // Sempre manter
  'usuarios': { id, nome, email, role, ativo, createdAt },
  'configuracoes': { chave, valor, tipo, updatedAt },
  
  // Adaptar conforme negócio
  'entidades_principais': { /* campos específicos */ },
  'transacoes': { /* logs de ações */ },
  'relatorios': { /* dados consolidados */ }
}
```

### 💡 Dicas de Reutilização
1. **Mantenha a estrutura base** - App Router + componentes
2. **Adapte gradualmente** - Não tente mudar tudo de uma vez
3. **Reutilize components/ui** - São genéricos e funcionais
4. **Personalize hooks** - Adapte a lógica de negócio
5. **Configure Firebase novo** - Sempre criar projeto específico

---

**Template criado por Danieladmsf** - Acelere seus próximos projetos! 🚀