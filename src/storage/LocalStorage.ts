import { DataStorage } from "./DataStorage";


export class LocalStorage extends DataStorage {

    public constructor() {
        super("LocalStorage");
    }

    public hasValue(key: string) {
        return Promise.resolve(localStorage.getItem(key) != null);
    }

    public getValue(key: string) {
        return Promise.resolve(localStorage.getItem(key));
    }

    public setValue(key: string, value: string) {
        let overwritten = false;
        if (this.hasValue(key)) {
            overwritten = true;
        }
        localStorage.setItem(key, value);
        return Promise.resolve(overwritten);
    }

    public deleteValue(key: string) {
        if (this.hasValue(key)) {
            localStorage.removeItem(key);
            return Promise.resolve(true);
        }
        return Promise.resolve(false);
    }

    public async getQuota(): Promise<number> {
        // Get total size of local storage entries
        let totalSize = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                const value = localStorage.getItem(key);
                if (value) {
                    totalSize += value.length;
                }
            }
        }
        // Divide by lower bound of what we can expect local storage to hold in all browsers, with some leeway to be sure
        const maxCapacity = 5e6 * 0.8; // 5 MB minus a bit
        return totalSize / maxCapacity;
    }

}