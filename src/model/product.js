import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  inventory: { type: Number, required: true },
  featured: { type: Boolean, default: false },
  imageData: { type: Buffer },
  imageType: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

const Product = mongoose.model('Product', productSchema);

export default Product;
