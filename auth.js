import CONFIG from './config.js';

const STORAGE_KEYS = {
    accessToken: 'cognito_access_token',
    idToken: 'cognito_id_token',
    refreshToken: 'cognito_refresh_token'
};

const authority = `https://cognito-idp.${CONFIG.COGNITO_REGION}.amazonaws.com/${CONFIG.COGNITO_USER_POOL_ID}`;
let userManager = null;

async function getUserManager() {
    if (userManager) return userManager;
    const module = await import('https://esm.sh/oidc-client-ts@2.4.0');
    const UserManager = module.UserManager || module.default?.UserManager || module.default;
    if (!UserManager) {
        throw new Error('UserManager export not found');
    }
    userManager = new UserManager({
        authority,
        client_id: CONFIG.COGNITO_CLIENT_ID,
        redirect_uri: CONFIG.COGNITO_REDIRECT_URI,
        response_type: 'code',
        scope: CONFIG.COGNITO_SCOPES
    });
    return userManager;
}

function setTokens(user) {
    if (!user) return;
    localStorage.setItem(STORAGE_KEYS.accessToken, user.access_token || '');
    localStorage.setItem(STORAGE_KEYS.idToken, user.id_token || '');
    localStorage.setItem(STORAGE_KEYS.refreshToken, user.refresh_token || '');
}

function clearTokens() {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
}

function decodeJwt(token) {
    if (!token) return null;
    const payload = token.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    try {
        // atob() decodifica como latin-1. Para soportar UTF-8 (acentos, ñ, etc) en el token JWT:
        const binaryString = atob(padded);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const utf8String = new TextDecoder().decode(bytes);
        return JSON.parse(utf8String);
    } catch (error) {
        console.error('Failed to decode token', error);
        return null;
    }
}

function getProfileFromToken() {
    const token = localStorage.getItem(STORAGE_KEYS.idToken);
    const payload = decodeJwt(token);
    if (!payload) return null;
    const name = payload.name || payload.given_name || payload.email || 'Usuario';
    return {
        name,
        email: payload.email || '',
        sub: payload.sub || ''
    };
}

function hasCallbackParams() {
    const params = new URLSearchParams(window.location.search);
    return params.has('code') && params.has('state');
}

async function handleCallback() {
    if (!hasCallbackParams()) return null;
    const manager = await getUserManager();
    const user = await manager.signinRedirectCallback();
    setTokens(user);
    window.history.replaceState({}, document.title, CONFIG.COGNITO_REDIRECT_URI);
    return user;
}

async function updateUi() {
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userChip = document.getElementById('user-chip');
    const userName = document.getElementById('user-name');
    const userAvatar = document.getElementById('user-avatar');
    if (!loginBtn || !logoutBtn) return;

    const isAuthed = Boolean(localStorage.getItem(STORAGE_KEYS.idToken));
    loginBtn.classList.toggle('hidden', isAuthed);
    logoutBtn.classList.toggle('hidden', !isAuthed);

    if (userChip && userName && userAvatar) {
        userChip.classList.toggle('hidden', !isAuthed);
        if (isAuthed) {
            const profile = getProfileFromToken();
            const displayName = profile?.name || 'Usuario';
            userName.textContent = displayName;
            userAvatar.textContent = displayName.charAt(0).toUpperCase();
        }
    }
}

const auth = {
    init: async () => {
        try {
            await handleCallback();
        } catch (error) {
            console.error('Auth callback failed', error);
        }
        await updateUi();
    },
    login: async () => {
        try {
            const manager = await getUserManager();
            return manager.signinRedirect();
        } catch (error) {
            console.error('Auth init failed', error);
            return null;
        }
    },
    logout: () => {
        clearTokens();
        const clientId = CONFIG.COGNITO_CLIENT_ID;
        const logoutUri = CONFIG.COGNITO_LOGOUT_URI;
        const cognitoDomain = CONFIG.COGNITO_DOMAIN;
        window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
    },
    isAuthenticated: () => Boolean(localStorage.getItem(STORAGE_KEYS.idToken)),
    getAccessToken: () => localStorage.getItem(STORAGE_KEYS.accessToken),
    getProfile: () => getProfileFromToken()
};

export default auth;
