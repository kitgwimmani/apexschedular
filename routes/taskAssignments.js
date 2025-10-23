const express = require('express');
const router = express.Router();
const TaskAssignment = require('../models/TaskAssignment');
const ActivityInstance = require('../models/ActivityInstance');
const User = require('../models/User');
const { auth, managerAuth } = require('../middleware/auth');

// Get all task assignments (with optional filters)
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, activityInstanceId, userId } = req.query;
    
    // Build filter object
    const filter = {};
    if (activityInstanceId) {
      filter.activity_instance_id = activityInstanceId;
    }
    if (userId) {
      filter.user_id = userId;
    }
    
    const taskAssignments = await TaskAssignment.find(filter)
      .populate('activity_instance_id')
      .populate('user_id', 'username email')
      .populate('assigned_by', 'username email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ assigned_at: -1 });
    
    const total = await TaskAssignment.countDocuments(filter);
    
    res.json({
      success: true,
      data: taskAssignments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get task assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching task assignments'
    });
  }
});

// Get task assignments for a specific activity instance
router.get('/activity-instance/:activityInstanceId', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const taskAssignments = await TaskAssignment.find({
      activity_instance_id: req.params.activityInstanceId
    })
      .populate('activity_instance_id')
      .populate('user_id', 'username email')
      .populate('assigned_by', 'username email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ assigned_at: -1 });
    
    const total = await TaskAssignment.countDocuments({
      activity_instance_id: req.params.activityInstanceId
    });
    
    res.json({
      success: true,
      data: taskAssignments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get task assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching task assignments'
    });
  }
});

// Get single task assignment
router.get('/:id', auth, async (req, res) => {
  try {
    const taskAssignment = await TaskAssignment.findById(req.params.id)
      .populate('activity_instance_id')
      .populate('user_id', 'username email')
      .populate('assigned_by', 'username email');
    
    if (!taskAssignment) {
      return res.status(404).json({
        success: false,
        message: 'Task assignment not found'
      });
    }
    
    res.json({
      success: true,
      data: taskAssignment
    });
  } catch (error) {
    console.error('Get task assignment error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid task assignment ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while fetching task assignment'
    });
  }
});

// Create new task assignment
router.post('/', [auth, managerAuth], async (req, res) => {
  try {
    const activityInstance = await ActivityInstance.findById(req.body.activity_instance_id);
    if (!activityInstance) {
      return res.status(404).json({
        success: false,
        message: 'Activity instance not found'
      });
    }
    
    const user = await User.findById(req.body.user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check for existing assignment
    const existingAssignment = await TaskAssignment.findOne({
      activity_instance_id: req.body.activity_instance_id,
      user_id: req.body.user_id
    });
    
    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: 'User is already assigned to this activity instance'
      });
    }
    
    const taskAssignment = new TaskAssignment({
      ...req.body,
      assigned_by: req.user._id
    });
    
    await taskAssignment.save();
    
    // Populate after save
    await taskAssignment.populate('activity_instance_id');
    await taskAssignment.populate('user_id', 'username email');
    await taskAssignment.populate('assigned_by', 'username email');
    
    res.status(201).json({
      success: true,
      message: 'Task assignment created successfully',
      data: taskAssignment
    });
  } catch (error) {
    console.error('Create task assignment error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating task assignment'
    });
  }
});

// Update task assignment
router.put('/:id', [auth, managerAuth], async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'status is required',
      });
    }

    const taskAssignment = await TaskAssignment.findById(req.params.id);
    if (!taskAssignment) {
      return res.status(404).json({
        success: false,
        message: 'Task assignment not found',
      });
    }

    // Update status
    taskAssignment.status = status;
    await taskAssignment.save();

    const updatedTaskAssignment = await TaskAssignment.findById(req.params.id)
      .populate('activity_instance_id')
      .populate('user_id', 'username email')
      .populate('assigned_by', 'username email');

    res.json({
      success: true,
      message: 'Task assignment updated successfully',
      data: updatedTaskAssignment,
    });
  } catch (error) {
    console.error('Update task assignment error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid task assignment ID',
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
      message: 'Server error while updating task assignment',
    });
  }
});

// Delete task assignment
router.delete('/:id', [auth, managerAuth], async (req, res) => {
  try {
    const taskAssignment = await TaskAssignment.findById(req.params.id);
    
    if (!taskAssignment) {
      return res.status(404).json({
        success: false,
        message: 'Task assignment not found'
      });
    }
    
    await TaskAssignment.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Task assignment deleted successfully'
    });
  } catch (error) {
    console.error('Delete task assignment error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid task assignment ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while deleting task assignment'
    });
  }
});

module.exports = router;