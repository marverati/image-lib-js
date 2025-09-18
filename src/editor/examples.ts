
import { examplesArray } from "./examples_raw";


function processExample(key: string, example: string) {
    example = example.replaceAll('0, editor_1.', '');
    // Remove function wrapper
    if (example.startsWith('function ')) {
        const lines = example.split('\n');
        const innerLines = lines.slice(1, lines.length - 1);
        const indentation = Math.min(...innerLines.filter(l => l.trim().length > 0).map(line => line.length - line.trimLeft().length));
        const fixedLines = innerLines.map(line => line.substring(indentation));
        return fixedLines.join('\n');
    }
    return example;
}

export const examples = {}
for (const example of examplesArray) {
    if (example instanceof Function) {
        const key = example.name;
        const code = processExample(key, example.toString());
        examples[key] = code;
    } else {
        const fullText = example.trim();
        const p = fullText.indexOf(':');
        const key = fullText.slice(0, p).trim();
        const code = fullText.slice(p + 1).trim();
        examples[key] = code;
    }
}
