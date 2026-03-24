import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import { UserPlus, Mail, Lock, User } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post('/auth/register', formData);
      localStorage.setItem('token', data.token); // שמירת הטוקן
      localStorage.setItem('user', JSON.stringify(data.user)); // שמירת פרטי המשתמש
      navigate('/'); // מעבר לדף הבית
    } catch (err) {
      alert(err.response?.data?.message || "שגיאה ברישום");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4" dir="rtl">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl">
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="text-blue-600" size={32} />
          </div>
          <h2 className="text-3xl font-black text-gray-800">יצירת חשבון</h2>
          <p className="text-gray-500">הצטרפו לחיסכון חכם בקניות</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute right-3 top-3 text-gray-400" size={20} />
            <input 
              type="text" placeholder="שם מלא" required
              className="w-full pr-10 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
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
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-lg shadow-lg transition-all">
            הירשם עכשיו
          </button>
        </form>
        
        <p className="text-center mt-6 text-gray-600">
          כבר יש לך חשבון? <Link title="התחברות" to="/login" className="text-blue-600 font-bold">התחבר כאן</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;