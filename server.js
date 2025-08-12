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

// بيانات موظفين مؤقتة (username و password)
const users = [
  { username: 'admin', password: 'admin123' },
  { username: 'user1', password: 'password1' }
];

// تسجيل الدخول
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    // ترجع بيانات مبسطة (في نظام حقيقي تستخدم JWT أو جلسات)
    res.json({ success: true, username: user.username });
  } else {
    res.status(401).json({ success: false, message: 'اسم المستخدم أو كلمة المرور خاطئة' });
  }
});

// إضافة طلب جديد (نفس السابق)
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

// متابعة حالة طلب
app.get('/requests/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM requests WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'لم يتم العثور على الطلب' });
    res.json(row);
  });
});

// عرض جميع الطلبات (محمي بتسجيل الدخول)
app.get('/admin/requests', (req, res) => {
  // في نظام حقيقي: تحقق من توكن أو جلسة هنا
  db.all('SELECT * FROM requests ORDER BY id DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// تحديث حالة طلب (مثلاً من قيد الانتظار إلى منجز)
app.put('/admin/requests/:id', (req, res) => {
  const id = req.params.id;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'حالة الطلب مطلوبة' });

  const stmt = db.prepare('UPDATE requests SET status = ? WHERE id = ?');
  stmt.run(status, id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'لم يتم العثور على الطلب' });
    res.json({ success: true });
  });
  stmt.finalize();
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
