import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import productRoutes from './routes/productRoutes.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB Atlasga muvaffaqiyatli ulandi"))
    .catch((err) => console.error("❌ MongoDB xatosi:", err.message));

// --- MODELLAR ---
const Category = mongoose.models.Category || mongoose.model('Category', new mongoose.Schema({
    nomi: { type: String, required: true }
}));

const OrderSchema = new mongoose.Schema({
    items: Array,
    totalPrice: Number,
    phone: String,
    status: { type: String, default: "Yangi" }
}, { timestamps: true });

const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

// --- ROUTES ---
app.use('/api/products', productRoutes);

// --- STATISTIKA ALGORITMI ---
app.get("/api/admin/stats", async (req, res) => {
    try {
        const now = new Date();
        const tashkentTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tashkent" }));

        const startOfToday = new Date(tashkentTime);
        startOfToday.setHours(0, 0, 0, 0);

        const lastWeek = new Date(startOfToday);
        lastWeek.setDate(lastWeek.getDate() - 7);

        const lastMonth = new Date(startOfToday);
        lastMonth.setDate(lastMonth.getDate() - 30);

        const stats = await Order.aggregate([
            {
                $facet: {
                    // BUGUNGI SAVDO
                    "bugun": [
                        { $match: { createdAt: { $gte: startOfToday } } },
                        { $group: { _id: null, summa: { $sum: "$totalPrice" }, count: { $sum: 1 } } }
                    ],

                    // BUGUNGI TOP MAHSULOTLAR
                    "topProducts": [
                        { $match: { createdAt: { $gte: startOfToday } } },
                        { $unwind: "$items" },
                        {
                            $group: {
                                _id: "$items.nomi",
                                qty: { $sum: { $toInt: "$items.soni" } }
                            }
                        },
                        { $sort: { qty: -1 } },
                        { $limit: 10 }
                    ],

                    // HAFTALIK SUMMA
                    "haftalik": [
                        { $match: { createdAt: { $gte: lastWeek } } },
                        { $group: { _id: null, summa: { $sum: "$totalPrice" }, count: { $sum: 1 } } }
                    ],

                    // OYLIK SUMMA
                    "oylik": [
                        { $match: { createdAt: { $gte: lastMonth } } },
                        { $group: { _id: null, summa: { $sum: "$totalPrice" }, count: { $sum: 1 } } }
                    ],

                    // HAFTALIK GRAFIK (kunbay summa)
                    "trend": [
                        { $match: { createdAt: { $gte: lastWeek } } },
                        {
                            $group: {
                                _id: {
                                    $dateToString: {
                                        format: "%d/%m",
                                        date: "$createdAt",
                                        timezone: "+05:00"
                                    }
                                },
                                summa: { $sum: "$totalPrice" },
                                orders: { $sum: 1 }
                            }
                        },
                        { $sort: { "_id": 1 } }
                    ],

                    // ✅ KUNBAY MAHSULOT TAHLILI — har kuni qaysi mahsulot necha marta buyurtma qilingan
                    "trendProducts": [
                        { $match: { createdAt: { $gte: lastMonth } } },
                        { $unwind: "$items" },
                        {
                            $group: {
                                _id: {
                                    date: {
                                        $dateToString: {
                                            format: "%Y-%m-%d",
                                            date: "$createdAt",
                                            timezone: "+05:00"
                                        }
                                    },
                                    product: "$items.nomi"
                                },
                                qty: { $sum: { $toInt: "$items.soni" } }
                            }
                        },
                        { $sort: { "_id.date": 1, qty: -1 } }
                    ]
                }
            }
        ]);

        // trendProducts ni kunbay ob'ektga o'zgartirish: { "2025-05-02": [{name, qty}, ...] }
        const trendProductsRaw = stats[0].trendProducts || [];
        const trendProductsByDay = {};
        trendProductsRaw.forEach(item => {
            const date = item._id.date;
            if (!trendProductsByDay[date]) trendProductsByDay[date] = [];
            trendProductsByDay[date].push({
                name: item._id.product,
                qty: item.qty
            });
        });

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
            },
            // ✅ Frontend uchun kunbay mahsulotlar
            trendProductsByDay
        };

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- KATEGORIYALAR ---
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

// --- BUYURTMALAR ---
app.get("/api/orders", async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
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

app.listen(PORT, () => {
    console.log(`🚀 Server ${PORT}-portda uyg'oq!`);
});