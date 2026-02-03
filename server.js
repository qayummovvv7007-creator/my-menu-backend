import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import productRoutes from './routes/productRoutes.js';

dotenv.config();
const app = express();

// Middleware
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'], allowedHeaders: ['Content-Type'] }));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Atlasga ulandi"))
    .catch((err) => console.error("❌ Xato:", err.message));

// Modellar
const Category = mongoose.models.Category || mongoose.model('Category', new mongoose.Schema({ nomi: String }));
const Order = mongoose.models.Order || mongoose.model('Order', new mongoose.Schema({
    items: Array, totalPrice: Number, phone: String, date: String, status: { type: String, default: "Yangi" }
}));

// Routes
app.use('/api/products', productRoutes);

// KATEGORIYALAR API
app.get("/api/categories", async (req, res) => {
    const cats = await Category.find();
    res.json(cats);
});
app.post("/api/categories", async (req, res) => {
    const newCat = new Category({ nomi: req.body.nomi });
    await newCat.save();
    res.status(201).json(newCat);
});
app.delete("/api/categories/:id", async (req, res) => {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: "O'chirildi" });
});

// BUYURTMALAR API
app.get("/api/orders", async (req, res) => {
    const orders = await Order.find().sort({ _id: -1 });
    res.json(orders);
});
app.delete("/api/orders/:id", async (req, res) => {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: "O'chirildi" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server ${PORT}-portda yondi`));