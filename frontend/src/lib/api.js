const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const buildUrl = (path, params) => {
  const url = new URL(`${API}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.append(k, v);
    });
  }
  return url.toString();
};

const request = async (method, path, { params, body } = {}) => {
  const headers = {};
  const token = localStorage.getItem("session_token");
  if (token) headers.Authorization = `Bearer ${token}`;
  const init = { method, headers, credentials: "include" };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  const res = await fetch(buildUrl(path, params), init);
  const text = await res.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }

  if (!res.ok) {
    const detail = data && typeof data === "object" ? data.detail : null;
    const err = new Error(typeof detail === "string" ? detail : `Request failed with status ${res.status}`);
    err.response = { data, status: res.status };
    throw err;
  }

  return { data };
};

export const api = {
  get: (path, opts) => request("GET", path, opts),
  post: (path, body, opts) => request("POST", path, { ...opts, body }),
  put: (path, body, opts) => request("PUT", path, { ...opts, body }),
  delete: (path, opts) => request("DELETE", path, opts),
};
