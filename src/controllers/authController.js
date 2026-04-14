const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

async function register(req, res) {
  const { email, name, password, roleId } = req.body;

  if (!email || !name || !password) {
    return res.status(400).json({ error: 'email, name ve password zorunlu' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'Bu e-posta zaten kayıtlı' });
  }

  const hashed = await bcrypt.hash(password, 10);

  // roleId verilmemişse varsayılan rol olarak 1 kullan
  const targetRoleId = roleId ?? 1;

  const role = await prisma.role.findUnique({ where: { id: targetRoleId } });
  if (!role) {
    return res.status(400).json({ error: 'Geçersiz rol' });
  }

  const user = await prisma.user.create({
    data: { email, name, password: hashed, roleId: targetRoleId },
    select: { id: true, email: true, name: true, role: { select: { name: true } } },
  });

  return res.status(201).json({ user });
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email ve password zorunlu' });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });

  if (!user) {
    return res.status(401).json({ error: 'E-posta veya şifre hatalı' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'E-posta veya şifre hatalı' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN ?? '8h' }
  );

  return res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role.name },
  });
}

async function me(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, name: true, role: { select: { name: true } } },
  });
  return res.json({ user });
}

module.exports = { register, login, me };
