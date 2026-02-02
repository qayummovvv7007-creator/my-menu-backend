import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
    nomi: { type: String, required: true },
    title: { type: String, required: true }, // Qisqacha ma'lumot (masalan: "Mazali va issiq")
    narxi: { type: Number, required: true },
    category: { type: String, required: true }, // Ovqat, Ichimlik, Desert va h.k.
    rasmi: { type: String, required: true } // Rasm URL manzili
}, { timestamps: true });

export default mongoose.model('Product', ProductSchema);