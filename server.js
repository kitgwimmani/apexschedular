require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

// Import routes
const activityRoutes = require('./routes/activities');
const activityMetaRoutes = require('./routes/activityMeta');
const categoryRoutes = require('./routes/categories');
const activityInstanceRoutes = require('./routes/activityInstances');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const emailRoutes = require('./routes/mail');
const taskAssignmentsRoutes = require('./routes/taskAssignments');

// Import middleware
const { auth, adminAuth } = require('./middleware/auth'); // Add adminAuth import

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes (apply auth middleware to all API routes)
app.use('/api/activities', auth, activityRoutes);
app.use('/api/activity-meta', auth, activityMetaRoutes);
app.use('/api/categories', auth, categoryRoutes);
app.use('/api/activity-instances', auth, activityInstanceRoutes);
app.use('/api/admin', auth, adminAuth, adminRoutes); // Add adminAuth middleware
app.use('/api/mail', emailRoutes);
app.use('/api/task-assignments', taskAssignmentsRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Activity Management API is running!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});