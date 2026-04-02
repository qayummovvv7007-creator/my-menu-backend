import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
    items: Array,
    totalPrice: Number,
    phone: String,
    status: { type: String, default: "Yangi" }
}, { timestamps: true });

const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

export default Order;