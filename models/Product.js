import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
    nomi:     { type: String, required: true },
    title:    { type: String, required: true },
    narxi:    { type: Number, required: true },
    category: { type: String, required: true },
    rasmi:    { type: String, required: true },
    chegirma: { type: Number, default: 0 }  // ← shu qatorni qo'shing
}, { timestamps: true });

export default mongoose.model('Product', ProductSchema);