const express = require('express');
const router = express.Router();
const ActivityInstance = require('../models/ActivityInstance');
const { validateActivityInstance } = require('../middleware/validation');

// Get all activity instances
router.get('/', async (req, res) => {
  try {
    const activityInstances = await ActivityInstance.find().populate('activity_id');
    res.json(activityInstances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get instances for a specific activity
router.get('/activity/:activityId', async (req, res) => {
  try {
    const activityInstances = await ActivityInstance.find({ 
      activity_id: req.params.activityId 
    }).populate('activity_id');
    
    res.json(activityInstances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific activity instance
router.get('/:id', async (req, res) => {
  try {
    const activityInstance = await ActivityInstance.findById(req.params.id).populate('activity_id');
    if (!activityInstance) {
      return res.status(404).json({ message: 'Activity instance not found' });
    }
    res.json(activityInstance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new activity instance
router.post('/', validateActivityInstance, async (req, res) => {
  try {
    const activityInstance = new ActivityInstance(req.body);
    const savedInstance = await activityInstance.save();
    await savedInstance.populate('activity_id');
    res.status(201).json(savedInstance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update an activity instance
router.put('/:id', validateActivityInstance, async (req, res) => {
  try {
    const activityInstance = await ActivityInstance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('activity_id');
    
    if (!activityInstance) {
      return res.status(404).json({ message: 'Activity instance not found' });
    }
    
    res.json(activityInstance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete an activity instance
router.delete('/:id', async (req, res) => {
  try {
    const activityInstance = await ActivityInstance.findByIdAndDelete(req.params.id);
    if (!activityInstance) {
      return res.status(404).json({ message: 'Activity instance not found' });
    }
    res.json({ message: 'Activity instance deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;