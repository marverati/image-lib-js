import { SmartStorage } from "../storage/SmartStorage";
import { clamp } from "../utility/util";
import { createElement } from "./util";

const QUOTA_BUFFER = 0.03;

export class QuotaWidget {
    private div: HTMLElement;
    private lastQuota = 0;
    private visibleQuota = 0;

    public constructor(public readonly parent: HTMLElement, private readonly storage: SmartStorage) {
        this.render();
        parent.appendChild(this.div);
    }

    public render() {
        if (!this.div) {
            this.div = createElement("div", "quota-widget", "");
            this.div.className = "quota-widget";
        }
        this.div.innerHTML = "";
        const bar = createElement("div", "quota-bar", "", this.div);
        this.setBarQuota(this.lastQuota);
        this.storage.getQuota().then(quota => {
            this.lastQuota = quota;
            this.setBarQuota(this.lastQuota);
        });
    }

    private setBarQuota(actualQuota: number) {
        this.visibleQuota = clamp(actualQuota * (1.0 + QUOTA_BUFFER), 0, 1);
        const quota = this.visibleQuota;
        const bar = this.div.querySelector(".quota-bar") as HTMLElement | null;
        if (bar) {
            bar.style.width = (100 * quota) + "%";
            bar.style.backgroundColor = quota < 0.5 ? "green" :
                quota < 0.75 ? "yellow" :
                quota < 0.9 ? "orange" : "red";
            this.div.title = "Storage quota: " + (100 * quota).toFixed(1) + "%";
        }
    }

    public getQuota(): number {
        return this.lastQuota;
    }

    public getVisibleQuota(): number {
        return this.visibleQuota;
    }
}