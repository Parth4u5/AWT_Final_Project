import dotenv from 'dotenv';
import app from '../app.js';
import connectDB from '../config/db.js';

dotenv.config();

let bootstrapped = false;

export default async function handler(req, res) {
    try {
        if (!bootstrapped) {
            await connectDB();
            bootstrapped = true;
        }

        return app(req, res);
    } catch (error) {
        console.error('Vercel function bootstrap failed:', error.message);
        return res.status(500).json({ message: 'Server initialization failed' });
    }
}
