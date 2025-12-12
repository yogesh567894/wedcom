const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/org_management_service';

let nativeClient;
let nativeDB;

async function connectDB() {
  // Mongoose connection (Master DB)
  mongoose.set('strictQuery', true);
  await mongoose.connect(MONGO_URI);

  // Native MongoDB client (for dynamic collections)
  nativeClient = new MongoClient(MONGO_URI);
  await nativeClient.connect();
  nativeDB = nativeClient.db();

  console.log('MongoDB connected: mongoose + native driver');
}

function getMongooseConn() {
  return mongoose.connection;
}

function getNativeDB() {
  return nativeDB;
}

module.exports = {
  connectDB,
  mongooseConn: getMongooseConn,
  nativeDB: getNativeDB,
};
