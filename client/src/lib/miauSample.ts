'use client';

const CAT_SAMPLE_URL = '/audio/gato-choro-397899.mp3'; // expected in client/public/audio

type SampleSlice = {
  start: number;
  end: number;
  duration: number;
};

let catBuffer: AudioBuffer | null = null;
let catSlices: SampleSlice[] = [];
let catLoadPromise: Promise<void> | null = null;
let lastCatIndex: number | null = null;

function analyzeCatBuffer(buffer: AudioBuffer): SampleSlice[] {
  const sampleRate = buffer.sampleRate;
  const channel = buffer.getChannelData(0);
  const totalSamples = channel.length;
  const windowSize = Math.max(1, Math.floor(sampleRate * 0.008));
  const activationThreshold = 0.02;
  const sustainThreshold = 0.012;
  const minSliceSamples = Math.floor(sampleRate * 0.12);
  const paddingSamples = Math.floor(sampleRate * 0.02);
  const silenceGap = Math.floor(sampleRate * 0.08);

  const slices: SampleSlice[] = [];
  let inSound = false;
  let startSample = 0;
  let lastLoudSample = 0;

  for (let i = 0; i < totalSamples; i += windowSize) {
    const winEnd = Math.min(totalSamples, i + windowSize);
    let max = 0;
    for (let j = i; j < winEnd; j += 1) {
      const abs = Math.abs(channel[j]);
      if (abs > max) max = abs;
    }

    if (!inSound && max >= activationThreshold) {
      inSound = true;
      startSample = Math.max(0, i - paddingSamples);
      lastLoudSample = i;
      continue;
    }

    if (inSound) {
      if (max >= sustainThreshold) {
        lastLoudSample = i;
      } else if (i - lastLoudSample > silenceGap) {
        const endSample = Math.min(totalSamples, lastLoudSample + paddingSamples * 2);
        if (endSample - startSample >= minSliceSamples) {
          slices.push({
            start: startSample / sampleRate,
            end: endSample / sampleRate,
            duration: (endSample - startSample) / sampleRate,
          });
        }
        inSound = false;
      }
    }
  }

  if (inSound) {
    const endSample = Math.min(totalSamples, lastLoudSample + paddingSamples * 2);
    if (endSample - startSample >= Math.floor(sampleRate * 0.08)) {
      slices.push({
        start: startSample / sampleRate,
        end: endSample / sampleRate,
        duration: (endSample - startSample) / sampleRate,
      });
    }
  }

  if (slices.length === 0) {
    const segment = buffer.duration / 3;
    return Array.from({ length: 3 }, (_, idx) => {
      const start = Math.max(0, idx * segment);
      const end = Math.min(buffer.duration, start + segment);
      return { start, end, duration: Math.max(0.08, end - start) };
    });
  }

  slices.sort((a, b) => a.start - b.start);

  if (slices.length > 3) {
    return slices
      .map((slice) => ({ slice, duration: slice.duration }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 3)
      .map((entry) => entry.slice)
      .sort((a, b) => a.start - b.start);
  }

  const result = [...slices];
  while (result.length < 3) {
    const longestIndex = result.reduce(
      (bestIdx, slice, idx) => (slice.duration > result[bestIdx].duration ? idx : bestIdx),
      0
    );
    const longest = result[longestIndex];
    const mid = (longest.start + longest.end) / 2;
    const first: SampleSlice = { start: longest.start, end: mid, duration: Math.max(0.06, mid - longest.start) };
    const second: SampleSlice = { start: mid, end: longest.end, duration: Math.max(0.06, longest.end - mid) };
    result.splice(longestIndex, 1, first, second);
    result.sort((a, b) => a.start - b.start);
  }

  return result.slice(0, 3);
}

export function preloadCatSamples(ctx: AudioContext | null): Promise<void> {
  if (!ctx || typeof window === 'undefined') return Promise.resolve();
  if (catBuffer && catSlices.length) return Promise.resolve();
  if (catLoadPromise) return catLoadPromise;

  const promise = (async () => {
    try {
      const response = await fetch(CAT_SAMPLE_URL);
      if (!response.ok) throw new Error(`Failed to fetch ${CAT_SAMPLE_URL}: ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
      catBuffer = decoded;
      catSlices = analyzeCatBuffer(decoded)
        .map((slice) => {
          const boundedStart = Math.max(0, slice.start);
          const boundedEnd = Math.min(decoded.duration, slice.end);
          return {
            start: boundedStart,
            end: boundedEnd,
            duration: Math.max(0.08, boundedEnd - boundedStart),
          };
        })
        .filter((slice) => slice.duration > 0.05);
      if (!catSlices.length) {
        catBuffer = null;
      }
      lastCatIndex = null;
    } catch (error) {
      console.error('Failed to load cat meow sample', error);
      catBuffer = null;
      catSlices = [];
      lastCatIndex = null;
      throw error;
    }
  })();

  catLoadPromise = promise;
  promise.catch(() => {});
  promise.finally(() => {
    if (catLoadPromise === promise) {
      catLoadPromise = null;
    }
  });
  return promise;
}

export function playRandomCatSample(
  ctx: AudioContext | null,
  destination: AudioNode | null,
  when: number
): boolean {
  if (!ctx || !destination || !catBuffer || !catSlices.length) return false;
  let index = Math.floor(Math.random() * catSlices.length);
  if (catSlices.length > 1 && lastCatIndex !== null) {
    let safeguard = 0;
    while (index === lastCatIndex && safeguard < 4) {
      index = Math.floor(Math.random() * catSlices.length);
      safeguard += 1;
    }
  }
  lastCatIndex = index;
  const slice = catSlices[index];
  const rawDuration = Math.max(0.1, slice.duration);
  const offset = Math.max(0, Math.min(slice.start, catBuffer.duration - 0.05));
  const duration = Math.min(rawDuration, catBuffer.duration - offset);
  if (duration <= 0) return false;

  const source = ctx.createBufferSource();
  source.buffer = catBuffer;
  const gain = ctx.createGain();
  const fadeIn = Math.min(0.03, duration / 4);
  const fadeOut = Math.min(0.08, duration / 3);

  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(0.7, when + fadeIn);
  gain.gain.linearRampToValueAtTime(0.6, when + Math.max(fadeIn, duration - fadeOut));
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration + 0.04);

  source.connect(gain).connect(destination);
  const playbackWindow = Math.min(duration + 0.02, catBuffer.duration - offset);
  source.start(when, offset, Math.max(0.05, playbackWindow));
  source.stop(when + duration + 0.06);
  return true;
}
