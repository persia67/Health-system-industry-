
import { User, LicenseInfo } from '../types';
import { generateId } from '../utils';
import { SecurityService } from './securityService';

const USERS_KEY = 'ohs_users_secure_v3';
const LICENSE_KEY = 'ohs_license_secure_v3';
const TRIAL_DURATION_DAYS = 30;
const MASTER_RECOVERY_KEY = 'OHS-RECOVERY-2025';

const seedUsers = () => {
    try {
        const encryptedUsers = localStorage.getItem(USERS_KEY);
        let currentUsers: User[] = [];
        
        if (encryptedUsers) {
            const decrypted = SecurityService.decrypt<User[]>(encryptedUsers);
            if (decrypted && Array.isArray(decrypted)) {
                currentUsers = decrypted;
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
        defaultUsers.forEach(defUser => {
            const exists = currentUsers.some(u => u.username.toLowerCase() === defUser.username.toLowerCase());
            if (!exists) {
                currentUsers.push(defUser);
                hasChanged = true;
            }
        });

        if (hasChanged || !encryptedUsers) {
            localStorage.setItem(USERS_KEY, SecurityService.encrypt(currentUsers));
        }
    } catch (e) {
        console.error("Storage access failed during seed:", e);
    }
};

const seedLicense = () => {
    try {
        const licenseStr = localStorage.getItem(LICENSE_KEY);
        let license: LicenseInfo;

        if (!licenseStr) {
            license = {
                isActive: true,
                type: 'trial',
                activationDate: new Date().toISOString()
            };
        } else {
            const decrypted = SecurityService.decrypt<LicenseInfo>(licenseStr);
            if (!decrypted) {
                 // Tamper detected, reset license
                 license = { isActive: false, type: 'trial', activationDate: new Date().toISOString() };
            } else {
                license = decrypted;
                if (license.type === 'trial') {
                    // Refresh logic for demo purposes (remove in production if strict trial needed)
                    license.activationDate = new Date().toISOString();
                    license.isActive = true;
                }
            }
        }
        localStorage.setItem(LICENSE_KEY, SecurityService.encrypt(license));
    } catch (e) {
        console.error("Storage access failed during license seed:", e);
    }
};

export const AuthService = {
    init: () => {
        seedUsers();
        seedLicense();
    },

    getUsers: (): User[] => {
        try {
            const usersStr = localStorage.getItem(USERS_KEY);
            if (!usersStr) return [];
            return SecurityService.decrypt<User[]>(usersStr) || [];
        } catch (e) {
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

            const license = AuthService.getLicenseInfo();
            const isValidKey = recoveryKey === MASTER_RECOVERY_KEY || (license.serialKey && recoveryKey === license.serialKey);

            if (!isValidKey) {
                return { success: false, message: 'کد بازیابی اشتباه است.' };
            }

            users[userIndex].password = newPass;
            localStorage.setItem(USERS_KEY, SecurityService.encrypt(users));
            return { success: true, message: 'رمز عبور با موفقیت تغییر کرد. اکنون وارد شوید.' };
        } catch (e) {
            return { success: false, message: 'خطا در عملیات بازیابی.' };
        }
    },

    createUser: (user: Omit<User, 'id' | 'createdAt'>): boolean => {
        try {
            const users = AuthService.getUsers();
            if (users.some(u => u.username.toLowerCase() === user.username.toLowerCase())) return false;
            
            const newUser: User = {
                ...user,
                id: generateId(),
                createdAt: new Date().toISOString()
            };
            
            users.push(newUser);
            localStorage.setItem(USERS_KEY, SecurityService.encrypt(users));
            return true;
        } catch (e) {
            return false;
        }
    },

    updateUser: (id: string, updates: Partial<User>): boolean => {
        try {
            const users = AuthService.getUsers();
            const index = users.findIndex(u => u.id === id);
            if (index === -1) return false;

            if (updates.username && updates.username.toLowerCase() !== users[index].username.toLowerCase()) {
                if (users.some(u => u.username.toLowerCase() === updates.username!.toLowerCase())) {
                    return false;
                }
            }

            users[index] = { ...users[index], ...updates };
            localStorage.setItem(USERS_KEY, SecurityService.encrypt(users));
            return true;
        } catch (e) {
            return false;
        }
    },

    deleteUser: (id: string): boolean => {
        try {
            let users = AuthService.getUsers();
            const userToDelete = users.find(u => u.id === id);
            if (!userToDelete) return false;
            
            if (['admin', 'doctor', 'hse'].includes(userToDelete.username.toLowerCase())) return false;
            
            const initialLength = users.length;
            users = users.filter(u => u.id !== id);
            
            if (users.length === initialLength) return false;

            localStorage.setItem(USERS_KEY, SecurityService.encrypt(users));
            return true;
        } catch (e) {
            return false;
        }
    },

    getLicenseInfo: (): LicenseInfo => {
        try {
            const licenseStr = localStorage.getItem(LICENSE_KEY);
            if (!licenseStr) {
                seedLicense();
                return { isActive: false, type: 'trial', activationDate: '' };
            }
            
            const license = SecurityService.decrypt<LicenseInfo>(licenseStr);
            if (!license) return { isActive: false, type: 'trial', activationDate: '' };

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
             return { isActive: false, type: 'trial', activationDate: '' };
        }
    },

    activateLicense: (serial: string): boolean => {
        try {
            // New Secure Verification logic
            if (SecurityService.verifyLicenseSignature(serial)) {
                const newLicense: LicenseInfo = {
                    isActive: true,
                    type: 'full',
                    activationDate: new Date().toISOString(),
                    serialKey: serial
                };
                localStorage.setItem(LICENSE_KEY, SecurityService.encrypt(newLicense));
                return true;
            }
            return false;
        } catch (e) {
            console.error("Failed to activate license:", e);
            return false;
        }
    }
};
