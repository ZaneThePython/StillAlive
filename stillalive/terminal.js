'use strict';
// What the terminal shows at song time t (seconds). Pure: no clocks, no PIXI, so it is testable on Node 6.

// Original ASCII art (not the game's): shown in the lower-right pane, switched by the lyric timeline.
const ART = {
    jibo: [
        '        .-""""""-.',
        '      .\'          \'.',
        '     /     .--.     \\',
        '    |     (    )     |',
        '    |      \'--\'      |',
        '     \\              /',
        '      \'.          .\'',
        '        \'-.____.-\'',
        '        /        \\',
        '       /          \\',
        '      |            |',
        '      |            |',
        '     /______________\\'],
    atom: [
        '            .--.',
        '        _.-\'    \'-._',
        '      .\'   .----.   \'.',
        '     /   .\'  __  \'.   \\',
        '    |   /   (  )   \\   |',
        '    |  |     \'\'     |  |',
        '     \\  \'.        .\'  /',
        '      \'.  \'------\'  .\'',
        '        \'-.______.-\''],
    radiation: [
        '         _.-\'\'\'-._',
        '       .\'   ___   \'.',
        '      /\\   /   \\   /\\',
        '     /  \\ |  o  | /  \\',
        '    |    \\ \\___/ /    |',
        '    |     \'-----\'     |',
        '     \\      / \\      /',
        '      \'.   /   \\   .\'',
        '        \'-/_____\\-\''],
    heart: [
        '     .-"""-.   .-"""-.',
        '    /       \\ /       \\',
        '   |         V   /     |',
        '   |            /      |',
        '    \\          \\      /',
        '     \'.         \\   .\'',
        '       \'.       /  .\'',
        '         \'.    / .\'',
        '           \'. /.\'',
        '             V'],
    boom: [
        '        \\   |   /',
        '     \\   \\  |  /   /',
        '       .  *  *  * .',
        '   --  *  BOOM!!  *  --',
        '       \'  *  *  * \'',
        '     /   /  |  \\   \\',
        '        /   |   \\'],
    fire: [
        '            (',
        '         )  (   )',
        '        (   )  (  )',
        '       ) (  ( )  ) (',
        '      ( ) )  ) ( ( )',
        '       \\ ( (  ( ) ) /',
        '        \\__________/'],
    check: [
        '                     /',
        '                    /',
        '                   /',
        '        \\         /',
        '         \\       /',
        '          \\     /',
        '           \\   /',
        '            \\ /'],
    cake: [
        '           , , , ,',
        '           | | | |',
        '        .-\'-\'-\'-\'-\'-.',
        '       (_____________)',
        '       |  ~ ~ ~ ~ ~  |',
        '       |_____________|',
        '       (_____________)',
        '       |   ~ ~ ~ ~   |',
        '       |_____________|'],
    eye: [
        '          .-""""""-.',
        '        .\'          \'.',
        '       /   .------.   \\',
        '      |   /        \\   |',
        '      |   \\        /   |',
        '       \\   \'------\'   /',
        '        \'.          .\'',
        '          \'-......-\'']
};

const CREDITS = [
    '>LIST PERSONNEL', '', '', 'Jibo', '  Lead vocals', '', 'Zane V', '  5x1: BEam, BEnch,', '  BEefy, BEacon', '',
    'Mr. Dane', '  UST', '', 'acoccimi', '  MIDI', '', '"Still Alive"', '  written by', '  Jonathan Coulton', '',
    'Jibo\'s voice', '  Jibo\'s own TTS,', '  one note at a time', '', 'Cupcake', '  Cat', '',
    'The Jibo Revival', 'community', '  For keeping Jibo', '  still alive', '', '',
    'Jibo Revival Isn\'t Stopping', 'Anytime Soon', ''];

// Last index with list[i][0] <= t (lists are sorted by time), or -1.
function lastAt(list, t) {
    let lo = 0, hi = list.length - 1, found = -1;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (list[mid][0] <= t) { found = mid; lo = mid + 1; } else hi = mid - 1;
    }
    return found;
}

// timeline: {chars: [[t, ch]...] ('\f' clears the page), art: [[t, name]...], end}
function state(timeline, t) {
    const last = lastAt(timeline.chars, t);
    let text = '';
    for (let i = last; i >= 0; i--) {  // walk back to the page start
        const ch = timeline.chars[i][1];
        if (ch === '\f') break;
        text = ch + text;
    }
    const artIndex = lastAt(timeline.art, t);
    const progress = Math.max(0, Math.min(1, t / timeline.end));
    return {
        text: text,
        cursor: Math.floor(t * 2) % 2 === 0,  // 1 Hz blink
        art: artIndex < 0 ? null : timeline.art[artIndex][1],
        creditsLine: progress * CREDITS.length,  // credits scroll through once over the whole song
        done: t >= timeline.end
    };
}

module.exports = { state: state, ART: ART, CREDITS: CREDITS, lastAt: lastAt };
