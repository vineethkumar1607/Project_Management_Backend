const DEFAULT_FRONTEND_URL = "http://localhost:5173";

const getFrontendBaseUrl = () => {
  const envUrl = process.env.FRONTEND_URL?.trim();

  if (envUrl) {
    try {
      return new URL(envUrl).origin;
    } catch {
      console.error("[URL config] Invalid FRONTEND_URL:", envUrl);
    }
  }

  return DEFAULT_FRONTEND_URL;
};

export const FRONTEND_URL = getFrontendBaseUrl();

export const buildFrontendUrl = (path, searchParams = {}) => {
  const url = new URL(path, FRONTEND_URL);

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
};
