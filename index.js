const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// قاعدة بيانات مؤقتة (في الذاكرة فقط)
let requests = [];
let idCounter = 1;

// نقطة استقبال الطلبات
app.post('/requests', (req, res) => {
  const { fullName, requestType, details } = req.body;

  if (!fullName || !requestType || !details) {
    return res.status(400).json({ error: 'يرجى تعبئة جميع الحقول المطلوبة' });
  }

  const newRequest = {
    id: idCounter++,
    fullName,
    requestType,
    details,
    createdAt: new Date(),
  };

  requests.push(newRequest);

  res.json({ id: newRequest.id, message: 'تم تسجيل الطلب بنجاح' });
});

// اختبار السيرفر شغال
app.get('/', (req, res) => {
  res.send('Server is running...');
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
