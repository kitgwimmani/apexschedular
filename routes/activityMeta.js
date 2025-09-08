const express = require('express');
const router = express.Router();
const ActivityMeta = require('../models/ActivityMeta');
const { validateActivityMeta } = require('../middleware/validation');

// Get all activity meta
router.get('/', async (req, res) => {
  try {
    const activityMeta = await ActivityMeta.find().populate('activity_id');
    res.json(activityMeta);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get meta for a specific activity
router.get('/:activityId', async (req, res) => {
  try {
    const activityMeta = await ActivityMeta.findOne({ 
      activity_id: req.params.activityId 
    }).populate('activity_id');
    
    if (!activityMeta) {
      return res.status(404).json({ message: 'Activity meta not found' });
    }
    
    res.json(activityMeta);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create or update activity meta
router.post('/', validateActivityMeta, async (req, res) => {
  try {
    // Check if meta already exists for this activity
    let activityMeta = await ActivityMeta.findOne({ 
      activity_id: req.body.activity_id 
    });
    
    if (activityMeta) {
      // Update existing meta
      activityMeta = await ActivityMeta.findByIdAndUpdate(
        activityMeta._id,
        req.body,
        { new: true, runValidators: true }
      ).populate('activity_id');
    } else {
      // Create new meta
      activityMeta = new ActivityMeta(req.body);
      await activityMeta.save();
      await activityMeta.populate('activity_id');
    }
    
    res.status(201).json(activityMeta);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete activity meta
router.delete('/:id', async (req, res) => {
  try {
    const activityMeta = await ActivityMeta.findByIdAndDelete(req.params.id);
    if (!activityMeta) {
      return res.status(404).json({ message: 'Activity meta not found' });
    }
    res.json({ message: 'Activity meta deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;