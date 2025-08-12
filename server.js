const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

const db = new sqlite3.Database('./municipality.db', err => {
  if (err) console.error(err.message);
  else console.log('Connected to SQLite DB.');
});

// إنشاء الجداول
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullName TEXT NOT NULL,
    requestType TEXT NOT NULL,
    details TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'قيد الانتظار'
  )`);
});

// تسجيل مستخدم جديد
app.post('/admin/users', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'اسم المستخدم وكلمة المرور مطلوبان' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
    stmt.run(username, hashedPassword, function (err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(409).json({ error: 'اسم المستخدم موجود مسبقًا' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: this.lastID, username });
    });
    stmt.finalize();
  } catch {
    res.status(500).json({ error: 'خطأ في معالجة كلمة المرور' });
  }
});

// جلب كل المستخدمين
app.get('/admin/users', (req, res) => {
  db.all('SELECT id, username FROM users', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// تعديل كلمة مرور مستخدم
app.put('/admin/users/:id', async (req, res) => {
  const id = req.params.id;
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'كلمة المرور مطلوبة' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare('UPDATE users SET password = ? WHERE id = ?');
    stmt.run(hashedPassword, id, function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'المستخدم غير موجود' });
      res.json({ success: true });
    });
    stmt.finalize();
  } catch {
    res.status(500).json({ error: 'خطأ في معالجة كلمة المرور' });
  }
});

// تسجيل الدخول
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'يرجى إدخال اسم المستخدم وكلمة المرور' });

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row)
      return res.status(401).json({ success: false, message: 'اسم المستخدم أو كلمة المرور خاطئة' });

    const match = await bcrypt.compare(password, row.password);
    if (match) {
      // في نظام حقيقي: اعتمد JWT أو جلسات
      res.json({ success: true, username: row.username });
    } else {
      res.status(401).json({ success: false, message: 'اسم المستخدم أو كلمة المرور خاطئة' });
    }
  });
});

// إضافة طلب جديد
app.post('/requests', (req, res) => {
  const { fullName, requestType, details } = req.body;
  if (!fullName || !requestType || !details) {
    return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
  }
  const stmt = db.prepare('INSERT INTO requests (fullName, requestType, details) VALUES (?, ?, ?)');
  stmt.run(fullName, requestType, details, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
  stmt.finalize();
});

// جلب طلب حسب ID
app.get('/requests/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM requests WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'لم يتم العثور على الطلب' });
    res.json(row);
  });
});

// جلب كل الطلبات
app.get('/admin/requests', (req, res) => {
  db.all('SELECT * FROM requests ORDER BY id DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// تحديث حالة طلب
app.put('/admin/requests/:id', (req, res) => {
  const id = req.params.id;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'حالة الطلب مطلوبة' });

  const stmt = db.prepare('UPDATE requests SET status = ? WHERE id = ?');
  stmt.run(status, id, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'لم يتم العثور على الطلب' });
    res.json({ success: true });
  });
  stmt.finalize();
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
