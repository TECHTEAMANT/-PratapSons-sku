/**
 * Authentication Service
 * Handles user login, logout, and session management
 */

export interface User {
  username: string;
  name: string;
  role: string;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  error?: string;
}

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzo_g5k7DYfCfPCpCTXavOrvgVpg2fj1bKKvNT1COgAHwIhjw8fCyWrgJiwErhsleswAA/exec";
const SESSION_KEY = 'sku_generator_user';

/**
 * Login with username and password
 * Note: Due to CORS restrictions with Google Apps Script, we store credentials
 * locally and they will be validated on the server when submitting SKUs.
 * This is a simplified authentication suitable for internal tools.
 */
export async function login(username: string, password: string): Promise<User> {
  if (!SCRIPT_URL) {
    throw new Error('Google Script URL not configured');
  }

  if (!username || !password) {
    throw new Error('Username and password are required');
  }

  try {
    // Use URLSearchParams to ensure data is sent as application/x-www-form-urlencoded
    // which Google Apps Script handles well in e.parameter
    const formData = new URLSearchParams();
    formData.append('action', 'login');
    formData.append('username', username.trim());
    formData.append('password', password);

    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: LoginResponse = await response.json();

    if (!result.success || !result.user) {
      throw new Error(result.error || 'Invalid username or password');
    }

    const user: User = {
      username: result.user.username,
      name: result.user.name,
      role: result.user.role || 'user'
    };

    // Save to session
    saveSession(user);
    
    return user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

/**
 * Logout current user
 */
export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = '/login';
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const user = getCurrentUser();
  return user !== null;
}

/**
 * Get current logged-in user
 */
export function getCurrentUser(): User | null {
  const userJson = localStorage.getItem(SESSION_KEY);
  if (!userJson) return null;
  
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

/**
 * Save user session to localStorage
 */
function saveSession(user: User): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}
