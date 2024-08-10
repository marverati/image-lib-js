

export class UserData {
    private isSet = false;
    private name: string | null = null;
    private password: string | null = null; // TODO: turn into #password without private keyword

    public constructor() {

    }

    public setData(name: string, pw: string) {
        this.name = name;
        this.password = pw;
    }

    public isPasswordSet() {
        return this.password && this.password.length > 0;
    }
}

export abstract class DataStorage {
    private userData = new UserData();
    

    public constructor(public readonly name: string) {

    }

    public setUserData(name: string, pw: string) {
        this.userData.setData(name, pw);
    }

    public abstract hasValue(key: string): Promise<boolean>;

    public abstract getValue(key: string, defaultTo?: string | null): Promise<string | null>;

    public abstract setValue(key: string, value: string): Promise<boolean>;

    public abstract deleteValue(key: string): Promise<boolean>;

    public abstract getQuota(): Promise<number>;

}