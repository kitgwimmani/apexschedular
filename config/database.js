const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Encode the password to handle special characters
    const encodedPassword = encodeURIComponent('apexSchedular2025#');
    const connectionString = `mongodb+srv://talk2kayceenow_db_user:${encodedPassword}@apexcluster.s4bngss.mongodb.net/activity_db?retryWrites=true&w=majority&appName=apexcluster`;
    
    const conn = await mongoose.connect(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;