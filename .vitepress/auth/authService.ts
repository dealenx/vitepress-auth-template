import {
  useAuth,
  initAuth as initAuth0,
  login as auth0Login,
  logout as auth0Logout,
} from "./auth0Service";
import { readonly, ref } from "vue";

// Дополнительное состояние сервиса, если оно необходимо
const lastLoginAttempt = ref<Date | null>(null);

// Инициализация сервиса
export async function initAuth() {
  // Использование базовой инициализации из auth0Service
  await initAuth0();
}

// Оборачиваем базовый метод логина
export async function login(options?: any) {
  // Добавляем простой функционал отслеживания последней попытки входа
  lastLoginAttempt.value = new Date();

  // Вызываем оригинальный метод логина
  await auth0Login(options);
}

// Оборачиваем базовый метод выхода
export async function logout() {
  // Очищаем дополнительное состояние
  lastLoginAttempt.value = null;

  // Вызываем оригинальный метод логаута
  await auth0Logout();
}

// Пользовательский хук для компонентов Vue
export const useAuthService = () => {
  const auth = useAuth();

  // Возвращаем расширенный интерфейс
  return {
    ...auth, // Все свойства из базового auth0
    lastLoginAttempt: readonly(lastLoginAttempt),
    login,
    logout,
    initAuth,
  };
};
