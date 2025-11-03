// client/src/lib/sfx.ts
'use client';

import { useEffect, useMemo, useState } from 'react';

export type ClickVariant = 'classic' | 'retro' | 'laser';

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

function click() {
  ensure();
  if (!ctx) return;
  switch (clickVariant) {
    case 'retro':
      clickRetro();
      break;
    case 'laser':
      clickLaser();
      break;
    default:
      clickClassic();
      break;
  }
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
