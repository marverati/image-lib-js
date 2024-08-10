import { SmartStorage } from "../storage/SmartStorage";
import { createElement, getCookie } from "./util";


export class LoginWidget {
    private div: HTMLElement;

    public constructor(public readonly parent: HTMLElement, private readonly storage: SmartStorage) {
        this.render();
        parent.appendChild(this.div);
    }

    public render() {
        if (!this.div) {
            this.div = createElement("div", "login-widget", "", this.parent);
            this.div.className = "login-widget";
        }
        this.div.innerHTML = "";
        const name = this.getLoginName();
        const email = this.getUserEmail();
        if (name && email) {
            // Currently logged in, greet user and offer logout
            createElement("span", "", `Hi ${name}`, this.div);
            const logoutButton = createElement("button", "", "Logout", this.div);
            logoutButton.addEventListener("click", () => {
                this.logout();
            });
            this.div.title = `Logged in as ${email}`;
        } else {
            // Button leading to log in page
            const loginButton = createElement("button", "", "Login", this.div);
            loginButton.addEventListener("click", () => {
                // Open login.html in new tab
                window.open("login.html", "_blank");
                // TODO: somehow process login result live in this tab without page reload?
            });
            this.div.title = "";
        }
    }

    public logout() {
        // Remove 'token' cookie (but leave other cookies unaffected)
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        localStorage.removeItem('token');
        // TODO: inform backend about logout
    }

    public getLoginName(): string | null {
        return this.storage.getLoginName();
    }

    public getUserEmail(): string | null {
        return this.storage.getUserEmail();
    }

}