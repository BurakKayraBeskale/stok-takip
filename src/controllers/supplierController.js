const prisma = require('../lib/prisma');

async function list(req, res) {
  const suppliers = await prisma.supplier.findMany({
    include: { _count: { select: { products: true, purchaseOrders: true } } },
    orderBy: { name: 'asc' },
  });
  res.json(suppliers);
}

async function get(req, res) {
  const supplier = await prisma.supplier.findUnique({
    where: { id: Number(req.params.id) },
    include: { products: { select: { id: true, sku: true, name: true } } },
  });
  if (!supplier) return res.status(404).json({ error: 'Tedarikçi bulunamadı' });
  res.json(supplier);
}

async function create(req, res) {
  const { name, contact, phone, email, address } = req.body;
  if (!name) return res.status(400).json({ error: 'name zorunlu' });

  const supplier = await prisma.supplier.create({ data: { name, contact, phone, email, address } });
  res.status(201).json(supplier);
}

async function update(req, res) {
  const { name, contact, phone, email, address } = req.body;
  const supplier = await prisma.supplier.findUnique({ where: { id: Number(req.params.id) } });
  if (!supplier) return res.status(404).json({ error: 'Tedarikçi bulunamadı' });

  const updated = await prisma.supplier.update({
    where: { id: Number(req.params.id) },
    data: { name, contact, phone, email, address },
  });
  res.json(updated);
}

async function remove(req, res) {
  const id = Number(req.params.id);
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!supplier) return res.status(404).json({ error: 'Tedarikçi bulunamadı' });
  if (supplier._count.products > 0) return res.status(409).json({ error: 'Bu tedarikçiye ait ürünler mevcut' });

  await prisma.supplier.delete({ where: { id } });
  res.status(204).send();
}

module.exports = { list, get, create, update, remove };
