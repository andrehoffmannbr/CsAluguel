# CS Aluguel - Sistema de Gestão de Equipamentos de Festas

Sistema completo para gerenciamento de aluguel de equipamentos para festas e eventos.

## 🚀 Funcionalidades

- **Sistema de Login** com autenticação
- **Gestão de Clientes** com cadastro completo
- **Controle de Estoque** de equipamentos
- **Sistema de Agendamento** com calendário visual
- **Gestão Financeira** com relatórios

## 📋 Pré-requisitos

1. Conta no [Supabase](https://supabase.com)
2. Conta na [Vercel](https://vercel.com)

## ⚙️ Configuração

### 1. Configurar Banco de Dados (Supabase)

1. Acesse seu painel do Supabase
2. Vá em **SQL Editor**
3. Execute o arquivo `schema.sql` que está na raiz do projeto
4. Isso criará as tabelas: `clients`, `inventory` e `bookings`

### 2. Deploy na Vercel

1. Conecte este repositório à Vercel
2. Configure as variáveis de ambiente:

```env
SUPABASE_URL=https://todwaiccuifkhhzzydmk.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvZHdhaWNjdWlka2hoenp5ZG1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NzA4MTAsImV4cCI6MjA2ODM0NjgxMH0.7cLD7-9FIP7KkIdIKMGmP-5OBzW00-3CZP4JOXX7UiU
```

### 3. Login do Sistema

**Usuário:** `pedropsf2011@gmail.com`  
**Senha:** `123456789`

## 🏗️ Estrutura do Banco

### Tabelas Principais:

- **clients** - Dados dos clientes
- **inventory** - Controle de estoque
- **bookings** - Reservas e agendamentos

## 📱 Uso

1. Faça login com as credenciais acima
2. Gerencie clientes na aba "Clientes"
3. Controle estoque na aba "Estoque"
4. Faça agendamentos na aba "Agendamento"
5. Acompanhe financeiro na aba "Financeiro"

## 🔧 Tecnologias

- HTML5, CSS3, JavaScript ES6+
- Supabase (PostgreSQL)
- Font Awesome
- Design Responsivo

---

**Desenvolvido para CS Aluguel de Mesa e Pula Pula** 