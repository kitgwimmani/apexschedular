const express = require('express');
const router = express.Router();
const ActivityInstance = require('../models/ActivityInstance');
const Activity = require('../models/Activity');
const { validateActivityInstance } = require('../middleware/validation');
const { auth, managerAuth } = require('../middleware/auth');

// Get all activity instances for an activity
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
    res.status(500).json({
      success: false,
      message: 'Server error while fetching activity instance'
    });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const activityInstances = await ActivityInstance.find()
      .populate('activity_id')
      .populate('created_by', 'username email')
      .sort({ createdAt: -1 }); // Optional: sort by newest first

    res.json({
      success: true,
      count: activityInstances.length,
      data: activityInstances
    });
  } catch (error) {
    console.error('Get all activity instances error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching activity instances'
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
    
    const activityInstanceData = {
      ...req.body,
      created_by: req.user._id
    };
    
    const activityInstance = new ActivityInstance(activityInstanceData);
    await activityInstance.save();
    
    await activityInstance.populate('activity_id');
    await activityInstance.populate('created_by', 'username email');
    
    res.status(201).json({
      success: true,
      message: 'Activity instance created successfully',
      data: activityInstance
    });
  } catch (error) {
    console.error('Create activity instance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating activity instance'
    });
  }
});

// Update activity instance
router.put('/:id', [auth, managerAuth, validateActivityInstance], async (req, res) => {
  try {
    const activityInstance = await ActivityInstance.findById(req.params.id);
    
    if (!activityInstance) {
      return res.status(404).json({
        success: false,
        message: 'Activity instance not found'
      });
    }
    
    const updatedActivityInstance = await ActivityInstance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('activity_id')
      .populate('created_by', 'username email');
    
    res.json({
      success: true,
      message: 'Activity instance updated successfully',
      data: updatedActivityInstance
    });
  } catch (error) {
    console.error('Update activity instance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating activity instance'
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
    res.status(500).json({
      success: false,
      message: 'Server error while deleting activity instance'
    });
  }
});


module.exports = router;