import { DataStorage } from "./DataStorage";
import { LocalStorage } from "./LocalStorage";
import { SimpleBackendStorage } from "./SimpleBackendStorage";

/**
 * SmartStorage combines LocalStorage and SimpleBackendStorage, reading user data from localStorage if it exists,
 * and then uses SimpleBackendStorage if possible. If no user data is set, LocalStorage is used as a fallback.
 * LocalStorage items used for user data are "userName" and "userPw".
 */
export class SmartStorage extends DataStorage {
    private backendStorage = new SimpleBackendStorage();
    private localStorage = new LocalStorage();
    private userName = '';
    private password = '';

    public constructor() {
        super("SmartStorage");
    }

    private checkUserData() {
        const name = localStorage.getItem("userName");
        const pw = localStorage.getItem("userPw");
        if (pw !== this.password || name !== this.userName) {
            this.userName = name;
            this.password = pw;
            if (this.userName && this.password) {
                console.log("SmartStorage: using backend storage for user " + this.userName);
            } else {
                console.log("SmartStorage: using local storage");
            }
        }
        this.backendStorage.setUserData(name, pw);
        return this.userName !== '' && this.password !== '';
    }

    public hasValue(key: string) {
        if (this.checkUserData()) {
            return this.backendStorage.hasValue(key);
        } else {
            return this.localStorage.hasValue(key);
        }
    }

    public getValue(key: string) {
        if (this.checkUserData()) {
            return this.backendStorage.getValue(key);
        } else {
            return this.localStorage.getValue(key);
        }
    }

    public setValue(key: string, value: string) {
        if (this.checkUserData()) {
            return this.backendStorage.setValue(key, value);
        } else {
            return this.localStorage.setValue(key, value);
        }
    }

    public deleteValue(key: string) {
        if (this.checkUserData()) {
            return this.backendStorage.deleteValue(key);
        } else {
            return this.localStorage.deleteValue(key);
        }
    }

}