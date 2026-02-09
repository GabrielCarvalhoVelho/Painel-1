# Painel Solos.ag 🌱☕

> **Sistema de Gestão Agrícola para Fazendas de Café**  
> Desenvolvido pela Solos.ag — Painel completo para gerenciamento financeiro, operacional e técnico de propriedades cafeicultoras.

**🚀 [Guia de Deploy](./DEPLOY.md)** | **📖 [Documentação Completa](#-índice)**

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Stack Tecnológica](#-stack-tecnológica)
- [Arquitetura do Sistema](#-arquitetura-do-sistema)
- [Estrutura de Pastas](#-estrutura-de-pastas)
- [Instalação e Configuração](#-instalação-e-configuração)
- [Módulos do Sistema](#-módulos-do-sistema)
- [Dados Mockados (Frontend-only)](#-dados-mockados-frontend-only-) ✨ **Novo**
- [Serviços (Services)](#-serviços-services)
- [Utilitários (Lib)](#-utilitários-lib)
- [Banco de Dados](#-banco-de-dados)
- [Autenticação](#-autenticação)
- [Guia de Desenvolvimento](#-guia-de-desenvolvimento)
- [Padrões e Convenções](#-padrões-e-convenções)
- [Identidade Visual](#-identidade-visual)

---

## 🎯 Visão Geral

O **Painel Solos.ag** é uma aplicação web Single Page Application (SPA) que permite aos cafeicultores:

- � **Gerir dívidas e financiamentos** ✨ **Novo** (custeio, CPR, contratos)
- 📄 **Centralizar documentação** ✨ **Novo** (CAR, CPF, contratos, notas)
- 🐛 **Monitorar pragas e doenças** ✨ **Novo** (ocorrências, diagnósticos, tratamentos)
- 📊 **Acompanhar o fluxo de caixa** (entradas, saídas, saldo real e projetado)
- 🌾 **Gerenciar atividades agrícolas** (pulverização, adubação, colheita, etc.)
- 📦 **Controlar estoque de insumos** (fertilizantes, defensivos, sementes)
- 🗺️ **Administrar talhões e propriedades** (áreas, culturas, produtividade)
- 🚜 **Registrar máquinas e equipamentos** (horímetro, manutenções)
- ☕ **Acompanhar cotação do café** em tempo real
- 📈 **Analisar custos por safra e por talhão**

---

### ✨ O Que é Novo

**Dezembro 2025**: Três novos módulos com dados 100% mockados (sem integração com BD):

| Módulo | Descrição | Status |
|--------|-----------|--------|
| **Dívidas e Financiamentos** | Gestão de dívidas rurais com suporte a parcelamentos | ✅ Completo |
| **Documentos** | Centralização de CAR, CPF, ITR, contratos com busca avançada | ✅ Completo |
| **Pragas e Doenças** | Registro e acompanhamento de ocorrências com diagnóstico | ✅ Completo |

Todos com **UI responsiva**, **componentes reutilizáveis** e **estado local** para rápida prototipagem.

---

## 🛠 Stack Tecnológica

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **React** | 18.3 | UI Library |
| **TypeScript** | 5.5 | Tipagem estática |
| **Vite** | 5.4 | Build tool e dev server |
| **TailwindCSS** | 3.4 | Estilização utility-first |
| **Supabase** | 2.52 | Backend as a Service (PostgreSQL + Auth + Storage) |
| **date-fns** | 3.6 | Manipulação de datas |
| **lucide-react** | 0.344 | Biblioteca de ícones |
| **recharts** | 3.1 | Gráficos e visualizações |
| **react-datepicker** | 9.0 | Seletor de datas |

---

## 🏗 Arquitetura do Sistema

### Fluxo de Dados Principal

```
┌─────────────────────────────────────────────────────────────────┐
│                         App.tsx                                  │
│  (Roteamento por estado activeTab + Gerenciamento de Auth)      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Layout Components                             │
│  ┌──────────────────┐  ┌──────────────────────────────────────┐ │
│  │   Sidebar.tsx    │  │            Header.tsx                 │ │
│  │  (Navegação)     │  │  (Menu mobile + Logout + UserInfo)   │ │
│  └──────────────────┘  └──────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Domain Panels                                 │
│  FinanceiroPanel │ EstoquePanel │ ManejoAgricolaPanel │ ...     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Services Layer                              │
│  financeService │ estoqueService │ activityService │ ...        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Supabase Client                                │
│  src/lib/supabase.ts (Singleton com RLS / DEV bypass)           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               PostgreSQL (Supabase Cloud)                        │
│  Tabelas: transacoes_financeiras, lancamentos_agricolas, etc.   │
└─────────────────────────────────────────────────────────────────┘
```

### Princípios Arquiteturais

1. **Separação de Responsabilidades**: Componentes apenas renderizam UI; lógica de dados fica nos Services.
2. **Singleton Pattern**: AuthService e cliente Supabase são singletons.
3. **State Management**: useState + useEffect (sem Redux/Context para dados).
4. **RLS (Row Level Security)**: Em produção, o Supabase aplica RLS baseado no JWT do usuário.
5. **DEV Bypass**: Em desenvolvimento, usa `service_role_key` para ignorar RLS.

---

## 📁 Estrutura de Pastas

```
Painel/
├── public/                      # Assets estáticos
│   └── 21.png                   # Logo Solos.ag
├── src/
│   ├── App.tsx                  # Componente raiz + roteamento por estado
│   ├── main.tsx                 # Entry point React
│   ├── index.css                # Estilos globais + Tailwind directives
│   │
│   ├── components/              # Componentes React organizados por domínio
│   │   ├── Layout/              # Sidebar, Header
│   │   ├── Dashboard/           # DashboardOverview, StatsCard, Charts
│   │   ├── Financeiro/          # FinanceiroPanel, AttachmentModal
│   │   ├── Estoque/             # EstoquePanel, controle de insumos
│   │   ├── ManejoAgricola/      # Lançamentos de atividades agrícolas
│   │   ├── MinhaFazenda/        # Gestão de talhões e propriedades
│   │   ├── CustoSafra/          # Análise de custos por safra
│   │   ├── CustoPorTalhao/      # Análise de custos por talhão
│   │   ├── MaquinasEquipamentos/ # Cadastro de máquinas
│   │   ├── Vendas/              # Histórico de vendas
│   │   ├── EstoqueCafe/         # Estoque de café produzido
│   │   ├── AgendaTecnica/       # Agenda de atividades
│   │   ├── PlanejamentoTecnico/ # Planejamento técnico
│   │   ├── SimuladorVenda/      # Simulador de vendas
│   │   ├── SimuladorCredito/    # Simulador de crédito
│   │   ├── Notifications/       # Componentes de notificação
│   │   └── common/              # Componentes reutilizáveis
│   │       ├── DateInput.tsx    # Input de data customizado
│   │       └── SuccessToast.tsx # Toast de sucesso
│   │
│   ├── services/                # Camada de acesso a dados
│   │   ├── authService.ts       # Autenticação (JWT do n8n)
│   │   ├── financeService.ts    # Transações financeiras
│   │   ├── activityService.ts   # Lançamentos agrícolas
│   │   ├── estoqueService.ts    # Gestão de estoque
│   │   ├── talhaoService.ts     # Talhões e propriedades
│   │   ├── userService.ts       # Dados do usuário
│   │   ├── cotacaoService.ts    # Cotação do café
│   │   ├── maquinaService.ts    # Máquinas e equipamentos
│   │   └── ...                  # Outros serviços
│   │
│   └── lib/                     # Utilitários e configurações
│       ├── supabase.ts          # Cliente Supabase + Tipagens
│       ├── dateUtils.ts         # Funções de data (timezone-safe)
│       ├── currencyFormatter.ts # Formatação de moeda (R$)
│       ├── unitConverter.ts     # Conversão de unidades (kg, L, etc.)
│       └── formatUnit.ts        # Formatação de unidades
│
├── docs/                        # Documentação técnica
│   ├── database-schema.md       # Schema do banco de dados
│   └── *.md                     # Outras documentações
│
├── supabase/
│   └── migrations/              # Migrations do banco de dados
│
└── [arquivos de config]         # Configs do projeto
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── tsconfig.json
    └── eslint.config.js
```

---

## 🚀 Instalação e Configuração

### Pré-requisitos

- **Node.js** >= 18.x
- **npm** >= 9.x
- Conta no **Supabase** com projeto configurado

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/Painel.git
cd Painel
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJI...
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...  # Apenas para DEV
```

> ⚠️ **Atenção**: Nunca commite o arquivo `.env` ou exponha a `SERVICE_ROLE_KEY` em produção.

### 4. Execute o projeto

```bash
npm run dev      # Inicia o servidor de desenvolvimento (http://localhost:5173)
```

### Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento com Hot Reload |
| `npm run build` | Build de produção em `/dist` |
| `npm run preview` | Preview do build de produção |
| `npm run lint` | Executa ESLint |

---

## 📦 Módulos do Sistema

### Dashboard (`/src/components/Dashboard/`)

Visão geral consolidada com:
- Cards de indicadores (saldo, receitas, despesas, cotação do café)
- Gráfico de evolução financeira (últimos 6 meses)
- Lista de atividades recentes
- Próximas transações agendadas
- Widget de clima

**Componentes principais:**
- `DashboardOverview.tsx` - Painel principal
- `StatsCard.tsx` - Cards de estatísticas
- `FinancialChart.tsx` - Gráfico de receitas vs despesas
- `ActivityChart.tsx` - Gráfico de atividades
- `TransactionTable.tsx` - Tabela de transações
- `WeatherWidget.tsx` - Informações climáticas

### Financeiro (`/src/components/Financeiro/`)

Gestão completa do fluxo de caixa:
- Filtros por período (7 dias, 30 dias, mês atual, safra, personalizado)
- Separação entre transações realizadas e futuras
- Visualização de anexos (notas fiscais, comprovantes)
- Alocação de custos por talhão

### Dívidas e Financiamentos (`/src/components/DividasFinanciamentos/`) ✨ **Novo**

Gestão de dívidas e financiamentos rurais:
- Cadastro de dívidas (custeio, CPR Física, Barter, etc.)
- Tipos de pagamento: parcela única, parcelado, com produção
- Monitoramento de status (Ativa, Liquidada, Renegociada)
- Configuração de taxa, indexador e data de vencimento
- Anexos de contratos e documentos

**Componentes:**
- `DividasFinanciamentosPanel.tsx` - Painel principal (grid 2 colunas)
- `DividaCard.tsx` - Card com informações resumidas
- `DividaDetailPanel.tsx` - Painel lateral com detalhes completos
- `DividaFormModal.tsx` - Formulário modal para criar/editar dívidas

### Documentos (`/src/components/Documentos/`) ✨ **Novo**

Gestão centralizada de documentação agrícola:
- Suporte para múltiplos tipos: CAR, CPF, CNPJ, ITR, Contrato, Nota Fiscal, Outro
- Upload e visualização de arquivos (PDF, imagens, etc.)
- Filtros por tipo, origem, data de validade
- Busca em tempo real por nome, tipo ou descrição
- Rastreamento de datas de validade com indicador visual
- Responsivo (grid 3 colunas desktop, 1 coluna mobile)

**Componentes:**
- `DocumentosPanel.tsx` - Painel principal com grid responsivo
- `DocumentoCard.tsx` - Card com ícone do tipo, status de validade
- `DocumentoDetailPanel.tsx` - Painel com preview (mockado) e metadata
- `DocumentosSearchBar.tsx` - Barra de busca com filtros avançados

### Pragas e Doenças (`/src/components/PragasDoencas/`) ✨ **Novo**

Monitoramento e controle de pragas e doenças nas culturas:
- Registro de ocorrências (origem WhatsApp ou Painel)
- Captura de foto, sintomas, diagnóstico e ações tomadas
- Fases da lavoura: Vegetativo, Floração, Granação, Pré-colheita, Colheita, Pós-colheita
- Severidade: Baixa, Média, Alta
- Status de acompanhamento: Nova, Em acompanhamento, Resolvida
- Registro de produtos aplicados e recomendações
- Histórico de clima recente e dados diagnósticos

**Componentes:**
- `PragasDoencasPanel.tsx` - Painel principal (grid 2 colunas)
- `OcorrenciaCard.tsx` - Card com foto, tipo, fase, severidade
- `OcorrenciaDetailPanel.tsx` - Painel lateral com 5 seções (Básicas, Observações, Diagnóstico, Tratamento, Anexos)
- `OcorrenciaFormModal.tsx` - Formulário com 17 campos, suporte a array dinâmico de produtos
- `mockOcorrencias.ts` - 5 ocorrências mockadas para demonstração

### Estoque (`/src/components/Estoque/`)

Controle de insumos agrícolas:
- Cadastro de produtos (fertilizantes, defensivos, sementes)
- Movimentações (entradas, saídas, aplicações)
- Controle de lotes e validade
- Conversão automática de unidades (kg, L, ton, etc.)

### Manejo Agrícola (`/src/components/ManejoAgricola/`)

Registro de atividades no campo:
- Lançamentos com múltiplos talhões, responsáveis, produtos e máquinas
- Anexos de fotos/documentos
- Histórico completo de operações

### Minha Fazenda (`/src/components/MinhaFazenda/`)

Gestão de propriedades e talhões:
- Cadastro de talhões com área, cultura, variedade
- Produtividade por talhão (sacas/ha)
- Vínculo usuário-propriedade

---

## 🔧 Serviços (Services)

Todos os serviços seguem o padrão de **classe com métodos estáticos**:

### AuthService (`authService.ts`)

```typescript
// Singleton para gerenciamento de autenticação
const authService = AuthService.getInstance();
await authService.init();  // Inicializa sessão
authService.getCurrentUser();  // Retorna { user_id, nome }
await authService.logout();
```

**Características:**
- Decodifica JWT customizado do n8n
- Armazena token em `localStorage` como `ze_safra_token`
- Bypass automático em desenvolvimento

### FinanceService (`financeService.ts`)

```typescript
// Buscar resumo financeiro do mês atual
const resumo = await FinanceService.getResumoFinanceiro(userId);

// Buscar transações com filtros
const { transacoesRealizadas, transacoesFuturas, periodBalance } = 
  await FinanceService.getTransacoesComSaldo(userId, 'mes-atual');

// Filtros disponíveis: 'ultimos-7-dias' | 'ultimos-30-dias' | 'mes-atual' | 
//                      'safra-atual' | 'proximos-7-dias' | 'proximos-30-dias' | 
//                      'personalizado' | 'todos'
```

### ActivityService (`activityService.ts`)

```typescript
// Listar lançamentos agrícolas
const lancamentos = await ActivityService.getLancamentos(userId, 50);

// Criar novo lançamento com relacionamentos
await ActivityService.createLancamento(
  { nome_atividade: 'Pulverização', data_atividade: '2025-12-14', user_id },
  { 
    talhoes: [{ talhao_id: 'uuid' }],
    produtos: [{ nome_produto: 'Fungicida', quantidade_val: 5 }],
    maquinas: [{ nome_maquina: 'Pulverizador', horas_maquina: 3 }]
  }
);
```

### EstoqueService (`estoqueService.ts`)

```typescript
// Listar produtos do estoque
const produtos = await EstoqueService.getProdutos();

// Registrar movimentação
await EstoqueService.registrarMovimentacao({
  produto_id: 123,
  tipo: 'saida',
  quantidade: 10,
  observacao: 'Aplicação no talhão X'
});
```

### TalhaoService (`talhaoService.ts`)

```typescript
// Área total cultivada com café
const area = await TalhaoService.getAreaCultivadaCafe(userId);

// Produção total da fazenda
const sacas = await TalhaoService.getTotalProducaoFazenda(userId);

// Listar talhões
const talhoes = await TalhaoService.getTalhoes(userId);
```

---

## 🔨 Utilitários (Lib)

### dateUtils.ts

```typescript
import { formatDateBR, parseDateFromDB } from './lib/dateUtils';

// Formata data do banco para exibição brasileira
formatDateBR('2025-12-14');  // "14/12/2025"

// Parse seguro de datas (evita problemas de timezone)
const date = parseDateFromDB('2025-12-14');
```

> ⚠️ **Importante**: Use sempre `parseDateFromDB` ao invés de `new Date()` para evitar problemas de timezone (datas exibidas um dia antes).

### currencyFormatter.ts

```typescript
import { formatCurrency, formatSmartCurrency } from './lib/currencyFormatter';

formatCurrency(1234.56);       // "R$ 1.234,56"
formatSmartCurrency(0.0003);   // "R$ 0,0003" (expande decimais automaticamente)
```

### unitConverter.ts

```typescript
import { convertToStandardUnit, getBestDisplayUnit } from './lib/unitConverter';

// Converte para unidade padrão (mg ou mL)
convertToStandardUnit(5, 'kg');  // { quantidade: 5000000, unidade: 'mg' }

// Escolhe melhor unidade para exibição
getBestDisplayUnit(5000000, 'mg');  // { quantidade: 5, unidade: 'kg' }
```

---

## 🗄 Banco de Dados

### Principais Tabelas

| Tabela | Descrição |
|--------|-----------|
| `usuarios` | Dados cadastrais dos usuários |
| `propriedades` | Fazendas/propriedades rurais |
| `talhoes` | Subdivisões das propriedades |
| `vinculo_usuario_propriedade` | Relação N:N entre usuários e propriedades |
| `transacoes_financeiras` | Fluxo de caixa (entradas e saídas) |
| `alocacao_talhao` | Rateio de custos por talhão |
| `lancamentos_agricolas` | Atividades no campo (header) |
| `lancamento_talhoes` | Talhões vinculados à atividade |
| `lancamento_produtos` | Produtos usados na atividade |
| `lancamento_responsaveis` | Responsáveis pela atividade |
| `lancamento_maquinas` | Máquinas usadas na atividade |
| `estoque_de_produtos` | Inventário de insumos |
| `maquinas_equipamentos` | Cadastro de máquinas |
| `cotacao_diaria_cafe` | Cotações do café |

### Schema Detalhado

Consulte [docs/database-schema.md](docs/database-schema.md) para o schema completo.

### Migrations

As migrations ficam em `supabase/migrations/` e são versionadas por timestamp.

---

## 🔐 Autenticação

### Fluxo de Autenticação

1. **Usuário acessa link com token**: `https://painel.solos.ag/?token=eyJ...`
2. **App captura o token** da URL e salva em `localStorage`
3. **AuthService.init()** decodifica o JWT e extrai `user_id` e `nome`
4. **Em produção**: Token é injetado no cliente Supabase para aplicar RLS
5. **Em desenvolvimento**: Bypass automático com usuário de teste

### Estrutura do JWT (n8n)

```json
{
  "sub": "uuid-do-usuario",
  "nome": "Nome do Produtor",
  "email": "email@example.com",
  "role": "authenticated",
  "aud": "authenticated",
  "exp": 1734567890,
  "iat": 1734481490
}
```

### Logout

```typescript
await authService.logout();
// Remove token do localStorage
// Redireciona para tela de login
```

---

## 👨‍💻 Guia de Desenvolvimento

### Criando um Novo Módulo

1. **Crie a pasta do componente:**
   ```
   src/components/NovoModulo/
   └── NovoModuloPanel.tsx
   ```

2. **Crie o serviço de dados:**
   ```typescript
   // src/services/novoModuloService.ts
   import { supabase } from '../lib/supabase';

   export class NovoModuloService {
     static async getItems(userId: string) {
       const { data, error } = await supabase
         .from('tabela')
         .select('*')
         .eq('user_id', userId);
       
       if (error) {
         console.error('Erro:', error);
         return [];
       }
       return data || [];
     }
   }
   ```

3. **Adicione ao menu (Sidebar.tsx):**
   ```typescript
   const menuItems = [
     // ... outros itens
     { id: 'novo-modulo', icon: Package, label: 'Novo Módulo', description: 'Descrição' },
   ];
   ```

4. **Adicione ao roteamento (App.tsx):**
   ```typescript
   const renderContent = () => {
     switch (activeTab) {
       // ... outros cases
       case 'novo-modulo':
         return <NovoModuloPanel />;
     }
   };
   ```

### Estrutura de um Panel

```tsx
// src/components/NovoModulo/NovoModuloPanel.tsx
import { useState, useEffect } from 'react';
import { AuthService } from '../../services/authService';
import { NovoModuloService } from '../../services/novoModuloService';
import LoadingSpinner from '../Dashboard/LoadingSpinner';

export default function NovoModuloPanel() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const user = AuthService.getInstance().getCurrentUser();
      if (!user) return;
      
      const items = await NovoModuloService.getItems(user.user_id);
      setData(items);
      setLoading(false);
    };
    
    loadData();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-[#092f20] mb-4">Novo Módulo</h2>
      {/* Conteúdo */}
    </div>
  );
}
```

---

---

## 💾 Dados Mockados (Frontend-only) ✨ **Novo**

Os três módulos mais recentes utilizam dados **100% mockados** sem integração com banco de dados. Ideais para demonstração, prototipagem e UI/UX testing.

### Módulo: Dívidas e Financiamentos

**Arquivo:** `src/components/DividasFinanciamentos/mockDividas.ts`

**Estrutura:**
```typescript
interface Divida {
  id: number;
  nome: string;
  credor: string;
  tipo: 'Custeio' | 'CPR Física' | 'Financiamento' | 'Barter';
  dataContratacao: string;  // ISO format
  valorContratado: number;
  taxa: string;  // ex: "8.5% ao mês"
  indexador?: 'TJLP' | 'TR' | 'Outro';
  dataVencimento?: string;
  pagamento: 'parcela única' | 'parcelado' | 'com produção';
  pagamentoParcelado?: {
    numParcelas: number;
    valorParcela: number;
    primeiradata: string;
  };
  pagamentoComProducao?: {
    sacasComprometidas: number;
    precoReference: number;
  };
  status: 'Ativa' | 'Liquidada' | 'Renegociada';
  observacoes?: string;
  anexos?: string[];
}
```

**Dados de exemplo:** 7 dívidas (Custeio 2025, CPR Física, Barter, etc.)

### Módulo: Documentos

**Arquivo:** `src/components/Documentos/mockDocumentos.ts`

**Estrutura:**
```typescript
interface Documento {
  id: number;
  nomeArquivo: string;
  dataRecebimento: string;  // ISO format
  origem: 'Email' | 'WhatsApp' | 'Presencial' | 'Sistema';
  tipo: 'CAR' | 'CPF' | 'CNPJ' | 'ITR' | 'Contrato' | 'Nota Fiscal' | 'Outro';
  tamanho: string;  // ex: "2.5 MB"
  formato: string;  // ex: "PDF"
  validade?: string;  // ISO format (data de expiração)
  descricao?: string;
}
```

**Dados de exemplo:** 10 documentos (CAR, CPF, ITR, contratos, notas fiscais)

**Características especiais:**
- Cálculo automático de dias até vencimento
- Ícone do tipo de arquivo baseado em formato
- Filtros em tempo real: por tipo (7 categorias), origem (2 opções), validade (Todos/Válidos/Vencidos)
- Status visual de validade: Verde (válido), Amarelo (próximo ao vencimento), Vermelho (vencido)

### Módulo: Pragas e Doenças

**Arquivo:** `src/components/PragasDoencas/mockOcorrencias.ts`

**Estrutura:**
```typescript
interface Ocorrencia {
  id: number;
  origem: 'WhatsApp' | 'Painel';
  talhao: string;
  dataOcorrencia: string;  // ISO format
  faseLavoura: 'Vegetativo' | 'Floração' | 'Granação' | 'Pré-colheita' | 'Colheita' | 'Pós-colheita';
  tipoOcorrencia: 'Praga' | 'Doença' | 'Deficiência' | 'Planta daninha' | 'Não sei / Outra';
  severidade: 'Baixa' | 'Média' | 'Alta';
  areaAfetada: string;  // ex: "~10% do talhão"
  sintomas: string;
  acaoTomada: string;
  nomePraga?: string;
  diagnostico: 'Sugerido pela IA (não confirmado)' | 'Confirmado pelo agrônomo' | 'Ainda em dúvida';
  descricaoDetalhada?: string;
  climaRecente?: string;
  produtosAplicados: string[];  // ex: ["Fungicida X - 0,5 L/ha", "Inseticida Y - 1 L/ha"]
  dataAplicacao?: string;  // ISO format
  recomendacoes?: string;
  status: 'Nova' | 'Em acompanhamento' | 'Resolvida';
  anexos: string[];
  fotoPrincipal: string;  // emoji representation
}
```

**Dados de exemplo:** 5 ocorrências com diferentes tipos (Ferrugem, Cigarrinha, Déficit hídrico, etc.)

**Características especiais:**
- Suporte a origem dupla: WhatsApp (pré-preenchida) vs Painel (formulário completo)
- Array dinâmico de produtos aplicados
- Organização em 5 seções: Básicas, Observações, Diagnóstico, Tratamento, Anexos
- Status com cores: Vermelho (Nova), Amarelo (Em acompanhamento), Verde (Resolvida)
- Possibilidade de marcar como "Resolvida" diretamente do card

---

## 📏 Padrões e Convenções


### Nomenclatura

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Componentes | PascalCase | `FinanceiroPanel.tsx` |
| Serviços | camelCase + Service | `financeService.ts` |
| Utilitários | camelCase | `dateUtils.ts` |
| Pastas de domínio | PascalCase | `Financeiro/` |
| Variáveis/funções | camelCase | `loadFinancialData` |
| Constantes | UPPER_SNAKE | `CACHE_TTL` |
| Interfaces | PascalCase + prefixo I (opcional) | `TransacaoFinanceira` |

### Componentes

- **Funcionais** com hooks (não usar classes)
- **Props tipadas** com interface
- **Estado local** com `useState`
- **Efeitos colaterais** em `useEffect`
- **Não acessar Supabase diretamente** — usar Services

### Serviços

- **Classes com métodos estáticos** ou funções exportadas
- **Tratamento de erro** com try/catch e console.error
- **Retornar arrays vazios** em caso de erro (não lançar exceção)
- **Tipagem completa** de parâmetros e retornos

### Estilização

- **Tailwind CSS** para todos os estilos
- **Não usar CSS modules** ou styled-components
- **Classes utilitárias** diretamente no JSX
- **Responsividade** com prefixos `md:`, `lg:`

---

## 🎨 Identidade Visual

### Cores Oficiais

| Nome | HEX | Uso |
|------|-----|-----|
| Verde Escuro | `#004417` | Background sidebar, títulos |
| Verde Accent | `#00A651` | Botões, ícones ativos, links |
| Verde Lima | `#CADB2A` | Destaques, badges |
| Laranja | `#F7941F` | Alertas, ações importantes |
| Branco | `#FFFFFF` | Background cards, texto |

### Estilos Padrão

```tsx
// Card padrão
<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">

// Título principal
<h2 className="text-xl font-bold text-[#092f20]">

// Botão primário
<button className="bg-[#00A651] text-white px-4 py-2 rounded-lg hover:bg-[#008c44]">

// Sidebar item ativo
<button className="bg-[#003015] text-white rounded-lg">
```

### Componentes de UI

- **Ícones**: lucide-react (`<Home />`, `<DollarSign />`, etc.)
- **Gráficos**: recharts (`<LineChart />`, `<BarChart />`)
- **Data Picker**: react-datepicker
- **Fonte**: Nunito (via Tailwind config)

---

## � Guia Rápido: Novos Módulos com Dados Mockados

### Para Desenvolvedores

Se você quer **adicionar funcionalidade aos 3 novos módulos** (Dívidas, Documentos, Pragas), o padrão é:

#### 1. Encontrar os dados mockados
```bash
src/components/DividasFinanciamentos/mockDividas.ts
src/components/Documentos/mockDocumentos.ts
src/components/PragasDoencas/mockOcorrencias.ts
```

#### 2. Adicionar/Remover dados
Edite o array correspondente com seus objetos tipados:
```typescript
const mockDatas = [
  { id: 1, nome: "...", ... },
  { id: 2, nome: "...", ... }
];
```

#### 3. Implementar novos handlers
Atualize o painel principal (ex: `DividasFinanciamentosPanel.tsx`):
```typescript
const handleSomeAction = (item: Divida) => {
  console.log('Ação:', item);
  // Adicione sua lógica aqui
};
```

#### 4. Testar responsividade
- Desktop: Grid com 2 colunas
- Mobile: Grid com 1 coluna + detail panel em fullscreen

### Estrutura Padrão de um Módulo Mockado

```
/src/components/MeuModulo/
├── mockData.ts              # Dados mockados com interface TypeScript
├── MeuModuloPanel.tsx       # Componente principal (grid + estado)
├── MeuCard.tsx              # Card individual (lista)
├── MeuDetailPanel.tsx       # Painel lateral (detalhes)
└── MeuFormModal.tsx         # Modal para criar/editar
```

---

## 📚 Recursos Adicionais

- [Documentação do Supabase](https://supabase.com/docs)

- [Documentação do React](https://react.dev)
- [Documentação do TailwindCSS](https://tailwindcss.com/docs)
- [Documentação do date-fns](https://date-fns.org/docs)
- [Ícones Lucide](https://lucide.dev/icons)

---

## 📝 Licença

Este projeto é propriedade da **Solos.ag**. Todos os direitos reservados.

---

<p align="center">
  Desenvolvido com ☕ por <strong>Solos.ag</strong>
</p>
