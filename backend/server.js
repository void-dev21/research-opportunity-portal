require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const { validateOpportunity } = require('./validate');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// ---- Frontend (static files) ----
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ---- Helpers ----
function parseId(raw) {
  return /^\d+$/.test(raw) ? Number(raw) : null;
}

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM opportunities WHERE id = ?', [id]);
  return rows[0] || null;
}

// ---- Routes ----

// 1. Create
app.post('/api/opportunities', async (req, res, next) => {
  try {
    const { errors, data } = validateOpportunity(req.body, false);
    if (errors.length) return res.status(400).json({ message: 'Validation failed', errors });

    const [result] = await pool.query('INSERT INTO opportunities SET ?', [data]);
    const created = await findById(result.insertId);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// 2. Retrieve all
app.get('/api/opportunities', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM opportunities ORDER BY id DESC');
    res.status(200).json(rows);
  } catch (err) {
    next(err);
  }
});

// 3. Retrieve one
app.get('/api/opportunities/:id', async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json({ message: 'ID must be a positive integer' });

    const row = await findById(id);
    if (!row) return res.status(404).json({ message: `Opportunity with id ${id} not found` });
    res.status(200).json(row);
  } catch (err) {
    next(err);
  }
});

// 4. Update
app.put('/api/opportunities/:id', async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json({ message: 'ID must be a positive integer' });

    const { errors, data } = validateOpportunity(req.body, true);
    if (errors.length) return res.status(400).json({ message: 'Validation failed', errors });

    const existing = await findById(id);
    if (!existing) return res.status(404).json({ message: `Opportunity with id ${id} not found` });

    await pool.query('UPDATE opportunities SET ? WHERE id = ?', [data, id]);
    res.status(200).json(await findById(id));
  } catch (err) {
    next(err);
  }
});

// 5. Delete
app.delete('/api/opportunities/:id', async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) return res.status(400).json({ message: 'ID must be a positive integer' });

    const [result] = await pool.query('DELETE FROM opportunities WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: `Opportunity with id ${id} not found` });
    }
    res.status(200).json({ message: `Opportunity ${id} deleted successfully` });
  } catch (err) {
    next(err);
  }
});

// ---- Error handling ----
app.use('/api', (req, res) => res.status(404).json({ message: 'Route not found' }));

// Malformed JSON bodies -> 400, everything else -> 500
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Malformed JSON in request body' });
  }
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
}

module.exports = app;
