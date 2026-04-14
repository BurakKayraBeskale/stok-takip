const prisma = require('../lib/prisma');

const VALID_STATUSES = ['pending', 'approved', 'delivered', 'cancelled'];

const STATUS_TRANSITIONS = {
  pending:   ['approved', 'cancelled'],
  approved:  ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

function generateOrderNo() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `PO-${date}-${rand}`;
}

async function list(req, res) {
  const { supplierId, status, dateFrom, dateTo } = req.query;

  const where = {};
  if (supplierId) where.supplierId = Number(supplierId);
  if (status) where.status = status;
  if (dateFrom || dateTo) {
    where.orderDate = {};
    if (dateFrom) where.orderDate.gte = new Date(dateFrom);
    if (dateTo) where.orderDate.lte = new Date(dateTo);
  }

  const orders = await prisma.purchaseOrder.findMany({
    where,
    include: {
      supplier:   { select: { id: true, name: true } },
      user:       { select: { id: true, name: true } },
      _count:     { select: { orderItems: true } },
    },
    orderBy: { orderDate: 'desc' },
  });
  res.json(orders);
}

async function get(req, res) {
  const order = await prisma.purchaseOrder.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      supplier:   { select: { id: true, name: true, contact: true, phone: true, email: true } },
      user:       { select: { id: true, name: true } },
      orderItems: {
        include: { product: { select: { id: true, sku: true, name: true, unit: true } } },
      },
    },
  });
  if (!order) return res.status(404).json({ error: 'Sipariş bulunamadı' });
  res.json(order);
}

async function create(req, res) {
  const { supplierId, items, deliveryDate } = req.body;
  const userId = req.user.id;

  if (!supplierId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'supplierId ve en az bir kalem (items) zorunlu' });
  }

  for (const item of items) {
    if (!item.productId || !item.quantity || !item.unitPrice) {
      return res.status(400).json({ error: 'Her kalemde productId, quantity ve unitPrice zorunlu' });
    }
    if (Number(item.quantity) <= 0) {
      return res.status(400).json({ error: 'Kalem miktarı sıfırdan büyük olmalı' });
    }
  }

  const supplier = await prisma.supplier.findUnique({ where: { id: Number(supplierId) } });
  if (!supplier) return res.status(400).json({ error: 'Tedarikçi bulunamadı' });

  const productIds = items.map(i => Number(i.productId));
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  if (products.length !== productIds.length) {
    return res.status(400).json({ error: 'Bir veya daha fazla ürün bulunamadı' });
  }

  const orderItems = items.map(item => {
    const qty       = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);
    return {
      productId:  Number(item.productId),
      quantity:   qty,
      unitPrice,
      totalPrice: qty * unitPrice,
    };
  });

  const totalAmount = orderItems.reduce((sum, i) => sum + i.totalPrice, 0);

  let orderNo;
  let attempts = 0;
  while (attempts < 5) {
    orderNo = generateOrderNo();
    const exists = await prisma.purchaseOrder.findUnique({ where: { orderNo } });
    if (!exists) break;
    attempts++;
  }

  const order = await prisma.purchaseOrder.create({
    data: {
      orderNo,
      supplierId: Number(supplierId),
      userId,
      totalAmount,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      orderItems: { create: orderItems },
    },
    include: {
      supplier:   { select: { id: true, name: true } },
      user:       { select: { id: true, name: true } },
      orderItems: {
        include: { product: { select: { id: true, sku: true, name: true, unit: true } } },
      },
    },
  });

  res.status(201).json(order);
}

async function updateStatus(req, res) {
  const id     = Number(req.params.id);
  const { status } = req.body;
  const userId = req.user.id;

  if (!status) return res.status(400).json({ error: 'status zorunlu' });
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Geçerli durumlar: ${VALID_STATUSES.join(', ')}` });
  }

  const order = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      orderItems: {
        include: { product: { select: { id: true, sku: true, name: true, unit: true } } },
      },
    },
  });
  if (!order) return res.status(404).json({ error: 'Sipariş bulunamadı' });

  const allowed = STATUS_TRANSITIONS[order.status];
  if (!allowed.includes(status)) {
    return res.status(409).json({
      error: `'${order.status}' durumundan '${status}' durumuna geçiş yapılamaz`,
    });
  }

  // Teslim alındığında stok güncelle ve hareket kaydı oluştur
  if (status === 'delivered') {
    const warehouseId = req.body.warehouseId ? Number(req.body.warehouseId) : null;
    if (!warehouseId) {
      return res.status(400).json({ error: 'Teslim alma için warehouseId zorunlu' });
    }
    const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
    if (!warehouse) return res.status(400).json({ error: 'Depo bulunamadı' });

    const inventoryUpserts = order.orderItems.map(item =>
      prisma.inventory.upsert({
        where: { productId_warehouseId: { productId: item.productId, warehouseId } },
        create: { productId: item.productId, warehouseId, quantity: item.quantity },
        update: { quantity: { increment: item.quantity } },
      })
    );

    const movementCreates = order.orderItems.map(item =>
      prisma.stockMovement.create({
        data: {
          productId:   item.productId,
          warehouseId,
          userId,
          type:        'in',
          quantity:    item.quantity,
          reference:   order.orderNo,
          note:        `Satın alma siparişi teslim alındı: ${order.orderNo}`,
        },
      })
    );

    await prisma.$transaction([
      prisma.purchaseOrder.update({ where: { id }, data: { status } }),
      ...inventoryUpserts,
      ...movementCreates,
    ]);
  } else {
    await prisma.purchaseOrder.update({ where: { id }, data: { status } });
  }

  const updated = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier:   { select: { id: true, name: true } },
      user:       { select: { id: true, name: true } },
      orderItems: {
        include: { product: { select: { id: true, sku: true, name: true, unit: true } } },
      },
    },
  });
  res.json(updated);
}

async function remove(req, res) {
  const id = Number(req.params.id);
  const order = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { _count: { select: { orderItems: true } } },
  });
  if (!order) return res.status(404).json({ error: 'Sipariş bulunamadı' });
  if (order.status !== 'pending') {
    return res.status(409).json({ error: 'Sadece beklemedeki (pending) siparişler silinebilir' });
  }

  await prisma.$transaction([
    prisma.orderItem.deleteMany({ where: { purchaseOrderId: id } }),
    prisma.purchaseOrder.delete({ where: { id } }),
  ]);
  res.status(204).send();
}

module.exports = { list, get, create, updateStatus, remove };
