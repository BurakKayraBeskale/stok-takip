require('dotenv/config');
const express = require('express');
const cors = require('cors');

const authRoutes      = require('./routes/auth');
const warehouseRoutes = require('./routes/warehouses');
const categoryRoutes  = require('./routes/categories');
const supplierRoutes  = require('./routes/suppliers');
const productRoutes   = require('./routes/products');
const inventoryRoutes       = require('./routes/inventory');
const stockMovementRoutes   = require('./routes/stockMovements');
const purchaseOrderRoutes   = require('./routes/purchaseOrders');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth',       authRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/suppliers',  supplierRoutes);
app.use('/api/products',   productRoutes);
app.use('/api/inventory',        inventoryRoutes);
app.use('/api/stock-movements',  stockMovementRoutes);
app.use('/api/purchase-orders',  purchaseOrderRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Merkezi hata yakalayıcı
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Sunucu hatası' });
});

module.exports = app;
