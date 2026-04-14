const prisma = require('../lib/prisma');

async function list(req, res) {
  const categories = await prisma.category.findMany({
    include: {
      parent: { select: { id: true, name: true } },
      _count: { select: { children: true, products: true } },
    },
    orderBy: { name: 'asc' },
  });
  res.json(categories);
}

async function get(req, res) {
  const category = await prisma.category.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      parent: { select: { id: true, name: true } },
      children: { select: { id: true, name: true } },
    },
  });
  if (!category) return res.status(404).json({ error: 'Kategori bulunamadı' });
  res.json(category);
}

async function create(req, res) {
  const { name, parentId } = req.body;
  if (!name) return res.status(400).json({ error: 'name zorunlu' });

  if (parentId) {
    const parent = await prisma.category.findUnique({ where: { id: Number(parentId) } });
    if (!parent) return res.status(400).json({ error: 'Üst kategori bulunamadı' });
  }

  const category = await prisma.category.create({
    data: { name, parentId: parentId ? Number(parentId) : null },
    include: { parent: { select: { id: true, name: true } } },
  });
  res.status(201).json(category);
}

async function update(req, res) {
  const { name, parentId } = req.body;
  const id = Number(req.params.id);

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) return res.status(404).json({ error: 'Kategori bulunamadı' });

  if (parentId && Number(parentId) === id) {
    return res.status(400).json({ error: 'Kategori kendisinin üst kategorisi olamaz' });
  }

  const updated = await prisma.category.update({
    where: { id },
    data: {
      name: name ?? category.name,
      parentId: parentId !== undefined ? (parentId ? Number(parentId) : null) : category.parentId,
    },
    include: { parent: { select: { id: true, name: true } } },
  });
  res.json(updated);
}

async function remove(req, res) {
  const id = Number(req.params.id);
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { children: true, products: true } } },
  });
  if (!category) return res.status(404).json({ error: 'Kategori bulunamadı' });
  if (category._count.children > 0) return res.status(409).json({ error: 'Alt kategoriler mevcut, önce onları silin' });
  if (category._count.products > 0) return res.status(409).json({ error: 'Bu kategoriye ait ürünler mevcut' });

  await prisma.category.delete({ where: { id } });
  res.status(204).send();
}

module.exports = { list, get, create, update, remove };
