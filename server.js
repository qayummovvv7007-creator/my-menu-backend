import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';

import productRoutes  from './routes/productRoutes.js';
import orderRoutes    from './routes/orderRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import statsRoutes    from './routes/statsRoutes.js';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB Atlasga muvaffaqiyatli ulandi"))
    .catch((err) => console.error("❌ MongoDB xatosi:", err.message));

// --- ROUTES ---
app.use('/api/products',    productRoutes);
app.use('/api/orders',      orderRoutes);
app.use('/api/categories',  categoryRoutes);
app.use('/api/admin',       statsRoutes);   // → GET /api/admin/stats

app.listen(PORT, () => {
    console.log(`🚀 Server ${PORT}-portda uyg'oq!`);
});