process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gmail.com';

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { run, get } = require('../db/database');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

// ── LOGIN ─────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role)
      return res.status(400).json({ error: 'Email, password and role required' });

    const user = await get(
      'SELECT * FROM users WHERE email = ? AND role = ? AND is_active = 1',
      [email, role]
    );

    if (!user)
      return res.status(401).json({ error: 'Invalid credentials' });

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid)
      return res.status(401).json({ error: 'Invalid credentials' });

    // ── Client: must be approved ──────────────────────────────────────────
    if (user.role === 'client' && !user.is_approved) {
      return res.status(403).json({
        error: 'Your account is pending admin approval. Please wait for confirmation.'
      });
    }

    // ── All roles: direct login (no OTP) ─────────────────────────────────
    const now = new Date().toISOString();
    const logResult = await run(
      'INSERT INTO logs (user_id, login_time) VALUES (?, ?)',
      [user.id, now]
    );

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, logId: logResult.lastInsertRowid },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// ── LOGOUT ────────────────────────────────────────────────────────────────
router.post('/logout', authenticate, async (req, res) => {
  try {
    const { logId } = req.user;
    if (logId) {
      const log = await get('SELECT login_time FROM logs WHERE id = ?', [logId]);
      if (log) {
        const now = new Date();
        const loginTime = new Date(log.login_time);
        const durationHours = ((now - loginTime) / 3600000).toFixed(4);
        await run(
          'UPDATE logs SET logout_time = ?, work_duration = ? WHERE id = ?',
          [now.toISOString(), durationHours, logId]
        );
      }
    }
    return res.json({ message: 'Logged out successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── GET CURRENT USER ──────────────────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await get(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
