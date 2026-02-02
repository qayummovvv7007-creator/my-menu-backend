import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB ulandi: ${conn.connection.host} ✅`);
    } catch (error) {
        console.error(`Xato: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;