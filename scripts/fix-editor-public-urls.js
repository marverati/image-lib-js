// Post-build rewrite to ensure relative URLs in dist/editor/editor.html and linked assets
// Parcel v1 sometimes emits absolute URLs even with --public-url ./ for nested HTML builds.
// This script rewrites leading "/" to "./" for script/link href/src in editor.html and ensures parameters js/css references are relative.

const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '..', 'dist', 'editor');
const htmlPath = path.join(distDir, 'editor.html');

function rewriteHtml(html) {
  // Replace href/src that start with a single slash and point to local bundle names
  html = html.replace(/(\s(?:src|href)=["'])\/(?!\/)([^"'>]+)(["'])/g, (m, pre, url, post) => {
    return pre + './' + url + post;
  });

  // Also handle any stray url(/foo.css) inside inline CSS
  html = html.replace(/url\(\/(?!\/)\s*([^\)]+)\)/g, (m, url) => `url(./${url.trim()})`);

  return html;
}

function main() {
  if (!fs.existsSync(htmlPath)) {
    console.error('fix-editor-public-urls: missing', htmlPath);
    process.exit(1);
  }
  let html = fs.readFileSync(htmlPath, 'utf8');
  const rewritten = rewriteHtml(html);
  if (rewritten !== html) {
    fs.writeFileSync(htmlPath, rewritten, 'utf8');
    console.log('fix-editor-public-urls: rewritten editor.html to use relative URLs');
  } else {
    console.log('fix-editor-public-urls: no changes needed');
  }
}

main();
