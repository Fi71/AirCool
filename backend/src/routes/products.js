import { Router } from 'express';
import prisma from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: { category: true }
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { code, name, categoryId, price, purchasePrice, stock, minStock, image } = req.body;
    if (!code || !name) {
      return res.status(400).json({ error: 'Kode dan nama produk wajib diisi.' });
    }
    const existing = await prisma.product.findUnique({ where: { code } });
    if (existing) {
      return res.status(400).json({ error: 'Kode produk sudah ada.' });
    }
    const product = await prisma.product.create({
      data: {
        code, name,
        categoryId: categoryId ? parseInt(categoryId) : null,
        price: parseFloat(price) || 0,
        purchasePrice: parseFloat(purchasePrice) || 0,
        stock: parseInt(stock) || 0,
        minStock: parseInt(minStock) || 0,
        image: image || null
      },
      include: { category: true }
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { code, name, categoryId, price, purchasePrice, stock, minStock, image } = req.body;
    if (code) {
      const existing = await prisma.product.findFirst({ where: { code, id: { not: id } } });
      if (existing) return res.status(400).json({ error: 'Kode produk sudah ada.' });
    }
    const data = {};
    if (code !== undefined) data.code = code;
    if (name !== undefined) data.name = name;
    if (categoryId !== undefined) data.categoryId = categoryId ? parseInt(categoryId) : null;
    if (price !== undefined) data.price = parseFloat(price);
    if (purchasePrice !== undefined) data.purchasePrice = parseFloat(purchasePrice);
    if (stock !== undefined) data.stock = parseInt(stock);
    if (minStock !== undefined) data.minStock = parseInt(minStock);
    if (image !== undefined) data.image = image;

    const product = await prisma.product.update({
      where: { id },
      data,
      include: { category: true }
    });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Produk berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
