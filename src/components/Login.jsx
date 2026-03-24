import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import { LogIn, Mail, Lock } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post('/auth/login', formData);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.message || "פרטים שגויים");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4" dir="rtl">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        <div className="text-center mb-8">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="text-green-600" size={32} />
          </div>
          <h2 className="text-3xl font-black text-gray-800">ברוכים הבאים</h2>
          <p className="text-gray-500">התחברו כדי לראות את סל הקניות שלכם</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute right-3 top-3 text-gray-400" size={20} />
            <input 
              type="text" placeholder="שם משתמש" required
              className="w-full pr-10 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div className="relative">
            <Lock className="absolute right-3 top-3 text-gray-400" size={20} />
            <input 
              type="password" placeholder="סיסמה" required
              className="w-full pr-10 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>
          <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-lg shadow-lg transition-all">
            כניסה למערכת
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          אין לך חשבון? <Link title="הרשמה" to="/register" className="text-green-600 font-bold">צור חשבון חדש</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;