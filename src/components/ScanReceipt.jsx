import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import { Camera, Check, Loader2, Trash2, Plus, X, Image as ImageIcon, RotateCcw } from 'lucide-react';

const ScanReceipt = () => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  // States למצלמה
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [showFlash, setShowFlash] = useState(false); // <--- סטייט לאפקט הפלאש
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(mediaStream);
      setIsCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      }, 100);
    } catch (err) {
      alert("שגיאה בגישה למצלמה. וודא שאתה ב-HTTPS");
    }
  };

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach(track => track.stop());
    setStream(null);
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      // הפעלת אפקט הפלאש
      setShowFlash(true);
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        const capturedFile = new File([blob], "receipt.jpg", { type: "image/jpeg" });
        
        // השהייה קצרה כדי שהמשתמש יראה את הפלאש לפני שהמצלמה נסגרת
        setTimeout(() => {
          setFile(capturedFile);
          setShowFlash(false);
          stopCamera();
        }, 150);
      }, 'image/jpeg', 0.9);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('receipt', file);
      const { data } = await API.post('/receipts/scan', formData);
      setResult(data);
    } catch (err) {
      alert("סריקה נכשלה");
    } finally {
      setLoading(false);
    }
  };

  // פונקציות עזר לתוצאות
  const handleStoreChange = (field, value) => setResult({ ...result, [field]: value });
  const handleItemChange = (index, field, value) => {
    const newItems = [...result.items];
    newItems[index][field] = value;
    setResult({ ...result, items: newItems });
  };
  const removeItem = (index) => {
    const newItems = result.items.filter((_, i) => i !== index);
    setResult({ ...result, items: newItems });
  };
  const addItem = () => setResult({ ...result, items: [...result.items, { name: "", price: 0 }] });

  const handleConfirm = async () => {
    try {
      await API.post('/products/confirm-receipt', result);
      alert("הנתונים נשמרו בהצלחה!");
      setResult(null);
      setFile(null);
    } catch (err) {
      alert("שגיאה בשמירה");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 bg-white shadow-2xl rounded-3xl mt-4 sm:mt-10" dir="rtl">
      <style>{`
        @keyframes scan { 0% { top: 0%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
        .scanner-line { position: absolute; left: 0; width: 100%; height: 4px; background: #3b82f6; box-shadow: 0px 0px 15px 2px #3b82f6; z-index: 10; animation: scan 2s linear infinite; }
        .flash-effect { position: absolute; inset: 0; background: white; z-index: 50; animation: flash-out 0.2s ease-out forwards; }
        @keyframes flash-out { from { opacity: 1; } to { opacity: 0; } }
      `}</style>

      <h2 className="text-2xl sm:text-3xl font-extrabold mb-6 text-gray-800 flex items-center gap-3">
        <Camera className="text-blue-600" size={28} /> סריקת קבלה
      </h2>

      {!result ? (
        <div className="flex flex-col items-center p-4 sm:p-8 border-4 border-dashed border-blue-100 rounded-3xl bg-blue-50/30 min-h-[400px] justify-center">
          
          {/* מצב בחירה */}
          {!isCameraActive && !previewUrl && (
            <div className="grid grid-cols-2 gap-6 w-full max-w-sm">
              <div className="flex flex-col items-center gap-2">
                <button onClick={startCamera} className="bg-blue-600 p-6 rounded-2xl shadow-lg hover:bg-blue-700 text-white transition-all active:scale-95">
                   <Camera size={40} />
                </button>
                <span className="text-sm font-bold text-gray-600">פתח מצלמה</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <input type="file" id="gallery-upload" accept="image/*" onChange={(e) => setFile(e.target.files[0])} className="hidden" />
                <label htmlFor="gallery-upload" className="cursor-pointer bg-white p-6 rounded-2xl shadow-lg hover:bg-gray-50 text-blue-600 border-2 border-blue-100 transition-all active:scale-95">
                   <ImageIcon size={40} />
                </label>
                <span className="text-sm font-bold text-gray-600">מהגלריה</span>
              </div>
            </div>
          )}

          {/* מצלמה פעילה בתוך הדף */}
          {isCameraActive && (
            <div className="w-full max-w-sm flex flex-col items-center">
              <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl bg-black border-4 border-white">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                
                {/* אפקט הפלאש */}
                {showFlash && <div className="flash-effect"></div>}

                <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
                  <div className="bg-black/60 text-white text-[11px] p-2 rounded-lg text-center backdrop-blur-sm">
                    יישר את הקבלה למרכז המסגרת
                  </div>
                  <div className="flex-1 flex items-center justify-center p-6">
                    <div className="w-full h-full border-2 border-white/40 rounded-lg relative">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500"></div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button onClick={stopCamera} className="bg-gray-200 text-gray-700 p-4 rounded-full hover:bg-gray-300">
                  <X size={24} />
                </button>
                <button onClick={capturePhoto} className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 active:scale-90 transition-all border-4 border-blue-100">
                  <Camera size={32} />
                </button>
              </div>
            </div>
          )}

          {/* תצוגה מקדימה לפני סריקה */}
          {previewUrl && !isCameraActive && (
            <div className="w-full flex flex-col items-center">
              <div className="relative w-full max-w-sm aspect-[3/4] mb-6 rounded-2xl overflow-hidden shadow-lg border-4 border-white">
                <img src={previewUrl} alt="תצוגה מקדימה" className="w-full h-full object-cover" />
                {loading && <div className="scanner-line"></div>}
                {!loading && (
                  <button onClick={() => setFile(null)} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110">
                    <RotateCcw size={18} />
                  </button>
                )}
              </div>
              <button onClick={handleUpload} disabled={loading} className="w-full max-w-sm bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-100">
                {loading ? <><Loader2 className="animate-spin" /> מנתח ב-AI...</> : <>בצע סריקת מחירים</>}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* תוצאות הסריקה */
        <div className="space-y-6 animate-in fade-in duration-500 px-2">
           <div className="bg-green-50 p-3 rounded-xl border border-green-200 text-green-700 font-bold text-center text-sm">
             ✅ הקבלה נקלטה! נא לאשר את הפרטים למטה:
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-200">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">שם הרשת</label>
              <input className="w-full p-2.5 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 text-sm" value={result.storeName || ""} onChange={(e) => handleStoreChange('storeName', e.target.value)} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">סניף / עיר</label>
              <input className="w-full p-2.5 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 text-sm" value={result.branchName || ""} onChange={(e) => handleStoreChange('branchName', e.target.value)} />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-gray-700 flex justify-between items-center px-1">
              פירוט מוצרים
              <button onClick={addItem} className="text-[11px] bg-blue-600 text-white px-3 py-1 rounded-full font-bold">+ הוסף מוצר</button>
            </h3>
            {result.items.map((item, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm transition-all hover:border-blue-100">
                <input className="flex-1 p-2 bg-gray-50 rounded-lg outline-none text-sm font-medium" value={item.name} onChange={(e) => handleItemChange(idx, 'name', e.target.value)} />
                <div className="flex items-center gap-2 justify-between sm:justify-end">
                  <div className="relative">
                    <input type="number" className="w-24 p-2 bg-gray-100 rounded-lg outline-none text-left font-bold text-blue-700 text-sm" value={item.price} onChange={(e) => handleItemChange(idx, 'price', e.target.value)} />
                    <span className="absolute left-2 top-2 text-[10px] text-gray-400">₪</span>
                  </div>
                  <button onClick={() => removeItem(idx)} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <button onClick={handleConfirm} className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-green-700 transition-all">
              <Check size={22} className="inline ml-2" /> שמור מחירים במערכת
            </button>
            <button onClick={() => setResult(null)} className="py-4 px-6 bg-gray-100 text-gray-500 rounded-2xl font-bold">ביטול</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanReceipt;