const express = require('express');
const router = express.Router();
const ActivityMeta = require('../models/ActivityMeta');
const Activity = require('../models/Activity');
const { validateActivityMeta } = require('../middleware/validation');
const { auth, managerAuth } = require('../middleware/auth');

// Get activity meta by activity ID
router.get('/activity/:activityId', auth, async (req, res) => {
  try {
    const activityMeta = await ActivityMeta.findOne({ 
      activity_id: req.params.activityId 
    }).populate('activity_id');
    
    if (!activityMeta) {
      return res.status(404).json({
        success: false,
        message: 'Activity metadata not found'
      });
    }
    
    res.json({
      success: true,
      data: activityMeta
    });
  } catch (error) {
    console.error('Get activity meta error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching activity metadata'
    });
  }
});

// Create or update activity meta
router.post('/', [auth, managerAuth, validateActivityMeta], async (req, res) => {
  try {
    const activity = await Activity.findById(req.body.activity_id);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }
    
    let activityMeta = await ActivityMeta.findOne({ 
      activity_id: req.body.activity_id 
    });
    
    const metaData = {
      ...req.body,
      created_by: req.user._id
    };
    
    if (activityMeta) {
      activityMeta = await ActivityMeta.findOneAndUpdate(
        { activity_id: req.body.activity_id },
        metaData,
        { new: true, runValidators: true }
      ).populate('activity_id');
      
      return res.json({
        success: true,
        message: 'Activity metadata updated successfully',
        data: activityMeta
      });
    } else {
      activityMeta = new ActivityMeta(metaData);
      await activityMeta.save();
      await activityMeta.populate('activity_id');
      
      return res.status(201).json({
        success: true,
        message: 'Activity metadata created successfully',
        data: activityMeta
      });
    }
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Metadata already exists for this activity'
      });
    }
    
    console.error('Create/update activity meta error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating/updating activity metadata'
    });
  }
});

// Delete activity meta
router.delete('/:id', [auth, managerAuth], async (req, res) => {
  try {
    const activityMeta = await ActivityMeta.findById(req.params.id);
    
    if (!activityMeta) {
      return res.status(404).json({
        success: false,
        message: 'Activity metadata not found'
      });
    }
    
    await ActivityMeta.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Activity metadata deleted successfully'
    });
  } catch (error) {
    console.error('Delete activity meta error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting activity metadata'
    });
  }
});

module.exports = router;