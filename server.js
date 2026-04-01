import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import productRoutes from './routes/productRoutes.js';

dotenv.config();

const app = express();

// 1. Middleware
app.use(cors());
app.use(express.json());

// 2. O'zgaruvchilar
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

// 3. MongoDB ulanishi
mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB Atlasga muvaffaqiyatli ulandi"))
    .catch((err) => console.error("❌ MongoDB xatosi:", err.message));

// 4. Modellar (Timestamps qo'shildi - vaqtni aniq hisoblash uchun)
const Category = mongoose.models.Category || mongoose.model('Category', new mongoose.Schema({
    nomi: { type: String, required: true }
}));

const OrderSchema = new mongoose.Schema({
    items: Array,
    totalPrice: Number,
    phone: String,
    date: String,
    status: { type: String, default: "Yangi" }
}, { timestamps: true }); // Avtomatik createdAt va updatedAt qo'shadi

const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

// 5. Routes
app.use('/api/products', productRoutes);

// --- STATISTIKA ALGORITMI (Yangi qo'shilgan qism) ---
app.get("/api/admin/stats", async (req, res) => {
    try {
        const now = new Date();
        // O'zbekiston vaqti bilan bugun 00:00 ni topamiz
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Oxirgi 7 kun va 30 kun uchun vaqt chegaralari
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const stats = await Order.aggregate([
            {
                $facet: {
                    // BUGUNGI SAVDO VA TOP MAHSULOTLAR
                    "bugun": [
                        { $match: { createdAt: { $gte: startOfToday } } },
                        { $group: { _id: null, summa: { $sum: "$totalPrice" }, count: { $sum: 1 } } }
                    ],
                    "topProducts": [
                        { $match: { createdAt: { $gte: startOfToday } } },
                        { $unwind: "$items" },
                        { $group: { _id: "$items.nomi", qty: { $sum: "$items.soni" } } },
                        { $sort: { qty: -1 } },
                        { $limit: 10 }
                    ],
                    // HAFTALIK VA OYLIK UMUMIY SUMMALAR
                    "haftalik": [
                        { $match: { createdAt: { $gte: lastWeek } } },
                        { $group: { _id: null, summa: { $sum: "$totalPrice" }, count: { $sum: 1 } } }
                    ],
                    "oylik": [
                        { $match: { createdAt: { $gte: lastMonth } } },
                        { $group: { _id: null, summa: { $sum: "$totalPrice" }, count: { $sum: 1 } } }
                    ],
                    // GRAFIK UCHUN (7 kunlik trend)
                    "trend": [
                        { $match: { createdAt: { $gte: lastWeek } } },
                        { $group: {
                            _id: { $dateToString: { format: "%d/%m", date: "$createdAt", timezone: "+05:00" } },
                            summa: { $sum: "$totalPrice" }
                        }},
                        { $sort: { "_id": 1 } }
                    ]
                }
            }
        ]);

        // Frontend oson tushunishi uchun formatlaymiz
        const result = {
            kunlik: {
                summa: stats[0].bugun[0]?.summa || 0,
                count: stats[0].bugun[0]?.count || 0,
                sorted: stats[0].topProducts.map(p => ({ name: p._id, qty: p.qty })),
                trend: stats[0].trend
            },
            haftalik: {
                summa: stats[0].haftalik[0]?.summa || 0,
                count: stats[0].haftalik[0]?.count || 0
            },
            oylik: {
                summa: stats[0].oylik[0]?.summa || 0,
                count: stats[0].oylik[0]?.count || 0
            }
        };

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- KATEGORIYALAR VA BUYURTMALAR (Siz yozgan kodlar) ---
app.get("/api/categories", async (req, res) => {
    try {
        const cats = await Category.find();
        res.status(200).json(cats);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/categories", async (req, res) => {
    try {
        const newCat = new Category({ nomi: req.body.nomi });
        await newCat.save();
        res.status(201).json(newCat);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/categories/:id", async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        res.json({ message: "O'chirildi" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/orders", async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 }); // Vaqt bo'yicha saralash
        res.json(orders);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/orders", async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        await newOrder.save();
        res.status(201).json(newOrder);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete("/api/orders/:id", async (req, res) => {
    try {
        await Order.findByIdAndDelete(req.params.id);
        res.json({ message: "Buyurtma o'chirildi" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 6. SERVERNI YOQISH
app.listen(PORT, () => {
    console.log(`🚀 Server ${PORT}-portda uyg'oq!`);
});