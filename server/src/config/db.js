const mongoose = require('mongoose');
const dns = require('dns');

// Fix Windows DNS querySrv ECONNREFUSED for MongoDB Atlas SRV records
if (process.platform === 'win32') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (e) {
    // Ignore if not supported in environment
  }
}

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/surpluslink';
    const conn = await mongoose.connect(mongoURI);
    console.log(`[MongoDB Connected] Host: ${conn.connection.host}, DB: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB Connection Error] ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
