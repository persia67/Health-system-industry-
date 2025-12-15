
import { User, LicenseInfo } from '../types';
import { generateId } from '../utils';

const USERS_KEY = 'ohs_users_v1';
const LICENSE_KEY = 'ohs_license_v1';
const TRIAL_DURATION_DAYS = 7;

// Seed Default Users
const seedUsers = () => {
    // Check if users exist. If not, seed them.
    // NOTE: In a real scenario, we might check if the list is empty. 
    // Here we ensure at least the default admin exists if the key is missing.
    if (!localStorage.getItem(USERS_KEY)) {
        const defaultUsers: User[] = [
            {
                id: 'dev-001',
                username: 'admin',
                password: '123', // In a real app, hash this!
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
        localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
    }
};

// Seed License Info
const seedLicense = () => {
    if (!localStorage.getItem(LICENSE_KEY)) {
        const license: LicenseInfo = {
            isActive: true,
            type: 'trial',
            activationDate: new Date().toISOString()
        };
        localStorage.setItem(LICENSE_KEY, JSON.stringify(license));
    }
};

export const AuthService = {
    init: () => {
        seedUsers();
        seedLicense();
    },

    // --- User Management ---
    getUsers: (): User[] => {
        const usersStr = localStorage.getItem(USERS_KEY);
        return usersStr ? JSON.parse(usersStr) : [];
    },

    login: (username: string, password: string): User | null => {
        const users = AuthService.getUsers();
        const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
        return user || null;
    },

    createUser: (user: Omit<User, 'id' | 'createdAt'>): boolean => {
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
    },

    deleteUser: (id: string): boolean => {
        let users = AuthService.getUsers();
        if (users.find(u => u.id === id)?.role === 'developer') return false; // Cannot delete initial dev
        users = users.filter(u => u.id !== id);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        return true;
    },

    resetPassword: (id: string, newPass: string): boolean => {
        const users = AuthService.getUsers();
        const userIndex = users.findIndex(u => u.id === id);
        if (userIndex === -1) return false;

        users[userIndex].password = newPass;
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        return true;
    },

    // --- License Management ---
    getLicenseInfo: (): LicenseInfo => {
        const licenseStr = localStorage.getItem(LICENSE_KEY);
        if (!licenseStr) {
            seedLicense();
            return AuthService.getLicenseInfo();
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
    },

    activateLicense: (serial: string): boolean => {
        // Mock Validation: Serial must start with "OHS-" and have 16 chars
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
    }
};
