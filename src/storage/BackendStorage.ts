import { DataStorage } from "./DataStorage";

const baseUrl = "https://rationaltools.org/api/storage" // Note: not available yet

export class BackendStorage extends DataStorage {

    public constructor() {
        super("BackendStorage");
    }

    private async customFetch(action: string, method: string = "GET", body: Object = null) {
        const url = baseUrl + action;
        const options = {
            method,
            cache: "no-cache" as RequestCache,
            credentials: "same-origin" as RequestCredentials,
            headers: {
              "Content-Type": "application/json",
            },
            body: body ? JSON.stringify(body) : undefined
        };

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
        const response = await this.customFetch(`${key}/exists`);
        return !!response.exists;
    }

    public async getValue(key: string, defaultTo?: string | null) {
        if (defaultTo !== undefined) {
            try {
                return this.customFetch(key);
            } catch(e) {
                return defaultTo;
            }
        }
        // No default value provided -> may throw error
        return this.customFetch(key);
    }

    public async setValue(key: string, value: string) {
        const response = await this.customFetch("", "POST", { key, value });
        return !!response.success;
    }

    public async deleteValue(key: string) {
        const response = await this.customFetch(key, "DELETE");
        return !!response.success;
    }

    public async getQuota(): Promise<number> {
        // TODO
        return 0;
    }
}
