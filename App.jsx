import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:3000';

function App() {
  const [page, setPage] = useState('login'); // login, dashboard
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '' });
  const [editUserId, setEditUserId] = useState(null);
  const [editPassword, setEditPassword] = useState('');
  const [message, setMessage] = useState('');

  // تسجيل دخول
  async function handleLogin(e) {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPage('dashboard');
        loadUsers();
        loadRequests();
      } else {
        setLoginError(data.message || 'خطأ في تسجيل الدخول');
      }
    } catch {
      setLoginError('خطأ في الاتصال بالخادم');
    }
  }

  // تحميل المستخدمين
  async function loadUsers() {
    try {
      const res = await fetch(`${API_URL}/admin/users`);
      const data = await res.json();
      setUsers(data);
    } catch {
      setMessage('فشل في تحميل المستخدمين');
    }
  }

  // تحميل الطلبات
  async function loadRequests() {
    try {
      const res = await fetch(`${API_URL}/admin/requests`);
      const data = await res.json();
      setRequests(data);
    } catch {
      setMessage('فشل في تحميل الطلبات');
    }
  }

  // إضافة مستخدم جديد
  async function addUser(e) {
    e.preventDefault();
    if (!newUser.username || !newUser.password) {
      setMessage('يرجى ملء جميع الحقول');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`تم إضافة المستخدم ${data.username}`);
        setNewUser({ username: '', password: '' });
        loadUsers();
      } else {
        setMessage(data.error);
      }
    } catch {
      setMessage('خطأ في الاتصال بالخادم');
    }
  }

  // تعديل كلمة مرور مستخدم
  async function updateUserPassword(e) {
    e.preventDefault();
    if (!editPassword || !editUserId) return;
    try {
      const res = await fetch(`${API_URL}/admin/users/${editUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: editPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('تم تحديث كلمة المرور');
        setEditPassword('');
        setEditUserId(null);
        loadUsers();
      } else {
        setMessage(data.error);
      }
    } catch {
      setMessage('خطأ في الاتصال بالخادم');
    }
  }

  // تحديث حالة طلب
  async function updateRequestStatus(id, status) {
    try {
      const res = await fetch(`${API_URL}/admin/requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        setMessage('فشل في تحديث حالة الطلب');
      } else {
        loadRequests();
      }
    } catch {
      setMessage('خطأ في الاتصال بالخادم');
    }
  }

  // تسجيل خروج
  function logout() {
    setPage('login');
    setLoginData({ username: '', password: '' });
    setLoginError('');
    setUsers([]);
    setRequests([]);
    setMessage('');
  }

  if (page === 'login') {
    return (
      <div style={{ maxWidth: 400, margin: 'auto', padding: 20 }}>
        <h2>تسجيل دخول الموظفين</h2>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="اسم المستخدم"
            value={loginData.username}
            onChange={e => setLoginData({ ...loginData, username: e.target.value })}
            required
            style={{ width: '100%', marginBottom: 10, padding: 8 }}
          />
          <input
            type="password"
            placeholder="كلمة المرور"
            value={loginData.password}
            onChange={e => setLoginData({ ...loginData, password: e.target.value })}
            required
            style={{ width: '100%', marginBottom: 10, padding: 8 }}
          />
          <button type="submit" style={{ width: '100%', padding: 10 }}>
            تسجيل الدخول
          </button>
        </form>
        {loginError && <p style={{ color: 'red' }}>{loginError}</p>}
      </div>
    );
  }

  // صفحة لوحة التحكم
  return (
    <div style={{ maxWidth: 900, margin: 'auto', padding: 20 }}>
      <button
        onClick={logout}
        style={{
          backgroundColor: '#e74c3c',
          color: 'white',
          padding: '10px 15px',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          marginBottom: 20,
        }}
      >
        تسجيل الخروج
      </button>

      <h2>إدارة المستخدمين</h2>
      <form onSubmit={addUser} style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="اسم المستخدم"
          value={newUser.username}
          onChange={e => setNewUser({ ...newUser, username: e.target.value })}
          required
          style={{ marginRight: 10, padding: 8 }}
        />
        <input
          type="password"
          placeholder="كلمة المرور"
          value={newUser.password}
          onChange={e => setNewUser({ ...newUser, password: e.target.value })}
          required
          style={{ marginRight: 10, padding: 8 }}
        />
        <button type="submit" style={{ padding: 10 }}>
          إضافة مستخدم
        </button>
      </form>

      <ul>
        {users.map(user => (
          <li key={user.id} style={{ marginBottom: 10 }}>
            {user.username}
            <button
              style={{ marginLeft: 10 }}
              onClick={() => {
                setEditUserId(user.id);
                setEditPassword('');
                setMessage('');
              }}
            >
              تعديل كلمة المرور
            </button>
          </li>
        ))}
      </ul>

      {editUserId && (
        <form onSubmit={updateUserPassword} style={{ marginTop: 20 }}>
          <input
            type="password"
            placeholder="كلمة المرور الجديدة"
            value={editPassword}
            onChange={e => setEditPassword(e.target.value)}
            required
            style={{ padding: 8, marginRight: 10 }}
          />
          <button type="submit" style={{ padding: 10 }}>
            حفظ التعديل
          </button>
          <button
            type="button"
            onClick={() => {
              setEditUserId(null);
              setEditPassword('');
              setMessage('');
            }}
            style={{ padding: 10, marginLeft: 10 }}
          >
            إلغاء
          </button>
        </form>
      )}

      <h2 style={{ marginTop: 40 }}>إدارة الطلبات</h2>
      {message && <p style={{ color: 'red' }}>{message}</p>}
      <table border="1" width="100%" cellPadding="8" style={{ borderCollapse: 'collapse' }}>
        <thead style={{ backgroundColor: '#3498db', color: 'white' }}>
          <tr>
            <th>رقم الطلب</th>
            <th>الاسم الكامل</th>
            <th>نوع الطلب</th>
            <th>التفاصيل</th>
            <th>الحالة</th>
            <th>تغيير الحالة</th>
          </tr>
        </thead>
        <tbody>
          {requests.map(req => (
            <tr key={req.id}>
              <td>{req.id}</td>
              <td>{req.fullName}</td>
              <td>{req.requestType}</td>
              <td>{req.details}</td>
              <td>{req.status}</td>
              <td>
                <select
                  value={req.status}
                  onChange={e => updateRequestStatus(req.id, e.target.value)}
                >
                  <option value="قيد الانتظار">قيد الانتظار</option>
                  <option value="قيد التنفيذ">قيد التنفيذ</option>
                  <option value="منجز">منجز</option>
                  <option value="مرفوض">مرفوض</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
