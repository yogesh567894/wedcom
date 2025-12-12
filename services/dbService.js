const { nativeDB } = require('../config/db');

function sanitizeCollectionName(name) {
  return `org_${name.toLowerCase().replace(/\s+/g, '_')}`;
}

async function createCollection(collectionName) {
  const db = nativeDB();
  const exists = await db.listCollections({ name: collectionName }).hasNext();
  if (exists) return db.collection(collectionName);
  const col = await db.createCollection(collectionName);
  console.log('Collection created:', collectionName);
  return col;
}

async function dropCollection(collectionName) {
  const db = nativeDB();
  const exists = await db.listCollections({ name: collectionName }).hasNext();
  if (!exists) return false;
  const result = await db.dropCollection(collectionName);
  console.log('Collection dropped:', collectionName);
  return result;
}

async function renameCollection(oldName, newName) {
  const db = nativeDB();
  const exists = await db.listCollections({ name: oldName }).hasNext();
  if (!exists) throw new Error(`Source collection not found: ${oldName}`);
  await db.renameCollection(oldName, newName, { dropTarget: true });
  console.log('Collection renamed:', oldName, '->', newName);
}

module.exports = {
  sanitizeCollectionName,
  createCollection,
  dropCollection,
  renameCollection,
};
