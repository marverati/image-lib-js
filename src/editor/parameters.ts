import { Color, ColorRGB } from "../PixelMap";
import { colorFromString, colorToString, debounce } from "../utility/util";



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
        if (!this.div) {
            throw new Error('No div provided for ParameterHandler');
        }
    }

    public getTotalCalls() {
        return this.totalCalls;
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

    public get(id: string) {
        return this.inputs[id];
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

    public button(id: string, callback: () => void): void {
        this.totalCalls++;
        this.debouncedSync();
        if (!this.inputs[id]) {
            this.inputs[id] = new ButtonInput(id, callback);
        } else if (!(this.inputs[id] instanceof ButtonInput)) {
            throw new Error('Parameter with ID ' + id + ' is already in use and of a different type');
        }
        this.inputs[id].lastTick = this.tick;
    }

    public slider(id: string, min: number, max: number, defaultValue?: number, step: number = 1): number {
        this.totalCalls++;
        this.debouncedSync();
        if (!this.inputs[id]) {
            this.inputs[id] = new SliderInput(id, defaultValue ?? min, min, max, step);
            this.inputs[id].setChangeListener(() => this.reactToChange());
        } else if (!(this.inputs[id] instanceof SliderInput)) {
            throw new Error('Parameter with ID ' + id + ' is already in use and of a different type');
        }
        this.inputs[id].lastTick = this.tick;
        return this.inputs[id].get() as number;
    }

    public number(id: string, defaultValue: number, min?: number, max?: number, step?: number): number {
        this.totalCalls++;
        this.debouncedSync();
        if (!this.inputs[id]) {
            this.inputs[id] = new NumberInput(id, defaultValue, min, max, step);
            this.inputs[id].setChangeListener(() => this.reactToChange());
        } else if (!(this.inputs[id] instanceof NumberInput)) {
            throw new Error('Parameter with ID ' + id + ' is already in use and of a different type');
        }
        this.inputs[id].lastTick = this.tick;
        return this.inputs[id].get() as number;
    }

    public color(id: string, defaultValue: string = "#000000", returnAsString: boolean = false): string {
        this.totalCalls++;
        this.debouncedSync();
        if (!this.inputs[id]) {
            this.inputs[id] = new ColorPickerInput(id, defaultValue, returnAsString);
            this.inputs[id].setChangeListener(() => this.reactToChange());
        } else if (!(this.inputs[id] instanceof ColorPickerInput)) {
            throw new Error('Parameter with ID ' + id + ' is already in use and of a different type');
        }
        this.inputs[id].lastTick = this.tick;
        return this.inputs[id].get() as string;
    }

    public text(id: string, defaultValue: string = "", placeholder: string = ""): string {
        this.totalCalls++;
        this.debouncedSync();
        if (!this.inputs[id]) {
            this.inputs[id] = new TextInput(id, defaultValue, placeholder);
            this.inputs[id].setChangeListener(() => this.reactToChange());
        } else if (!(this.inputs[id] instanceof TextInput)) {
            throw new Error('Parameter with ID ' + id + ' is already in use and of a different type');
        }
        this.inputs[id].lastTick = this.tick;
        return this.inputs[id].get() as string;
    }

    public select(id: string, options: string[], defaultIndex: number = 0): string {
        this.totalCalls++;
        this.debouncedSync();
        if (!this.inputs[id]) {
            this.inputs[id] = new SelectInput(id, options, defaultIndex);
            this.inputs[id].setChangeListener(() => this.reactToChange());
        } else if (!(this.inputs[id] instanceof SelectInput)) {
            throw new Error('Parameter with ID ' + id + ' is already in use and of a different type');
        }
        this.inputs[id].lastTick = this.tick;
        return this.inputs[id].get() as string;
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

    public set(value: T) {
        this.value = value;
        this.changeListener?.();
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

export class SliderInput extends ParameterInput<number> {
    private min: number;
    private max: number;
    private step: number;
    
    public constructor(id: string, value: number, min: number, max: number, step: number = 1) {
        super(id, value);
        this.min = min;
        this.max = max;
        this.step = step;
    }

    public renderInteractive() {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.gap = '8px';
        
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = this.min.toString();
        slider.max = this.max.toString();
        slider.step = this.step.toString();
        slider.value = this.value.toString();
        slider.style.flexGrow = '1';
        
        const valueDisplay = document.createElement('span');
        valueDisplay.textContent = this.value.toString();
        valueDisplay.style.minWidth = '30px';
        valueDisplay.style.textAlign = 'right';
        
        const updateValue = () => {
            this.value = Number(slider.value);
            valueDisplay.textContent = this.value.toString();
            this.changeListener?.();
        };
        
        slider.addEventListener('input', updateValue);
        
        container.appendChild(slider);
        container.appendChild(valueDisplay);
        return container;
    }
}

export class NumberInput extends ParameterInput<number> {
    private min?: number;
    private max?: number;
    private step?: number;
    
    public constructor(id: string, value: number, min?: number, max?: number, step?: number) {
        super(id, value);
        this.min = min;
        this.max = max;
        this.step = step;
    }

    public renderInteractive() {
        const input = document.createElement('input');
        input.type = 'number';
        input.value = this.value.toString();
        
        if (this.min !== undefined) input.min = this.min.toString();
        if (this.max !== undefined) input.max = this.max.toString();
        if (this.step !== undefined) input.step = this.step.toString();
        
        input.addEventListener('change', () => {
            this.value = Number(input.value);
            this.changeListener?.();
        });
        
        return input;
    }
}

export class ColorPickerInput extends ParameterInput<string | Color | ColorRGB> {
    private includeAlpha: boolean;
    
    public constructor(
        id: string,
        value: string | Color | ColorRGB = "#000000",
        private readonly returnAsString = false,
    ) {
        super(id, colorToString(value));
        if (value instanceof Array) {
            this.includeAlpha = value.length === 4;
        } else {
            this.includeAlpha = value.length === 9 || value.length === 5;
        }
    }

    public getString() {
        return this.value;
    }

    public get() {
        if (this.returnAsString) {
            return this.value as string;
        } else {
            return colorFromString(this.value as string);
        }
    }

    public renderInteractive() {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.gap = '8px';
        
        const colorPicker = document.createElement('input');
        colorPicker.type = 'color';
        colorPicker.value = (this.value as string).substring(0, 7); // Remove alpha if present
        
        let alphaInput: HTMLInputElement | null = null;
        
        if (this.includeAlpha) {
            const alpha = parseInt((this.value as string).substring(7), 16) || 255;
            const alphaPercent = Math.round((alpha / 255) * 100);
            
            alphaInput = document.createElement('input');
            alphaInput.type = 'range';
            alphaInput.min = '0';
            alphaInput.max = '100';
            alphaInput.value = alphaPercent.toString();
            alphaInput.style.width = '60px';
            
            const alphaLabel = document.createElement('span');
            alphaLabel.textContent = `${alphaPercent}%`;
            alphaLabel.style.fontSize = '0.8em';
            alphaLabel.style.minWidth = '40px';
            
            alphaInput.addEventListener('change', () => {
                const alphaValue = Math.round((Number(alphaInput!.value) / 100) * 255);
                alphaLabel.textContent = `${alphaInput!.value}%`;
                this.value = `${colorPicker.value}${alphaValue.toString(16).padStart(2, '0')}`;
                this.changeListener?.();
            });
            
            container.appendChild(alphaInput);
            container.appendChild(alphaLabel);
        }
        
        colorPicker.addEventListener('change', () => {
            if (this.includeAlpha && alphaInput) {
                const alphaValue = Math.round((Number(alphaInput.value) / 100) * 255);
                this.value = `${colorPicker.value}${alphaValue.toString(16).padStart(2, '0')}`;
            } else {
                this.value = colorPicker.value;
            }
            this.changeListener?.();
        });
        
        container.insertBefore(colorPicker, container.firstChild);
        return container;
    }
}

export class TextInput extends ParameterInput<string> {
    private placeholder: string;
    
    public constructor(id: string, value: string = "", placeholder: string = "") {
        super(id, value);
        this.placeholder = placeholder;
    }

    public renderInteractive() {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = this.value;
        input.placeholder = this.placeholder;
        
        input.addEventListener('change', () => {
            this.value = input.value;
            this.changeListener?.();
        });
        
        return input;
    }
}

export class SelectInput extends ParameterInput<string> {
    private options: string[];
    
    public constructor(id: string, options: string[], defaultIndex: number = 0) {
        const defaultValue = options[defaultIndex] || options[0] || "";
        super(id, defaultValue);
        this.options = options;
    }

    public renderInteractive() {
        const select = document.createElement('select');
        
        for (const option of this.options) {
            const optionEl = document.createElement('option');
            optionEl.value = option;
            optionEl.textContent = option;
            optionEl.selected = option === this.value;
            select.appendChild(optionEl);
        }
        
        select.addEventListener('change', () => {
            this.value = select.value;
            this.changeListener?.();
        });
        
        return select;
    }
}
