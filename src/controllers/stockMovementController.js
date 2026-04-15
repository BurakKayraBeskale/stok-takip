const prisma = require('../lib/prisma');
const { sendLowStockAlert } = require('../lib/mailer');

const VALID_TYPES = ['in', 'out', 'adjustment'];

// Stok güncellendikten sonra minStock kontrolü yapar, gerekirse email gönderir (fire-and-forget)
async function triggerLowStockCheck(organizationId, productId, warehouseId, productName, sku, warehouseName) {
  try {
    const inv = await prisma.inventory.findUnique({
      where: {
        organizationId_productId_warehouseId: { organizationId, productId, warehouseId },
      },
    });
    if (!inv || inv.minStock == null || inv.quantity > inv.minStock) return;

    const admins = await prisma.user.findMany({
      where: { organizationId, role: { name: 'admin' } },
      select: { email: true },
    });
    if (admins.length === 0) return;

    await sendLowStockAlert({
      to:            admins.map(a => a.email).join(', '),
      productName,
      sku,
      warehouseName,
      quantity:  inv.quantity,
      minStock:  inv.minStock,
    });
  } catch (err) {
    console.error('[low-stock-check]', err.message);
  }
}

async function list(req, res) {
  const organizationId = req.user.organizationId;
  const { productId, warehouseId, type, dateFrom, dateTo } = req.query;

  const where = { organizationId };
  if (productId)   where.productId   = Number(productId);
  if (warehouseId) where.warehouseId = Number(warehouseId);
  if (type)        where.type        = type;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo)   where.createdAt.lte = new Date(dateTo);
  }

  const movements = await prisma.stockMovement.findMany({
    where,
    include: {
      product:   { select: { id: true, sku: true, name: true, unit: true } },
      warehouse: { select: { id: true, name: true } },
      user:      { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(movements);
}

async function get(req, res) {
  const organizationId = req.user.organizationId;
  const movement = await prisma.stockMovement.findFirst({
    where: { id: Number(req.params.id), organizationId },
    include: {
      product:   { select: { id: true, sku: true, name: true, unit: true } },
      warehouse: { select: { id: true, name: true } },
      user:      { select: { id: true, name: true } },
    },
  });
  if (!movement) return res.status(404).json({ error: 'Stok hareketi bulunamadı' });
  res.json(movement);
}

async function create(req, res) {
  const organizationId = req.user.organizationId;
  const { productId, warehouseId, type, quantity, reference, note } = req.body;
  const userId = req.user.id;

  if (!productId || !warehouseId || !type || quantity == null) {
    return res.status(400).json({ error: 'productId, warehouseId, type, quantity zorunlu' });
  }
  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: `type değeri şunlardan biri olmalı: ${VALID_TYPES.join(', ')}` });
  }
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty === 0) {
    return res.status(400).json({ error: 'quantity sıfır olmayan tam sayı olmalı' });
  }

  const [product, warehouse] = await Promise.all([
    prisma.product.findFirst({ where: { id: Number(productId), organizationId } }),
    prisma.warehouse.findFirst({ where: { id: Number(warehouseId), organizationId } }),
  ]);
  if (!product)   return res.status(400).json({ error: 'Ürün bulunamadı' });
  if (!warehouse) return res.status(400).json({ error: 'Depo bulunamadı' });

  // 'out' için mevcut stok kontrolü
  if (type === 'out' || (type === 'adjustment' && qty < 0)) {
    const inventory = await prisma.inventory.findUnique({
      where: {
        organizationId_productId_warehouseId: {
          organizationId,
          productId:   Number(productId),
          warehouseId: Number(warehouseId),
        },
      },
    });
    const currentQty = inventory ? inventory.quantity : 0;
    const needed = type === 'out' ? qty : Math.abs(qty);
    if (currentQty < needed) {
      return res.status(409).json({
        error: `Yetersiz stok. Mevcut: ${currentQty}, Talep edilen: ${needed}`,
      });
    }
  }

  const delta = type === 'out' ? -qty : qty;

  const [movement] = await prisma.$transaction([
    prisma.stockMovement.create({
      data: {
        organizationId,
        productId:   Number(productId),
        warehouseId: Number(warehouseId),
        userId,
        type,
        quantity:  qty,
        reference: reference ?? null,
        note:      note ?? null,
      },
      include: {
        product:   { select: { id: true, sku: true, name: true, unit: true } },
        warehouse: { select: { id: true, name: true } },
        user:      { select: { id: true, name: true } },
      },
    }),
    prisma.inventory.upsert({
      where: {
        organizationId_productId_warehouseId: {
          organizationId,
          productId:   Number(productId),
          warehouseId: Number(warehouseId),
        },
      },
      create: {
        organizationId,
        productId:   Number(productId),
        warehouseId: Number(warehouseId),
        quantity:    Math.max(0, delta),
      },
      update: { quantity: { increment: delta } },
    }),
  ]);

  // Kritik stok kontrolü — yanıtı bekletmeden arka planda çalıştır
  triggerLowStockCheck(
    organizationId,
    Number(productId),
    Number(warehouseId),
    product.name,
    product.sku,
    warehouse.name,
  );

  res.status(201).json(movement);
}

module.exports = { list, get, create };
