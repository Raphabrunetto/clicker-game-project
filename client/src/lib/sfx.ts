// client/src/lib/sfx.ts
'use client';

import { useEffect, useMemo, useState } from 'react';

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

function ensure() {
  if (!ctx) {
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
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

function click() {
  ensure();
  if (!ctx) return;
  const t = now();
  // short percussive blip + slight freq glide
  createOsc(220, 'triangle', t, 0.07, 0.4);
  createOsc(440, 'sine', t + 0.01, 0.03, 0.2);
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

