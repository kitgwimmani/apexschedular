const mongoose = require('mongoose');

const activityInstanceSchema = new mongoose.Schema({
  activity_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: true
  },
  start_time: {
    type: Date,
    required: true
  },
  end_time: {
    type: Date,
    required: true
  },
  actual_start_time: {
    type: Date
  },
  actual_end_time: {
    type: Date
  },
  // Added fields for authentication and tracking
  status: {
    type: String,
    enum: ['Scheduled', 'In Progress', 'Completed', 'Canceled'],
    default: 'Scheduled'
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    trim: true
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
activityInstanceSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('ActivityInstance', activityInstanceSchema);