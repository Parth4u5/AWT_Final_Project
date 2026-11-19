import dotenv from 'dotenv';
import { assertEnv } from '../config/env.js';
import app from '../app.js';
import connectDB from '../config/db.js';

dotenv.config();

let bootstrapped = false;
let configError = null;

try {
    assertEnv();
} catch (error) {
    configError = error;
    console.error(error.message);
}

export default async function handler(req, res) {
    try {
        if (configError) {
            return res.status(500).json({ message: 'Server initialization failed' });
        }

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
