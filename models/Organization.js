const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const OrganizationSchema = new mongoose.Schema({
  organization_name: { type: String, required: true, unique: true, trim: true },
  admin_email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }, // stores bcrypt hash
  org_collection_name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Pre-save: hash password if modified
OrganizationSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Note: unique indexes are already defined at the field level via `unique: true`.
// Avoid duplicating index definitions to prevent Mongoose warnings.

module.exports = mongoose.model('Organization', OrganizationSchema);
