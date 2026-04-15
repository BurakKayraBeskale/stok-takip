const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

// İlk kayıtta rollerin var olduğundan emin ol
async function ensureRoles() {
  await prisma.role.upsert({ where: { name: 'admin' }, update: {}, create: { name: 'admin' } });
  await prisma.role.upsert({ where: { name: 'user' },  update: {}, create: { name: 'user'  } });
}

function signToken(user, organizationId) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role.name, organizationId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN ?? '8h' }
  );
}

async function register(req, res) {
  const { email, name, password, organizationName } = req.body;

  if (!email || !name || !password) {
    return res.status(400).json({ error: 'email, name ve password zorunlu' });
  }
  if (!organizationName) {
    return res.status(400).json({ error: 'organizationName (firma adı) zorunlu' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'Bu e-posta zaten kayıtlı' });
  }

  await ensureRoles();
  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });

  const hashed = await bcrypt.hash(password, 10);

  const organization = await prisma.organization.create({
    data: { name: organizationName },
  });

  const user = await prisma.user.create({
    data: { email, name, password: hashed, roleId: adminRole.id, organizationId: organization.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: { select: { name: true } },
      organization: { select: { id: true, name: true } },
    },
  });

  const token = signToken(user, organization.id);

  return res.status(201).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role.name,
      organizationId: organization.id,
      organizationName: organization.name,
    },
  });
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email ve password zorunlu' });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true, organization: true },
  });

  if (!user) {
    return res.status(401).json({ error: 'E-posta veya şifre hatalı' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'E-posta veya şifre hatalı' });
  }

  const token = signToken(user, user.organizationId);

  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role.name,
      organizationId: user.organizationId,
      organizationName: user.organization.name,
    },
  });
}

async function me(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: { select: { name: true } },
      organization: { select: { id: true, name: true } },
    },
  });
  return res.json({ user });
}

module.exports = { register, login, me };
