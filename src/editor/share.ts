/**
 * If a share URL param (?load=NAME) is present, return the sanitized name.
 * No fetching and no title updates here; the editor will select the Public item.
 */
export function readAndApplyShareUrlIfSet(): Promise<string | null> {
    const urlParams = new URLSearchParams(window.location.search);
    const scriptName = urlParams.get('load');
    if (scriptName) {
        const safeName = cleanUpName(scriptName);
        return Promise.resolve(safeName);
    }
    return Promise.resolve(null);
}

export function getShareUrl(name: string) {
    return `https://rationaltools.org/tools/image-editor/data/share/${name}.js`;
}

export function getHostedEditorUrl(name: string) {
    return `https://rationaltools.org/tools/image-editor/editor.html?load=${encodeURIComponent(name)}`;
}

function cleanUpName(name: string) {
    return name.replace(/[^a-zA-Z0-9_-]/g, '');
}

// Keep in sync with editor.ts readable name
function makeNameReadable(name: string) {
    name = name.replace(/[_-]/g, ' ');
    name = name.replace(/\b\w/g, c => c.toUpperCase());
    return name;
}