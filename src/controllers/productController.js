const prisma = require('../lib/prisma');

async function list(req, res) {
  const organizationId = req.user.organizationId;
  const { categoryId, supplierId, search } = req.query;

  const where = { organizationId };
  if (categoryId) where.categoryId = Number(categoryId);
  if (supplierId) where.supplierId = Number(supplierId);
  if (search) where.name = { contains: search };

  const products = await prisma.product.findMany({
    where,
    include: {
      category: { select: { id: true, name: true } },
      supplier: { select: { id: true, name: true } },
      _count: { select: { inventory: true } },
    },
    orderBy: { name: 'asc' },
  });
  res.json(products);
}

async function get(req, res) {
  const organizationId = req.user.organizationId;
  const product = await prisma.product.findFirst({
    where: { id: Number(req.params.id), organizationId },
    include: {
      category: { select: { id: true, name: true } },
      supplier: { select: { id: true, name: true } },
      inventory: {
        include: { warehouse: { select: { id: true, name: true } } },
      },
    },
  });
  if (!product) return res.status(404).json({ error: 'Ürün bulunamadı' });
  res.json(product);
}

async function create(req, res) {
  const organizationId = req.user.organizationId;
  const { sku, name, description, categoryId, supplierId, unitPrice, unit } = req.body;

  if (!sku || !name || !categoryId || !supplierId || unitPrice == null || !unit) {
    return res.status(400).json({ error: 'sku, name, categoryId, supplierId, unitPrice, unit zorunlu' });
  }

  const [category, supplier, existing] = await Promise.all([
    prisma.category.findFirst({ where: { id: Number(categoryId), organizationId } }),
    prisma.supplier.findFirst({ where: { id: Number(supplierId), organizationId } }),
    prisma.product.findUnique({ where: { organizationId_sku: { organizationId, sku } } }),
  ]);

  if (!category) return res.status(400).json({ error: 'Kategori bulunamadı' });
  if (!supplier) return res.status(400).json({ error: 'Tedarikçi bulunamadı' });
  if (existing) return res.status(409).json({ error: 'Bu SKU zaten kayıtlı' });

  const product = await prisma.product.create({
    data: {
      sku, name, description,
      categoryId: Number(categoryId),
      supplierId: Number(supplierId),
      unitPrice, unit, organizationId,
    },
    include: {
      category: { select: { id: true, name: true } },
      supplier: { select: { id: true, name: true } },
    },
  });
  res.status(201).json(product);
}

async function update(req, res) {
  const organizationId = req.user.organizationId;
  const id = Number(req.params.id);
  const { name, description, categoryId, supplierId, unitPrice, unit } = req.body;

  const product = await prisma.product.findFirst({ where: { id, organizationId } });
  if (!product) return res.status(404).json({ error: 'Ürün bulunamadı' });

  const updated = await prisma.product.update({
    where: { id },
    data: {
      name: name ?? product.name,
      description: description ?? product.description,
      categoryId: categoryId ? Number(categoryId) : product.categoryId,
      supplierId: supplierId ? Number(supplierId) : product.supplierId,
      unitPrice: unitPrice ?? product.unitPrice,
      unit: unit ?? product.unit,
    },
    include: {
      category: { select: { id: true, name: true } },
      supplier: { select: { id: true, name: true } },
    },
  });
  res.json(updated);
}

async function remove(req, res) {
  const organizationId = req.user.organizationId;
  const id = Number(req.params.id);
  const product = await prisma.product.findFirst({
    where: { id, organizationId },
    include: { _count: { select: { inventory: true, stockMovements: true } } },
  });
  if (!product) return res.status(404).json({ error: 'Ürün bulunamadı' });
  if (product._count.inventory > 0 || product._count.stockMovements > 0) {
    return res.status(409).json({ error: 'Bu ürüne ait stok veya hareket kaydı mevcut' });
  }

  await prisma.product.delete({ where: { id } });
  res.status(204).send();
}

module.exports = { list, get, create, update, remove };
