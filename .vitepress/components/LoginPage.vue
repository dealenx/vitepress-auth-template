<template>
    <div class="login-page">
        <div class="login-container">
            <h1>Sign In</h1>

            <div v-if="loginError" class="auth-error">
                {{ loginError }}
            </div>

            <!-- Auth0 Login -->
            <div v-if="currentProvider === 'auth0'" class="login-form">
                <button class="login-button" @click="handleAuth0Login">
                    <span class="login-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                            <polyline points="10 17 15 12 10 7"></polyline>
                            <line x1="15" y1="12" x2="3" y2="12"></line>
                        </svg>
                    </span>
                    Sign In
                </button>
            </div>

            <!-- Supabase Login Form -->
            <div v-else-if="currentProvider === 'supabase'" class="login-form">
                <form @submit.prevent="handleSupabaseLogin">
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" v-model="email" placeholder="Enter email" required />
                    </div>
                    <div class="form-group">
                        <label for="supabasePassword">Password</label>
                        <input type="password" id="supabasePassword" v-model="supabasePassword"
                            placeholder="Enter password" required />
                    </div>
                    <button type="submit" class="login-button">Sign In</button>
                </form>
            </div>

            <!-- Basic Auth Login Form -->
            <div v-else class="login-form">
                <form @submit.prevent="handleBasicLogin">
                    <div class="form-group">
                        <label for="username">Username</label>
                        <input type="text" id="username" v-model="username" placeholder="Enter username" required />
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" v-model="password" placeholder="Enter password" required />
                    </div>
                    <button type="submit" class="login-button">Sign In</button>
                </form>
            </div>

            <div class="home-link">
                <a :href="withBase('/')">Return to Home Page</a>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthService } from '../auth/authService';
import { useRouter, useData, withBase } from 'vitepress';

const router = useRouter();
const { site } = useData();

const {
    login,
    currentProvider,
} = useAuthService();

// Basic Auth form state
const username = ref('');
const password = ref('');
// Supabase form state
const email = ref('');
const supabasePassword = ref('');
const loginError = ref<string | null>(null);

const handleAuth0Login = () => {
    login();
};

const handleBasicLogin = async () => {
    loginError.value = null;

    try {
        const success = await login({
            username: username.value,
            password: password.value
        });

        if (success) {
            // Redirect to home page after successful login using base path from config
            window.location.href = withBase('/');
        } else {
            loginError.value = 'Invalid username or password';
        }
    } catch (error) {
        loginError.value = 'An error occurred during login';
        console.error('Login error:', error);
    }
};

const handleSupabaseLogin = async () => {
    loginError.value = null;

    try {
        const success = await login({
            email: email.value,
            password: supabasePassword.value
        });

        if (success) {
            // Redirect to home page after successful login
            window.location.href = withBase('/');
        } else {
            loginError.value = 'Invalid email or password';
        }
    } catch (error) {
        loginError.value = 'An error occurred during login';
        console.error('Login error:', error);
    }
};
</script>

<style>
.login-page {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: var(--vp-c-bg);
    padding: 20px;
}

.login-container {
    width: 100%;
    max-width: 400px;
    padding: 2rem;
    background-color: var(--vp-c-bg-soft);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.login-container h1 {
    margin-bottom: 1.5rem;
    text-align: center;
    color: var(--vp-c-brand);
}

.login-form {
    margin-bottom: 1.5rem;
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
    color: var(--vp-c-text-1);
}

.login-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 0.75rem;
    font-size: 1rem;
    font-weight: 500;
    background-color: var(--vp-c-brand);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.login-button:hover {
    background-color: var(--vp-c-brand-dark);
}

.login-icon {
    margin-right: 8px;
}

.home-link {
    margin-top: 1.5rem;
    text-align: center;
}

.home-link a {
    color: var(--vp-c-brand);
    text-decoration: none;
}

.home-link a:hover {
    text-decoration: underline;
}

.auth-error {
    background-color: #ffebee;
    color: #c62828;
    padding: 0.75rem;
    border-radius: 4px;
    margin-bottom: 1rem;
    font-size: 0.9rem;
}

.login-info {
    margin-top: 0.75rem;
    text-align: center;
    color: var(--vp-c-text-2);
}

/* Dark mode adjustments */
.dark .auth-error {
    background-color: rgba(244, 67, 54, 0.1);
}

.dark .login-container {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
</style>