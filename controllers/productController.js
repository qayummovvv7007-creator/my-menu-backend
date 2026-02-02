import Product from '../models/Product.js';

// 1. Ma'lumotlarni olish
export const getProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 2. Yangi mahsulot qo'shish
export const addProduct = async (req, res) => {
    try {
        const product = new Product(req.body);
        const savedProduct = await product.save();
        res.status(201).json(savedProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// 3. Mahsulotni o'chirish
export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        await Product.findByIdAndDelete(id);
        res.status(200).json({ message: "O'chirildi" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};  