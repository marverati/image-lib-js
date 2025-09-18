/**
 * Checks if a share URL is set in the URL parameters and if so,
 * fetches the script and returns the code.
 * @returns 
 */
export function readAndApplyShareUrlIfSet() {
    const urlParams = new URLSearchParams(window.location.search);
    const scriptName = urlParams.get('load');
    if (scriptName) {
        const safeName = cleanUpName(scriptName);
        const fetchUrl = getShareUrl(safeName);
        const readableName = makeNameReadable(safeName);
        document.title = `Image Editor - ${readableName}`;
        return fetch(fetchUrl)
            .then(response => response.text());
    }
    return Promise.resolve(null);
}

export function getShareUrl(name: string) {
    return `https://rationaltools.org/tools/image-editor/data/share/${name}.js`;
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