import { describe, test, expect, beforeEach, afterAll } from '@jest/globals';
import { clearScriptParam, getHostedEditorUrl, getShareUrl, parseScriptParam, setScriptParam } from '../share';

/**
 * share.ts only needs window.location and window.history, so a tiny stand-in is enough
 * (no DOM environment required).
 */
const fakeWindow = {
    location: { pathname: '/editor.html', search: '', hash: '' },
    history: {
        entries: [] as string[],
        pushState(_: any, __: string, url: string) { this.entries.push(url); applyUrl(url); },
        replaceState(_: any, __: string, url: string) { this.entries[this.entries.length - 1] = url; applyUrl(url); },
    },
};

function applyUrl(url: string) {
    const [beforeHash, hash = ''] = url.split('#');
    const [pathname, search = ''] = beforeHash.split('?');
    fakeWindow.location.pathname = pathname;
    fakeWindow.location.search = search ? `?${search}` : '';
    fakeWindow.location.hash = hash ? `#${hash}` : '';
}

function setUrl(search: string, hash = '') {
    fakeWindow.location.search = search;
    fakeWindow.location.hash = hash;
    fakeWindow.history.entries = [];
}

(globalThis as any).window = fakeWindow;
afterAll(() => { delete (globalThis as any).window; });

describe('parseScriptParam', () => {
    beforeEach(() => setUrl(''));

    test('returns null without a script parameter', () => {
        expect(parseScriptParam()).toBeNull();
        setUrl('?foo=bar');
        expect(parseScriptParam()).toBeNull();
    });

    test('parses category:name', () => {
        setUrl('?script=examples:spiral');
        expect(parseScriptParam()).toEqual({ category: 'examples', name: 'spiral' });
        setUrl('?script=user:my_script-2');
        expect(parseScriptParam()).toEqual({ category: 'user', name: 'my_script-2' });
    });

    test('parses percent-encoded values', () => {
        setUrl('?script=public%3Ameme-text');
        expect(parseScriptParam()).toEqual({ category: 'public', name: 'meme-text' });
    });

    test('parses the legacy category/name form', () => {
        setUrl('?script=public/add-outline');
        expect(parseScriptParam()).toEqual({ category: 'public', name: 'add-outline' });
    });

    test('rejects unknown categories and empty names', () => {
        setUrl('?script=secret:thing');
        expect(parseScriptParam()).toBeNull();
        setUrl('?script=examples:');
        expect(parseScriptParam()).toBeNull();
        setUrl('?script=justaname');
        expect(parseScriptParam()).toBeNull();
    });

    test('strips unsafe characters from the name', () => {
        setUrl('?script=examples:../../evil<script>');
        expect(parseScriptParam()).toEqual({ category: 'examples', name: 'evilscript' });
    });

    test('migrates legacy ?load= to ?script=public:', () => {
        setUrl('?load=meme-text&x=1');
        expect(parseScriptParam()).toEqual({ category: 'public', name: 'meme-text' });
        expect(fakeWindow.location.search).toBe('?x=1&script=public:meme-text');
    });
});

describe('setScriptParam / clearScriptParam', () => {
    beforeEach(() => setUrl('?other=1', '#top'));

    test('adds the parameter with a readable colon and keeps other parameters', () => {
        setScriptParam('examples', 'spiral');
        expect(fakeWindow.location.search).toBe('?other=1&script=examples:spiral');
        expect(fakeWindow.location.hash).toBe('#top');
        expect(fakeWindow.history.entries).toHaveLength(1);
    });

    test('replaces an existing script parameter', () => {
        setScriptParam('examples', 'spiral');
        setScriptParam('user', 'mine', true);
        expect(fakeWindow.location.search).toBe('?other=1&script=user:mine');
        expect(fakeWindow.history.entries).toHaveLength(1);
    });

    test('cleans up the name', () => {
        setScriptParam('user', 'a b/c');
        expect(parseScriptParam()).toEqual({ category: 'user', name: 'abc' });
    });

    test('clearScriptParam removes script and load', () => {
        setUrl('?script=examples:spiral&load=x&other=1');
        clearScriptParam();
        expect(fakeWindow.location.search).toBe('?other=1');
    });
});

describe('share URLs', () => {
    test('getShareUrl points to the hosted script file', () => {
        expect(getShareUrl('meme-text')).toBe('https://rationaltools.org/tools/image-editor/data/share/meme-text.js');
    });

    test('getHostedEditorUrl links to the hosted editor', () => {
        expect(getHostedEditorUrl('examples', 'spiral')).toBe('https://rationaltools.org/tools/image-editor/editor.html?script=examples:spiral');
    });
});
