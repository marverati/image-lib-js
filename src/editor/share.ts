/**
 * Deep link utilities for the editor.
 * New scheme: ?script=<category>:<name> where category ∈ {user, public, examples}
 * Back-compat: also parse legacy forms ?script=<category>/<name> and ?load=<name> (public).
 */

export type ScriptCategory = 'user' | 'public' | 'examples';

/**
 * Parse the current URL for a script deep link. If a legacy ?load= is present,
 * it will be migrated to ?script=public:<name> via history.replaceState.
 */
export function parseScriptParam(): { category: ScriptCategory; name: string } | null {
    const url = new URL(window.location.href);
    const params = url.searchParams;

    // Migrate legacy ?load=name to ?script=public:name
    if (!params.get('script') && params.get('load')) {
        const legacy = cleanUpName(params.get('load')!);
        if (legacy) {
            params.delete('load');
            params.set('script', `public:${legacy}`);
            window.history.replaceState({}, '', url.pathname + '?' + params.toString());
        } else {
            params.delete('load');
            window.history.replaceState({}, '', url.pathname + (params.toString() ? '?' + params.toString() : ''));
        }
    }

    const script = params.get('script');
    if (!script) return null;

    // Accept both category:name (preferred) and category/name (legacy)
    let category: ScriptCategory | undefined;
    let name: string | undefined;

    if (script.includes(':')) {
        const idx = script.indexOf(':');
        category = script.substring(0, idx) as ScriptCategory;
        name = script.substring(idx + 1);
    } else if (script.includes('/')) {
        const idx = script.indexOf('/');
        category = script.substring(0, idx) as ScriptCategory;
        name = script.substring(idx + 1);
    }

    if (!category || !name) return null;
    name = cleanUpName(name);
    if (!name) return null;
    if (category !== 'user' && category !== 'public' && category !== 'examples') return null;
    return { category, name };
}

/**
 * Update the URL's script parameter to the given value.
 * When replace is true, use replaceState, otherwise pushState.
 * Uses ':' as separator for readability (avoids %2F encoding).
 */
export function setScriptParam(category: ScriptCategory, name: string, replace = false): void {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    params.delete('load');
    params.set('script', `${category}:${cleanUpName(name)}`);
    const newUrl = url.pathname + '?' + params.toString();
    if (replace) window.history.replaceState({}, '', newUrl); else window.history.pushState({}, '', newUrl);
}

/**
 * Remove the script (and legacy load) parameter from the URL.
 */
export function clearScriptParam(): void {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    params.delete('script');
    params.delete('load');
    const qs = params.toString();
    const newUrl = url.pathname + (qs ? '?' + qs : '');
    window.history.replaceState({}, '', newUrl);
}

// Legacy helper retained for compatibility, no longer used by the editor.
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

export function getHostedEditorUrl(category: ScriptCategory, name: string) {
    return `https://rationaltools.org/tools/image-editor/editor.html?script=${encodeURIComponent(category + ':' + name)}`;
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