import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI?.trim();

if (!MONGODB_URI) {
  console.warn("⚠️ MONGODB_URI is not set. API routes that touch the DB will fail until it is provided.");
}

declare global {
  // eslint-disable-next-line no-var
  var __careerAlignDb: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}

const cached = global.__careerAlignDb ?? { conn: null, promise: null };

global.__careerAlignDb = cached;

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }
  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI environment variable.");
  }
  cached.promise =
    cached.promise ??
    mongoose.connect(MONGODB_URI, {
      dbName: "careerAlign",
      bufferCommands: false,
      serverSelectionTimeoutMS: 30_000
    });
  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes("ip address") || message.includes("access list")) {
      console.error(
        "MongoDB Atlas rejected the connection. Add your current IP (or 0.0.0.0/0 for development) to the Network Access list in the Atlas UI."
      );
    }
    throw error;
  }
  return cached.conn;
}
