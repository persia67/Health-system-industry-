
import React from 'react';
import { Moon, Sun } from 'lucide-react';

interface Props {
  isDark: boolean;
  toggle: () => void;
}

const ThemeToggle: React.FC<Props> = ({ isDark, toggle }) => {
  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg transition-colors border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
      title={isDark ? "تغییر به حالت روشن" : "تغییر به حالت تاریک"}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
};

export default ThemeToggle;
