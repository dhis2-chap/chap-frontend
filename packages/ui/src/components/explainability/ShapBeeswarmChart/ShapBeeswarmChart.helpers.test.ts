import { describe, it, expect } from 'vitest';
import { interpolateColor, jitterForKey } from './ShapBeeswarmChart';

describe('interpolateColor', () => {
    it('returns the start color (blue) at t=0', () => {
        expect(interpolateColor(0)).toBe('rgb(66,165,245)');
    });

    it('returns the end color (red) at t=1', () => {
        expect(interpolateColor(1)).toBe('rgb(239,83,80)');
    });

    it('returns a midpoint color at t=0.5', () => {
        expect(interpolateColor(0.5)).toBe('rgb(153,124,163)');
    });

    it('produces RGB values within 0–255', () => {
        for (const t of [0, 0.25, 0.5, 0.75, 1]) {
            const match = interpolateColor(t).match(/rgb\((\d+),(\d+),(\d+)\)/);
            expect(match).not.toBeNull();
            const [r, g, b] = match!.slice(1).map(Number);
            for (const c of [r, g, b]) {
                expect(c).toBeGreaterThanOrEqual(0);
                expect(c).toBeLessThanOrEqual(255);
            }
        }
    });
});

describe('jitterForKey', () => {
    it('returns the same value for the same key (deterministic)', () => {
        expect(jitterForKey('orgA|2024-01|rainfall')).toBe(jitterForKey('orgA|2024-01|rainfall'));
    });

    it('returns different values for different keys', () => {
        const a = jitterForKey('a');
        const b = jitterForKey('b');
        expect(a).not.toBe(b);
    });

    it('stays within the bounded jitter range [-0.15, 0.15]', () => {
        const samples = [
            '', 'a', 'orgA|2024-01|x', 'orgB|2024-12|temperature_max',
            'long-string-with-many-characters-asdfghjkl',
        ];
        for (const s of samples) {
            const j = jitterForKey(s);
            expect(j).toBeGreaterThanOrEqual(-0.15);
            expect(j).toBeLessThanOrEqual(0.15);
        }
    });

    it('handles empty string', () => {
        expect(jitterForKey('')).toBeCloseTo(-0.15, 5);
    });
});
