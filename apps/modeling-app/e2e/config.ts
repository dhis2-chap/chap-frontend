const DEFAULT_APP_URL = 'http://localhost:3000';

export const getAppUrl = (): string => {
    return process.env.E2E_APP_URL ?? DEFAULT_APP_URL;
};

export const getAppOrigin = (): string => {
    return new URL(getAppUrl()).origin;
};
