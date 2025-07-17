-- Schema para CS Aluguel - Sistema de Gestão de Equipamentos de Festas
-- Execute este arquivo no SQL Editor do Supabase

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    cpf TEXT,
    address JSONB,
    party_address JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Inventário/Estoque
CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    cost DECIMAL(10,2) DEFAULT 0,
    rental_price DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Reservas/Agendamentos
CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    event_name TEXT NOT NULL,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    items JSONB NOT NULL DEFAULT '{}',
    price DECIMAL(10,2) DEFAULT 0,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'Pendente',
    contract_data_url TEXT,
    event_address JSONB,
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_inventory_name ON inventory(name);

-- Funções para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários nas tabelas para documentação
COMMENT ON TABLE clients IS 'Tabela de clientes do sistema CS Aluguel';
COMMENT ON TABLE inventory IS 'Tabela de controle de estoque de equipamentos';
COMMENT ON TABLE bookings IS 'Tabela de reservas e agendamentos';

-- Inserir alguns dados de exemplo para o inventário (opcional)
INSERT INTO inventory (id, name, quantity, cost, rental_price) VALUES
('mesa-redonda', 'Mesa Redonda', 10, 50.00, 100.00),
('mesa-retangular', 'Mesa Retangular', 15, 60.00, 120.00),
('cadeira-plastica', 'Cadeira Plástica', 100, 15.00, 30.00),
('toalha-de-mesa', 'Toalha de Mesa', 25, 10.00, 20.00),
('tenda-3x3', 'Tenda 3x3', 5, 300.00, 600.00),
('pula-pula', 'Pula Pula', 2, 1500.00, 200.00),
('jogo-de-mesa', 'Jogo de Mesa', 20, 80.00, 150.00),
('aparelho-de-som', 'Aparelho de Som', 3, 500.00, 1000.00)
ON CONFLICT (id) DO NOTHING; 