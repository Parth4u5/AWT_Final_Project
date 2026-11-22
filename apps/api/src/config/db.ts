import mongoose from "mongoose";

let cachedConnection: Promise<typeof mongoose> | null = null;

const connectDB = async (): Promise<typeof mongoose> => {
  if (cachedConnection) {
    return cachedConnection;
  }

  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error(
      "MONGO_URI is missing. Add it to apps/api/.env or Vercel environment variables.",
    );
  }

  cachedConnection = mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
  });

  try {
    await cachedConnection;
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
    return cachedConnection;
  } catch (error) {
    cachedConnection = null;
    throw error;
  }
};

export default connectDB;
