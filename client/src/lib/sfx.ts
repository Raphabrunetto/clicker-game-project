// client/src/lib/sfx.ts
'use client';

import { useEffect, useMemo, useState } from 'react';
import { playRandomCatSample, preloadCatSamples } from '@/lib/miauSample';

export type ClickVariant =
  | 'classic'
  | 'retro'
  | 'laser'
  | 'nebula'
  | 'pulse'
  | 'crystal'
  | 'nova'
  | 'quantum'
  | 'aurora'
  | 'glitch'
  | 'zenith'
  | 'stardust'
  | 'miau';

type SfxAPI = {
  click: () => void;
  stageUp: () => void;
  purchase: () => void;
  error: () => void;
  resume: () => Promise<void>;
  setMuted: (m: boolean) => void;
  getMuted: () => boolean;
};

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
let clickVariant: ClickVariant = 'classic';

type AudioWindow = typeof window & {
  webkitAudioContext?: typeof AudioContext;
};

function ensure() {
  if (!ctx) {
    const audioWindow = window as AudioWindow;
    const AC = audioWindow.AudioContext || audioWindow.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.2; // global volume
    master.connect(ctx.destination);
  }
}

async function resume() {
  ensure();
  if (ctx && ctx.state !== 'running') {
    await ctx.resume();
  }
  if (clickVariant === 'miau') {
    try {
      await preloadCatSamples(ctx);
    } catch {
      // ignore fetch/decode errors, fallback will handle
    }
  }
}

function now() {
  ensure();
  return ctx ? ctx.currentTime : 0;
}

function createOsc(freq: number, type: OscillatorType = 'triangle', when = now(), dur = 0.08, vol = 0.5) {
  if (!ctx || !master) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, when);
  gain.gain.setValueAtTime(0, when);
  gain.gain.linearRampToValueAtTime(vol, when + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  osc.connect(gain).connect(master);
  osc.start(when);
  osc.stop(when + dur + 0.02);
}

function createNoise(dur = 0.25, when = now(), vol = 0.2) {
  if (!ctx || !master) return;
  const sampleRate = ctx.sampleRate;
  const frameCount = Math.max(1, Math.floor(sampleRate * dur));
  const buffer = ctx.createBuffer(1, frameCount, sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0;
  for (let i = 0; i < frameCount; i += 1) {
    const white = Math.random() * 2 - 1;
    lastOut = (lastOut + 0.02 * white) / 1.02;
    data[i] = lastOut;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(vol, when + 0.02);
  gain.gain.linearRampToValueAtTime(vol * 0.6, when + dur * 0.4);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  noise.connect(gain).connect(master);
  noise.start(when);
  noise.stop(when + dur);
}

function clickClassic() {
  ensure();
  if (!ctx) return;
  const t = now();
  createOsc(220, 'triangle', t, 0.07, 0.4);
  createOsc(440, 'sine', t + 0.01, 0.03, 0.2);
}

function clickRetro() {
  ensure();
  if (!ctx) return;
  const t = now();
  createOsc(160, 'square', t, 0.085, 0.4);
  createOsc(320, 'square', t + 0.015, 0.05, 0.26);
  createOsc(640, 'triangle', t + 0.04, 0.04, 0.18);
}

function clickLaser() {
  ensure();
  if (!ctx || !master) return;
  const t = now();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(960, t);
  osc.frequency.exponentialRampToValueAtTime(320, t + 0.16);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.55, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  osc.connect(gain).connect(master);
  osc.start(t);
  osc.stop(t + 0.22);
  createOsc(1280, 'triangle', t + 0.05, 0.06, 0.18);
}

function clickNebula() {
  ensure();
  if (!ctx || !master) return;
  const t = now();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(280, t);
  osc.frequency.linearRampToValueAtTime(520, t + 0.14);
  osc.frequency.linearRampToValueAtTime(320, t + 0.28);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.45, t + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
  osc.connect(gain).connect(master);
  osc.start(t);
  osc.stop(t + 0.36);
  createOsc(780, 'triangle', t + 0.06, 0.09, 0.22);
}

function clickPulse() {
  ensure();
  if (!ctx) return;
  const t = now();
  createOsc(150, 'square', t, 0.08, 0.36);
  createOsc(220, 'square', t + 0.05, 0.06, 0.28);
  createOsc(110, 'sine', t + 0.03, 0.12, 0.2);
}

function clickCrystal() {
  ensure();
  if (!ctx) return;
  const t = now();
  createOsc(880, 'triangle', t, 0.08, 0.32);
  createOsc(1320, 'triangle', t + 0.02, 0.06, 0.26);
  createOsc(1760, 'sine', t + 0.05, 0.05, 0.18);
}

function clickNova() {
  ensure();
  if (!ctx || !master) return;
  const t = now();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(420, t);
  osc.frequency.exponentialRampToValueAtTime(1080, t + 0.08);
  osc.frequency.exponentialRampToValueAtTime(260, t + 0.22);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.55, t + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
  osc.connect(gain).connect(master);
  osc.start(t);
  osc.stop(t + 0.28);
  createOsc(1280, 'square', t + 0.05, 0.07, 0.22);
}

function clickQuantum() {
  ensure();
  if (!ctx || !master) return;
  const t = now();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(240, t);
  osc.frequency.setValueAtTime(360, t + 0.04);
  osc.frequency.setValueAtTime(540, t + 0.08);
  osc.frequency.setValueAtTime(810, t + 0.12);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.42, t + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  osc.connect(gain).connect(master);
  osc.start(t);
  osc.stop(t + 0.2);
  createOsc(960, 'triangle', t + 0.1, 0.05, 0.18);
}

function clickAurora() {
  ensure();
  if (!ctx || !master) return;
  const t = now();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(320, t);
  osc.frequency.linearRampToValueAtTime(440, t + 0.12);
  osc.frequency.linearRampToValueAtTime(280, t + 0.28);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.4, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
  osc.connect(gain).connect(master);
  osc.start(t);
  osc.stop(t + 0.34);
  createOsc(640, 'sine', t + 0.08, 0.12, 0.18);
  createOsc(960, 'sine', t + 0.15, 0.08, 0.15);
}

function clickGlitch() {
  ensure();
  if (!ctx || !master) return;
  const baseCtx = ctx;
  const baseMaster = master;
  const t = now();
  [0, 0.03, 0.06].forEach((offset, idx) => {
    const osc = baseCtx.createOscillator();
    const gain = baseCtx.createGain();
    osc.type = idx === 1 ? 'square' : 'sawtooth';
    osc.frequency.setValueAtTime(200 + idx * 160, t + offset);
    gain.gain.setValueAtTime(0, t + offset);
    gain.gain.linearRampToValueAtTime(0.4 - idx * 0.08, t + offset + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + offset + 0.05);
    osc.connect(gain).connect(baseMaster);
    osc.start(t + offset);
    osc.stop(t + offset + 0.07);
  });
  createOsc(960, 'square', t + 0.05, 0.03, 0.2);
}

function clickZenith() {
  ensure();
  if (!ctx) return;
  const t = now();
  createOsc(256, 'sine', t, 0.1, 0.3);
  createOsc(384, 'sine', t + 0.05, 0.09, 0.26);
  createOsc(512, 'triangle', t + 0.1, 0.08, 0.22);
  createOsc(768, 'triangle', t + 0.15, 0.06, 0.18);
}

function clickStardust() {
  ensure();
  if (!ctx) return;
  const t = now();
  createOsc(680, 'triangle', t, 0.06, 0.28);
  createOsc(960, 'sine', t + 0.025, 0.06, 0.22);
  createOsc(1280, 'triangle', t + 0.05, 0.08, 0.18);
  createOsc(1520, 'sine', t + 0.08, 0.05, 0.15);
}

function playProceduralMiau(t: number) {
  if (!ctx || !master) return;
  const base = ctx.createOscillator();
  const startFreq = 260 + Math.random() * 50;
  const peakFreq = 520 + Math.random() * 80;
  const tailFreq = 210 + Math.random() * 40;
  base.type = 'sawtooth';
  base.frequency.setValueAtTime(startFreq, t);
  base.frequency.exponentialRampToValueAtTime(peakFreq, t + 0.12);
  base.frequency.exponentialRampToValueAtTime(tailFreq, t + 0.4);

  const formantA = ctx.createBiquadFilter();
  formantA.type = 'bandpass';
  formantA.Q.setValueAtTime(7, t);
  formantA.frequency.setValueAtTime(780, t);
  formantA.frequency.linearRampToValueAtTime(1180, t + 0.08);
  formantA.frequency.linearRampToValueAtTime(600, t + 0.28);

  const formantE = ctx.createBiquadFilter();
  formantE.type = 'bandpass';
  formantE.Q.setValueAtTime(5.5, t);
  formantE.frequency.setValueAtTime(1500, t);
  formantE.frequency.linearRampToValueAtTime(2100, t + 0.06);
  formantE.frequency.linearRampToValueAtTime(950, t + 0.34);

  const mixGain = ctx.createGain();
  mixGain.gain.setValueAtTime(0.6, t);

  base.connect(formantA).connect(mixGain);
  base.connect(formantE).connect(mixGain);

  const vocalGain = ctx.createGain();
  vocalGain.gain.setValueAtTime(0.0001, t);
  vocalGain.gain.exponentialRampToValueAtTime(0.6, t + 0.05);
  vocalGain.gain.linearRampToValueAtTime(0.4, t + 0.18);
  vocalGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.58);

  mixGain.connect(vocalGain).connect(master);

  const bodyGain = ctx.createGain();
  bodyGain.gain.setValueAtTime(0.0001, t);
  bodyGain.gain.exponentialRampToValueAtTime(0.22, t + 0.04);
  bodyGain.gain.linearRampToValueAtTime(0.16, t + 0.24);
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
  base.connect(bodyGain).connect(master);

  const vibrato = ctx.createOscillator();
  const vibratoGain = ctx.createGain();
  vibrato.type = 'sine';
  vibrato.frequency.setValueAtTime(6.5, t);
  vibratoGain.gain.setValueAtTime(12, t);
  vibratoGain.gain.linearRampToValueAtTime(3, t + 0.32);
  vibrato.connect(vibratoGain).connect(base.frequency);

  base.start(t);
  base.stop(t + 0.6);
  vibrato.start(t);
  vibrato.stop(t + 0.6);

  const chirp = ctx.createOscillator();
  const chirpGain = ctx.createGain();
  chirp.type = 'triangle';
  chirp.frequency.setValueAtTime(1000, t + 0.08);
  chirp.frequency.exponentialRampToValueAtTime(520, t + 0.24);
  chirpGain.gain.setValueAtTime(0.0001, t + 0.08);
  chirpGain.gain.exponentialRampToValueAtTime(0.3, t + 0.12);
  chirpGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
  chirp.connect(chirpGain).connect(master);
  chirp.start(t + 0.08);
  chirp.stop(t + 0.35);

  createOsc(620, 'triangle', t + 0.16, 0.18, 0.18);
  createOsc(300, 'sine', t + 0.28, 0.22, 0.12);
  createNoise(0.32, t + 0.04, 0.12);
}

function clickMiau() {
  ensure();
  if (!ctx || !master) return;
  const t = now();
  preloadCatSamples(ctx).catch(() => {});
  if (playRandomCatSample(ctx, master, t)) return;
  playProceduralMiau(t);
}

const CLICK_VARIANT_HANDLERS: Record<ClickVariant, () => void> = {
  classic: clickClassic,
  retro: clickRetro,
  laser: clickLaser,
  nebula: clickNebula,
  pulse: clickPulse,
  crystal: clickCrystal,
  nova: clickNova,
  quantum: clickQuantum,
  aurora: clickAurora,
  glitch: clickGlitch,
  zenith: clickZenith,
  stardust: clickStardust,
  miau: clickMiau,
};

function click() {
  ensure();
  if (!ctx) return;
  const handler = CLICK_VARIANT_HANDLERS[clickVariant] ?? clickClassic;
  handler();
}

function stageUp() {
  ensure();
  if (!ctx) return;
  const t = now() + 0.02;
  // ascending triad C4 E4 G4
  createOsc(261.63, 'sine', t + 0.00, 0.18, 0.35);
  createOsc(329.63, 'sine', t + 0.12, 0.18, 0.3);
  createOsc(392.0, 'sine', t + 0.24, 0.25, 0.25);
}

function purchase() {
  ensure();
  if (!ctx) return;
  const t = now() + 0.01;
  // short up-interval
  createOsc(392.0, 'triangle', t, 0.09, 0.35);
  createOsc(523.25, 'triangle', t + 0.08, 0.12, 0.3);
}

function errorTone() {
  ensure();
  if (!ctx) return;
  const t = now();
  // down gliss
  createOsc(300, 'sawtooth', t, 0.12, 0.28);
  createOsc(180, 'sawtooth', t + 0.08, 0.14, 0.22);
}

function setMuted(m: boolean) {
  muted = m;
  if (master) master.gain.value = muted ? 0 : 0.2;
  try { localStorage.setItem('clicker:sfx-muted', muted ? '1' : '0'); } catch {}
}

function getMuted() { return muted; }

export function initMutedFromStorage() {
  try { muted = localStorage.getItem('clicker:sfx-muted') === '1'; } catch {}
}

export function setClickVariant(variant: ClickVariant) {
  clickVariant = variant;
  if (variant === 'miau') {
    preloadCatSamples(ctx).catch(() => {});
  }
}

export function getClickVariant(): ClickVariant {
  return clickVariant;
}

export function getSfx(): SfxAPI {
  return {
    click,
    stageUp,
    purchase,
    error: errorTone,
    resume,
    setMuted,
    getMuted,
  };
}

export function useSfx() {
  const api = useMemo(() => getSfx(), []);
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    initMutedFromStorage();
    return getMuted();
  });

  useEffect(() => {
    // keep local state in sync with global mute
    api.setMuted(isMuted);
  }, [api, isMuted]);

  return {
    click: api.click,
    stageUp: api.stageUp,
    purchase: api.purchase,
    error: api.error,
    resume: api.resume,
    muted: isMuted,
    toggleMute: () => setIsMuted((v) => !v),
    setMuted: setIsMuted,
  } as const;
}
