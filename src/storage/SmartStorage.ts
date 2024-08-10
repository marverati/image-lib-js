import { DataStorage } from "./DataStorage";
import { LocalStorage } from "./LocalStorage";
import { SimpleBackendStorage } from "./SimpleBackendStorage";

enum StorageType {
    UNDEFINED = 0,
    LOCALSTORAGE = 1,
    BACKENDSTORAGE = 2,
}

/**
 * SmartStorage combines LocalStorage and SimpleBackendStorage, reading user data from localStorage if it exists,
 * and then uses SimpleBackendStorage if possible. If no user data is set, LocalStorage is used as a fallback.
 * LocalStorage items used for user data are "userName" and "userPw".
 */
export class SmartStorage extends DataStorage {
    private backendStorage = new SimpleBackendStorage();
    private localStorage = new LocalStorage();
    private token = '';
    private userName = '';
    private userEmail = '';
    private storageType = StorageType.UNDEFINED;

    public constructor() {
        super("SmartStorage");
    }

    private checkUserData() {
        // Login token can be in cookie or in localStorage
        const cookieToken = document.cookie.split(';').find(c => c.trim().startsWith('token='));
        const cookieTokenValue = cookieToken ? cookieToken.trim().substring('token='.length) : null;
        const token = cookieTokenValue ?? localStorage.getItem('token');
        const userName = localStorage.getItem('loginName');
        const userEmail = localStorage.getItem('loginEmail');
        if (token && userName && userEmail) {
            this.token = token;
            this.userName = userName;
            this.userEmail = userEmail;
            this.backendStorage.setUserData(this.userEmail, this.token);
            if (this.storageType !== StorageType.BACKENDSTORAGE) {
                this.storageType = StorageType.BACKENDSTORAGE;
                console.log("SmartStorage: using backend storage for user " + userName);
            }
        } else {
            if (this.storageType !== StorageType.LOCALSTORAGE) {
                this.storageType = StorageType.LOCALSTORAGE;
                console.log("SmartStorage: using local storage");
            }
        }
        return this.storageType === StorageType.BACKENDSTORAGE;
    }

    public getLoginName(): string | null {
        if (this.checkUserData()) {
            return this.userName
        } else {
            return null
        }
    }

    public getUserEmail(): string | null {
        if (this.checkUserData()) {
            return this.userEmail
        } else {
            return null
        }
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

    public async getQuota() {
        if (this.checkUserData()) {
            return this.backendStorage.getQuota();
        } else {
            return this.localStorage.getQuota();
        }
    }

}