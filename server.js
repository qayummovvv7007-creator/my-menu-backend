import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import productRoutes from './routes/productRoutes.js';

dotenv.config();
const app = express();

// 1. Middleware - CORS sozlamalari juda muhim!
app.use(cors({
    origin: '*', // Xavfsizlik uchun keyinchalik o'zingizni frontend saytingiz manzilini qo'ying
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// 2. MongoDB Connection - Xatolikni aniqroq ko'rsatadi
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Atlasga ulandi"))
    .catch((err) => console.error("❌ MongoDB xatosi:", err.message));

// 3. Modellar (Schema o'zgarmasligi uchun alohida aniqlash yaxshiroq)
const Category = mongoose.models.Category || mongoose.model('Category', new mongoose.Schema({ nomi: String }));
const Order = mongoose.models.Order || mongoose.model('Order', new mongoose.Schema({
    items: Array, 
    totalPrice: Number, 
    phone: String, 
    date: String, 
    status: { type: String, default: "Yangi" }
}));

// 4. Routes
app.use('/api/products', productRoutes);

// KATEGORIYALAR API
app.get("/api/categories", async (req, res) => {
    try {
        const cats = await Category.find();
        res.json(cats);
    } catch (err) {
        res.status(500).json({ error: "Kategoriyalarni olib bo'lmadi" });
    }
});

app.post("/api/categories", async (req, res) => {
    try {
        const newCat = new Category({ nomi: req.body.nomi });
        await newCat.save();
        res.status(201).json(newCat);
    } catch (err) {
        res.status(400).json({ error: "Saqlashda xato" });
    }
});

app.delete("/api/categories/:id", async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        res.json({ message: "O'chirildi" });
    } catch (err) {
        res.status(500).json({ error: "O'chirishda xato" });
    }
});

// BUYURTMALAR API
app.get("/api/orders", async (req, res) => {
    try {
        const orders = await Order.find().sort({ _id: -1 });
        res.status(200).json(orders);
    } catch (err) {
        res.status(500).json({ error: "Buyurtmalarni olib bo'lmadi" });
    }
});

app.delete("/api/orders/:id", async (req, res) => {
    try {
        await Order.findByIdAndDelete(req.params.id);
        res.json({ message: "O'chirildi" });
    } catch (err) {
        res.status(500).json({ error: "O'chirishda xato" });
    }
});

// 5. Noto'g'ri manzillar uchun (Bu o'sha HTML xatosini oldini oladi)
app.use((req, res) => {
    res.status(404).json({ error: "Bunday API manzili mavjud emas!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server ${PORT}-portda yondi`));