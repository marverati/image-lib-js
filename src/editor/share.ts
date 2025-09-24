/**
 * Deep link utilities for the editor.
 * New scheme: ?script=<category>:<name> where category ∈ {user, public, examples}
 * Back-compat: also parse legacy forms ?script=<category>/<name> and ?load=<name> (public).
 */

export type ScriptCategory = 'user' | 'public' | 'examples';

/**
 * Parse the current URL for a script deep link. If a legacy ?load= is present,
 * it will be migrated to ?script=public:<name> via history.replaceState without encoding ':'
 */
export function parseScriptParam(): { category: ScriptCategory; name: string } | null {
    // Migrate legacy ?load=name to ?script=public:name if needed
    if (!hasQueryParam('script') && hasQueryParam('load')) {
        const legacy = cleanUpName(getQueryParamRaw('load') || '');
        if (legacy) {
            replaceQueryPreservingEncoding({ script: `public:${legacy}` }, ['load']);
        } else {
            replaceQueryPreservingEncoding({}, ['load']);
        }
    }

    const script = getQueryParamDecoded('script');
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
 * Update the URL's script parameter to the given value. Uses ':' separator.
 * Avoid URLSearchParams to keep ':' visible.
 */
export function setScriptParam(category: ScriptCategory, name: string, replace = false): void {
    const value = `${category}:${cleanUpName(name)}`;
    updateQueryPreservingEncoding({ script: value }, ['load'], replace);
}

/**
 * Remove the script (and legacy load) parameter from the URL.
 */
export function clearScriptParam(): void {
    updateQueryPreservingEncoding({}, ['script', 'load'], true);
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
    // Keep ':' readable
    return `https://rationaltools.org/tools/image-editor/editor.html?script=${category}:${name}`;
}

function cleanUpName(name: string) {
    return name.replace(/[^a-zA-Z0-9_-]/g, '');
}

// Helpers to manipulate query strings without forcing percent-encoding of ':'
function getQueryParts(): string[] {
    const qs = window.location.search.startsWith('?') ? window.location.search.slice(1) : window.location.search;
    if (!qs) return [];
    return qs.split('&').filter(Boolean);
}

function hasQueryParam(name: string): boolean {
    return getQueryParts().some(p => decodeURIComponent((p.split('=')[0] || '').replace(/\+/g, ' ')) === name);
}

function getQueryParamRaw(name: string): string | null {
    for (const p of getQueryParts()) {
        const [k, v = ''] = p.split('=');
        if (decodeURIComponent((k || '').replace(/\+/g, ' ')) === name) return v; // raw (still encoded if it was)
    }
    return null;
}

function getQueryParamDecoded(name: string): string | null {
    const raw = getQueryParamRaw(name);
    if (raw == null) return null;
    try { return decodeURIComponent(raw.replace(/\+/g, ' ')); } catch { return raw; }
}

function updateQueryPreservingEncoding(set: Record<string, string>, remove: string[] = [], replace = false) {
    const parts = getQueryParts();
    const kept = parts.filter(p => {
        const k = decodeURIComponent((p.split('=')[0] || '').replace(/\+/g, ' '));
        return !remove.includes(k) && !Object.prototype.hasOwnProperty.call(set, k);
    });
    for (const [k, v] of Object.entries(set)) {
        kept.push(`${encodeURIComponent(k)}=${v}`); // key encoded, value raw to keep ':' visible
    }
    const newSearch = kept.length ? `?${kept.join('&')}` : '';
    const newUrl = window.location.pathname + newSearch + window.location.hash;
    if (replace) window.history.replaceState({}, '', newUrl); else window.history.pushState({}, '', newUrl);
}

function replaceQueryPreservingEncoding(set: Record<string, string>, remove: string[] = []) {
    updateQueryPreservingEncoding(set, remove, true);
}

// Keep in sync with editor.ts readable name
function makeNameReadable(name: string) {
    name = name.replace(/[_-]/g, ' ');
    name = name.replace(/\b\w/g, c => c.toUpperCase());
    return name;
}