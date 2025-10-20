const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const { validateActivity } = require('../middleware/validation');
const { auth, managerAuth } = require('../middleware/auth');

// Get all activities
router.get('/', auth, async (req, res) => {
  try {
    const { status, priority, category, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority_level = priority;
    if (category) filter.category_id = category;
    
    const activities = await Activity.find(filter)
      .populate('created_by', 'username email')
      .populate('focal_person', 'username email')
      .populate('category_id', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ created_at: -1 });
    
    const total = await Activity.countDocuments(filter);
    
    res.json({
      success: true,
      data: activities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching activities'
    });
  }
});

// Get single activity
router.get('/:id', auth, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate('created_by', 'username email')
      .populate('focal_person', 'username email')
      .populate('category_id', 'name description');
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }
    
    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching activity'
    });
  }
});

// Create new activity
router.post('/', [auth, managerAuth, validateActivity], async (req, res) => {
  try {
    const activityData = {
      ...req.body,
      created_by: req.user._id
    };
    
    const activity = new Activity(activityData);
    await activity.save();
    
    await activity.populate('created_by', 'username email');
    await activity.populate('focal_person', 'username email');
    await activity.populate('category_id', 'name');
    
    res.status(201).json({
      success: true,
      message: 'Activity created successfully',
      data: activity
    });
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating activity'
    });
  }
});

// Update activity
router.put('/:id', [auth, validateActivity], async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }
    
    // Check permissions
    if (req.user.role !== 'admin' && 
        req.user.role !== 'manager' && 
        activity.created_by.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const updatedActivity = await Activity.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('created_by', 'username email')
      .populate('focal_person', 'username email')
      .populate('category_id', 'name');
    
    res.json({
      success: true,
      message: 'Activity updated successfully',
      data: updatedActivity
    });
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating activity'
    });
  }
});

// Delete activity
router.delete('/:id', [auth, managerAuth], async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }
    
    await Activity.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Activity deleted successfully'
    });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting activity'
    });
  }
});

module.exports = router;