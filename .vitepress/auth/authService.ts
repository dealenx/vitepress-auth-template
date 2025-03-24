import { readonly, ref, computed, Ref } from "vue";
import * as auth0Service from "./auth0Service";
import * as basicAuthService from "./basicAuthService";

// Типы для авторизации
export type AuthProvider = "auth0" | "basic";

// Общий интерфейс для провайдеров аутентификации
export interface AuthState {
  isAuthenticated: Ref<boolean>;
  user: Ref<any>;
  loading: Ref<boolean>;
  error: Ref<any>;
}

// Интерфейс для адаптера аутентификации
interface AuthAdapter {
  useAuth: () => AuthState;
  initAuth: () => Promise<void>;
  login: (options?: any) => Promise<boolean>;
  logout: () => Promise<void>;
}

// Адаптер для auth0Service
const auth0Adapter: AuthAdapter = {
  useAuth: () => {
    const auth = auth0Service.useAuth();
    return {
      isAuthenticated: auth.isAuthenticated,
      user: auth.user,
      loading: auth.loading,
      error: auth.error,
    };
  },
  initAuth: auth0Service.initAuth,
  login: async (options?: any) => {
    await auth0Service.login(options);
    return true; // auth0 не возвращает результат, всегда считаем успешным
  },
  logout: auth0Service.logout,
};

// Адаптер для basicAuthService
const basicAuthAdapter: AuthAdapter = {
  useAuth: () => {
    const auth = basicAuthService.useBasicAuth();
    return {
      isAuthenticated: auth.isAuthenticated,
      user: auth.user,
      loading: auth.loading,
      error: auth.error,
    };
  },
  initAuth: basicAuthService.initAuth,
  login: async (options?: any) => {
    if (options && options.username && options.password) {
      return await basicAuthService.login(options.username, options.password);
    }
    return false;
  },
  logout: basicAuthService.logout,
};

// Реестр адаптеров
const adapters: Record<AuthProvider, AuthAdapter> = {
  auth0: auth0Adapter,
  basic: basicAuthAdapter,
};

// Получаем провайдер из переменных окружения
const defaultProvider =
  (import.meta.env.DEFAULT_AUTH_PROVIDER as AuthProvider) || "auth0";

// Текущий провайдер аутентификации
const currentProvider = ref<AuthProvider>(defaultProvider);

// Метаданные аутентификации
const lastLoginAttempt = ref<Date | null>(null);

// Получаем текущий адаптер
function getCurrentAdapter(): AuthAdapter {
  return adapters[currentProvider.value];
}

// Экспортируем функцию смены провайдера
export function setAuthProvider(provider: AuthProvider) {
  if (provider !== currentProvider.value) {
    currentProvider.value = provider;
  }
}

// Инициализация сервиса
export async function initAuth() {
  await getCurrentAdapter().initAuth();
}

// Метод входа
export async function login(options?: any) {
  lastLoginAttempt.value = new Date();
  return await getCurrentAdapter().login(options);
}

// Метод выхода
export async function logout() {
  lastLoginAttempt.value = null;
  await getCurrentAdapter().logout();
}

// Пользовательский хук для компонентов Vue
export const useAuthService = () => {
  // Создаем вычисляемые свойства на основе текущего адаптера
  const isAuthenticated = computed(
    () => getCurrentAdapter().useAuth().isAuthenticated.value
  );

  const user = computed(() => getCurrentAdapter().useAuth().user.value);

  const loading = computed(() => getCurrentAdapter().useAuth().loading.value);

  const error = computed(() => getCurrentAdapter().useAuth().error.value);

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
    setAuthProvider,
  };
};
