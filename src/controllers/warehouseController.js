const prisma = require('../lib/prisma');

async function list(req, res) {
  const warehouses = await prisma.warehouse.findMany({
    include: { _count: { select: { inventory: true } } },
    orderBy: { name: 'asc' },
  });
  res.json(warehouses);
}

async function get(req, res) {
  const warehouse = await prisma.warehouse.findUnique({
    where: { id: Number(req.params.id) },
    include: { warehouseLocations: true },
  });
  if (!warehouse) return res.status(404).json({ error: 'Depo bulunamadı' });
  res.json(warehouse);
}

async function create(req, res) {
  const { name, location } = req.body;
  if (!name) return res.status(400).json({ error: 'name zorunlu' });

  const warehouse = await prisma.warehouse.create({ data: { name, location } });
  res.status(201).json(warehouse);
}

async function update(req, res) {
  const { name, location } = req.body;
  const warehouse = await prisma.warehouse.findUnique({ where: { id: Number(req.params.id) } });
  if (!warehouse) return res.status(404).json({ error: 'Depo bulunamadı' });

  const updated = await prisma.warehouse.update({
    where: { id: Number(req.params.id) },
    data: { name, location },
  });
  res.json(updated);
}

async function remove(req, res) {
  const warehouse = await prisma.warehouse.findUnique({ where: { id: Number(req.params.id) } });
  if (!warehouse) return res.status(404).json({ error: 'Depo bulunamadı' });

  await prisma.warehouse.delete({ where: { id: Number(req.params.id) } });
  res.status(204).send();
}

module.exports = { list, get, create, update, remove };
