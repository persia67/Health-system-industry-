
import React from 'react';

const SvgIcon = ({ children, className, ...props }: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
    style={{ width: '1.25rem', height: '1.25rem', ...props.style }} // Default sizing mimicking w-5 h-5
    {...props}
  >
    {children}
  </svg>
);

export const Shield = (props: any) => <SvgIcon {...props}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></SvgIcon>;
export const Activity = (props: any) => <SvgIcon {...props}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></SvgIcon>;
export const Search = (props: any) => <SvgIcon {...props}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></SvgIcon>;
export const Plus = (props: any) => <SvgIcon {...props}><path d="M5 12h14"/><path d="M12 5v14"/></SvgIcon>;
export const LogOut = (props: any) => <SvgIcon {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></SvgIcon>;
export const AlertTriangle = (props: any) => <SvgIcon {...props}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></SvgIcon>;
export const UserPlus = (props: any) => <SvgIcon {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></SvgIcon>;
export const X = (props: any) => <SvgIcon {...props}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></SvgIcon>;
export const Save = (props: any) => <SvgIcon {...props}><path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/></SvgIcon>;
export const FileText = (props: any) => <SvgIcon {...props}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></SvgIcon>;
export const ClipboardList = (props: any) => <SvgIcon {...props}><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></SvgIcon>;
export const Stethoscope = (props: any) => <SvgIcon {...props}><path d="M11 2v2"/><path d="M5 2v2"/><path d="M5 5a2 2 0 0 0-2 2v4a9 9 0 0 0 9 9 9 9 0 0 0 9-9V7a2 2 0 0 0-2-2"/><path d="M8 15a6 6 0 0 0 12 0v-3"/><circle cx="20" cy="10" r="2"/></SvgIcon>;
export const Microscope = (props: any) => <SvgIcon {...props}><path d="M6 18h8"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/></SvgIcon>;
export const CheckCircle = (props: any) => <SvgIcon {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></SvgIcon>;
export const Eye = (props: any) => <SvgIcon {...props}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></SvgIcon>;
export const Wind = (props: any) => <SvgIcon {...props}><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></SvgIcon>;
export const Ear = (props: any) => <SvgIcon {...props}><path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0"/><path d="M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 1 0 4 0v-1a.5.5 0 0 1 1 0v1a2.5 2.5 0 0 0 5 0v-1a.5.5 0 0 1-1 0"/></SvgIcon>;
export const ListChecks = (props: any) => <SvgIcon {...props}><path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/></SvgIcon>;
export const Info = (props: any) => <SvgIcon {...props}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></SvgIcon>;
export const UploadCloud = (props: any) => <SvgIcon {...props}><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></SvgIcon>;
export const FileSpreadsheet = (props: any) => <SvgIcon {...props}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 13h2"/><path d="M8 17h2"/><path d="M14 13h2"/><path d="M14 17h2"/></SvgIcon>;
export const Users = (props: any) => <SvgIcon {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></SvgIcon>;
export const Sparkles = (props: any) => <SvgIcon {...props}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M9 3v4"/><path d="M3 5h4"/><path d="M3 9h4"/></SvgIcon>;
export const Loader2 = (props: any) => <SvgIcon {...props} className={props.className + " animate-spin"}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></SvgIcon>;
export const Square = (props: any) => <SvgIcon {...props}><rect width="18" height="18" x="3" y="3" rx="2"/></SvgIcon>;
export const Database = (props: any) => <SvgIcon {...props}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></SvgIcon>;
export const RefreshCw = (props: any) => <SvgIcon {...props}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></SvgIcon>;
export const Key = (props: any) => <SvgIcon {...props}><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/><path d="M10 18a5.5 5.5 0 0 0 7.2-2.4"/></SvgIcon>;
export const Building2 = (props: any) => <SvgIcon {...props}><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></SvgIcon>;
export const User = (props: any) => <SvgIcon {...props}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></SvgIcon>;
export const Lock = (props: any) => <SvgIcon {...props}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></SvgIcon>;
export const LogIn = (props: any) => <SvgIcon {...props}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></SvgIcon>;
export const ArrowRight = (props: any) => <SvgIcon {...props}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></SvgIcon>;
export const ArrowLeft = (props: any) => <SvgIcon {...props}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></SvgIcon>;
export const KeyRound = (props: any) => <SvgIcon {...props}><path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z"/><circle cx="16.5" cy="7.5" r=".5"/></SvgIcon>;
export const CheckCircle2 = (props: any) => <SvgIcon {...props}><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></SvgIcon>;
export const Moon = (props: any) => <SvgIcon {...props}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></SvgIcon>;
export const Sun = (props: any) => <SvgIcon {...props}><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></SvgIcon>;
export const Upload = (props: any) => <SvgIcon {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></SvgIcon>;
export const Download = (props: any) => <SvgIcon {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></SvgIcon>;
export const History = (props: any) => <SvgIcon {...props}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></SvgIcon>;
export const RotateCcw = (props: any) => <SvgIcon {...props}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></SvgIcon>;
export const Building = (props: any) => <SvgIcon {...props}><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M16 18h.01"/></SvgIcon>;
export const Copy = (props: any) => <SvgIcon {...props}><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></SvgIcon>;
export const Check = (props: any) => <SvgIcon {...props}><path d="M20 6 9 17l-5-5"/></SvgIcon>;
export const Trash2 = (props: any) => <SvgIcon {...props}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></SvgIcon>;
export const Edit = (props: any) => <SvgIcon {...props}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></SvgIcon>;
export const PlusCircle = (props: any) => <SvgIcon {...props}><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></SvgIcon>;
export const ArrowUpDown = (props: any) => <SvgIcon {...props}><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></SvgIcon>;
export const Clock = (props: any) => <SvgIcon {...props}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></SvgIcon>;
export const AlertCircle = (props: any) => <SvgIcon {...props}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></SvgIcon>;
export const UserCheck = (props: any) => <SvgIcon {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></SvgIcon>;
export const CheckSquare = (props: any) => <SvgIcon {...props}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></SvgIcon>;
export const MessageSquare = (props: any) => <SvgIcon {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></SvgIcon>;
export const Send = (props: any) => <SvgIcon {...props}><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></SvgIcon>;
export const Bot = (props: any) => <SvgIcon {...props}><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></SvgIcon>;
export const Heart = (props: any) => <SvgIcon {...props}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></SvgIcon>;
export const Beaker = (props: any) => <SvgIcon {...props}><path d="M4.5 3h15"/><path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3"/><path d="M6 14h12"/></SvgIcon>;
export const Ruler = (props: any) => <SvgIcon {...props}><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/></SvgIcon>;
export const Weight = (props: any) => <SvgIcon {...props}><circle cx="12" cy="5" r="3"/><path d="M6.5 8a2 2 0 0 0-1.905 1.457L2.118 20.14A1 1 0 0 0 3.085 21H20.915a1 1 0 0 0 .967-.86l-2.477-10.683A2 2 0 0 0 17.5 8H6.5z"/></SvgIcon>;
export const Briefcase = (props: any) => <SvgIcon {...props}><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></SvgIcon>;
export const TrendingUp = (props: any) => <SvgIcon {...props}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></SvgIcon>;
export const XCircle = (props: any) => <SvgIcon {...props}><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></SvgIcon>;
export const ShieldAlert = (props: any) => <SvgIcon {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></SvgIcon>;
export const Unlock = (props: any) => <SvgIcon {...props}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></SvgIcon>;
export const Filter = (props: any) => <SvgIcon {...props}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></SvgIcon>;
