import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import exampleRoutes from './routes/exampleRoutes.js';

const frontendUrl = process.env.FRONTEND_URL;

const app = express();

const staticAllowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    ...(frontendUrl ? [frontendUrl] : []),
];

const isAllowedOrigin = (origin) => {
    if (staticAllowedOrigins.includes(origin)) {
        return true;
    }

    // Allow Vercel preview and production frontend domains.
    try {
        const hostname = new URL(origin).hostname;
        return hostname.endsWith('.vercel.app');
    } catch {
        return false;
    }
};

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow non-browser clients and server-to-server requests.
            if (!origin) {
                return callback(null, true);
            }

            if (isAllowedOrigin(origin)) {
                return callback(null, true);
            }

            return callback(new Error('Not allowed by CORS'));
        },
    })
);

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/examples', exampleRoutes);

app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});

export default app;
