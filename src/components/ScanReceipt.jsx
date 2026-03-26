import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import { Camera, Check, Loader2, Trash2, Plus, X, Image as ImageIcon, RotateCcw, Layers3 } from 'lucide-react';

const ScanReceipt = () => {
  const [file, setFile] = useState(null); // הקובץ הסופי לשליחה
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  // States למצלמה
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const videoRef = useRef(null);
  const videoCanvasRef = useRef(null); // קנבס נסתר ללכידת פריים בודד
  const [stream, setStream] = useState(null);

  // States חדשים לתמיכה בריבוי תמונות (קבלות ארוכות)
  const [capturedParts, setCapturedParts] = useState([]); // מערך של תמונות (Images) שעברו אופטימיזציה
  const [isProcessingStitch, setIsProcessingStitch] = useState(false); // טעינה בזמן החיבור

  // ניהול תצוגה מקדימה
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  // ניקוי מצלמה ביציאה
  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [stream]);

  // --- לוגיקת מצלמה ---

  const startCamera = async () => {
    setCapturedParts([]); // איפוס חלקים קודמים
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        // הגדרת רזולוציה אידיאלית לצילום קבלה (לא גבוהה מדי כדי לא להעמיס בחיבור)
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
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
    setCapturedParts([]); // ניקוי זמני
  };

  // פונקציית עזר להפוך Blob לתמונת HTML (Image object)
  const blobToImage = (blob) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = URL.createObjectURL(blob);
    });
  };

  // לכידת חלק מהקבלה
  const capturePart = () => {
    if (videoRef.current && videoCanvasRef.current) {
      setShowFlash(true);
      const video = videoRef.current;
      const canvas = videoCanvasRef.current;
      const context = canvas.getContext('2d');

      // אופטימיזציה: אנחנו מגבילים את הרוחב למקסימום 1200 פיקסלים לשמירה על זיכרון
      const targetWidth = Math.min(video.videoWidth, 1200);
      const scaleFactor = targetWidth / video.videoWidth;
      const targetHeight = video.videoHeight * scaleFactor;

      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      // ציור הפריים המוקטן על הקנבס הזמני
      context.drawImage(video, 0, 0, targetWidth, targetHeight);
      
      canvas.toBlob(async (blob) => {
        // הפיכת ה-Blob לאובייקט תמונה כדי שנוכל להדביק אותו אחר כך
        const imgObject = await blobToImage(blob);
        setCapturedParts(prev => [...prev, imgObject]);
        
        // פלאש מהיר
        setTimeout(() => setShowFlash(false), 100);
      }, 'image/jpeg', 0.85); // דחיסה קלה
    }
  };

  // פונקציית הקסם: חיבור כל החלקים לתמונה אחת ארוכה
  const stitchAndFinish = () => {
    if (capturedParts.length === 0) return;
    if (capturedParts.length === 1) {
      // אם יש רק חלק אחד, אין מה לחבר. נהפוך אותו לקובץ הסופי.
      processSinglePart(capturedParts[0]);
      return;
    }

    setIsProcessingStitch(true);

    // יצירת קנבס סופי
    const finalCanvas = document.createElement('canvas');
    const ctx = finalCanvas.getContext('2d');

    // חישוב המימדים הסופיים
    const finalWidth = capturedParts[0].width; // נניח שכולן באותו רוחב
    let finalHeight = 0;
    capturedParts.forEach(img => finalHeight += img.height);

    finalCanvas.width = finalWidth;
    finalCanvas.height = finalHeight;

    // הדבקת התמונות אחת מתחת לשנייה
    let currentY = 0;
    capturedParts.forEach(img => {
      ctx.drawImage(img, 0, currentY);
      currentY += img.height;
    });

    // הפיכת הקנבס הסופי לקובץ JPEG אחד ארוך
    finalCanvas.toBlob((blob) => {
      const stitchedFile = new File([blob], "long_receipt.jpg", { type: "image/jpeg" });
      setFile(stitchedFile);
      
      // ניקוי זיכרון - שחרור ה-Object URLs של החלקים הזמניים
      capturedParts.forEach(img => URL.revokeObjectURL(img.src));
      
      setIsProcessingStitch(false);
      stopCamera(); // עכשיו אפשר לסגור את המצלמה
    }, 'image/jpeg', 0.8); // דחיסה סופית
  };

  // עזר למקרה שיש רק חלק אחד
  const processSinglePart = (imgObj) => {
    fetch(imgObj.src)
      .then(res => res.blob())
      .then(blob => {
        const singleFile = new File([blob], "receipt.jpg", { type: "image/jpeg" });
        setFile(singleFile);
        stopCamera();
      });
  };

  // --- לוגיקת API ---

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      // שי לב: השדה עדיין נקרא 'receipt' (יחיד), כי ה-Backend מקבל קובץ אחד
      formData.append('receipt', file);
      const { data } = await API.post('/receipts/scan', formData);
      setResult(data);
    } catch (err) {
      alert("סריקה נכשלה, נסה שנית.");
    } finally {
      setLoading(false);
    }
  };

  // --- פונקציות עריכה (נשאר ללא שינוי) ---
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
      setResult(null); setFile(null);
    } catch (err) { alert("שגיאה בשמירה"); }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 bg-white shadow-2xl rounded-3xl mt-4 sm:mt-10" dir="rtl">
      <style>{`
        @keyframes scan { 0% { top: 0%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
        .scanner-line { position: absolute; left: 0; width: 100%; height: 4px; background: #3b82f6; box-shadow: 0px 0px 15px 2px #3b82f6; z-index: 10; animation: scan 2s linear infinite; }
        .flash-effect { position: absolute; inset: 0; background-color: white; z-index: 50; animation: flash-fade 0.2s ease-out forwards; pointer-events: none; }
        @keyframes flash-fade { 0% { opacity: 1; } 100% { opacity: 0; } }
      `}</style>

      <h2 className="text-2xl sm:text-3xl font-extrabold mb-6 text-gray-800 flex items-center gap-3">
        <Camera className="text-blue-600" size={28} /> סריקת קבלה
      </h2>

      {!result ? (
        <div className="flex flex-col items-center p-4 sm:p-8 border-4 border-dashed border-blue-100 rounded-3xl bg-blue-50/30 min-h-[400px] justify-center relative">
          
          {/* מסך טעינה בזמן חיבור התמונות */}
          {isProcessingStitch && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-3xl">
              <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
              <p className="text-lg font-bold text-gray-800">מחבר את חלקי הקבלה...</p>
              <p className="text-sm text-gray-500">זה עשוי לקחת כמה שניות</p>
            </div>
          )}

          {/* מצב בחירה ראשוני */}
          {!isCameraActive && !previewUrl && (
            <div className="grid grid-cols-2 gap-6 w-full max-w-sm">
              <div className="flex flex-col items-center gap-2">
                <button onClick={startCamera} className="bg-blue-600 p-6 rounded-2xl shadow-lg hover:bg-blue-700 text-white transition-all active:scale-95 w-full aspect-square">
                   <Camera size={40} />
                </button>
                <span className="text-sm font-bold text-gray-600">פתח מצלמה</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <input type="file" id="gallery-upload" accept="image/*" onChange={(e) => setFile(e.target.files[0])} className="hidden" />
                <label htmlFor="gallery-upload" className="cursor-pointer bg-white p-6 rounded-2xl shadow-lg hover:bg-gray-50 transition-all flex items-center justify-center text-blue-600 border-2 border-blue-100 active:scale-95 w-full aspect-square">
                   <ImageIcon size={40} />
                </label>
                <span className="text-sm font-bold text-gray-600">מהגלריה</span>
              </div>
            </div>
          )}

          {/* מצלמה פעילה בתוך הדף - תומכת בריבוי צילומים */}
          {isCameraActive && (
            <div className="w-full max-w-sm flex flex-col items-center">
              <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl bg-black border-4 border-white">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                
                {showFlash && <div className="flash-effect"></div>}
                
                <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
                  {/* הודעת הדרכה משתנה */}
                  <div className="bg-black/60 text-white text-[11px] p-2 rounded-lg text-center backdrop-blur-sm mx-auto border border-white/10">
                    {capturedParts.length === 0 
                      ? "צלם את החלק העליון של הקבלה"
                      : `חלק ${capturedParts.length} צולם. המשך לחלק הבא עם חפיפה קלה.`}
                  </div>
                  
                  {/* כוונת גבולות */}
                  <div className="flex-1 flex items-center justify-center p-6">
                    <div className="w-full h-full border-2 border-dashed border-white/30 rounded-lg relative">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500"></div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500"></div>
                    </div>
                  </div>
                  
                  {/* מונה חלקים */}
                  {capturedParts.length > 0 && (
                    <div className="absolute bottom-4 right-4 bg-blue-600 text-white font-bold text-xs px-3 py-1.5 rounded-full shadow-lg">
                      {capturedParts.length} חלקים צולמו
                    </div>
                  )}
                </div>
              </div>

              {/* כפתורי שליטה במצלמה */}
              <div className="grid grid-cols-3 gap-4 mt-6 items-center w-full">
                <button onClick={stopCamera} className="bg-gray-100 text-gray-700 p-4 rounded-full hover:bg-gray-200 justify-self-center">
                  <X size={20} />
                </button>
                
                {/* כפתור צילום (לוכד חלק) */}
                <button onClick={capturePart} className="bg-blue-600 text-white p-5 rounded-full shadow-lg border-4 border-blue-100 active:scale-90 justify-self-center">
                  <Camera size={28} />
                </button>

                {/* כפתור סיום וחיבור - מופיע רק אם צולמו חלקים */}
                {capturedParts.length > 0 ? (
                  <button onClick={stitchAndFinish} className="bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 active:scale-95 justify-self-center animate-pulse">
                    <Layers3 size={20} />
                  </button>
                ) : (
                  <div className="w-10"></div> // איזון ויזואלי
                )}
              </div>
              <canvas ref={videoCanvasRef} className="hidden" />
            </div>
          )}

          {/* תצוגה מקדימה של הקובץ הסופי (הארוך) */}
          {previewUrl && !isCameraActive && (
            <div className="w-full flex flex-col items-center">
              <div className="relative w-full max-w-sm aspect-[3/4] mb-6 rounded-2xl overflow-hidden shadow-lg border-4 border-white bg-gray-100">
                {/* התמונה עשויה להיות ארוכה מאוד, object-contain יציג את כולה */}
                <img src={previewUrl} alt="תצוגה מקדימה" className="w-full h-full object-contain" />
                {loading && <div className="scanner-line"></div>}
                {!loading && (
                  <button onClick={() => setFile(null)} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110">
                    <RotateCcw size={18} />
                  </button>
                )}
              </div>
              <button onClick={handleUpload} disabled={loading} className="w-full max-w-sm bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-100 disabled:bg-gray-400">
                {loading ? <><Loader2 className="animate-spin" /> מנתח ב-AI...</> : <>בצע סריקת מחירים</>}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* תוצאות הסריקה - נשאר ללא שינוי */
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