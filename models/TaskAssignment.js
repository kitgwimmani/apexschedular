const mongoose = require('mongoose');

const taskAssignmentSchema = new mongoose.Schema({
  activity_instance_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ActivityInstance',
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Assigned', 'In Progress', 'Completed', 'Canceled'],
    default: 'Assigned'
  },
  assigned_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    trim: true
  },
  assigned_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Update the updated_at field before saving
taskAssignmentSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

// Prevent duplicate assignments
taskAssignmentSchema.index({ activity_instance_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model('TaskAssignment', taskAssignmentSchema);