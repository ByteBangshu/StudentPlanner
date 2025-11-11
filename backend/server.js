require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const session = require('express-session');

// ======================= CONTROLLERS ======================= //
const AuthController = require('./controllers/AuthFile');
const CalController = require('./controllers/CalendarFile');
const app = express();
const PORT = 3001;

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave :false,
  saveUninitialized : true,
  cookie: {secure:false}
}))

// ======================= MIDDLEWARE ======================= //
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(express.static("src"));

// ======================= TESTING ======================== //
app.get('/', (req, res) => {
    res.send('Hello! Your backend is running.');
});

// ======================= MONGODB CONNECTION ======================= //
mongoose.connect(process.env.MONGO_API, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ======================= AUTH ROUTES ======================= //
app.post('/signup', AuthController.createUser);
app.post('/login', AuthController.loginUser);

// ======================= CALENDAR ROUTES ======================= //
app.post('/addEvent', CalController.setCalendar);
app.post('/getEvents', CalController.getCalendar);

// ======================= SERVER LISTENING ======================= //
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });