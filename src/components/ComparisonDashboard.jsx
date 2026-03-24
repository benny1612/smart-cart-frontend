import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { ShoppingCart, Store, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Info, Loader2 } from 'lucide-react';

const ComparisonDashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedBranch, setExpandedBranch] = useState(null);

  useEffect(() => {
    fetchComparison();
  }, []);

  const fetchComparison = async () => {
    try {
      // הקריאה לשרת מחזירה כעת { comparison, pendingInvitations }
      const response = await API.get('/cart/compare');
      const comparisonArray = response.data.comparison || [];
      
      // מיון הסניפים מהזול ליקר ביותר על בסיס המערך ששלפנו
      const sortedData = [...comparisonArray].sort((a, b) => 
        parseFloat(a.totalBasket) - parseFloat(b.totalBasket)
      );
      
      setData(sortedData);
    } catch (err) {
      console.error("שגיאה בטעינת השוואה", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <Loader2 className="animate-spin text-blue-600" size={40} />
      <p className="text-gray-500 font-medium font-sans">מנתח מחירים ומחשב את הסל המשתלם ביותר...</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6" dir="rtl">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-black text-gray-800 mb-2 flex justify-center gap-3">
          <ShoppingCart className="text-blue-600" size={40} /> השוואת סל קניות
        </h1>
        <p className="text-gray-500 text-lg">מצאנו את המחירים המעודכנים ביותר עבור {data.length} סניפים</p>
      </header>

      <div className="space-y-6">
        {data.length === 0 ? (
          <div className="text-center bg-gray-50 p-10 rounded-3xl border border-dashed border-gray-200">
            <Info className="mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">הסל שלך ריק או שאין מספיק נתונים להשוואה כרגע.</p>
          </div>
        ) : (
          data.map((branch, index) => (
            <div 
              key={branch.branchId}
              className={`bg-white rounded-3xl shadow-sm border-2 transition-all overflow-hidden ${
                index === 0 && branch.missingCount === 0 
                  ? 'border-green-500 ring-4 ring-green-50' 
                  : 'border-gray-100 hover:border-blue-200'
              }`}
            >
              {/* שורת סיכום הסניף */}
              <div 
                className="p-6 cursor-pointer flex flex-wrap items-center justify-between gap-4"
                onClick={() => setExpandedBranch(expandedBranch === branch.branchId ? null : branch.branchId)}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${index === 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                    <Store size={28} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-xl text-gray-800">{branch.chain}</h3>
                      {index === 0 && branch.missingCount === 0 && (
                        <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase">
                          <CheckCircle2 size={12} /> הכי זול
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm">{branch.branchName}</p>
                    
                    {/* חיווי מוצרים חסרים */}
                    {branch.missingCount > 0 && (
                      <div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg text-[11px] mt-1 font-bold border border-orange-100 w-fit">
                        <AlertTriangle size={12} />
                        חסר מידע על {branch.missingCount} מוצרים
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-left">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">סה"כ לסל קיים</p>
                    <p className={`text-3xl font-black ${index === 0 && branch.missingCount === 0 ? 'text-green-600' : 'text-gray-800'}`}>
                      {branch.totalBasket} ₪
                    </p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-full text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                     {expandedBranch === branch.branchId ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>
              </div>

              {/* פירוט מוצרים מורחב */}
              {expandedBranch === branch.branchId && (
                <div className="px-6 pb-6 pt-2 border-t border-gray-50 bg-gray-50/30">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="text-gray-400 text-[11px] uppercase border-b border-gray-100">
                          <th className="py-3 font-bold">שם מוצר</th>
                          <th className="py-3 font-bold text-center">כמות</th>
                          <th className="py-3 font-bold text-left">מחיר יחידה</th>
                          <th className="py-3 font-bold text-left">סה"כ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {branch.items.map((item) => (
                          <tr key={item.productId} className={`group transition-colors ${item.isMissing ? "bg-red-50/40" : "hover:bg-white"}`}>
                            <td className="py-4">
                              <p className={`font-bold text-sm ${item.isMissing ? 'text-red-400' : 'text-gray-700'}`}>
                                {item.name}
                              </p>
                              {item.isMissing && (
                                <span className="flex items-center gap-1 text-[10px] text-red-500 font-medium">
                                  <AlertTriangle size={10} /> מוצר זה טרם נסרק בסניף זה
                                </span>
                              )}
                            </td>
                            <td className="py-4 text-center text-sm font-medium text-gray-500">{item.quantity}</td>
                            <td className="py-4 text-left text-sm font-mono text-gray-600">
                              {item.isMissing ? "---" : `${item.pricePerUnit} ₪`}
                            </td>
                            <td className="py-4 text-left font-bold text-sm text-gray-800">
                              {item.isMissing ? "0.00 ₪" : `${item.subtotal} ₪`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {branch.missingCount > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-2xl flex items-start gap-3">
                      <Info size={16} className="text-blue-500 mt-0.5" />
                      <p className="text-xs text-blue-700 leading-relaxed">
                        המחיר הכולל מחושב עבור המוצרים הקיימים במערכת בלבד. כדי לקבל השוואה מדויקת יותר, נסה לסרוק קבלה מסניף זה.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ComparisonDashboard;