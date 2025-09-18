/**
 * Checks if a share URL is set in the URL parameters and if so,
 * fetches the script and returns the code.
 * Returns null on failure (e.g., CORS), caller can show a message.
 */
export function readAndApplyShareUrlIfSet() {
    const urlParams = new URLSearchParams(window.location.search);
    const scriptName = urlParams.get('load');
    if (scriptName) {
        const safeName = cleanUpName(scriptName);
        const fetchUrl = getShareUrl(safeName);
        const readableName = makeNameReadable(safeName);
        document.title = `Image Editor - ${readableName}`;
        return fetch(fetchUrl, { cache: 'no-cache' })
            .then(response => response.text())
            .catch((err) => {
                console.warn('[share] Failed to fetch public script. This is likely a CORS restriction. URL =', fetchUrl);
                console.warn('To run the script anyway, open this URL:', getHostedEditorUrl(safeName));
                console.warn(err);
                return null;
            });
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

function makeNameReadable(name: string) {
    name = name.replace(/[_-]/g, ' ');
    // Turn all word beginnings uppercase
    name = name.replace(/\b\w/g, c => c.toUpperCase());
    return name;
}