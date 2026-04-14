const prisma = require('../lib/prisma');

async function list(req, res) {
  const { warehouseId, productId, lowStock } = req.query;

  const where = {};
  if (warehouseId) where.warehouseId = Number(warehouseId);
  if (productId) where.productId = Number(productId);
  if (lowStock === 'true') where.quantity = { lte: prisma.inventory.fields.minStock };

  const inventory = await prisma.inventory.findMany({
    where,
    include: {
      product: { select: { id: true, sku: true, name: true, unit: true } },
      warehouse: { select: { id: true, name: true } },
      location: { select: { id: true, zone: true, aisle: true, shelf: true, bin: true } },
    },
    orderBy: [{ warehouse: { name: 'asc' } }, { product: { name: 'asc' } }],
  });
  res.json(inventory);
}

async function get(req, res) {
  const inventory = await prisma.inventory.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      product: { select: { id: true, sku: true, name: true, unit: true, unitPrice: true } },
      warehouse: { select: { id: true, name: true, location: true } },
      location: true,
    },
  });
  if (!inventory) return res.status(404).json({ error: 'Stok kaydı bulunamadı' });
  res.json(inventory);
}

async function upsert(req, res) {
  const { productId, warehouseId, quantity, minStock, maxStock, locationId } = req.body;

  if (!productId || !warehouseId || quantity == null) {
    return res.status(400).json({ error: 'productId, warehouseId, quantity zorunlu' });
  }

  const [product, warehouse] = await Promise.all([
    prisma.product.findUnique({ where: { id: Number(productId) } }),
    prisma.warehouse.findUnique({ where: { id: Number(warehouseId) } }),
  ]);

  if (!product) return res.status(400).json({ error: 'Ürün bulunamadı' });
  if (!warehouse) return res.status(400).json({ error: 'Depo bulunamadı' });

  const inventory = await prisma.inventory.upsert({
    where: { productId_warehouseId: { productId: Number(productId), warehouseId: Number(warehouseId) } },
    create: {
      productId: Number(productId),
      warehouseId: Number(warehouseId),
      quantity: Number(quantity),
      minStock: minStock != null ? Number(minStock) : 0,
      maxStock: maxStock != null ? Number(maxStock) : null,
      locationId: locationId ? Number(locationId) : null,
    },
    update: {
      quantity: Number(quantity),
      minStock: minStock != null ? Number(minStock) : undefined,
      maxStock: maxStock != null ? Number(maxStock) : undefined,
      locationId: locationId !== undefined ? (locationId ? Number(locationId) : null) : undefined,
    },
    include: {
      product: { select: { id: true, sku: true, name: true, unit: true } },
      warehouse: { select: { id: true, name: true } },
      location: true,
    },
  });
  res.status(200).json(inventory);
}

async function lowStock(req, res) {
  const all = await prisma.inventory.findMany({
    include: {
      product: { select: { id: true, sku: true, name: true, unit: true } },
      warehouse: { select: { id: true, name: true } },
    },
    orderBy: { quantity: 'asc' },
  });
  res.json(all.filter(i => i.quantity <= i.minStock));
}

module.exports = { list, get, upsert, lowStock };
