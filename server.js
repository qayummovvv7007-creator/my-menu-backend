import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import productRoutes from './routes/productRoutes.js';

dotenv.config();

const app = express();

// 1. Middleware (Hammasi joyida)
app.use(cors());
app.use(express.json());

// 2. O'zgaruvchilar
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

// 3. MongoDB ulanishi (Atlas uchun optimallashtirilgan)
mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB Atlasga muvaffaqiyatli ulandi"))
    .catch((err) => {
        console.error("❌ MongoDB ulanishda xato:", err.message);
    });

// 4. Modellar
const Category = mongoose.models.Category || mongoose.model('Category', new mongoose.Schema({
    nomi: { type: String, required: true }
}));

const Order = mongoose.models.Order || mongoose.model('Order', new mongoose.Schema({
    items: Array,
    totalPrice: Number,
    phone: String,
    date: String,
    status: { type: String, default: "Yangi" }
}));

// 5. Routes
app.use('/api/products', productRoutes);

// KATEGORIYALAR API
app.get("/api/categories", async (req, res) => {
    try {
        const cats = await Category.find();
        res.status(200).json(cats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/categories", async (req, res) => {
    try {
        const newCat = new Category({ nomi: req.body.nomi });
        await newCat.save();
        res.status(201).json(newCat);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete("/api/categories/:id", async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        res.json({ message: "O'chirildi" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// BUYURTMALAR API
app.get("/api/orders", async (req, res) => {
    try {
        const orders = await Order.find().sort({ _id: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/orders", async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        await newOrder.save();
        res.status(201).json(newOrder);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete("/api/orders/:id", async (req, res) => {
    try {
        await Order.findByIdAndDelete(req.params.id);
        res.json({ message: "Buyurtma o'chirildi" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. SERVERNI YOQISH (Bu qism hamma narsadan pastda tursin)
app.listen(PORT, () => {
    console.log(`🚀 Server ${PORT}-portda uyg'oq!`);
});