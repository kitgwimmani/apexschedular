const mongoose = require('mongoose');

const activityMetaSchema = new mongoose.Schema({
  activity_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: true,
    unique: true // Added unique constraint since it's a 1:1 relationship
  },
  activity_location: {
    type: String,
    maxlength: 255,
    trim: true
  },
  external_focal_person: {
    type: String,
    maxlength: 100,
    trim: true
  },
  external_email: {
    type: String,
    maxlength: 255,
    trim: true,
    lowercase: true
  },
  external_phone: {
    type: String,
    maxlength: 20,
    trim: true
  },
  additional_notes: {
    type: String,
    trim: true
  },
  // Added fields for authentication and tracking
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Update the updated_at field before saving
activityMetaSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('ActivityMeta', activityMetaSchema);