import Order from '../models/Order.js';

// GET /api/admin/stats
export const getStats = async (req, res) => {
    try {
        // Toshkent vaqti bilan bugungi kun boshini hisoblaymiz
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

                    // OYLIK SUMMA
                    "oylik": [
                        { $match: { createdAt: { $gte: lastMonth } } },
                        { $group: { _id: null, summa: { $sum: "$totalPrice" }, count: { $sum: 1 } } }
                    ],

                    // OYLIK GRAFIK — kunbay summa (Toshkent vaqti)
                    "trend": [
                        { $match: { createdAt: { $gte: lastMonth } } },
                        {
                            $group: {
                                _id: {
                                    $dateToString: {
                                        format: "%Y-%m-%d",
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

                    // KUNBAY MAHSULOT TAHLILI
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

        // trendProducts ni kunbay ob'ektga o'zgartirish
        const trendProductsRaw = stats[0].trendProducts || [];
        const trendProductsByDay = {};
        trendProductsRaw.forEach(item => {
            const date = item._id.date;
            if (!trendProductsByDay[date]) trendProductsByDay[date] = [];
            trendProductsByDay[date].push({ name: item._id.product, qty: item.qty });
        });

        res.json({
            kunlik: {
                summa: stats[0].bugun[0]?.summa || 0,
                count: stats[0].bugun[0]?.count || 0,
                sorted: stats[0].topProducts.map(p => ({ name: p._id, qty: p.qty })),
                trend: stats[0].trend
            },
            oylik: {
                summa: stats[0].oylik[0]?.summa || 0,
                count: stats[0].oylik[0]?.count || 0
            },
            trendProductsByDay
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};