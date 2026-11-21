'use strict';

// The terminal: amber text on black in three panes like the end-credits screen.
// Left: lyrics typed as Jibo sings. Right top: scrolling credits. Right bottom: ASCII art.
const path = require('path');
const terminal = require('./terminal');

const AMBER = 0xFFB01E, FONT = 'StillAliveMono', SIZE = 24, LINE = 30;
const LEFT = { x: 70, y: 70, w: 600, h: 600 }, CREDITS = { x: 720, y: 70, w: 500, h: 250 }, ART = { x: 720, y: 360, w: 500, h: 300 };
const VISIBLE_CREDITS = Math.floor(CREDITS.h / LINE);

class UI {
    config(views) {
        return { viewConfig: { type: 'View', id: 'stillalive', category: 'gui', ignoreSwipeDown: true, transitionStageOnly: true },
            componentConfigs: [] };
    }
    // Load the bundled mono font (Jibo has none). Resolves even if loading fails: the text falls back to monospace.
    static loadFont(doc) {
        try {
            const face = new global.FontFace(FONT, 'url("file://' + path.join(__dirname, 'resources/mono.ttf') + '")');
            return face.load().then(f => { doc.fonts.add(f); }, () => {});
        } catch (e) { return Promise.resolve(); }
    }
    decorate(view, PIXI) {
        const stage = new PIXI.Container();
        const bg = new PIXI.Graphics(); bg.beginFill(0x000000); bg.drawRect(0, 0, 1280, 720); bg.endFill();
        stage.addChild(bg);
        const style = (extra) => Object.assign({ fontFamily: FONT + ', monospace', fontSize: SIZE, fill: AMBER, lineHeight: LINE }, extra || {});
        const dashes = (x, y, w) => { const d = new PIXI.Text(new Array(Math.floor(w / 14.4)).join('-'), style()); d.x = x; d.y = y; stage.addChild(d); };
        dashes(LEFT.x - 10, LEFT.y - 38, LEFT.w + 20); dashes(LEFT.x - 10, LEFT.y + LEFT.h + 4, LEFT.w + 20);
        dashes(CREDITS.x - 10, CREDITS.y - 38, CREDITS.w + 20); dashes(CREDITS.x - 10, CREDITS.y + CREDITS.h + 4, CREDITS.w + 20);
        this.lyrics = new PIXI.Text('', style({ wordWrap: true, wordWrapWidth: LEFT.w }));
        this.lyrics.x = LEFT.x; this.lyrics.y = LEFT.y; stage.addChild(this.lyrics);
        this.credits = new PIXI.Text('', style()); this.credits.x = CREDITS.x; this.credits.y = CREDITS.y; stage.addChild(this.credits);
        this.art = new PIXI.Text('', style({ fontSize: 22, lineHeight: 25 })); this.art.x = ART.x; this.art.y = ART.y; stage.addChild(this.art);
        view.stage.addChildAt(stage, 0);
        this.shown = {};
    }
    // Update only what changed: PIXI.Text re-rasterizes on every text assignment.
    render(s) {
        if (!this.lyrics) return;
        const lyrics = s.text + (s.cursor ? '_' : ' ');
        if (this.shown.lyrics !== lyrics) {
            this.shown.lyrics = lyrics;
            // a full pane scrolls like a terminal: drop the oldest lines until the page fits
            let lines = lyrics.split('\n');
            this.lyrics.text = lines.join('\n');
            while (lines.length > 1 && this.lyrics.height > LEFT.h) { lines = lines.slice(1); this.lyrics.text = lines.join('\n'); }
        }
        const first = Math.floor(s.creditsLine);
        if (this.shown.credits !== first) {
            this.shown.credits = first;
            const start = Math.max(0, first - VISIBLE_CREDITS + 1);  // newest line at the bottom, like a terminal
            this.credits.text = terminal.CREDITS.slice(start, first + 1).join('\n');
        }
        if (this.shown.art !== s.art) {
            this.shown.art = s.art;
            this.art.text = s.art ? terminal.ART[s.art].join('\n') : '';
        }
    }
}

module.exports = UI;
