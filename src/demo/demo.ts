import { GrayscalePixelMap, RGBAPixelMap } from '../image-lib';
import { examples } from './examples';
import { exposeToWindow } from './util';

window.addEventListener('load', createDemoImages);

const sleep = (delay = 0) => new Promise((resolve, reject) => setTimeout(resolve, delay));

type DemoType = {name: string, image: HTMLImageElement, code?: string}

const width = 512;
const height = 256;

async function createDemoImages() {

    // For our code snippets to work as a function based on raw text, we need to add classes to window scope
    exposeToWindow({
        width,
        height,
        GrayscalePixelMap,
        RGBAPixelMap
    })

    for (const name of Object.keys(examples)) {
        const code = examples[name];
        let image: HTMLImageElement | null = null;
        let errorString = '';
        try {
            const fnc = Function(code);
            image = fnc();
        } catch(e) {
            errorString = e;
            console.error(e);
        }
        // Heading
        const h = document.createElement('h2');
        h.textContent = name;
        document.body.appendChild(h);
        // Image
        if (image) {
            document.body.appendChild(image);
        } else {
            const txt = document.createElement('p')
            txt.className = 'error';
            txt.textContent = errorString;
            document.body.appendChild(txt);
        }
        // Code
        const text = document.createElement('textarea');
        text.readOnly = true;
        text.value = code;
        document.body.appendChild(text);
        // Render and asynchronously proceed with next
        await sleep();
    }
}
