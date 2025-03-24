import { readonly, ref, computed, Ref, shallowRef } from "vue";

// Типы для авторизации
export type AuthProvider = "auth0" | "basic";

// Общий интерфейс для провайдеров аутентификации
export interface AuthState {
  isAuthenticated: Ref<boolean>;
  user: Ref<any>;
  loading: Ref<boolean>;
  error: Ref<any>;
}

// Адаптер для auth0Service
async function createAuth0Adapter() {
  const auth0Module = await import("./auth0Service");
  return {
    useAuth: () => {
      const auth = auth0Module.useAuth();
      return {
        isAuthenticated: auth.isAuthenticated,
        user: auth.user,
        loading: auth.loading,
        error: auth.error,
      };
    },
    initAuth: auth0Module.initAuth,
    login: async (options?: any) => {
      await auth0Module.login(options);
      return true; // auth0 не возвращает результат, всегда считаем успешным
    },
    logout: auth0Module.logout,
  };
}

// Адаптер для basicAuthService
async function createBasicAuthAdapter() {
  const basicAuthModule = await import("./basicAuthService");
  return {
    useAuth: () => {
      const auth = basicAuthModule.useBasicAuth();
      return {
        isAuthenticated: auth.isAuthenticated,
        user: auth.user,
        loading: auth.loading,
        error: auth.error,
      };
    },
    initAuth: basicAuthModule.initAuth,
    login: async (options?: any) => {
      if (options && options.username && options.password) {
        return await basicAuthModule.login(options.username, options.password);
      }
      return false;
    },
    logout: basicAuthModule.logout,
  };
}

// Получаем провайдер из переменных окружения
const defaultProvider =
  (import.meta.env.DEFAULT_AUTH_PROVIDER as AuthProvider) || "auth0";

// Текущий провайдер аутентификации
const currentProvider = ref<AuthProvider>(defaultProvider);

// Метаданные аутентификации
const lastLoginAttempt = ref<Date | null>(null);

// Интерфейс для провайдера аутентификации с адаптерами
interface AuthAdapter {
  useAuth: () => AuthState;
  initAuth: () => Promise<void>;
  login: (options?: any) => Promise<boolean>;
  logout: () => Promise<void>;
}

// Ссылка на текущий адаптер
const authAdapter = shallowRef<AuthAdapter | null>(null);

// Флаг загрузки модуля
const isModuleLoading = ref(false);

// Загружаем адаптер аутентификации
async function loadAuthAdapter(provider: AuthProvider): Promise<AuthAdapter> {
  isModuleLoading.value = true;
  try {
    let adapter: AuthAdapter;

    if (provider === "auth0") {
      adapter = await createAuth0Adapter();
    } else if (provider === "basic") {
      adapter = await createBasicAuthAdapter();
    } else {
      throw new Error(`Неподдерживаемый провайдер аутентификации: ${provider}`);
    }

    authAdapter.value = adapter;
    return adapter;
  } finally {
    isModuleLoading.value = false;
  }
}

// Получаем или загружаем текущий адаптер
async function getAuthAdapter(): Promise<AuthAdapter> {
  if (!authAdapter.value) {
    return await loadAuthAdapter(currentProvider.value);
  }
  return authAdapter.value;
}

// Экспортируем функцию смены провайдера
export async function setAuthProvider(provider: AuthProvider) {
  if (provider !== currentProvider.value) {
    currentProvider.value = provider;
    await loadAuthAdapter(provider);
  }
}

// Инициализация сервиса
export async function initAuth() {
  const adapter = await getAuthAdapter();
  await adapter.initAuth();
}

// Метод входа
export async function login(options?: any) {
  lastLoginAttempt.value = new Date();
  const adapter = await getAuthAdapter();
  return await adapter.login(options);
}

// Метод выхода
export async function logout() {
  lastLoginAttempt.value = null;
  const adapter = await getAuthAdapter();
  await adapter.logout();
}

// Пользовательский хук для компонентов Vue
export const useAuthService = () => {
  // Создаем вычисляемые свойства, которые будут обновляться при изменении адаптера
  const isAuthenticated = computed(() => {
    const adapter = authAdapter.value;
    return adapter ? adapter.useAuth().isAuthenticated.value : false;
  });

  const user = computed(() => {
    const adapter = authAdapter.value;
    return adapter ? adapter.useAuth().user.value : null;
  });

  const loading = computed(() => {
    const adapter = authAdapter.value;
    return (
      isModuleLoading.value ||
      (adapter ? adapter.useAuth().loading.value : true)
    );
  });

  const error = computed(() => {
    const adapter = authAdapter.value;
    return adapter ? adapter.useAuth().error.value : null;
  });

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
