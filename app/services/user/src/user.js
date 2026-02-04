const express = require('express');
const { initVault } = require('./vault');

const app = express();
const PORT = process.env.SERVICE_PORT || 3002;

app.use(express.json());

// Get profile
app.get('/profile/:id', async (req, res) => {
  const userId = req.params.id;
  try {

    const query = `
        SELECT p.display_name as name, p.bio, p.avatar_url, p.balance, a.email
        FROM users.profiles p
        JOIN auth.credentials a ON p.user_id = a.id
        WHERE p.user_id = $1
     `;

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function bootstrap()
{
  await initVault();

  app.listen(PORT, () => {
    console.log(`✅ User service running on port ${PORT}`);
  });
}

bootstrap();