
import React, { useState, useEffect } from 'react';
import { Key, Unlock, ShieldAlert, CheckCircle } from 'lucide-react';
import { AuthService } from '../services/authService';
import { LicenseInfo } from '../types';

interface Props {
  onActivated: () => void;
}

const LicenseActivation: React.FC<Props> = ({ onActivated }) => {
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [serial, setSerial] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setLicense(AuthService.getLicenseInfo());
  }, []);

  const handleActivate = () => {
     if (AuthService.activateLicense(serial)) {
         const newLicense = AuthService.getLicenseInfo();
         setLicense(newLicense);
         // If successfully activated to full license, proceed
         if (newLicense.type === 'full') {
             onActivated();
         }
     } else {
         setError('سریال نامعتبر است. لطفا مجددا تلاش کنید.');
     }
  };

  if (!license) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300" dir="rtl">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-amber-500/30 max-w-lg w-full text-center relative overflow-hidden shadow-2xl dark:shadow-none">
            {license.isActive && license.type === 'trial' && (
                <>
                    <div className="w-20 h-20 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldAlert className="w-10 h-10 text-amber-600 dark:text-amber-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">نسخه آزمایشی (Trial)</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        شما در حال استفاده از نسخه آزمایشی هستید. <br/>
                        <span className="text-amber-600 dark:text-amber-400 font-bold text-lg">{license.trialDaysRemaining} روز</span> از اعتبار شما باقی مانده است.
                    </p>
                </>
            )}

            {!license.isActive && (
                 <>
                    <div className="w-20 h-20 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Key className="w-10 h-10 text-red-600 dark:text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">پایان اعتبار لایسنس</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        مهلت استفاده آزمایشی به پایان رسیده است. لطفا جهت ادامه استفاده، نرم‌افزار را فعال کنید.
                    </p>
                 </>
            )}

            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-white/5">
                <h3 className="text-slate-900 dark:text-white font-bold mb-4 flex items-center justify-center gap-2">
                    <Unlock className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                    فعال‌سازی نرم‌افزار
                </h3>
                <input 
                    type="text" 
                    value={serial}
                    onChange={(e) => setSerial(e.target.value)}
                    placeholder="OHS-XXXX-XXXX-XXXX"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-xl p-3 text-center text-slate-900 dark:text-white font-mono tracking-widest uppercase mb-4 focus:border-cyan-500 focus:outline-none"
                />
                {error && <p className="text-red-500 dark:text-red-400 text-sm mb-4">{error}</p>}
                
                <div className="flex gap-3">
                    {license.isActive && (
                        <button onClick={onActivated} className="flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-white py-3 rounded-xl transition-colors font-medium">
                            ادامه بصورت آزمایشی
                        </button>
                    )}
                    <button onClick={handleActivate} className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-cyan-900/20 transition-all">
                        فعال‌سازی
                    </button>
                </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-white/5 text-xs text-slate-500 dark:text-slate-600">
                <p>جهت دریافت لایسنس با پشتیبانی تماس بگیرید.</p>
                <p className="mt-1 font-mono">Serial ID for Demo: OHS-1234-5678-9012</p>
            </div>
        </div>
    </div>
  );
};

export default LicenseActivation;
