export interface LocalUser {
  id: string;
  email: string;
  storeName: string;
  isPro: boolean;
  provider: 'email' | 'google';
}

interface StoredLocalUser extends LocalUser {
  password: string;
}

export interface LocalSession {
  user: LocalUser;
}

const USERS_KEY = 'biztrivo:auth:users';
const SESSION_KEY = 'biztrivo:auth:session';
const RESET_EMAIL_KEY = 'biztrivo:auth:reset-email';

const isBrowser = typeof window !== 'undefined';

const readJson = <T,>(key: string, fallback: T): T => {
  if (!isBrowser) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  if (!isBrowser) return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const toPublicUser = (user: StoredLocalUser): LocalUser => ({
  id: user.id,
  email: user.email,
  storeName: user.storeName,
  isPro: user.isPro,
  provider: user.provider,
});

const getStoredUsers = () => readJson<StoredLocalUser[]>(USERS_KEY, []);

const saveStoredUsers = (users: StoredLocalUser[]) => {
  writeJson(USERS_KEY, users);
};

export const getLocalSession = (): LocalSession | null => {
  return readJson<LocalSession | null>(SESSION_KEY, null);
};

export const getCurrentLocalUser = (): LocalUser | null => {
  return getLocalSession()?.user ?? null;
};

export const signUpLocal = async (email: string, password: string, storeName: string) => {
  const normalizedEmail = normalizeEmail(email);
  const users = getStoredUsers();

  if (users.some((user) => user.email === normalizedEmail)) {
    return { error: 'User already registered' };
  }

  const newUser: StoredLocalUser = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    password,
    storeName: storeName.trim() || 'Minha Loja',
    isPro: true,
    provider: 'email',
  };

  saveStoredUsers([...users, newUser]);
  return { error: null };
};

export const signInLocal = async (email: string, password: string) => {
  const normalizedEmail = normalizeEmail(email);
  const user = getStoredUsers().find(
    (entry) => entry.email === normalizedEmail && entry.password === password,
  );

  if (!user) {
    return { error: 'Invalid login credentials' };
  }

  writeJson(SESSION_KEY, { user: toPublicUser(user) });
  return { error: null, user: toPublicUser(user) };
};

export const signOutLocal = async () => {
  if (!isBrowser) return;
  window.localStorage.removeItem(SESSION_KEY);
};

export const requestPasswordResetLocal = async (email: string) => {
  const normalizedEmail = normalizeEmail(email);
  const userExists = getStoredUsers().some((user) => user.email === normalizedEmail);

  if (isBrowser && userExists) {
    window.localStorage.setItem(RESET_EMAIL_KEY, normalizedEmail);
  }

  return { error: null };
};

export const canResetPasswordLocal = () => {
  if (!isBrowser) return false;
  return Boolean(window.localStorage.getItem(RESET_EMAIL_KEY) || getCurrentLocalUser()?.email);
};

export const updatePasswordLocal = async (password: string) => {
  if (!isBrowser) {
    return { error: 'Modo local indisponível.' };
  }

  const resetEmail = window.localStorage.getItem(RESET_EMAIL_KEY);
  const sessionUser = getCurrentLocalUser();
  const targetEmail = resetEmail || sessionUser?.email;

  if (!targetEmail) {
    return { error: 'Nenhum usuário disponível para redefinir a senha.' };
  }

  const users = getStoredUsers();
  const nextUsers = users.map((user) =>
    user.email === targetEmail ? { ...user, password } : user,
  );

  if (!nextUsers.some((user) => user.email === targetEmail)) {
    return { error: 'Usuário não encontrado.' };
  }

  saveStoredUsers(nextUsers);
  window.localStorage.removeItem(RESET_EMAIL_KEY);
  return { error: null };
};

export const updateCurrentLocalUser = (patch: Partial<Pick<LocalUser, 'storeName' | 'isPro'>>) => {
  const session = getLocalSession();
  if (!session) return;

  const nextSession: LocalSession = {
    user: {
      ...session.user,
      ...patch,
    },
  };

  writeJson(SESSION_KEY, nextSession);

  const users = getStoredUsers().map((user) =>
    user.id === session.user.id ? { ...user, ...patch } : user,
  );

  saveStoredUsers(users);
};
