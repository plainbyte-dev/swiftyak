import mongoose from 'mongoose';

let connecting = null;

// Safe to call on every request: the connection is opened once and reused. On
// serverless hosts (Vercel) the app is imported without running server.js, so
// app.js calls this per request instead of relying on a connect-at-startup.
export async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose;

  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI is not set in the environment');
  }

  if (!connecting) {
    mongoose.set('strictQuery', true);

    connecting = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 10000 })
      .then((conn) => {
        console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
        return conn;
      })
      .catch((err) => {
        connecting = null; // let the next request retry
        throw err;
      });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
  }

  return connecting;
}
