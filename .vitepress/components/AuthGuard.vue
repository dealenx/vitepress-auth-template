<template>
  <div v-if="loading" class="auth-loading">
    <div class="loader"></div>
    <div>Loading authentication...</div>
  </div>
  <div v-else-if="requiresAuth && !isAuthenticated" class="auth-login">
    <div class="login-container">
      <h2>Authentication Required</h2>
      <p>This content is protected. Please log in to continue.</p>

      <!-- Auth0 Login -->
      <div v-if="currentProvider === 'auth0'">
        <button class="login-button" @click="handleAuth0Login">Log In</button>
      </div>

      <!-- Supabase Login Form -->
      <div v-else-if="currentProvider === 'supabase'" class="supabase-auth-form">
        <div v-if="loginError" class="auth-error">
          {{ loginError }}
        </div>
        <form @submit.prevent="handleSupabaseLogin">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" v-model="email" placeholder="Enter email" required />
          </div>
          <div class="form-group">
            <label for="supabasePassword">Password</label>
            <input type="password" id="supabasePassword" v-model="supabasePassword" placeholder="Enter password"
              required />
          </div>
          <button type="submit" class="login-button">Log In</button>
        </form>
      </div>

      <!-- Basic Auth Login Form -->
      <div v-else class="basic-auth-form">
        <div v-if="loginError" class="auth-error">
          {{ loginError }}
        </div>
        <form @submit.prevent="handleBasicLogin">
          <div class="form-group">
            <label for="username">Username</label>
            <input type="text" id="username" v-model="username" placeholder="Enter username" required />
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" v-model="password" placeholder="Enter password" required />
          </div>
          <button type="submit" class="login-button">Log In</button>
        </form>
        <div class="login-info">
          <small>Default credentials: admin / password</small>
        </div>
      </div>
    </div>
  </div>
  <slot v-else></slot>
</template>

<script setup lang="ts">
import { useAuthService } from '../auth/authService';
import { useData } from 'vitepress';
import { onMounted, computed, ref } from 'vue';

const { frontmatter } = useData();
const {
  initAuth,
  login,
  isAuthenticated,
  loading,
  currentProvider,
  error: authError
} = useAuthService();

// Basic Auth form state
const username = ref('');
const password = ref('');
// Supabase form state
const email = ref('');
const supabasePassword = ref('');
const loginError = ref<string | null>(null);

const requiresAuth = computed(() => {
  return frontmatter.value.protected === true;
});

const handleAuth0Login = () => {
  login();
};

const handleBasicLogin = async () => {
  loginError.value = null;

  const success = await login({
    username: username.value,
    password: password.value
  });

  if (!success) {
    loginError.value = 'Invalid username or password';
  }
};

const handleSupabaseLogin = async () => {
  loginError.value = null;

  const success = await login({
    email: email.value,
    password: supabasePassword.value
  });

  if (!success) {
    loginError.value = 'Invalid email or password';
  }
};

const isBrowser = typeof window !== 'undefined';

onMounted(async () => {
  if (isBrowser) {
    await initAuth();
  }
});
</script>

<style>
.auth-loading {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 60vh;
  font-size: 1.2rem;
  gap: 20px;
}

.loader {
  border: 5px solid var(--vp-c-bg-soft);
  border-top: 5px solid var(--vp-c-brand);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.auth-login {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60vh;
}

.login-container {
  max-width: 400px;
  padding: 2rem;
  background-color: var(--vp-c-bg-soft);
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.login-button {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background-color: var(--vp-c-brand);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  width: 100%;
}

.login-button:hover {
  background-color: var(--vp-c-brand-dark);
}

/* Basic Auth Form Styles */
.basic-auth-form {
  margin-top: 1rem;
  text-align: left;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background-color: var(--vp-c-bg);
  font-size: 1rem;
}

.auth-error {
  color: #e53935;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background-color: rgba(229, 57, 53, 0.1);
  border-radius: 4px;
  text-align: center;
}

.login-info {
  margin-top: 1rem;
  text-align: center;
  color: var(--vp-c-text-2);
}

/* Supabase Auth Form Styles */
.supabase-auth-form {
  margin-top: 1rem;
  text-align: left;
}
</style>