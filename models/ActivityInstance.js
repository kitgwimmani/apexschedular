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
  }
});

module.exports = mongoose.model('ActivityInstance', activityInstanceSchema);