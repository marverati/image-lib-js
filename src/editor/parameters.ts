import { debounce } from "../utility/util";



export class ParameterHandler {
    
    private inputs: Record<string, ParameterInput<any>> = {};
    private debouncedSync = debounce(this.sync, 1);
    private tick = 0;
    private autoUpdateToggle = new ToggleInput('Auto Update', true);
    private runButton = new ButtonInput('Run', () => this.onChange?.());
    private totalCalls = 0;

    public constructor(
        private readonly div: HTMLElement,
        private readonly onChange?: () => void,
        private readonly onRender?: () => void,
    ) {
        // TODO: auto update checkbox
        if (!this.div) {
            throw new Error('No div provided for ParameterHandler');
        }
    }

    public getTotalCalls() {
        return this.totalCalls;
    }

    public toggle(id: string, defaultValue = false): boolean {
        this.totalCalls++;
        this.debouncedSync();
        if (!this.inputs[id]) {
            this.inputs[id] = new ToggleInput(id, defaultValue);
            this.inputs[id].setChangeListener(() => this.reactToChange());
        } else if (!(this.inputs[id] instanceof ToggleInput)) {
            throw new Error('Parameter with ID ' + id + ' is already in use and of a different type');
        }
        this.inputs[id].lastTick = this.tick;
        return this.inputs[id].get() as boolean;
    }

    private clearOutdatedInputs() {
        for (const id in this.inputs) {
            if (this.inputs[id].lastTick !== this.tick) {
                delete this.inputs[id];
            }
        }
    }

    public reactToChange() {
        if (this.autoUpdateToggle.get()) {
            this.onChange?.();
        }
    }

    public sync() {
        // Remove inputs that are no longer in use
        this.clearOutdatedInputs();
        // Finish this tick
        this.tick += 1;
        // Sync inputs to DOM
        this.renderParams();
        // Notify the user
        this.onRender?.();
    }

    private renderParams() {
        this.div.innerHTML = '';
        let count = 0;
        for (const id in this.inputs) {
            count++;
            const input = this.inputs[id];
            const el = input.render();
            this.div.appendChild(el);
        }
        if (count === 0) {
            return;
        }
        // Add 'Auto Update' checkbox on top
        const autoUpdateEl = this.autoUpdateToggle.render();
        autoUpdateEl.classList.add('auto-update');
        this.div.insertBefore(autoUpdateEl, this.div.firstChild);
        // Add 'Run' button on bottom
        const runButtonEl = this.runButton.render();
        runButtonEl.classList.add('run-button');
        this.div.appendChild(runButtonEl);
    }
}

export abstract class ParameterInput<T> {

    public readonly id: string;
    protected value: T;
    public lastTick = -1;
    protected changeListener: null | (() => void) = null;

    public constructor(id: string, value: T) {
        this.id = id;
        this.value = value;
    }

    public setChangeListener(listener: () => void) {
        this.changeListener = listener;
    }

    public get() {
        return this.value;
    }

    public render() {
        const div = document.createElement('div');
        div.classList.add('parameter');
        const label = this.renderLabel();
        if (label) {
            label.classList.add('parameter-label');
            div.appendChild(label);
        }
        const input = this.renderInteractive();
        if (input) {
            input.classList.add('parameter-input');
            div.appendChild(input);
        }
        return div;
    }

    public renderLabel(): HTMLElement | null {
        const label = document.createElement('label');
        label.textContent = this.id + ':';
        return label;
    }

    public renderInteractive(): HTMLElement | null {
        return null;
    }

}

export class ToggleInput extends ParameterInput<boolean> {
    
    public constructor(id: string, value = false) {
        super(id, value);
    }

    public renderInteractive() {
        const el = document.createElement('input') as HTMLInputElement;
        el.type = 'checkbox';
        el.checked = this.value;
        el.addEventListener('change', () => {
            this.value = el.checked;
            this.changeListener?.();
        });
        return el;
    }
}

export class ButtonInput extends ParameterInput<void> {
    
    public constructor(id: string, private callback: () => void) {
        super(id, undefined);
    }

    public renderLabel() {
        return null;
    }

    public renderInteractive() {
        const el = document.createElement('button') as HTMLButtonElement;
        el.textContent = this.id;
        el.addEventListener('click', () => {
            this.callback();
        });
        return el;
    }
}