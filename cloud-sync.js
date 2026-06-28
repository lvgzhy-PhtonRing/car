// car 云同步模块 — 复用 Ysp-app 的 Supabase 实例
// 表名: car_state (需在 Supabase 控制台创建)

const CLOUD_STORAGE_KEY = 'car_cloud_config';
const CLOUD_SESSION_KEY = 'car_cloud_session';
const SYNC_DEBOUNCE_MS = 1000;

let syncTimer = null;

// ==================== 配置管理 ====================

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

// ==================== 会话管理 ====================

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

// ==================== API 调用 ====================

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

// 登录
async function signIn(config, email, password) {
  const resp = await fetch(`${config.supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: buildHeaders(config),
    body: JSON.stringify({ email, password }),
  });
  const data = await parseResp(resp);
  if (!resp.ok) throw apiError('云端登录失败', resp.status, data);

  const expiresIn = Number(data.expires_in || 0);
  const expiresAt = Number(data.expires_at || 0) || Math.floor(Date.now() / 1000) + expiresIn;
  return {
    accessToken: data.access_token || '',
    refreshToken: data.refresh_token || '',
    expiresAt,
    user: { id: data.user?.id || '', email: data.user?.email || email },
  };
}

// 刷新会话
async function refreshSession(config, session) {
  if (!session?.refreshToken) throw new Error('登录已过期，请重新登录');
  const resp = await fetch(`${config.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: buildHeaders(config),
    body: JSON.stringify({ refresh_token: session.refreshToken }),
  });
  const data = await parseResp(resp);
  if (!resp.ok) throw apiError('刷新会话失败', resp.status, data);

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

// 确保会话有效
async function ensureSession(config, session) {
  if (!session?.accessToken) return null;
  if (isSessionValid(session)) return session;
  const refreshed = await refreshSession(config, session);
  saveSession(refreshed);
  return refreshed;
}

// 读取云端数据
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
  if (!resp.ok) throw apiError('读取云端数据失败', resp.status, data);

  const rows = Array.isArray(data) ? data : [];
  return {
    payload: rows[0]?.payload ?? null,
    updatedAt: rows[0]?.updated_at || '',
    session: validSession,
  };
}

// 保存云端数据
async function saveCloudData(config, payload, session) {
  const validSession = await ensureSession(config, session);
  if (!validSession?.accessToken) throw new Error('请先登录云端账号');

  const headers = { ...buildHeaders(config, validSession.accessToken), Prefer: 'return=representation' };
  const patchParams = new URLSearchParams();
  patchParams.set('id', `eq.${config.stateId}`);

  // 尝试更新
  const patchResp = await fetch(`${config.supabaseUrl}/rest/v1/car_state?${patchParams}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ payload, updated_at: new Date().toISOString() }),
  });
  const patchData = await parseResp(patchResp);
  if (!patchResp.ok) throw apiError('写入云端数据失败', patchResp.status, patchData);

  const patchedRows = Array.isArray(patchData) ? patchData : [];
  if (patchedRows.length > 0) {
    return { updatedAt: patchedRows[0]?.updated_at || '', session: validSession };
  }

  // 不存在则插入
  const insertResp = await fetch(`${config.supabaseUrl}/rest/v1/car_state`, {
    method: 'POST',
    headers,
    body: JSON.stringify([{ id: config.stateId, payload, owner_id: validSession.user.id }]),
  });
  const insertData = await parseResp(insertResp);
  if (!insertResp.ok) throw apiError('创建云端数据行失败', insertResp.status, insertData);

  const insertedRows = Array.isArray(insertData) ? insertData : [];
  return { updatedAt: insertedRows[0]?.updated_at || '', session: validSession };
}

// ==================== 导出接口 ====================

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

  // 同步：保存本地数据到云端
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
      console.error('云同步上传失败:', err);
      throw err;
    }
  },

  // 加载：从云端拉取数据
  async loadFromCloud() {
    const config = loadConfig();
    if (!config.supabaseAnonKey) return null;
    const session = loadSession();
    try {
      const result = await fetchCloudData(config, session);
      if (result.session) saveSession(result.session);
      return result.payload;
    } catch (err) {
      console.error('云端加载失败:', err);
      return null;
    }
  },

  // 防抖同步
  scheduleSync(getDataFn) {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      this.syncUp(getDataFn).catch(() => {});
    }, SYNC_DEBOUNCE_MS);
  },

  // 立即同步
  async syncNow(getDataFn) {
    clearTimeout(syncTimer);
    return this.syncUp(getDataFn);
  },
};
