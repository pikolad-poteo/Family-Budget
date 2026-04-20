const pool = require('./db');

async function checkDatabase(req, res, next) {
  try {
    await pool.query('SELECT 1');
    next();
  } catch (error) {
    console.error('Database connection error:', error.message);

    return res.status(500).send(`
      <h1>Database connection error</h1>
      <p>My-Budget cannot connect to MySQL right now.</p>
      <p>Please check your .env configuration and database status.</p>
    `);
  }
}

module.exports = checkDatabase;