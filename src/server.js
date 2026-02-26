import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

if (!CLERK_SECRET_KEY) {
  console.error('CLERK_SECRET_KEY is missing in .env');
}

app.get('/api/users', async (req, res) => {
  const { role } = req.query;
  console.log(`Fetching users for role: ${role}`);
  try {
    const response = await fetch('https://api.clerk.com/v1/users', {
      headers: {
        'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Clerk API error: ${response.status} ${err}`);
    }

    const data = await response.json();

    // Some endpoints or SDKs might return { data: [...] }, but v1/users usually returns an array.
    // However, let's be safe.
    const users = Array.isArray(data) ? data : (data.data || []);

    console.log(`Total users fetched: ${users.length}`);

    // Filter by role in public_metadata (case-insensitive check for robustness)
    const filtered = users.filter(user => {
      const userRole = user.public_metadata?.role;
      if (!userRole || !role) return false;
      return String(userRole).toLowerCase() === String(role).toLowerCase();
    });

    console.log(`Filtered users: ${filtered.length}`);
    if (filtered.length === 0 && users.length > 0) {
        console.log("Example metadata from first user:", users[0].public_metadata);
    }

    res.json(filtered.map(u => ({
      id: u.id,
      name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || (u.email_addresses && u.email_addresses[0]?.email_address) || 'Unknown User',
      role: u.public_metadata?.role
    })));
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/init-user-role', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  try {
    const getResponse = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${CLERK_SECRET_KEY}`
      }
    });

    if (!getResponse.ok) {
        const err = await getResponse.text();
        throw new Error(`Clerk API error (get): ${getResponse.status} ${err}`);
    }

    const user = await getResponse.json();

    if (!user.public_metadata?.role) {
      console.log(`Initializing role for user ${userId}`);
      const updateResponse = await fetch(`https://api.clerk.com/v1/users/${userId}/metadata`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          public_metadata: {
            role: 'colaborador'
          }
        })
      });

      if (!updateResponse.ok) {
          const err = await updateResponse.text();
          throw new Error(`Clerk API error (patch): ${updateResponse.status} ${err}`);
      }

      const updatedUser = await updateResponse.json();
      return res.json(updatedUser);
    }

    res.json(user);
  } catch (error) {
    console.error('Error initializing user role:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend proxy running on http://localhost:${PORT}`);
});
