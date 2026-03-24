import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, Camera, LogOut, User as UserIcon, 
  Menu, X, Bell, Check, X as CloseIcon 
} from 'lucide-react';
import API from '../services/api';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [invitations, setInvitations] = useState([]);
  
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  // טעינת הזמנות ממתינות בטעינת הקומפוננטה
  useEffect(() => {
    if (user) {
      fetchInvitations();
    }
  }, []);

  const fetchInvitations = async () => {
    try {
      // אנחנו קוראים ל-compare כי ה-Backend מחזיר שם גם את ה-pendingInvitations
      const { data } = await API.get('/cart/compare');
      setInvitations(data.pendingInvitations || []);
    } catch (err) {
      console.error("שגיאה בטעינת הזמנות");
    }
  };

  const handleAccept = async (listId) => {
    try {
      await API.post('/cart/accept', { listId });
      setShowNotifications(false);
      fetchInvitations();
      window.location.reload(); // רענון כדי לטעון את הרשימה החדשה בכל האפליקציה
    } catch (err) {
      alert("אישור ההזמנה נכשל");
    }
  };

  const handleDecline = async (listId) => {
    try {
      await API.post('/cart/decline', { listId });
      fetchInvitations();
    } catch (err) {
      alert("דחיית ההזמנה נכשלה");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navLinks = [
    { to: "/", label: "הסל שלי", icon: <ShoppingCart size={18} /> },
    { to: "/scan", label: "סריקת קבלה", icon: <Camera size={18} /> },
  ];

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm" dir="rtl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* צד ימין: לוגו וניווט */}
        <div className="flex items-center gap-6">
          <Link to="/" className="text-2xl font-black text-blue-600 tracking-tighter flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-md">
              <ShoppingCart className="text-white" size={20} />
            </div>
            <span className="hidden sm:inline">SmartCart</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink 
                key={link.to}
                to={link.to} 
                className={({ isActive }) => 
                  `px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`
                }
              >
                {link.icon} {link.label}
              </NavLink>
            ))}
          </div>
        </div>

        {/* צד שמאל: התראות, משתמש ותפריט המבורגר */}
        <div className="flex items-center gap-2 md:gap-4">
          
          {/* כפתור התראות (פעמון) */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 rounded-xl transition-all relative ${invitations.length > 0 ? 'text-orange-500 bg-orange-50' : 'text-gray-400 hover:bg-gray-50'}`}
            >
              <Bell size={22} className={invitations.length > 0 ? "animate-pulse" : ""} />
              {invitations.length > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                  {invitations.length}
                </span>
              )}
            </button>

            {/* דרופדאון התראות */}
            {showNotifications && (
              <div className="absolute left-0 mt-3 w-72 bg-white border border-gray-100 shadow-2xl rounded-2xl z-50 p-4 animate-in fade-in slide-in-from-top-2">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">הזמנות לשיתוף</h4>
                
                {invitations.length > 0 ? (
                  <div className="space-y-4">
                    {invitations.map((inv) => (
                      <div key={inv.listId} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <p className="text-xs text-gray-600 mb-2">
                          <span className="font-bold text-gray-800">{inv.senderName}</span> הזמין אותך לערוך רשימה משותפת
                        </p>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleAccept(inv.listId)}
                            className="flex-1 bg-blue-600 text-white text-[11px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 hover:bg-blue-700"
                          >
                            <Check size={14} /> אשר
                          </button>
                          <button 
                            onClick={() => handleDecline(inv.listId)}
                            className="flex-1 bg-white text-gray-500 border border-gray-200 text-[11px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 hover:bg-gray-50"
                          >
                            <CloseIcon size={14} /> דחה
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-sm text-gray-400 py-4">אין התראות חדשות</p>
                )}
              </div>
            )}
          </div>

          {/* פרטי משתמש */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100">
            <UserIcon size={14} className="text-gray-400" />
            <span className="text-sm font-bold text-gray-700">{user?.name}</span>
          </div>
          
          <button 
            onClick={handleLogout}
            className="hidden sm:block p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut size={20} />
          </button>

          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* תפריט מובייל */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-50 p-4 space-y-2">
          {navLinks.map((link) => (
            <NavLink 
              key={link.to} to={link.to} 
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => 
                `w-full px-4 py-4 rounded-2xl font-bold transition-all flex items-center gap-3 ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-50 text-gray-600'}`
              }
            >
              {link.icon} {link.label}
            </NavLink>
          ))}
          <button 
            onClick={handleLogout}
            className="w-full px-4 py-4 rounded-2xl font-bold bg-red-50 text-red-500 flex items-center gap-3 mt-4"
          >
            <LogOut size={18} /> התנתקות
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;