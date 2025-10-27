const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 255,
    unique: true
  },
  description: {
    type: String
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId, // Changed from Number to ObjectId
    ref: 'User',
    required: true
  },
  focal_person: {
    type: mongoose.Schema.Types.ObjectId, // Changed from Number to ObjectId
    ref: 'User',
    required: true
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  priority_level: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Scheduled', 'In Progress', 'Completed', 'Canceled'],
    default: 'Scheduled'
  }
});

module.exports = mongoose.model('Activity', activitySchema);