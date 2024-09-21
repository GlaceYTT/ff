const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb+srv://shiva:shiva@cluster0.7oupm.mongodb.net/?retryWrites=true&w=majority', { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => console.log('Connected to MongoDB'))
.catch(error => console.error('MongoDB connection error:', error));

// User schema
const UserSchema = new mongoose.Schema({
  name: String,
  emailOrPhone: String,
  password: String,
  phoneNumber: String,
  userId: String,
});

const User = mongoose.model('User', UserSchema);

// Middleware for logging requests
app.use((req, res, next) => {
  console.log(`Incoming ${req.method} request to ${req.url}`);
  next();
});

// Registration endpoint
app.post('/api/register', async (req, res) => {
  console.log('Registration request received:', req.body);
  const { name, emailOrPhone, password, phoneNumber } = req.body;
  try {
    const userId = new mongoose.Types.ObjectId(); 
    const newUser = new User({ name, emailOrPhone, password, phoneNumber, userId });
    await newUser.save();

    console.log("Registered User:", newUser);
    
    res.json({ userId, message: 'User registered successfully!' });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  console.log('Login request received:', req.body);
  const { emailOrPhone, password } = req.body;
  try {
    const user = await User.findOne({ emailOrPhone, password });
    if (user) {
      console.log("Login successful for user:", user.emailOrPhone);
      res.json({ userId: user.userId, message: 'Login successful!' });
    } else {
      console.warn("Invalid login attempt for:", emailOrPhone);
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Start server
app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
