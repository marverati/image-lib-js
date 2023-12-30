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

}