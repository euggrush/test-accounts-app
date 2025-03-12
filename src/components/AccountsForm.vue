<template>
    <div class="accounts-form">
        <h2>Учетные записи</h2>
        <el-button type="primary" @click="onAddAccount">Добавить учетную запись</el-button>

        <div v-for="account in accountsStore.accounts" :key="account.id" class="account-item">
            <!-- Метка -->
            <el-form-item label="Метка" :error="labelErrorMap[account.id] ? 'Некорректное значение' : ''">
                <el-input maxlength="50" v-model="localLabels[account.id]" @blur="() => updateLabel(account)"
                    placeholder="Введите метки через ;" :class="{ error: labelErrorMap[account.id] }" />
            </el-form-item>

            <!-- Тип записи -->
            <el-form-item label="Тип записи">
                <el-select v-model="account.type" placeholder="Выберите тип" @change="onTypeChange(account)">
                    <el-option label="LDAP" value="LDAP" />
                    <el-option label="Локальная" value="Локальная" />
                </el-select>
            </el-form-item>

            <!-- Логин -->
            <el-form-item label="Логин" :error="loginErrorMap[account.id] ? 'Поле обязательно' : ''">
                <el-input maxlength="100" v-model="account.login" @blur="onLoginBlur($event, account)"
                    :class="{ error: loginErrorMap[account.id] }" />
            </el-form-item>

            <!-- Пароль (только если Локальная) -->
            <template v-if="account.type === 'Локальная'">
                <el-form-item label="Пароль" :error="passwordErrorMap[account.id] ? 'Поле обязательно' : ''">
                    <el-input maxlength="100" v-model="account.password" show-password
                        @blur="onPasswordBlur($event, account)" :class="{ error: passwordErrorMap[account.id] }" />
                </el-form-item>
            </template>

            <!-- Кнопка удаления -->
            <el-button type="danger" @click="onRemoveAccount(account.id)">Удалить</el-button>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { reactive, onMounted } from 'vue';
import { useAccountsStore, Account } from '@/stores/accounts';

// Определение типа для карт ошибок
interface ErrorMap {
    [key: number]: boolean;
}

const accountsStore = useAccountsStore();

// Карты ошибок для логина, пароля и меток
const loginErrorMap = reactive<ErrorMap>({});
const passwordErrorMap = reactive<ErrorMap>({});
const labelErrorMap = reactive<ErrorMap>({});

// Локальное состояние для поля «Метка»
const localLabels = reactive<Record<number, string>>({});

// При монтировании инициализируем значения для всех существующих аккаунтов
onMounted(() => {
    accountsStore.accounts.forEach(account => {
        localLabels[account.id] = account.labels.map(label => label.text).join(';');
    });
});

function onAddAccount() {
    const newAccount: Account = {
        id: Date.now(),
        labels: [],
        type: 'LDAP',
        login: '',
        password: null,
    };
    accountsStore.addAccount(newAccount);
    // Инициализируем локальное значение для нового аккаунта
    localLabels[newAccount.id] = '';
}

function onRemoveAccount(id: number) {
    accountsStore.removeAccount(id);
    delete localLabels[id];
}

/**
 * Функция обновления меток для аккаунта
 * Считывает значение из локального состояния, разбивает его по символу ';'
 * и обновляет аккаунт в хранилище.
 */
function updateLabel(account: Account) {
    const value = localLabels[account.id];
    const parts = value.split(';').map(part => part.trim()).filter(Boolean);
    // Проверяем длину каждой метки (максимум 50 символов)
    const hasError = parts.some(part => part.length > 50);
    labelErrorMap[account.id] = hasError;

    if (!hasError) {
        account.labels = parts.map(part => ({ text: part }));
        accountsStore.updateAccount({ ...account });
        // Обновляем локальное значение, чтобы отобразить преобразованный результат
        localLabels[account.id] = account.labels.map(label => label.text).join(';');
    }
}

/**
 * При изменении типа записи:
 * - Если выбран LDAP, обнуляем пароль.
 */
function onTypeChange(account: Account) {
    if (account.type === 'LDAP') {
        account.password = null;
    }
    accountsStore.updateAccount({ ...account });
}

/**
 * Валидация логина при потере фокуса.
 */
function onLoginBlur(event: Event, account: Account) {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    const hasError = !value || value.length > 100;
    loginErrorMap[account.id] = hasError;

    if (!hasError) {
        account.login = value;
        accountsStore.updateAccount({ ...account });
    }
}

/**
 * Валидация пароля при потере фокуса (для локальных аккаунтов).
 */
function onPasswordBlur(event: Event, account: Account) {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    const hasError = !value || value.length > 100;
    passwordErrorMap[account.id] = hasError;

    if (!hasError) {
        account.password = value;
        accountsStore.updateAccount({ ...account });
    }
}
</script>

<style scoped>
.el-button--primary {
    margin-bottom: 16px;
}

.account-item {
    border: 1px solid #ccc;
    padding: 16px;
    margin-bottom: 16px;
    border-radius: 8px;
}

.error {
    border-color: red !important;
}
</style>