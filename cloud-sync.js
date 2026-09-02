// car cloud sync module - Supabase
// Table: car_state (create in Supabase console)

const CLOUD_STORAGE_KEY = 'car_cloud_config';
const CLOUD_SESSION_KEY = 'car_cloud_session';
const SYNC_DEBOUNCE_MS = 1000;

let syncTimer = null;

// ==================== Config ====================

function getDefaultConfig() {
  return {
    supabaseUrl: 'https://mqdxmbsaddebxlallgos.supabase.co',
    supabaseAnonKey: '',
    stateId: 'main',
    enabled: false,
  };
}

function loadConfig() {
  try {
    const raw = localStorage.getItem(CLOUD_STORAGE_KEY);
    if (raw) return { ...getDefaultConfig(), ...JSON.parse(raw) };
  } catch {}
  return getDefaultConfig();
}

function saveConfig(config) {
  localStorage.setItem(CLOUD_STORAGE_KEY, JSON.stringify(config));
}

// ==================== Session ====================

function loadSession() {
  try {
    const raw = localStorage.getItem(CLOUD_SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { accessToken: '', refreshToken: '', expiresAt: 0, user: { id: '', email: '' } };
}

function saveSession(session) {
  localStorage.setItem(CLOUD_SESSION_KEY, JSON.stringify(session));
}

function isSessionValid(session, safeSeconds = 60) {
  if (!session?.accessToken) return false;
  return session.expiresAt - safeSeconds > Math.floor(Date.now() / 1000);
}

// ==================== API ====================

function buildHeaders(config, token) {
  return {
    apikey: config.supabaseAnonKey,
    Authorization: `Bearer ${token || config.supabaseAnonKey}`,
    'Content-Type': 'application/json',
  };
}

async function parseResp(resp) {
  const text = await resp.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return { message: text }; }
}

function apiError(prefix, status, data) {
  const msg = data?.message || data?.error_description || data?.hint || data?.error || '';
  return new Error(`${prefix}${msg ? ': ' + msg : ''} (HTTP ${status})`);
}

async function signIn(config, email, password) {
  const resp = await fetch(`${config.supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: buildHeaders(config),
    body: JSON.stringify({ email, password }),
  });
  const data = await parseResp(resp);
  if (!resp.ok) throw apiError('Login failed', resp.status, data);

  const expiresIn = Number(data.expires_in || 0);
  const expiresAt = Number(data.expires_at || 0) || Math.floor(Date.now() / 1000) + expiresIn;
  return {
    accessToken: data.access_token || '',
    refreshToken: data.refresh_token || '',
    expiresAt,
    user: { id: data.user?.id || '', email: data.user?.email || email },
  };
}

async function refreshSession(config, session) {
  if (!session?.refreshToken) throw new Error('Session expired, please login again');
  const resp = await fetch(`${config.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: buildHeaders(config),
    body: JSON.stringify({ refresh_token: session.refreshToken }),
  });
  const data = await parseResp(resp);
  if (!resp.ok) throw apiError('Refresh failed', resp.status, data);

  const expiresIn = Number(data.expires_in || 0);
  const expiresAt = Number(data.expires_at || 0) || Math.floor(Date.now() / 1000) + expiresIn;
  return {
    accessToken: data.access_token || '',
    refreshToken: data.refresh_token || '',
    expiresAt,
    user: {
      id: data.user?.id || session.user?.id || '',
      email: data.user?.email || session.user?.email || '',
    },
  };
}

async function ensureSession(config, session) {
  if (!session?.accessToken) return null;
  if (isSessionValid(session)) return session;
  const refreshed = await refreshSession(config, session);
  saveSession(refreshed);
  return refreshed;
}

async function fetchCloudData(config, session) {
  const validSession = await ensureSession(config, session);
  const params = new URLSearchParams();
  params.set('id', `eq.${config.stateId}`);
  params.set('select', 'id,payload,updated_at');
  params.set('limit', '1');

  const resp = await fetch(`${config.supabaseUrl}/rest/v1/car_state?${params}`, {
    method: 'GET',
    headers: buildHeaders(config, validSession?.accessToken),
    cache: 'no-store',
  });
  const data = await parseResp(resp);
  if (!resp.ok) throw apiError('Fetch failed', resp.status, data);

  const rows = Array.isArray(data) ? data : [];
  return {
    payload: rows[0]?.payload ?? null,
    updatedAt: rows[0]?.updated_at || '',
    session: validSession,
  };
}

async function saveCloudData(config, payload, session) {
  const validSession = await ensureSession(config, session);
  if (!validSession?.accessToken) throw new Error('Please login first');

  const headers = { ...buildHeaders(config, validSession.accessToken), Prefer: 'return=representation' };
  const patchParams = new URLSearchParams();
  patchParams.set('id', `eq.${config.stateId}`);

  const patchResp = await fetch(`${config.supabaseUrl}/rest/v1/car_state?${patchParams}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ payload, updated_at: new Date().toISOString() }),
  });
  const patchData = await parseResp(patchResp);
  if (!patchResp.ok) throw apiError('Save failed', patchResp.status, patchData);

  const patchedRows = Array.isArray(patchData) ? patchData : [];
  if (patchedRows.length > 0) {
    return { updatedAt: patchedRows[0]?.updated_at || '', session: validSession };
  }

  const insertResp = await fetch(`${config.supabaseUrl}/rest/v1/car_state`, {
    method: 'POST',
    headers,
    body: JSON.stringify([{ id: config.stateId, payload, owner_id: validSession.user.id }]),
  });
  const insertData = await parseResp(insertResp);
  if (!insertResp.ok) throw apiError('Insert failed', insertResp.status, insertData);

  const insertedRows = Array.isArray(insertData) ? insertData : [];
  return { updatedAt: insertedRows[0]?.updated_at || '', session: validSession };
}

// ==================== Export ====================

window.CarCloudSync = {
  loadConfig,
  saveConfig,
  loadSession,
  saveSession,
  signIn,
  fetchCloudData,
  saveCloudData,
  ensureSession,
  isSessionValid,

  async syncUp(getDataFn) {
    const config = loadConfig();
    if (!config.enabled || !config.supabaseAnonKey) return;
    const session = loadSession();
    if (!session.accessToken) return;

    try {
      const payload = getDataFn();
      const result = await saveCloudData(config, payload, session);
      if (result.session) saveSession(result.session);
      return result;
    } catch (err) {
      console.error('Cloud sync up failed:', err);
      throw err;
    }
  },

  async loadFromCloud() {
    const config = loadConfig();
    if (!config.supabaseAnonKey) return null;
    const session = loadSession();
    try {
      const result = await fetchCloudData(config, session);
      if (result.session) saveSession(result.session);
      return { payload: result.payload, updatedAt: result.updatedAt || '' };
    } catch (err) {
      console.error('Cloud load failed:', err);
      return null;
    }
  },

  scheduleSync(getDataFn) {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      this.syncUp(getDataFn).catch(() => {});
    }, SYNC_DEBOUNCE_MS);
  },

  async syncNow(getDataFn) {
    clearTimeout(syncTimer);
    return this.syncUp(getDataFn);
  },

  // ==================== 基金余额同步（登录会话写入 ysp_state 供 ysp-app 读取） ====================
  async saveCarFundBalance(balance) {
    const config = loadConfig();
    if (!config.supabaseAnonKey) return null;

    let session = loadSession();
    if (!session?.accessToken) return null; // 未登录则不同步，云端只允许登录账号写入

    let validSession = session;
    try {
      validSession = await ensureSession(config, session);
      if (validSession?.accessToken && validSession !== session) saveSession(validSession);
    } catch (err) {
      console.error('Fund balance session refresh failed:', err);
      return null;
    }
    if (!validSession?.accessToken) return null;

    const headers = {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${validSession.accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    };
    const payload = {
      balance: Number(balance || 0),
      updatedAt: new Date().toISOString(),
    };
    try {
      const patchResp = await fetch(
        `${config.supabaseUrl}/rest/v1/ysp_state?id=eq.car`,
        { method: 'PATCH', headers, body: JSON.stringify({ payload, is_public: true, updated_at: payload.updatedAt }) }
      );
      const patchData = await parseResp(patchResp);
      if (!patchResp.ok) console.error('Fund balance patch failed:', patchData);
      if (Array.isArray(patchData) && patchData.length > 0) return patchData[0];
      const insertResp = await fetch(
        `${config.supabaseUrl}/rest/v1/ysp_state`,
        { method: 'POST', headers, body: JSON.stringify([{ id: 'car', payload, is_public: true, owner_id: validSession.user.id }]) }
      );
      const insertData = await parseResp(insertResp);
      if (!insertResp.ok) console.error('Fund balance insert failed:', insertData);
      return Array.isArray(insertData) ? insertData[0] : null;
    } catch (err) {
      console.error('Fund balance sync failed:', err);
      return null;
    }
  },
};
