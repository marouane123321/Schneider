const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

const db = new sqlite3.Database('./requests.db', (err) => {
  if (err) console.error(err.message);
  else console.log('Connected to SQLite database.');
});

db.run(`CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fullName TEXT NOT NULL,
  requestType TEXT NOT NULL,
  details TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'قيد الانتظار'
)`);

app.post('/requests', (req, res) => {
  const { fullName, requestType, details } = req.body;
  if (!fullName || !requestType || !details) {
    return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
  }
  const stmt = db.prepare('INSERT INTO requests (fullName, requestType, details) VALUES (?, ?, ?)');
  stmt.run(fullName, requestType, details, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
  stmt.finalize();
});

app.get('/requests/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM requests WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'لم يتم العثور على الطلب' });
    res.json(row);
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
