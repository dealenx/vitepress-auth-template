import {
  useAuth,
  initAuth as initAuth0,
  login as auth0Login,
  logout as auth0Logout,
} from "./auth0Service";
import {
  useBasicAuth,
  initAuth as initBasicAuth,
  login as basicAuthLogin,
  logout as basicAuthLogout,
} from "./basicAuthService";
import { readonly, ref, computed } from "vue";

// Определение доступных провайдеров аутентификации
export type AuthProvider = "auth0" | "basic";

// Получаем провайдер из переменных окружения
const defaultProvider =
  (import.meta.env.DEFAULT_AUTH_PROVIDER as AuthProvider) || "auth0";

// Текущий провайдер аутентификации
const currentProvider = ref<AuthProvider>(defaultProvider);

// Дополнительное состояние сервиса, если оно необходимо
const lastLoginAttempt = ref<Date | null>(null);

// Инициализация сервиса
export async function initAuth() {
  // Использование соответствующей инициализации в зависимости от провайдера
  if (currentProvider.value === "auth0") {
    await initAuth0();
  } else {
    await initBasicAuth();
  }
}

// Оборачиваем метод логина
export async function login(options?: any) {
  // Добавляем простой функционал отслеживания последней попытки входа
  lastLoginAttempt.value = new Date();

  // Вызываем соответствующий метод логина
  if (currentProvider.value === "auth0") {
    await auth0Login(options);
    return true;
  } else {
    // Для Basic Auth ожидаем username и password
    if (options && options.username && options.password) {
      return await basicAuthLogin(options.username, options.password);
    }
    return false;
  }
}

// Оборачиваем метод выхода
export async function logout() {
  // Очищаем дополнительное состояние
  lastLoginAttempt.value = null;

  // Вызываем соответствующий метод логаута
  if (currentProvider.value === "auth0") {
    await auth0Logout();
  } else {
    await basicAuthLogout();
  }
}

// Пользовательский хук для компонентов Vue
export const useAuthService = () => {
  const auth0 = useAuth();
  const basicAuth = useBasicAuth();

  // Вычисляемые свойства на основе текущего провайдера
  const isAuthenticated = computed(() =>
    currentProvider.value === "auth0"
      ? auth0.isAuthenticated.value
      : basicAuth.isAuthenticated.value
  );

  const user = computed(() =>
    currentProvider.value === "auth0" ? auth0.user.value : basicAuth.user.value
  );

  const loading = computed(() =>
    currentProvider.value === "auth0"
      ? auth0.loading.value
      : basicAuth.loading.value
  );

  const error = computed(() =>
    currentProvider.value === "auth0"
      ? auth0.error.value
      : basicAuth.error.value
  );

  // Возвращаем расширенный интерфейс
  return {
    isAuthenticated,
    user,
    loading,
    error,
    currentProvider: readonly(currentProvider),
    lastLoginAttempt: readonly(lastLoginAttempt),
    login,
    logout,
    initAuth,
  };
};
