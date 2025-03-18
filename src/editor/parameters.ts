import { debounce } from "../utility/util";



export class ParameterHandler {
    
    private inputs: Record<string, ParameterInput<any>> = {};
    private debouncedSync = debounce(this.sync, 1);
    private tick = 0;
    private autoUpdate = true;

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

    public toggle(id: string, defaultValue = false): boolean {
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
        if (this.autoUpdate) {
            this.onChange?.();
        }
    }

    public sync() {
        // Remove inputs that are no longer in use
        this.clearOutdatedInputs();
        // Finish this tick
        this.tick += 1;
        // Sync inputs to DOM
        this.div.innerHTML = '';
        for (const id in this.inputs) {
            const input = this.inputs[id];
            const el = input.render();
            this.div.appendChild(el);
        }
        // Notify the user
        this.onRender?.();
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
        const label = document.createElement('label');
        label.textContent = this.id + ':';
        div.appendChild(label);
        const input = this.renderInteractive();
        input.classList.add('parameter-input');
        div.appendChild(input);
        return div;
    }

    public abstract renderInteractive(): HTMLElement;

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