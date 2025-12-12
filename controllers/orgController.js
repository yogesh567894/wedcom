const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Organization = require('../models/Organization');
const { sanitizeCollectionName, createCollection, dropCollection, renameCollection } = require('../services/dbService');
const { nativeDB } = require('../config/db');

function formatResponse({ success, data = undefined, message = undefined, error = undefined }) {
  const res = { success };
  if (data) res.data = data;
  if (message) res.message = message;
  if (error) res.error = error;
  return res;
}

// POST /org/create
async function createOrg(req, res) {
  try {
    const { organization_name, email, password } = req.body || {};
    if (!organization_name || !email || !password) {
      return res.status(400).json(formatResponse({ success: false, error: 'Missing required fields' }));
    }

    const existing = await Organization.findOne({ organization_name });
    if (existing) {
      return res.status(409).json(formatResponse({ success: false, error: 'Organization already exists' }));
    }

    const collection_name = sanitizeCollectionName(organization_name);

    const org = new Organization({
      organization_name,
      admin_email: email,
      password,
      org_collection_name: collection_name,
    });

    await org.save();

    // Create dynamic collection
    const col = await createCollection(collection_name);
    await col.insertOne({ welcome: true, created_at: Date.now() });

    return res.status(201).json(formatResponse({
      success: true,
      data: {
        org_name: org.organization_name,
        collection_name: org.org_collection_name,
      },
      message: 'Organization created',
    }));
  } catch (err) {
    console.error('createOrg error:', err);
    return res.status(500).json(formatResponse({ success: false, error: 'Internal server error' }));
  }
}

// POST /admin/login
async function loginAdmin(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json(formatResponse({ success: false, error: 'Missing email or password' }));
    }

    const org = await Organization.findOne({ admin_email: email });
    if (!org) {
      return res.status(401).json(formatResponse({ success: false, error: 'Invalid credentials' }));
    }

    const match = await bcrypt.compare(password, org.password);
    if (!match) {
      return res.status(401).json(formatResponse({ success: false, error: 'Invalid credentials' }));
    }

    const token = jwt.sign({
      org_id: org._id.toString(),
      org_name: org.organization_name,
      org_collection_name: org.org_collection_name,
      email: org.admin_email,
    }, process.env.JWT_SECRET, { expiresIn: '12h' });

    return res.json(formatResponse({ success: true, data: { token, org_name: org.organization_name } }));
  } catch (err) {
    console.error('loginAdmin error:', err);
    return res.status(500).json(formatResponse({ success: false, error: 'Internal server error' }));
  }
}

// GET /org/get?organization_name=<name>
async function getOrg(req, res) {
  try {
    const { organization_name } = req.query || {};
    if (!organization_name) {
      return res.status(400).json(formatResponse({ success: false, error: 'Missing organization_name' }));
    }

    const org = await Organization.findOne({ organization_name });
    if (!org) {
      return res.status(404).json(formatResponse({ success: false, error: 'Organization not found' }));
    }

    return res.json(formatResponse({
      success: true,
      data: {
        organization_name: org.organization_name,
        org_collection_name: org.org_collection_name,
        admin_email: org.admin_email,
        createdAt: org.createdAt,
      },
    }));
  } catch (err) {
    console.error('getOrg error:', err);
    return res.status(500).json(formatResponse({ success: false, error: 'Internal server error' }));
  }
}

// PUT /org/update
async function updateOrg(req, res) {
  try {
    const { organization_name, new_organization_name, email, password } = req.body || {};
    const user = req.user;

    if (!organization_name || !new_organization_name || !email) {
      return res.status(400).json(formatResponse({ success: false, error: 'Missing required fields' }));
    }

    const org = await Organization.findOne({ organization_name });
    if (!org) {
      return res.status(404).json(formatResponse({ success: false, error: 'Organization not found' }));
    }

    // Verify ownership via JWT
    if (user.org_id !== org._id.toString()) {
      return res.status(401).json(formatResponse({ success: false, error: 'Unauthorized: Not your organization' }));
    }

    // Ensure new name is unique and different
    if (new_organization_name === organization_name) {
      return res.status(400).json(formatResponse({ success: false, error: 'New organization name must be different' }));
    }
    const exists = await Organization.findOne({ organization_name: new_organization_name });
    if (exists) {
      return res.status(409).json(formatResponse({ success: false, error: 'New organization name already exists' }));
    }

    // Rename collection
    const oldCollection = org.org_collection_name;
    const newCollection = sanitizeCollectionName(new_organization_name);
    await renameCollection(oldCollection, newCollection);

    // Update fields
    org.organization_name = new_organization_name;
    org.org_collection_name = newCollection;
    org.admin_email = email || org.admin_email;
    if (password) {
      // triggers pre-save hash
      org.password = password;
    }

    await org.save();

    return res.json(formatResponse({
      success: true,
      data: {
        org_name: org.organization_name,
        org_collection_name: org.org_collection_name,
      },
      message: 'Organization updated',
    }));
  } catch (err) {
    console.error('updateOrg error:', err);
    return res.status(500).json(formatResponse({ success: false, error: 'Internal server error' }));
  }
}

// DELETE /org/delete
async function deleteOrg(req, res) {
  try {
    const { organization_name } = req.body || {};
    const user = req.user;
    if (!organization_name) {
      return res.status(400).json(formatResponse({ success: false, error: 'Missing organization_name' }));
    }

    const org = await Organization.findOne({ organization_name });
    if (!org) {
      return res.status(404).json(formatResponse({ success: false, error: 'Organization not found' }));
    }

    if (user.org_id !== org._id.toString()) {
      return res.status(401).json(formatResponse({ success: false, error: 'Unauthorized: Not your organization' }));
    }

    const collectionName = org.org_collection_name;
    await dropCollection(collectionName);
    await Organization.deleteOne({ _id: org._id });

    return res.json(formatResponse({ success: true, message: 'Organization deleted' }));
  } catch (err) {
    console.error('deleteOrg error:', err);
    return res.status(500).json(formatResponse({ success: false, error: 'Internal server error' }));
  }
}

module.exports = {
  createOrg,
  loginAdmin,
  getOrg,
  updateOrg,
  deleteOrg,
};
