const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const { validateActivity } = require('../middleware/validation');

// Get all activities
router.get('/', async (req, res) => {
  try {
    const activities = await Activity.find().populate('category_id');
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific activity
router.get('/:id', async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id).populate('category_id');
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    res.json(activity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new activity
// In the POST route for creating activities:
router.post('/', validateActivity, async (req, res) => {
  try {
    // Use the authenticated user's ID
    const activityData = {
      ...req.body,
      created_by: req.user.id, // Use the authenticated user's ID
      focal_person: req.body.focal_person || req.user.id // Default to current user if not specified
    };
    
    const activity = new Activity(activityData);
    const savedActivity = await activity.save();
    await savedActivity.populate('category_id');
    await savedActivity.populate('created_by', 'username email');
    await savedActivity.populate('focal_person', 'username email');
    
    res.status(201).json(savedActivity);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update an activity
router.put('/:id', validateActivity, async (req, res) => {
  try {
    const activity = await Activity.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('category_id');
    
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    
    res.json(activity);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete an activity
router.delete('/:id', async (req, res) => {
  try {
    const activity = await Activity.findByIdAndDelete(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;