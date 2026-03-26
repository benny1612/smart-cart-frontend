import React, { useState, useEffect } from 'react';
import { Sparkles, Camera, ShoppingCart, Users, BadgePercent, X, Zap } from 'lucide-react';

const WelcomeModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] max-w-lg w-full overflow-hidden shadow-2xl transform animate-in zoom-in-95 duration-300 border border-gray-100" dir="rtl">
        
        {/* כפתור סגירה */}
        <button onClick={handleClose} className="absolute top-6 left-6 text-gray-400 hover:text-gray-700 transition-colors z-10">
          <X size={28} />
        </button>

        {/* ראש המודאל - עוצמתי */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-10 text-white text-center relative">
          <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
            <Zap size={40} className="fill-yellow-400 text-yellow-400" />
          </div>
          <h2 className="text-3xl font-black mb-2 tracking-tight">ברוכים הבאים ל-SmartCart</h2>
          <p className="text-blue-100 font-medium">הקהילה שחוסכת לכם כסף בכל קנייה</p>
        </div>

        {/* תוכן ההסבר - ממוקד ב-2 הפיצ'רים */}
        <div className="p-8 space-y-8">
          
          {/* חלק 1: הסריקה והקהילה */}
          <div className="flex items-start gap-5">
            <div className="bg-blue-100 p-4 rounded-2xl text-blue-600 shrink-0 shadow-sm">
              <Camera size={28} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-xl mb-1">סורקים ועוזרים לכולם</h4>
              <p className="text-gray-600 leading-relaxed">
                מצלמים את הקבלה וה-AI שלנו מעדכן את המערכת. כל מחיר שאתם מעדכנים עוזר לכל המשתמשים לדעת כמה עולה כל מוצר באמת.
              </p>
            </div>
          </div>

          {/* חלק 2: הסל והשוואת המחירים */}
          <div className="flex items-start gap-5">
            <div className="bg-green-100 p-4 rounded-2xl text-green-600 shrink-0 shadow-sm">
              <ShoppingCart size={28} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-xl mb-1">הסל הכי זול עבורכם</h4>
              <p className="text-gray-600 leading-relaxed">
                צרו סל קניות (אפשר גם עם שותפים!). המערכת תבדוק ב-DB ותגיד לכם בדיוק איזה סניף הכי משתלם לכם היום.
              </p>
            </div>
          </div>

          {/* שיתופיות */}
          <div className="flex items-center gap-3 justify-center py-2 px-4 bg-gray-50 rounded-2xl text-gray-500 text-sm font-medium">
            <Users size={18} />
            <span>ניהול רשימות משותפות בזמן אמת</span>
          </div>
        </div>

        {/* כפתור סיום */}
        <div className="p-8 pt-0">
          <button 
            onClick={handleClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black text-xl shadow-xl shadow-blue-200 transition-all active:scale-95"
          >
            יאללה, בואו נחסוך!
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;