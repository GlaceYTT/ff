const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const bcrypt = require('bcryptjs');

const app = express();
const port = 10838; 
const cors = require('cors');
app.use(cors({
    origin: '*',  // Allow all origins
  }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Connect to MongoDB
mongoose.connect('mongodb+srv://shiva:shiva@cluster0.7oupm.mongodb.net/?retryWrites=true&w=majority')
  .then(() => console.log('Connected to MongoDB'))
  .catch(error => console.error('MongoDB connection error:', error));

// User schema
const UserSchema = new mongoose.Schema({
  name: String,
  username: String,
  email: String,
  phoneNumber: String,
  password: String,
  userId: String,
  profilePicture: String, // Field for storing base64 image
});

const User = mongoose.model('User', UserSchema, 'RailEaseAccounts');

// Middleware for logging requests
app.use((req, res, next) => {
  console.log(`Incoming ${req.method} request to ${req.url}`);
  next();
});

// Secret key for signing tokens (securely store in environment variables)
const JWT_SECRET = '4a03156cab8474b5c16b6bf8275e506c9ee32d2db529146f60c99025d9c757b4'; // Replace with your actual secret key

// Login endpoint
app.post('/api/login', async (req, res) => {
  console.log('Login request received:', req.body);
  const { identifier, password } = req.body;

  try {
    const user = await User.findOne({
      $or: [
        { email: identifier },
        { phoneNumber: identifier },
        { username: identifier }
      ]
    });

    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
        const token = jwt.sign(
          { userId: user.userId, username: user.username },
          JWT_SECRET,
          { expiresIn: '1h' }
        );

        // Send user info and token, including profilePicture
        res.json({
          user: {
            ...user.toObject(), // Convert Mongoose document to a plain object
            password: undefined // Ensure password is not included in the response
          },
          token,
          message: 'Login successful!'
        
        });
        //console.log(user);
      } else {
        console.warn("Invalid login attempt for:", identifier);
        res.status(401).json({ message: 'Invalid credentials' });
      }
    } else {
      console.warn("Invalid login attempt for:", identifier);
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
});


// Registration endpoint with checks for existing user
app.post('/api/register', async (req, res) => {
  console.log('Registration request received:', req.body);
  const { name, username, email, phoneNumber, password, profilePicture } = req.body;

  try {
    // Check if email, username, or phone number already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email },
        { username: username },
        { phoneNumber: phoneNumber }
      ]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email/username/phone number already exists' });
    }

    const userId = new mongoose.Types.ObjectId();
    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password

    const newUser = new User({
      name,
      username,
      email,
      phoneNumber,
      password: hashedPassword, // Save the hashed password
      profilePicture,
      userId
    });

    await newUser.save();

    const token = jwt.sign(
      { userId: newUser.userId, username: newUser.username },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      user: newUser,
      token,
      message: 'User registered successfully!'
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
});


app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
