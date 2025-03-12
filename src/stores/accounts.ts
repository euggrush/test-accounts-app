import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface LabelItem {
    text: string;
}

export type AccountType = 'LDAP' | 'Локальная';

export interface Account {
    id: number;
    labels: LabelItem[]; // [{ text: 'XXX' }, { text: 'YYY' }, ...]
    type: AccountType;    // 'LDAP' или 'Локальная'
    login: string;
    password: string | null; // null, если LDAP
}

const STORAGE_KEY = 'accounts_data';

function loadFromLocalStorage(): Account[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (error) {
        console.error('Error loading accounts from localStorage:', error);
        return [];
    }
}

function saveToLocalStorage(accounts: Account[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    } catch (error) {
        console.error('Error saving accounts to localStorage:', error);
    }
}

export const useAccountsStore = defineStore('accounts', () => {
    const accounts = ref<Account[]>(loadFromLocalStorage());

    function addAccount(account: Account) {
        accounts.value.push(account);
        saveToLocalStorage(accounts.value);
    }

    function updateAccount(updated: Account) {
        const idx = accounts.value.findIndex(acc => acc.id === updated.id);
        if (idx !== -1) {
            accounts.value[idx] = { ...updated };
            saveToLocalStorage(accounts.value);
        }
    }

    function removeAccount(id: number) {
        accounts.value = accounts.value.filter(acc => acc.id !== id);
        saveToLocalStorage(accounts.value);
    }

    return {
        accounts,
        addAccount,
        updateAccount,
        removeAccount,
    };
});
