require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { startQueues } = require('./jobs');

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
  try {
    await connectDB();
    await startQueues();
    
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
// Trigger nodemon restart

