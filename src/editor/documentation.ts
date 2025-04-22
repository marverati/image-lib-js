

const docHtml = `
<h2>Help</h2>

<div class="doc-section">
    <h3>Editor</h3>
    <ul>
        <li><code>F1</code> to toggle documentation (this overlay)</li>
        <li><i>Hold</i> <code>F1</code> to briefly show documentation</li>
        <li><code>CTRL+ENTER</code> to run code</li>
        <li>Press <code>👁️</code> button to switch between code snippet and its documentation</li>
        <li>Code documentation can be added by starting lines with <code>//></code></li>
    </ul>

    <h3>API</h3>
    <ul>
        <li><code>use(id)</code> to set ID as default target <ex>use(-1)</ex></li>
        <li><code>copy(sId, tId)</code> to copy from source ID to target ID <ex>copy(0, 1)</ex></li>
        <li><code>copyFrom(sId)</code> to copy from source ID to current target <ex>copyFrom(1)</ex></li>
        <li><code>copyTo(tId)</code> to copy from current target to target ID <ex>copyTo(0)</ex></li>
        <li>IDs: 0 = source (left), -1 = target (right), 1-9 = top slots</li> 
        <li><code>gen(func, [w], [h])</code> or <code>generate(func)</code> to generate a new image based on provided pixel color mapping <ex>gen((x, y) => [x % 255, 127.5 + 127.5 * Math.sin(y / 10), x ^ y])</ex></li>
        <li><code>fill(color)</code> to fill the target with a single color <ex>fill([0, 255, 128, 128])</ex></li>
        <li><code>filter(func)</code> to apply a filter to the target <ex>filter((c, x, y) => [255 - c[0], 255 - c[1], 255 - c[2], c[3]])</ex></li>
        <li><code>filterR</code>, <code>filterG</code>, <code>filterB</code>, <code>filterA</code> to apply a filter to one channel of the target <ex>filterR((r, c, x, y) => Math.max(c[0], c[1], c[2]))</ex></li>
        <li><code>resize(w, [h])</code> to resize the target <ex>resize(512, 256)</ex></li>
        <li><code>rescale(fw, [fh])</code> to rescale the target <ex>rescale(0.5, 0.5)</ex></li>
        <li><code>crop(w, [h], [relAnchorX], [relAnchorY])</code> to crop the target <ex>crop(64, 64, 0.5, 0.5)</ex></li>
        <!-- currently combine requires Pixelmap, adjust it to work with IDs as well
        <li><code>combine(sId1, sId2, sId3)</code> to combine 3 sources into the target <ex>combine(1, 2, 3)</ex></li>
        <li><code>combine3(sId1, sId2, sId3)</code> to combine 3 sources into the target <ex>combine3(1, 2, 3)</ex></li>
        -->
        <li><code>mirror()</code> to mirror the target horizontally</li>
        <li><code>flip()</code> to flip the target vertically</li>
    </ul>

    <h3>Parameters</h3>
    <ul>
        <li><code>param.toggle(name, defaultValue)</code> to create a toggle parameter <ex>const debug = param.toggle('debug', false)</ex></li>
        <li><code>param.number(name, defaultValue, min, max, step)</code> to create a number parameter <ex>const g = param.number('green', 0, 0, 255)</ex></li>
        <li><code>param.slider(name, defaultValue, min, max, step, liveUpdate)</code> to create a slider parameter <ex>const b = param.slider('blue', 0, 0, 255)</ex></li>
        <li><code>param.text(name, defaultValue, placeholder)</code> to create a text parameter <ex>const seed = param.text('seed', '12345')</ex></li>
        <li><code>param.button(name, callback)</code> to create a button parameter <ex>const button = param.button('Randomize', () => { ... })</ex></li>
        <li><code>param.color(name, defaultValue, returnAsString)</code> to create a color parameter. By default returns RGBA array. <ex>const color = param.color('color', '#ff0000ff')</ex></li>
        <li><code>param.select(name, options, defaultIndex)</code> to create a dropdown <ex>const spot = param.select('spot', ["left", "middle", "right"], 1)</ex></li>
        <li><code>param.get(name)</code> to get the parameter object and manipulate it <ex>param.get('seed').set('54321')</ex></li>
    </ul>
</div>
`.replaceAll(/<ex>(.*?)<\/ex>/g, (_, code) => `<code class="example">${code}</code>`);

export function setupDocumentation(div) {
    div.innerHTML = docHtml;
    let lastKeyDown = -Infinity;
    let isShown = false;
    let lastEventWasDown = false;
    document.body.addEventListener('keydown', (e) => {
        if (lastEventWasDown) {
            return;
        }
        lastEventWasDown = true;
        if (e.key === 'F1' || e.key === 'Escape' && isShown) {
            lastKeyDown = Date.now();
            if (isShown) {
                div.classList.add('hidden');
            } else {
                div.classList.remove('hidden');
            }
            isShown = !isShown;
            e.preventDefault();
            e.stopPropagation();
        }
    });
    document.body.addEventListener('keyup', (e) => {
        lastEventWasDown = false;
        if (e.key === 'F1' && isShown) {
            if (Date.now() - lastKeyDown > 400) {
                isShown = false;
                div.classList.add('hidden');
                e.preventDefault();
                e.stopPropagation();
            }
        }
    });

    console.info('NOTE: Press or hold F1 to show documentation');
}