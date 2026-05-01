const express = require('express');
const dotenv  = require('dotenv');
const cors    = require('cors');
const http    = require('http');
const path    = require('path');

const connectDB    = require('./src/config/db');
const { initSocket } = require('./src/config/socket');

dotenv.config();

const app = express();

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Static folders for uploads
// Booking payment screenshots  → /uploads/filename.jpg
// Event banners                → /uploads/events/filename.jpg
app.use('/uploads', express.static(path.join(__dirname, 'src/uploads')));

// Routes
app.use('/api/auth',       require('./src/routes/authRoutes'));
app.use('/api/user-auth',  require('./src/routes/userAuthRoutes')); // ← user login/register
app.use('/api/bookings',   require('./src/routes/bookingRoutes'));
app.use('/api/events',     require('./src/routes/eventRoutes'));
app.use('/api/employees',  require('./src/routes/employeeRoutes'));

// Health check
app.get('/', (req, res) => res.send('API Running...'));

const PORT = process.env.PORT || 5000;

// Create HTTP server (required for Socket.IO)
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});