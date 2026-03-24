import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { 
  Search, Plus, ShoppingBasket, Trash2, Loader2, 
  AlertCircle, ChevronDown, ChevronUp, Store, UserPlus, Send, X, User as UserIcon 
} from 'lucide-react';

const CartManager = ({ onCartUpdate }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [fullComparisonData, setFullComparisonData] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedProductId, setExpandedProductId] = useState(null);
  
  const [showShare, setShowShare] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [isSharing, setIsSharing] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchCart();
  }, []);

  // --- לוגיקת חיפוש מוצרים בזמן אמת ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim().length > 1) {
        searchProducts();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const searchProducts = async () => {
    setIsSearching(true);
    try {
      // הנתיב שמחפש מוצרים ב-DB
      const { data } = await API.get(`/products?search=${searchTerm}`);
      setSearchResults(data);
    } catch (err) {
      console.error("שגיאה בחיפוש מוצרים");
    } finally {
      setIsSearching(false);
    }
  };

  const fetchCart = async () => {
    try {
      const { data } = await API.get('/cart/compare');
      const comparisonArray = data.comparison || [];
      setFullComparisonData(comparisonArray);
      
      if (comparisonArray.length > 0) {
        setCartItems(comparisonArray[0].items);
      } else {
        setCartItems([]);
      }
    } catch (err) {
      console.error("שגיאה בטעינת הסל");
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!shareEmail) return;
    setIsSharing(true);
    try {
      const { data } = await API.post('/cart/invite', { email: shareEmail });
      alert(data.message);
      setShareEmail("");
      setShowShare(false);
      fetchCart();
    } catch (err) {
      alert(err.response?.data?.message || "שגיאה בשליחת הזמנה");
    } finally {
      setIsSharing(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("האם אתה בטוח שברצונך להסיר את השותף?")) return;
    try {
      await API.delete(`/cart/members/${memberId}`);
      fetchCart();
      if (onCartUpdate) onCartUpdate();
    } catch (err) {
      alert("שגיאה בהסרת שותף");
    }
  };

  const handleAddAction = async (productId, name = null) => {
    try {
      await API.post('/cart/add', { productId: productId || null, name: name || null, quantity: 1 });
      setSearchTerm("");
      setSearchResults([]);
      await fetchCart();
      if (onCartUpdate) onCartUpdate();
    } catch (err) { alert("שגיאה בהוספה"); }
  };

  const handleRemove = async (productId) => {
    try {
      await API.delete(`/cart/remove/${productId}`);
      await fetchCart();
      if (onCartUpdate) onCartUpdate();
    } catch (err) { alert("מחיקה נכשלה"); }
  };

  const getProductPriceInBranch = (branchId, productId) => {
    const branch = fullComparisonData.find(b => b.branchId === branchId);
    return branch ? branch.items.find(i => i.productId === productId) : null;
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-3xl shadow-lg border border-gray-100" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
          <ShoppingBasket className="text-blue-600" /> רשימת הקניות שלי
        </h2>
        <button 
          onClick={() => setShowShare(!showShare)}
          className={`p-2 px-4 rounded-xl transition-all flex items-center gap-2 font-bold text-sm ${
            showShare ? 'bg-blue-600 text-white shadow-md' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
          }`}
        >
          <UserPlus size={18} />
          <span>שותפים</span>
        </button>
      </div>

      {/* חלונית ניהול שותפים */}
      {showShare && (
        <div className="mb-8 p-5 bg-blue-50 rounded-3xl border border-blue-100 animate-in fade-in slide-in-from-top-2">
          <form onSubmit={handleInvite} className="mb-6">
            <label className="block text-xs font-bold text-blue-800 mb-2 mr-1">הזמן שותף חדש (לפי שם משתמש):</label>
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="הכנס שם משתמש"
                className="flex-1 p-3 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                required
              />
              <button 
                type="submit"
                disabled={isSharing}
                className="bg-blue-600 text-white px-5 rounded-2xl hover:bg-blue-700 transition-colors shadow-md"
              >
                {isSharing ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              </button>
            </div>
          </form>

          {/* רשימת שותפים */}
          <div className="space-y-2">
            <p className="text-[11px] font-black text-blue-400 uppercase tracking-widest mb-3 mr-1">שותפים פעילים:</p>
            {fullComparisonData[0]?.members?.map((member) => (
              <div key={member._id} className="flex justify-between items-center bg-white/60 p-3 rounded-2xl border border-blue-50">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 text-blue-600 w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm">
                    {member.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{member.name}</p>
                    <p className="text-[10px] text-gray-400 leading-none">{member.email}</p>
                  </div>
                </div>
                {currentUser?.id !== member._id && (
                  <button onClick={() => handleRemoveMember(member._id)} className="p-2 text-gray-300 hover:text-red-500 rounded-xl">
                    <X size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* שורת חיפוש עם הצעות מה-DB */}
      <div className="relative mb-8">
        <div className="relative">
          <Search className="absolute right-4 top-3.5 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="חפש מוצר או הקלד מוצר חדש..."
            className="w-full pr-12 p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {isSearching && <Loader2 className="absolute left-4 top-4 animate-spin text-blue-500" size={20} />}
        </div>
        
        {searchTerm.trim().length > 1 && (
          <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 shadow-2xl rounded-2xl overflow-hidden">
            {/* הצגת תוצאות מה-Database */}
            {searchResults.map((p) => (
              <button 
                key={p._id} 
                onClick={() => handleAddAction(p._id)} 
                className="w-full text-right p-4 hover:bg-blue-50 flex justify-between items-center border-b border-gray-50 group"
              >
                <span className="font-bold text-gray-700 group-hover:text-blue-600">{p.name}</span>
                <Plus size={18} className="text-blue-600" />
              </button>
            ))}

            {/* אופציה להוספת מוצר חדש אם הוא לא ב-DB */}
            <button 
              onClick={() => handleAddAction(null, searchTerm)} 
              className="w-full text-right p-4 bg-blue-600 text-white hover:bg-blue-700 flex justify-between items-center"
            >
              <div>
                <p className="text-[10px] opacity-80 uppercase tracking-wider text-white/80">לא מצאת? הוסף כחדש:</p>
                <span className="font-bold">"{searchTerm}"</span>
              </div>
              <Plus size={20} />
            </button>
          </div>
        )}
      </div>

      {/* רשימת הפריטים בסל */}
      <div className="space-y-4">
        {cartItems.length > 0 ? (
          cartItems.map((item) => (
            <div key={item.productId} className={`rounded-3xl border transition-all ${expandedProductId === item.productId ? 'border-blue-200 bg-blue-50/20 shadow-sm' : 'border-gray-100 bg-gray-50 group'}`}>
              <div className="flex justify-between items-center p-4 cursor-pointer" onClick={() => setExpandedProductId(expandedProductId === item.productId ? null : item.productId)}>
                <div className="flex items-center gap-4">
                  <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md">{item.quantity}</div>
                  <div><p className="font-bold text-gray-800">{item.name}</p><p className="text-[10px] text-gray-400">לחץ לצפייה במחירים</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={(e) => { e.stopPropagation(); handleRemove(item.productId); }} className="text-gray-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-xl"><Trash2 size={18} /></button>
                  {expandedProductId === item.productId ? <ChevronUp size={20} className="text-blue-500" /> : <ChevronDown size={20} className="text-gray-300" />}
                </div>
              </div>
              {expandedProductId === item.productId && (
                <div className="px-4 pb-5 pt-2 space-y-2">
                  <div className="h-px bg-blue-100/50 mb-3 mx-2" />
                  {fullComparisonData.map((branch) => {
                    const pInfo = getProductPriceInBranch(branch.branchId, item.productId);
                    return (
                      <div key={branch.branchId} className="flex justify-between items-center bg-white p-3 rounded-2xl shadow-sm border border-blue-50/50">
                        <div><p className="text-xs font-bold text-gray-700">{branch.chain}</p><p className="text-[10px] text-gray-400">{branch.branchName}</p></div>
                        <div className="text-left">{pInfo?.isMissing ? <span className="text-[10px] text-orange-400 font-medium">טרם נסרק</span> : <span className="text-sm font-black text-blue-700">{pInfo.pricePerUnit} ₪</span>}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-16">
            <ShoppingBasket className="text-gray-200 mx-auto mb-4" size={40} />
            <p className="text-gray-500 font-bold">הרשימה שלך ריקה</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartManager;