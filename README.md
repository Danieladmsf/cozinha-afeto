# Cozinha Afeto 🍽️

Sistema completo de gestão para cozinha com foco em eficiência operacional e controle nutricional.

## 📋 Funcionalidades

### 🏢 Gestão Operacional
- **Dashboard**: Visão geral das operações diárias
- **Clientes**: Cadastro e gestão de clientes com portal personalizado
- **Fornecedores e Serviços**: Controle de fornecedores e prestadores
- **Pedidos**: Sistema completo de gestão de pedidos

### 🍳 Cardápio e Receitas
- **Cardápio Semanal**: Planejamento e configuração de cardápios
- **Receitas**: Banco de receitas com fichas técnicas detalhadas
- **Ficha Técnica**: Cálculos nutricionais e de custos
- **Análise de Receitas**: Relatórios e análises nutricionais

### 📊 Controle e Relatórios
- **Ingredientes**: Gestão completa do estoque de ingredientes
- **Tabela Nutricional**: Base de dados nutricionais
- **Sobras**: Controle e relatórios de desperdício
- **Contas**: Gestão financeira e controle de gastos

### 🔧 Configurações
- **Categorias**: Organização por categorias de alimentos
- **Configurar Cardápio**: Personalização de layout e apresentação

## 🚀 Tecnologias

- **Frontend**: React 18 + Next.js 14
- **Backend**: Firebase (Firestore, Auth, Functions)
- **UI/UX**: Tailwind CSS + shadcn/ui
- **Animações**: Framer Motion
- **Ícones**: Lucide React
- **Formulários**: React Hook Form
- **Datas**: date-fns

## 📁 Estrutura do Projeto

```
cozinha-afeto/
├── app/                          # Páginas do Next.js App Router
│   ├── dashboard/               # Dashboard principal
│   ├── clientes/               # Gestão de clientes
│   ├── cardapio/               # Cardápio semanal
│   ├── receitas/               # Banco de receitas
│   ├── ingredientes/           # Gestão de ingredientes
│   ├── pedidos/                # Sistema de pedidos
│   ├── portal/                 # Portal do cliente
│   └── ...
├── components/                  # Componentes React
│   ├── ui/                     # Componentes base (shadcn/ui)
│   ├── shared/                 # Componentes compartilhados
│   ├── clientes/               # Componentes específicos de clientes
│   ├── cardapio/               # Componentes de cardápio
│   └── ...
├── hooks/                      # Custom hooks organizados por módulo
├── lib/                        # Utilitários e configurações
├── utils/                      # Funções auxiliares
└── public/                     # Arquivos estáticos
```

## 🛠️ Instalação e Configuração

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Conta Firebase

### 1. Clone o repositório
```bash
git clone https://github.com/Danieladmsf/cozinha-afeto.git
cd cozinha-afeto
```

### 2. Instale as dependências
```bash
npm install
# ou
yarn install
```

### 3. Configure o Firebase
1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Configure Firestore Database
3. Configure Authentication
4. Copie as credenciais para `lib/firebase.js`

### 4. Execute o projeto
```bash
npm run dev
# ou
yarn dev
```

O projeto estará disponível em `http://localhost:3000`

## 🔥 Firebase Setup

### Firestore Collections
- `clientes` - Dados dos clientes
- `receitas` - Banco de receitas
- `ingredientes` - Catálogo de ingredientes
- `cardapios` - Cardápios semanais
- `pedidos` - Pedidos dos clientes
- `fornecedores` - Fornecedores e serviços
- `configuracoes` - Configurações do sistema

### Authentication
- Login/cadastro de clientes
- Portal personalizado por cliente
- Controle de acesso administrativo

## 📱 Portal do Cliente

Sistema dedicado para clientes com:
- Visualização personalizada do cardápio
- Realização de pedidos
- Histórico de pedidos
- Informações nutricionais

## 🎨 Design System

Utiliza **shadcn/ui** para componentes consistentes:
- Tema personalizado
- Componentes acessíveis
- Design responsivo
- Paleta de cores da marca

## 📊 Relatórios e Analytics

- Análise de aceitação de receitas
- Controle de desperdício (sobras)
- Relatórios nutricionais
- Gestão de custos

## 🔄 Deploy

### Vercel (Recomendado)
```bash
npm run build
npm run start
```

### Firebase Hosting
```bash
npm run build
firebase deploy
```

## 📝 Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento
npm run build        # Build para produção
npm run start        # Servidor de produção
npm run lint         # Verificar código
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a MIT License.

## 📞 Suporte

Para dúvidas ou suporte, entre em contato através dos issues do GitHub.

---

**Cozinha Afeto** - Transformando a gestão de cozinhas através da tecnologia 🚀