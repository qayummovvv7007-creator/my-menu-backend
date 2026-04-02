import Category from '../models/Category.js';

// GET /api/categories
export const getCategories = async (req, res) => {
    try {
        const cats = await Category.find();
        res.status(200).json(cats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/categories
export const createCategory = async (req, res) => {
    try {
        const newCat = new Category({ nomi: req.body.nomi });
        await newCat.save();
        res.status(201).json(newCat);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE /api/categories/:id
export const deleteCategory = async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        res.json({ message: "O'chirildi" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};