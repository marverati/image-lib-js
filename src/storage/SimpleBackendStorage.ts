import { DataStorage } from "./DataStorage";
import { clamp } from "../demo/util";

const baseUrl = "https://rationaltools.org/internal/api/storage.php" // temporarily use 'internal' backend

const quotaKey = "###quota";

const QUOTA_CHECK_INTERVAL = 1000 * 60 * 1; // 1 minute

export class SimpleBackendStorage extends DataStorage {
    private userEmail = '';
    private loginToken = '';
    private cachedQuota: number | null = null;
    private lastQuotaCheck = 0;

    public constructor() {
        super("SimpleBackendStorage");
    }

    public invalidateCache() {
        this.cachedQuota = null;
    }

    public setUserData(userEmail: string, token: string): void {
        this.userEmail = userEmail;
        this.loginToken = token;
    }

    private async customFetch(url: string, method: string = "GET", body: Object = null) {
        const headers = {
            "Content-Type": "application/json; charset=utf-8",
        };
        // Add user name and login token to headers
        headers['Authorization'] = 'Bearer ' + this.loginToken;
        headers['X-User'] = this.userEmail;
        const options = {
            method,
            headers,
            cache: "no-cache" as RequestCache,
            body: method === "POST" ? JSON.stringify(body) : undefined,
            withCredentials: true,
        };
        console.log({url, options});

        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`Request failed with status: ${response.statusText}`);
            }
            return response.json();
        } catch(e) {
            // Here, consider handling the error or logging it
            throw e;
        }
    }

    public async hasValue(key: string) {
        const result = await this.getValue(key); // TODO: add dedicated endpoint for this use case rather than requesting full value?
        return result !== undefined;
    }

    public async getValue(key: string) {
        try {
            const url = baseUrl + "?key=" + encodeURIComponent(key);
            const response = await this.customFetch(url, "GET");
            return response.value;
        } catch(e) {
            return undefined;
        }
    }

    public async setValue(key: string, value: string) {
        this.invalidateCache();
        const response = await this.customFetch(baseUrl, "POST", { key, value });
        return !!response.success;
    }

    public async deleteValue(key: string) {
        this.invalidateCache();
        const url = baseUrl + "?key=" + encodeURIComponent(key);
        const response = await this.customFetch(url, "DELETE");
        return !!response.success;
    }

    public async fetchQuota(): Promise<number> {
        try {
            const url = baseUrl + "?key=" + encodeURIComponent(quotaKey);
            const response = await this.customFetch(url, "GET");
            const used = response.usedStorage, max = response.maxStorage;
            const ratio = (+used) / (+max);
            if (ratio >= 0) {
                return clamp(ratio, 0, 1); 
            }
        } catch(e) {
            console.error('Error while getting usage quota: ', e);
        }
        return -1;
    }

    public async getQuota(): Promise<number> {
        if (!this.cachedQuota || Date.now() - this.lastQuotaCheck > QUOTA_CHECK_INTERVAL) {
            this.cachedQuota = await this.fetchQuota();
        }
        return this.cachedQuota;
    }
}
