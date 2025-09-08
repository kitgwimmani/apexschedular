const mongoose = require('mongoose');

const activityMetaSchema = new mongoose.Schema({
  activity_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: true
  },
  activity_location: {
    type: String,
    maxlength: 255
  },
  external_focal_person: {
    type: String,
    maxlength: 100
  },
  external_email: {
    type: String,
    maxlength: 255
  },
  external_phone: {
    type: String,
    maxlength: 20
  },
  additional_notes: {
    type: String
  }
});

module.exports = mongoose.model('ActivityMeta', activityMetaSchema);