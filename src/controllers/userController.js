const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

// GET /api/users - Org'daki tüm kullanıcıları listele
async function list(req, res) {
  const organizationId = req.user.organizationId;
  const users = await prisma.user.findMany({
    where: { organizationId },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      role: { select: { id: true, name: true } },
    },
    orderBy: { name: 'asc' },
  });
  res.json(users);
}

// GET /api/users/:id
async function get(req, res) {
  const organizationId = req.user.organizationId;
  const user = await prisma.user.findFirst({
    where: { id: Number(req.params.id), organizationId },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      role: { select: { id: true, name: true } },
    },
  });
  if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
  res.json(user);
}

// POST /api/users/invite - Org'a yeni kullanıcı ekle (admin only)
async function invite(req, res) {
  const organizationId = req.user.organizationId;
  const { email, name, password, roleName } = req.body;

  if (!email || !name || !password) {
    return res.status(400).json({ error: 'email, name ve password zorunlu' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'Bu e-posta zaten kayıtlı' });
  }

  const targetRoleName = roleName ?? 'user';
  const role = await prisma.role.findUnique({ where: { name: targetRoleName } });
  if (!role) {
    return res.status(400).json({ error: `Geçersiz rol. Geçerli roller: admin, user` });
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, name, password: hashed, roleId: role.id, organizationId },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      role: { select: { id: true, name: true } },
    },
  });

  res.status(201).json(user);
}

// PATCH /api/users/:id/role - Kullanıcı rolünü güncelle (admin only)
async function updateRole(req, res) {
  const organizationId = req.user.organizationId;
  const id = Number(req.params.id);
  const { roleName } = req.body;

  if (!roleName) return res.status(400).json({ error: 'roleName zorunlu' });

  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) {
    return res.status(400).json({ error: `Geçersiz rol. Geçerli roller: admin, user` });
  }

  const user = await prisma.user.findFirst({ where: { id, organizationId } });
  if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });

  if (user.id === req.user.id) {
    return res.status(409).json({ error: 'Kendi rolünüzü değiştiremezsiniz' });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { roleId: role.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: { select: { id: true, name: true } },
    },
  });
  res.json(updated);
}

// DELETE /api/users/:id - Kullanıcıyı org'dan çıkar (admin only)
async function remove(req, res) {
  const organizationId = req.user.organizationId;
  const id = Number(req.params.id);

  if (id === req.user.id) {
    return res.status(409).json({ error: 'Kendinizi silemezsiniz' });
  }

  const user = await prisma.user.findFirst({ where: { id, organizationId } });
  if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });

  await prisma.user.delete({ where: { id } });
  res.status(204).send();
}

module.exports = { list, get, invite, updateRole, remove };
