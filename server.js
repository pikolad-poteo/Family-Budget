// Import core dependencies
require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const mysql = require('mysql2/promise');

// Create Express application instance
const app = express();

// Create MySQL connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'my_budget',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

// Temporary in-memory user storage
const users = [
  {
    id: 1,
    name: 'Test',
    email: 'admin@myshop.local',
    password: '123'
  }
];

// Define server port
const PORT = process.env.PORT || 3000;

// Configure template engine and views directory
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Register global middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'my-budget-secret-key',
    resave: false,
    saveUninitialized: false
  })
);

// Register shared template variables middleware
// Makes current user data available in all EJS templates
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// Middleware: database connection check
// Ensures that MySQL is available before handling application routes
app.use(async (req, res, next) => {
  try {
    await db.query('SELECT 1');
    next();
  } catch (error) {
    console.error('Database connection error:', error.message);

    res.status(500).send(`
      <h1>Database connection error</h1>
      <p>My-Budget cannot connect to MySQL right now.</p>
      <p>Please check your database settings and server status.</p>
    `);
  }
});

// Middleware: authentication guard
// Redirects guest users to the login page
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  next();
}

// Route: root page
// Redirects user depending on authentication state
app.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }

  res.redirect('/login');
});

// Route: dashboard page
// Renders the main dashboard interface for authenticated users
app.get('/dashboard', requireAuth, (req, res) => {
  res.render('dashboard/index', {
    title: 'Dashboard',
    activePage: 'dashboard'
  });
});

// Route: categories page
// Displays the categories management page for authenticated users
app.get('/categories', requireAuth, (req, res) => {
  res.render('categories/index', {
    title: 'Categories',
    activePage: 'categories'
  });
});

// Route: transactions page
// Displays the page with financial transactions for authenticated users
app.get('/transactions', requireAuth, (req, res) => {
  res.render('transactions/index', {
    title: 'Transactions',
    activePage: 'transactions'
  });
});

// Route: family page
// Displays the family members section for authenticated users
app.get('/family', requireAuth, (req, res) => {
  res.render('family/index', {
    title: 'Family',
    activePage: 'family'
  });
});

// Route: wishlist page
// Displays the wishlist page with planned purchases for authenticated users
app.get('/wishlist', requireAuth, (req, res) => {
  res.render('wishlist/index', {
    title: 'Wishlist',
    activePage: 'wishlist'
  });
});

// Route: calendar page
// Displays the calendar view for planning and events for authenticated users
app.get('/calendar', requireAuth, (req, res) => {
  res.render('calendar/index', {
    title: 'Calendar',
    activePage: 'calendar'
  });
});

// Route: login page
// Renders the user login form for guest users
app.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }

  res.render('login', {
    title: 'Login',
    activePage: 'login',
    errorMessage: '',
    successMessage: ''
  });
});

// Route: login form submission
// Checks user credentials and stores authenticated user in session
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render('login', {
      title: 'Login',
      activePage: 'login',
      errorMessage: 'Please enter both email and password.',
      successMessage: ''
    });
  }

  const user = users.find((item) => item.email === email);

  if (!user || user.password !== password) {
    return res.render('login', {
      title: 'Login',
      activePage: 'login',
      errorMessage: 'Invalid email or password.',
      successMessage: ''
    });
  }

  req.session.user = {
    id: user.id,
    name: user.name,
    email: user.email
  };

  res.redirect('/dashboard');
});

// Route: register page
// Renders the user registration form for guest users
app.get('/register', (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }

  res.render('register', {
    title: 'Register',
    activePage: 'register',
    errorMessage: '',
    successMessage: ''
  });
});

// Route: register form submission
// Validates input and stores a temporary user in memory
app.post('/register', (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (!name || !email || !password || !confirmPassword) {
    return res.render('register', {
      title: 'Register',
      activePage: 'register',
      errorMessage: 'Please fill in all fields.',
      successMessage: ''
    });
  }

  if (password !== confirmPassword) {
    return res.render('register', {
      title: 'Register',
      activePage: 'register',
      errorMessage: 'Passwords do not match.',
      successMessage: ''
    });
  }

  const existingUser = users.find((user) => user.email === email);

  if (existingUser) {
    return res.render('register', {
      title: 'Register',
      activePage: 'register',
      errorMessage: 'A user with this email already exists.',
      successMessage: ''
    });
  }

  users.push({
    id: users.length + 1,
    name,
    email,
    password
  });

  res.redirect('/login');
});

// Route: logout page
// Clears active user session and redirects to login page
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// Fallback route: page not found
// Handles requests to undefined routes
app.use((req, res) => {
  res.status(404).send('404 - Page not found');
});

// Start server and show local address in console
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});