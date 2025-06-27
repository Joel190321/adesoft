const express = require('express');
const cors = require('cors');
const db = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Products API
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM products ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { id, name, description, price, tax, stock, category } = req.body;
    
    // Get next sequential ID
    const [maxResult] = await db.execute('SELECT MAX(sequential_id) as max_id FROM products');
    const nextSequentialId = (maxResult[0]?.max_id || 0) + 1;
    const code = `P${String(nextSequentialId).padStart(4, '0')}`;
    
    await db.execute(
      'INSERT INTO products (id, code, name, description, price, tax, stock, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, code, name, description, price, tax, stock, category]
    );
    
    const [newProduct] = await db.execute('SELECT * FROM products WHERE id = ?', [id]);
    res.status(201).json(newProduct[0]);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Clients API
app.get('/api/clients', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM clients ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/clients', async (req, res) => {
  try {
    const { id, name, rnc, phone, address1, address2, isExempt, debit, credit, vendorId } = req.body;
    
    await db.execute(
      'INSERT INTO clients (id, name, rnc, phone, address1, address2, is_exempt, debit, credit, vendor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, rnc, phone, address1, address2, isExempt, debit, credit, vendorId]
    );
    
    const [newClient] = await db.execute('SELECT * FROM clients WHERE id = ?', [id]);
    res.status(201).json(newClient[0]);
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Vendors API
app.get('/api/vendors', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM vendors ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/vendors/auth', async (req, res) => {
  try {
    const { id, name } = req.query;
    const [rows] = await db.execute('SELECT * FROM vendors WHERE id = ? AND name = ?', [id, name]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error authenticating vendor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Transactions API
app.get('/api/transactions', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM transactions ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const { id, control, document, type, date, clientId, client, vendorId, vendor, value, pendingValue, items, subtotal, tax } = req.body;
    
    await db.execute(
      'INSERT INTO transactions (id, control, document, type, date, client_id, client_data, vendor_id, vendor_data, value, pending_value, items, subtotal, tax) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, control, document, type, date, clientId, JSON.stringify(client), vendorId, JSON.stringify(vendor), value, pendingValue, JSON.stringify(items), subtotal, tax]
    );
    
    const [newTransaction] = await db.execute('SELECT * FROM transactions WHERE id = ?', [id]);
    res.status(201).json(newTransaction[0]);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Settings API
app.get('/api/settings', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM settings WHERE id = ?', ['global']);
    res.json(rows[0] || null);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const { companyName, taxRate, defaultCredit, orderPrefix, address, phone, rnc, email, logo, taxIncluded } = req.body;
    
    await db.execute(
      'UPDATE settings SET company_name = ?, tax_rate = ?, default_credit = ?, order_prefix = ?, address = ?, phone = ?, rnc = ?, email = ?, logo = ?, tax_included = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [companyName, taxRate, defaultCredit, orderPrefix, address, phone, rnc, email, logo, taxIncluded, 'global']
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});