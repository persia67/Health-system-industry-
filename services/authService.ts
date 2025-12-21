
import { User, LicenseInfo } from '../types';
import { generateId } from '../utils';

const USERS_KEY = 'ohs_users_v1';
const LICENSE_KEY = 'ohs_license_v1';
const TRIAL_DURATION_DAYS = 7;
const MASTER_RECOVERY_KEY = 'OHS-RECOVERY-2025'; // Master key for demo recovery

// Seed Default Users (Additive logic)
const seedUsers = () => {
    try {
        const usersStr = localStorage.getItem(USERS_KEY);
        let currentUsers: User[] = [];
        
        if (usersStr) {
            try {
                const parsed = JSON.parse(usersStr);
                if (Array.isArray(parsed)) {
                    currentUsers = parsed;
                }
            } catch (e) {
                console.warn("User data corrupted, initializing new list.");
            }
        }

        const defaultUsers: User[] = [
            {
                id: 'dev-001',
                username: 'admin',
                password: '123',
                role: 'developer',
                name: 'مدیر سیستم',
                createdAt: new Date().toISOString()
            },
            {
                id: 'doc-001',
                username: 'doctor',
                password: '123',
                role: 'doctor',
                name: 'دکتر محمدی (پزشک طب کار)',
                createdAt: new Date().toISOString()
            },
            {
                id: 'hse-001',
                username: 'hse',
                password: '123',
                role: 'health_officer',
                name: 'مهندس رضایی (کارشناس بهداشت)',
                createdAt: new Date().toISOString()
            }
        ];

        let hasChanged = false;

        // Add defaults only if they don't exist by username
        defaultUsers.forEach(defUser => {
            const exists = currentUsers.some(u => u.username.toLowerCase() === defUser.username.toLowerCase());
            if (!exists) {
                currentUsers.push(defUser);
                hasChanged = true;
            }
        });

        if (hasChanged || !usersStr) {
            localStorage.setItem(USERS_KEY, JSON.stringify(currentUsers));
        }
    } catch (e) {
        console.error("Storage access failed during seed:", e);
    }
};

// Seed License Info
const seedLicense = () => {
    try {
        if (!localStorage.getItem(LICENSE_KEY)) {
            const license: LicenseInfo = {
                isActive: true,
                type: 'trial',
                activationDate: new Date().toISOString()
            };
            localStorage.setItem(LICENSE_KEY, JSON.stringify(license));
        }
    } catch (e) {
        console.error("Storage access failed during license seed:", e);
    }
};

export const AuthService = {
    init: () => {
        seedUsers();
        seedLicense();
    },

    // --- User Management ---
    getUsers: (): User[] => {
        try {
            const usersStr = localStorage.getItem(USERS_KEY);
            if (!usersStr) return [];
            return JSON.parse(usersStr);
        } catch (e) {
            console.error("Failed to load users:", e);
            return [];
        }
    },

    login: (username: string, password: string): User | null => {
        const users = AuthService.getUsers();
        const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
        return user || null;
    },

    recoverPassword: (username: string, recoveryKey: string, newPass: string): { success: boolean, message: string } => {
        try {
            const users = AuthService.getUsers();
            const userIndex = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
            
            if (userIndex === -1) {
                return { success: false, message: 'کاربری با این نام کاربری یافت نشد.' };
            }

            // Verify against Master Recovery Key or License Key
            const license = AuthService.getLicenseInfo();
            const isValidKey = recoveryKey === MASTER_RECOVERY_KEY || (license.serialKey && recoveryKey === license.serialKey);

            if (!isValidKey) {
                return { success: false, message: 'کد بازیابی اشتباه است.' };
            }

            users[userIndex].password = newPass;
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
            return { success: true, message: 'رمز عبور با موفقیت تغییر کرد. اکنون وارد شوید.' };
        } catch (e) {
            return { success: false, message: 'خطا در عملیات بازیابی.' };
        }
    },

    createUser: (user: Omit<User, 'id' | 'createdAt'>): boolean => {
        try {
            const users = AuthService.getUsers();
            if (users.some(u => u.username.toLowerCase() === user.username.toLowerCase())) return false; // Duplicate
            
            const newUser: User = {
                ...user,
                id: generateId(),
                createdAt: new Date().toISOString()
            };
            
            users.push(newUser);
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
            return true;
        } catch (e) {
            console.error("Failed to create user:", e);
            return false;
        }
    },

    deleteUser: (id: string): boolean => {
        try {
            let users = AuthService.getUsers();
            const userToDelete = users.find(u => u.id === id);
            if (!userToDelete) return false;
            
            // Protect initial admin/dev accounts from deletion
            if (['admin', 'doctor', 'hse'].includes(userToDelete.username.toLowerCase())) return false;
            
            const initialLength = users.length;
            users = users.filter(u => u.id !== id);
            
            if (users.length === initialLength) return false;

            localStorage.setItem(USERS_KEY, JSON.stringify(users));
            return true;
        } catch (e) {
            console.error("Failed to delete user:", e);
            return false;
        }
    },

    resetPassword: (id: string, newPass: string): boolean => {
        try {
            const users = AuthService.getUsers();
            const userIndex = users.findIndex(u => u.id === id);
            if (userIndex === -1) return false;

            users[userIndex].password = newPass;
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
            return true;
        } catch (e) {
            console.error("Failed to reset password:", e);
            return false;
        }
    },

    // --- License Management ---
    getLicenseInfo: (): LicenseInfo => {
        try {
            const licenseStr = localStorage.getItem(LICENSE_KEY);
            if (!licenseStr) {
                seedLicense();
                const retry = localStorage.getItem(LICENSE_KEY);
                return retry ? JSON.parse(retry) : { isActive: false, type: 'trial', activationDate: '' };
            }
            
            const license: LicenseInfo = JSON.parse(licenseStr);
            
            if (license.type === 'trial') {
                const activationDate = new Date(license.activationDate);
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - activationDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                const remaining = TRIAL_DURATION_DAYS - diffDays;
                
                return {
                    ...license,
                    isActive: remaining > 0,
                    trialDaysRemaining: Math.max(0, remaining)
                };
            }
            return license;
        } catch (e) {
             console.error("Failed to get license info:", e);
             return { isActive: false, type: 'trial', activationDate: '' };
        }
    },

    activateLicense: (serial: string): boolean => {
        try {
            if (serial.startsWith('OHS-') && serial.length >= 16) {
                const newLicense: LicenseInfo = {
                    isActive: true,
                    type: 'full',
                    activationDate: new Date().toISOString(),
                    serialKey: serial
                };
                localStorage.setItem(LICENSE_KEY, JSON.stringify(newLicense));
                return true;
            }
            return false;
        } catch (e) {
            console.error("Failed to activate license:", e);
            return false;
        }
    }
};
