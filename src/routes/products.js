import express from 'express';
import multer from 'multer';
import Product from '../model/product.js';
import { adminAuth } from '../middleware/auth.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error('Only JPG, PNG, and WEBP images are allowed'));
  },
});

function normalizeProduct(product) {
  const obj = product.toObject();
  const imageUrl = product.imageData && product.imageType
    ? `data:${product.imageType};base64,${product.imageData.toString('base64')}`
    : '';

  return {
    ...obj,
    id: obj._id,
    imageUrl,
  };
}

router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    return res.status(200).json(products.map(normalizeProduct));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to load products' });
  }
});

router.post('/', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { name, category, price, inventory, featured, imageData, imageType } = req.body;

    if (!name || !category || price === undefined || inventory === undefined) {
      return res.status(400).json({
        message: 'Name, category, price and inventory are required',
      });
    }

    let storedImageData = req.file?.buffer;
    let storedImageType = req.file?.mimetype || '';

    if (!storedImageData && imageData && imageType) {
      storedImageData = Buffer.from(imageData, 'base64');
      storedImageType = imageType;
    }

    const product = new Product({
      name,
      category,
      price: Number(price),
      inventory: Number(inventory),
      featured: featured === 'true' || featured === true,
      imageData: storedImageData,
      imageType: storedImageType,
    });
    await product.save();

    return res.status(201).json(normalizeProduct(product));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to create product' });
  }
});

router.put('/:id', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const { name, category, price, inventory, featured, imageData, imageType } = req.body;
    if (name !== undefined) product.name = name;
    if (category !== undefined) product.category = category;
    if (price !== undefined) product.price = Number(price);
    if (inventory !== undefined) product.inventory = Number(inventory);
    if (featured !== undefined) product.featured = featured === 'true' || featured === true;

    if (req.file?.buffer) {
      product.imageData = req.file.buffer;
      product.imageType = req.file.mimetype;
    } else if (imageData && imageType) {
      product.imageData = Buffer.from(imageData, 'base64');
      product.imageType = imageType;
    }

    await product.save();
    return res.status(200).json(normalizeProduct(product));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to update product' });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const removed = await Product.findByIdAndDelete(req.params.id);
    if (!removed) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.status(200).json({ message: 'Product deleted' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Unable to delete product' });
  }
});

export default router;
