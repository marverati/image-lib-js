import { DataStorage } from "./DataStorage";

const baseUrl = "https://rationaltools.org/internal/api/storage.php" // temporarily use 'internal' backend

export class SimpleBackendStorage extends DataStorage {
    private userName = '';
    private password = '';

    public constructor() {
        super("SimpleBackendStorage");
    }

    public setUserData(name: string, pw: string): void {
        this.userName = name;
        this.password = pw;
    }

    private async customFetch(url: string, method: string = "GET", body: Object = null) {
        const headers = {
            "Content-Type": "application/json; charset=utf-8",
        };
        // console.log("SimpleBackendStorage: using user " + this.userName + " with pw " + this.password + " getting " + btoa(this.userName + ':' + this.password));
        headers['Authorization'] = 'Basic ' + btoa(this.userName + ':' + this.password);
        const options = {
            method,
            headers,
            cache: "no-cache" as RequestCache,
            body: method === "POST" ? JSON.stringify(body) : undefined,
            withCredentials: true,
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
        const response = await this.customFetch(baseUrl, "POST", { key, value });
        return !!response.success;
    }

    public async deleteValue(key: string) {
        const url = baseUrl + "?key=" + encodeURIComponent(key);
        const response = await this.customFetch(url, "DELETE");
        return !!response.success;
    }
}
