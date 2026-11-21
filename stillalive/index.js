'use strict';

const path = require('path');
const jibo = require('jibo'), BeSkill = require('@be/be-framework').BeSkill;
const lifecycle = require('./touch-lifecycle'), UI = require('./ui'), terminal = require('./terminal');
const timeline = require('./resources/timeline.json');

// Plays Jibo's Still Alive with the terminal "music video". The audio element is the clock, so the typing stays
// in sync even if the renderer stalls. Swipe down leaves; the song ending leaves on its own.
class StillAlive extends BeSkill {
    constructor() { super(...arguments); this.generation = 0; this.view = null; this.closing = null; this.audio = null; this.timer = null; }
    open() {
        if (this.view) { this.close(() => { if (!this.view) this.open(); else this.exit({ noElementsOfSurprise: true }); }); return; }
        const generation = ++this.generation, views = jibo.face.views;
        this.closing = null; this.leaving = false;
        this.ui = new UI();
        const view = this.view = lifecycle.prepareView(views.createView('View', this.ui.config(views)));
        view.addAction(views.ActionData.CALLBACK, { callback: () => this.leave() }, true, false, views.GESTURE.SWIPE_DOWN);
        const current = () => generation === this.generation && !this.leaving && !!this.view;
        UI.loadFont(global.document).then(() => {
            if (!current()) return;
            views.changeView({ addView: view, transitionOpen: views.TRANSITION.IN, transitionClose: views.TRANSITION.OUT },
                () => { if (current()) this.play(generation); }, () => { if (current()) this.leave(); },
                () => { if (current()) this.ui.decorate(view, global.PIXI); });
        });
    }
    play(generation) {
        const audio = this.audio = new global.Audio('file://' + path.join(__dirname, 'resources/still-alive.ogg'));
        audio.addEventListener('error', () => { if (generation === this.generation) this.leave(); });
        const played = audio.play();
        if (played && played.catch) played.catch(() => { if (generation === this.generation) this.leave(); });
        this.timer = setInterval(() => {
            if (generation !== this.generation || !this.ui) return;
            const s = terminal.state(timeline, audio.currentTime);
            this.ui.render(s);
            if (s.done || audio.ended) this.leave();
        }, 40);
    }
    stopAudio() {
        if (this.timer) { clearInterval(this.timer); this.timer = null; }
        if (this.audio) { try { this.audio.pause(); this.audio.removeAttribute('src'); this.audio.load(); } catch (e) {} this.audio = null; }
    }
    leave() { if (this.leaving) return; this.leaving = true; this.stopAudio(); this.exit({ noElementsOfSurprise: true }); }
    close(done) {
        done = done || (() => {});
        if (this.closing && this.closing.finished && this.closing.error) this.closing = null; // retry a failed close, don't replay it
        if (this.closing) {
            if (this.closing.finished) done(this.closing.error); else this.closing.callbacks.push(done);
            return;
        }
        const closing = this.closing = { finished: false, error: null, callbacks: [done] };
        ++this.generation; this.leaving = true; this.stopAudio();
        lifecycle.closeView(jibo.face.views, jibo.face.tween, this.view, require('timers'), 'stillalive', error => {
            closing.finished = true; closing.error = error || null;
            if (!error) { this.view = null; this.ui = null; }
            closing.callbacks.splice(0).forEach(callback => callback(closing.error));
        });
    }
    destroy(done) { this.close(error => super.destroy(baseError => done(error || baseError))); }
}

module.exports = StillAlive;
