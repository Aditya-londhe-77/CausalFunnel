'use strict';

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'interaction_tracker';

let client = null;
let db = null;

async function connect() {
  if (db) return db;

  client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  });

  await client.connect();
  db = client.db(DB_NAME);

  // Create indexes
  const events = db.collection('events');
  await events.createIndex({ session_id: 1 });
  await events.createIndex({ timestamp: -1 });
  await events.createIndex({ page_url: 1, event_type: 1 });

  console.log(`[db] Connected to MongoDB: ${DB_NAME}`);
  return db;
}

function getDb() {
  if (!db) throw new Error('Database not connected. Call connect() first.');
  return db;
}

async function close() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('[db] Connection closed.');
  }
}

module.exports = { connect, getDb, close };
