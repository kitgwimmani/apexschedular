const express = require('express');
const router = express.Router();
const ActivityInstance = require('../models/ActivityInstance');
const Activity = require('../models/Activity');
const { validateActivityInstance } = require('../middleware/validation');
const { auth, managerAuth } = require('../middleware/auth');

// Get all activity instances (with optional activity filter)
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, activityId } = req.query;
    
    // Build filter object
    const filter = {};
    if (activityId) {
      filter.activity_id = activityId;
    }
    
    const activityInstances = await ActivityInstance.find(filter)
      .populate('activity_id')
      .populate('created_by', 'username email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ start_time: -1 });
    
    const total = await ActivityInstance.countDocuments(filter);
    
    res.json({
      success: true,
      data: activityInstances,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get activity instances error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching activity instances'
    });
  }
});

// Get activity instances for a specific activity (keep for backward compatibility)
router.get('/activity/:activityId', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const activityInstances = await ActivityInstance.find({
      activity_id: req.params.activityId
    })
      .populate('activity_id')
      .populate('created_by', 'username email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ start_time: -1 });
    
    const total = await ActivityInstance.countDocuments({
      activity_id: req.params.activityId
    });
    
    res.json({
      success: true,
      data: activityInstances,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get activity instances error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching activity instances'
    });
  }
});

// Get single activity instance
router.get('/:id', auth, async (req, res) => {
  try {
    const activityInstance = await ActivityInstance.findById(req.params.id)
      .populate('activity_id')
      .populate('created_by', 'username email');
    
    if (!activityInstance) {
      return res.status(404).json({
        success: false,
        message: 'Activity instance not found'
      });
    }
    
    res.json({
      success: true,
      data: activityInstance
    });
  } catch (error) {
    console.error('Get activity instance error:', error);
    
    // Handle invalid ObjectId format
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid activity instance ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while fetching activity instance'
    });
  }
});

// Create new activity instance
router.post('/', [auth, managerAuth, validateActivityInstance], async (req, res) => {
  try {
    const activity = await Activity.findById(req.body.activity_id);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }
    
    // Check for time conflicts
    const conflictingInstance = await ActivityInstance.findOne({
      activity_id: req.body.activity_id,
      $or: [
        {
          start_time: { $lt: req.body.end_time },
          end_time: { $gt: req.body.start_time }
        }
      ]
    });
    
    if (conflictingInstance) {
      return res.status(400).json({
        success: false,
        message: 'Time conflict with existing activity instance'
      });
    }
    
    const activityInstance = new ActivityInstance({
      ...req.body,
      created_by: req.user._id
    });
    
    await activityInstance.save();
    
    // Populate after save
    await activityInstance.populate('activity_id');
    await activityInstance.populate('created_by', 'username email');
    
    res.status(201).json({
      success: true,
      message: 'Activity instance created successfully',
      data: activityInstance
    });
  } catch (error) {
    console.error('Create activity instance error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating activity instance'
    });
  }
});

// Update activity instance
router.put('/:id', [auth, managerAuth], async (req, res) => {
  try {
    const { start_time, end_time } = req.body;

    if (!start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: 'start_time and end_time are required',
      });
    }

    if (new Date(start_time) >= new Date(end_time)) {
      return res.status(400).json({
        success: false,
        message: 'start_time must be before end_time',
      });
    }

    const activityInstance = await ActivityInstance.findById(req.params.id);
    if (!activityInstance) {
      return res.status(404).json({
        success: false,
        message: 'Activity instance not found',
      });
    }

    // Check for overlapping time
    const conflictingInstance = await ActivityInstance.findOne({
      _id: { $ne: req.params.id },
      activity_id: activityInstance.activity_id,
      $or: [
        {
          start_time: { $lt: end_time },
          end_time: { $gt: start_time },
        },
      ],
    });

    if (conflictingInstance) {
      return res.status(400).json({
        success: false,
        message: 'Time conflict with existing activity instance',
      });
    }

    // Update only times
    activityInstance.start_time = new Date(start_time);
    activityInstance.end_time = new Date(end_time);

    await activityInstance.save();

    const updatedActivityInstance = await ActivityInstance.findById(req.params.id)
      .populate('activity_id')
      .populate('created_by', 'username email');

    res.json({
      success: true,
      message: 'Activity instance time updated successfully',
      data: updatedActivityInstance,
    });
  } catch (error) {
    console.error('Update activity instance error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid activity instance ID',
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating activity instance',
    });
  }
});


// Delete activity instance
router.delete('/:id', [auth, managerAuth], async (req, res) => {
  try {
    const activityInstance = await ActivityInstance.findById(req.params.id);
    
    if (!activityInstance) {
      return res.status(404).json({
        success: false,
        message: 'Activity instance not found'
      });
    }
    
    await ActivityInstance.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Activity instance deleted successfully'
    });
  } catch (error) {
    console.error('Delete activity instance error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid activity instance ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while deleting activity instance'
    });
  }
});

module.exports = router;