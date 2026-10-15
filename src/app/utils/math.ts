export type Ease = (t: number) => number;

export const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
export const rand = (a: number, b: number) => a + Math.random() * (b - a);
export const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export const linear: Ease = t => t;
export const easeInOutQuad: Ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
export const easeOutQuad: Ease = t => 1 - Math.pow(1 - t, 2);
export const easeInOutQuint: Ease = t => t < .5 ? 16 * Math.pow(t, 5) : 1 - Math.pow(-2 * t + 2, 5) / 2;
export const easeOutCubic: Ease = t => 1 - Math.pow(1 - t, 3);
export const easeOutBack: Ease = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
