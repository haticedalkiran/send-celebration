// Each theme: confetti colors/shapes, text styling, synth waveform, scrim and allowed patterns.
export const THEMES = {
  arcade: {
    label: 'Arcade',
    colors: ['#ff2e63', '#08d9d6', '#ffe600', '#7cff4f', '#b967ff'],
    shapes: ['square'],
    text: '#ffe600', stroke: '#1a1a2e', shadow1: '#ff2e63', shadow2: '#1a1a2e',
    scrim: null, wave: 'square',
    patterns: ['volleys', 'rain', 'button'],
  },
  synthwave: {
    label: 'Synthwave',
    colors: ['#ff71ce', '#01cdfe', '#05ffa1', '#b967ff', '#fffb96'],
    shapes: ['square'],
    text: '#fffb96', stroke: '#2b0a4d', shadow1: '#ff71ce', shadow2: '#01cdfe',
    scrim: 'rgba(43,10,77,.35)', wave: 'sawtooth',
    patterns: ['rain', 'volleys', 'button'],
  },
  gameboy: {
    label: 'Game Boy',
    colors: ['#9bbc0f', '#8bac0f', '#306230', '#0f380f'],
    shapes: ['square'],
    text: '#9bbc0f', stroke: '#0f380f', shadow1: '#306230', shadow2: '#0f380f',
    scrim: 'rgba(15,56,15,.45)', wave: 'square',
    patterns: ['button', 'rain', 'volleys'],
  },
  casino: {
    label: 'Neon Casino',
    colors: ['#ffd700', '#ff1744', '#ffffff', '#00e676'],
    shapes: ['circle'],
    text: '#ffd700', stroke: '#4a0010', shadow1: '#ff1744', shadow2: '#4a0010',
    scrim: 'rgba(74,0,16,.3)', wave: 'triangle',
    patterns: ['button', 'volleys', 'rain'],
  },
};

export const JACKPOT_COLORS = ['#ffd700', '#fff3b0', '#ffb300', '#ffffff'];
