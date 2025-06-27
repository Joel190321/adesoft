-- =====================================================
-- SCRIPT DE INICIALIZACIÓN PARA PEDIDOS ADASOFT
-- =====================================================
-- Ejecutar después de crear la base de datos:
-- mysql -u root -p pedidos_adasoft < server/init-database.sql

-- Usar la base de datos
USE pedidos_adasoft;

-- Tabla de configuración global
CREATE TABLE IF NOT EXISTS settings (
  id VARCHAR(50) PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL DEFAULT '',
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 18.00,
  default_credit DECIMAL(10,2) NOT NULL DEFAULT 1000.00,
  order_prefix VARCHAR(10) NOT NULL DEFAULT 'ORD',
  address TEXT,
  phone VARCHAR(50),
  rnc VARCHAR(50),
  email VARCHAR(255),
  logo TEXT,
  tax_included BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de vendedores
CREATE TABLE IF NOT EXISTS vendors (
  id VARCHAR(50) PRIMARY KEY,
  sequential_id INT AUTO_INCREMENT UNIQUE,
  cedula VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  lastname VARCHAR(255),
  phone VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clients (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  rnc VARCHAR(50),
  phone VARCHAR(50),
  address1 TEXT,
  address2 TEXT,
  is_exempt BOOLEAN DEFAULT FALSE,
  debit DECIMAL(10,2) DEFAULT 0.00,
  credit DECIMAL(10,2) DEFAULT 0.00,
  vendor_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_vendor_id (vendor_id)
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(50) PRIMARY KEY,
  sequential_id INT AUTO_INCREMENT UNIQUE,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  tax DECIMAL(5,2) NOT NULL DEFAULT 18.00,
  stock INT NOT NULL DEFAULT 0,
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de transacciones (facturas y recibos)
CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR(50) PRIMARY KEY,
  control VARCHAR(50) UNIQUE NOT NULL,
  document VARCHAR(50),
  type ENUM('FA', 'RC') NOT NULL,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  client_id VARCHAR(50) NOT NULL,
  client_data JSON,
  vendor_id VARCHAR(50) NOT NULL,
  vendor_data JSON,
  value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  pending_value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  items JSON,
  subtotal DECIMAL(10,2),
  tax DECIMAL(10,2),
  reference_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_client_id (client_id),
  INDEX idx_vendor_id (vendor_id),
  INDEX idx_type (type),
  INDEX idx_reference_id (reference_id)
);

-- Tabla de referencias de pago
CREATE TABLE IF NOT EXISTS payment_references (
  id VARCHAR(50) PRIMARY KEY,
  control_rc VARCHAR(50) NOT NULL,
  type_rc VARCHAR(10) NOT NULL,
  control_fa VARCHAR(50) NOT NULL,
  type_fa VARCHAR(10) NOT NULL,
  client_id VARCHAR(50) NOT NULL,
  vendor_id VARCHAR(50) NOT NULL,
  payment_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_control_rc (control_rc),
  INDEX idx_control_fa (control_fa),
  INDEX idx_client_id (client_id)
);

-- Tabla de administradores
CREATE TABLE IF NOT EXISTS admins (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- INSERTAR DATOS INICIALES

-- Configuración inicial
INSERT IGNORE INTO settings (id, company_name, tax_rate, default_credit, order_prefix, address, phone, rnc, email)
VALUES ('global', 'AdaSoft Distribuidora', 18.00, 1000.00, 'FA', 'Av. Principal #123, Santo Domingo', '809-555-0123', '131234567', 'info@adasoft.com');

-- Administrador inicial
INSERT IGNORE INTO admins (id, name)
VALUES ('ADMIN', 'Administrador');

-- Vendedores de ejemplo
INSERT IGNORE INTO vendors (id, name, lastname, cedula, phone) VALUES
('V001', 'Juan', 'Perez', '00112233445', '809-555-1111'),
('V002', 'Maria', 'Rodriguez', '00112233446', '809-555-2222'),
('V003', 'Carlos', 'Martinez', '00112233447', '809-555-3333');

-- Clientes de ejemplo
INSERT IGNORE INTO clients (id, name, rnc, phone, address1, vendor_id, credit) VALUES
('C001', 'Supermercado ABC', '123456789', '809-555-1234', 'Calle Principal #42, Santiago', 'V001', 5000.00),
('C002', 'Tienda XYZ', '987654321', '809-555-5678', 'Av. Central #156, Santo Domingo', 'V001', 3000.00),
('C003', 'Farmacia Salud', '456789123', '809-555-9101', 'Calle Secundaria #78, La Vega', 'V002', 2500.00),
('C004', 'Restaurante El Buen Sabor', '789123456', '809-555-4567', 'Plaza Comercial Local 5, San Pedro', 'V002', 4000.00),
('C005', 'Ferretería Los Hermanos', '321654987', '809-555-7890', 'Av. Industrial #234, Moca', 'V003', 6000.00);

-- Productos de ejemplo
INSERT IGNORE INTO products (id, code, name, description, price, tax, stock, category) VALUES
('P001', 'P0001', 'Agua Mineral Crystal', 'Botella de agua mineral 500ml', 25.00, 18.00, 100, 'Bebidas'),
('P002', 'P0002', 'Coca Cola', 'Lata de Coca Cola 355ml', 35.00, 18.00, 80, 'Bebidas'),
('P003', 'P0003', 'Galletas Oreo', 'Paquete de galletas Oreo 200g', 45.00, 18.00, 50, 'Snacks'),
('P004', 'P0004', 'Papel Higiénico Charmin', 'Paquete de 4 rollos papel higiénico', 120.00, 18.00, 40, 'Hogar'),
('P005', 'P0005', 'Detergente Tide', 'Detergente en polvo 500g', 85.00, 18.00, 30, 'Limpieza'),
('P006', 'P0006', 'Arroz Grano de Oro', 'Saco de arroz 5 libras', 150.00, 18.00, 25, 'Alimentos'),
('P007', 'P0007', 'Aceite Mazola', 'Botella de aceite vegetal 1L', 95.00, 18.00, 35, 'Alimentos'),
('P008', 'P0008', 'Jabón Dove', 'Jabón antibacterial 100g', 40.00, 18.00, 60, 'Higiene'),
('P009', 'P0009', 'Colgate Total', 'Pasta dental familiar 150ml', 75.00, 18.00, 45, 'Higiene'),
('P010', 'P0010', 'Shampoo Pantene', 'Shampoo para todo tipo de cabello 400ml', 180.00, 18.00, 20, 'Higiene');

-- VERIFICACIÓN
SELECT '✅ Base de datos configurada exitosamente' as status;
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'pedidos_adasoft';

-- Mostrar resumen de datos insertados
SELECT 'Settings' as tabla, COUNT(*) as registros FROM settings
UNION ALL
SELECT 'Admins' as tabla, COUNT(*) as registros FROM admins
UNION ALL
SELECT 'Vendors' as tabla, COUNT(*) as registros FROM vendors
UNION ALL
SELECT 'Clients' as tabla, COUNT(*) as registros FROM clients
UNION ALL
SELECT 'Products' as tabla, COUNT(*) as registros FROM products;

-- Mostrar datos de ejemplo para verificar
SELECT '📊 VENDEDORES CREADOS:' as info;
SELECT id, name, lastname, phone FROM vendors;

SELECT '🏢 CLIENTES CREADOS:' as info;
SELECT id, name, phone, credit FROM clients LIMIT 3;

SELECT '📦 PRODUCTOS POR CATEGORÍA:' as info;
SELECT category, COUNT(*) as cantidad FROM products GROUP BY category;