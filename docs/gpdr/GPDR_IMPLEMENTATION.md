You can implement GDPR as **new endpoints in existing services**, or as a **separate microservice**. Given your current microservices layout in docker-compose.yml, a dedicated GDPR service is clean but not required.

## Recommended approach (fits your current setup)
Given `init-db.sh`, your DB schema is **single-schema** (`public`) with these tables:
- `public.users`
- `public.transactions`

**Add GDPR endpoints primarily to the user service** (or a lightweight `gdpr_service`):
- **User service**: identity + profile data + data export
- **Transition service**: transaction history (or reuse user service DB access)

Then **aggregate** data for export using a new **GDPR endpoint** in the user service or a lightweight new “gdpr_service”.

## What to implement

### 1) Data request & export
Create a GDPR export endpoint that:
- Fetches data from:
  - user: `public.users`
  - transition: `public.transactions`
- Returns a readable format (JSON + CSV/HTML).
- Uses existing service endpoints like `/profile/:id`, plus new endpoints in each service.

### 2) Data deletion with confirmation
- Step 1: user requests deletion → store a pending deletion token (DB or Vault).
- Step 2: user confirms via token → delete user data in each service.
- Make deletion cascade using `public.users` and `public.transactions` from `init-db.sh`.

### 3) Confirmation emails
- Add email sending in **auth service** (user identity is already there).
- Send emails on:
  - Export requested
  - Export completed
  - Deletion requested
  - Deletion confirmed
- For now, a stub mailer is fine, but a real SMTP client is required for production.

## Should it be a different service?
**Optional.**
If you want clear separation and auditability, create a dedicated **gdpr_service** that orchestrates:
- Calls other services’ endpoints.
- Sends confirmation emails.
- Logs requests.

Otherwise, keep it in **user_service** and have it call other services internally.

---

If you want, I can outline the minimal endpoint list and where to place them (with exact file links).






## Implementation Order:
1. Add GDPR endpoints to user service (export, delete request, confirm deletion).
2. Build frontend UI for those endpoints.
3. Add email confirmation pipeline.
4. Polish frontend.



1. Add GDPR endpoints

Here's a minimal GDPR endpoint checklist to add to user.js:

````javascript
const express = require('express');
const { initVault } = require('./vault');

const app = express();
const PORT = process.env.SERVICE_PORT || 3002;

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'user',
    timestamp: new Date().toISOString()
  });
});

// Get profile
app.get('/profile/:id', async (req, res) => {
  const userId = req.params.id;
  try {
    const query = `
        SELECT name, email, balance
        FROM public.users
        WHERE id = $1
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

// GDPR: Request data export
app.post('/gdpr/export-request/:id', async (req, res) => {
  const userId = req.params.id;
  try {
    // TODO: Create export request record in DB
    // TODO: Send confirmation email
    res.json({ message: 'Export request received. Check your email.', requestId: 'uuid' });
  } catch (error) {
    console.error('Error requesting export:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GDPR: Get exported user data (all data in readable format)
app.get('/gdpr/export/:id', async (req, res) => {
  const userId = req.params.id;
  try {
    // TODO: Fetch from all services (profile, transactions, etc.)
    // TODO: Format as JSON/CSV
    res.json({
      profile: {},
      transactions: [],
      exportedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GDPR: Request deletion with confirmation token
app.post('/gdpr/delete-request/:id', async (req, res) => {
  const userId = req.params.id;
  try {
    // TODO: Generate deletion token, store with TTL (24-48h)
    // TODO: Send confirmation email with token
    res.json({ message: 'Deletion request received. Confirm via email link.' });
  } catch (error) {
    console.error('Error requesting deletion:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GDPR: Confirm deletion with token
app.post('/gdpr/delete-confirm/:id', async (req, res) => {
  const { token } = req.body;
  const userId = req.params.id;
  try {
    // TODO: Validate token + TTL
    // TODO: Delete user data from all services (cascade)
    // TODO: Send confirmation email
    res.json({ message: 'User data deleted successfully.' });
  } catch (error) {
    console.error('Error confirming deletion:', error);
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
````

**Next steps:**
1. Implement DB schema for `gdpr_requests` table (stores export/delete requests + tokens).
2. Add email confirmation logic (stub mailer for now).
3. Implement data aggregation from other services.

Want the DB schema for `gdpr_requests`?
