<template>
    <el-container>
        <div class="accounts-form">
            <div class="add-btn-wrap">
                <h2>Учетные записи</h2>
                <el-button class="add-account-btn" @click="onAddAccount">+</el-button>
            </div>
            <p class="help-wrap"><i class="fa fa-question-circle" style="font-size:30px"></i>
                Для указания нескольких меток для одной пары логин/пароль используйте разделитель ;</p>

            <el-table :data="accountsStore.accounts" height="500" style="width: 100%">
                <el-table-column label="Метки" width="150">
                    <template #default="scope">
                        <el-input v-model="localLabels[scope.row.id]" @input="onLabelInput(scope.row)"
                            @blur="() => updateLabel(scope.row)" placeholder="Введите метки через ;" maxlength="50"
                            :class="{ error: labelErrorMap[scope.row.id] }" />
                    </template>
                </el-table-column>
                <el-table-column label="Тип записи" width="120">
                    <template #default="scope">
                        <el-select v-model="scope.row.type" placeholder="Выберите тип"
                            @change="onTypeChange(scope.row)">
                            <el-option label="LDAP" value="LDAP" />
                            <el-option label="Локальная" value="Локальная" />
                        </el-select>
                    </template>
                </el-table-column>
                <el-table-column label="Логин" width="120">
                    <template #default="scope">
                        <el-input v-model="scope.row.login" @blur="onLoginBlur($event, scope.row)" maxlength="100"
                            :class="{ error: loginErrorMap[scope.row.id] }" />
                    </template>
                </el-table-column>
                <el-table-column label="Пароль" width="320">
                    <template #default="scope">
                        <el-input v-if="scope.row.type === 'Локальная'" v-model="scope.row.password" show-password
                            @blur="onPasswordBlur($event, scope.row)" maxlength="100"
                            :class="{ error: passwordErrorMap[scope.row.id] }" />
                    </template>
                </el-table-column>
                <el-table-column label=" " width="50">
                    <template #default="scope">
                        <el-button class="remove-btn" :icon="Delete" @click="onRemoveAccount(scope.row.id)" />
                    </template>
                </el-table-column>
            </el-table>
        </div>
    </el-container>
</template>

<script lang="ts" setup>
import { reactive, onMounted } from 'vue';
import { useAccountsStore, Account } from '@/stores/accounts';
import { Delete } from '@element-plus/icons-vue'

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
 * Функция обработки ввода меток
 * Оставляет только буквы (латинские и кириллические) и символ ';'
 */
function onLabelInput(account: Account) {
    const value = localLabels[account.id];
    // Разрешаем только буквы (латинские и кириллические) и символ ';'
    const filtered = value.replace(/[^a-zA-Zа-яА-ЯёЁ;]+/g, '');
    if (filtered !== value) {
        localLabels[account.id] = filtered;
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
/* CSS-переменные для основных значений */
:root {
    --border-color: #ccc;
    --border-radius: 8px;
    --padding: 16px;
    --margin-bottom: 16px;
}

/* Общий контейнер с flex-раскладкой */
.flex-container {
    display: flex;
    align-items: center;
}

/* Обёртка для кнопки добавления */
.add-btn-wrap {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin: 1px;
}

/* Стили для элемента аккаунта */
.account-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    border: 1px solid var(--border-color);
    padding: var(--padding);
    margin-bottom: var(--margin-bottom);
    border-radius: var(--border-radius);
}

/* Сброс отступов для элементов формы */
.el-form-item {
    display: block;
    margin: 0;
}

/* Стилизация ошибки */
.error {
    border-color: red !important;
}

/* Обёртка для подсказок */
.help-wrap {
    display: flex;
    align-items: center;
}

.help-wrap i {
    margin-right: 10px;
}

/* Кнопки */
.add-account-btn {
    width: 40px;
    height: 40px;
    font-size: 20px;
    margin-left: 10px;
}

.remove-btn {
    border: none;
    font-size: 20px;
}
</style>
