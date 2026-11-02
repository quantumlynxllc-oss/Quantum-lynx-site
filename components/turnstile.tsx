'use client';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
type Turnstile = { render: (element: HTMLElement, options: Record<string, unknown>) => string; remove: (id: string) => void; reset: (id: string) => void };
let loader: Promise<Turnstile> | undefined;
function loadTurnstile() {
  loader ??= new Promise<Turnstile>((resolve, reject) => {
    const w = window as Window & { turnstile?: Turnstile };
    if (w.turnstile) { resolve(w.turnstile); return; }
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true; script.defer = true;
    script.onload = () => w.turnstile ? resolve(w.turnstile) : reject(new Error('Verification unavailable'));
    script.onerror = () => { loader = undefined; script.remove(); reject(new Error('Verification unavailable')); };
    document.head.append(script);
  });
  return loader;
}
export type TurnstileHandle = { token: () => Promise<string>; reset: () => void };
export const TurnstileField = forwardRef<TurnstileHandle, { siteKey: string }>(function TurnstileField({ siteKey }, ref) {
  const element = useRef<HTMLDivElement>(null);
  const value = useRef('');
  const widget = useRef<string | null>(null);
  const api = useRef<Turnstile | null>(null);
  useImperativeHandle(ref, () => ({
    async token() {
      // Allow a slow connection to finish verification without discarding input.
      for (let i = 0; i < 40; i++) {
        if (value.current) return value.current;
        await new Promise(resolve => setTimeout(resolve, 250));
      }
      throw new Error('Verification unavailable');
    },
    reset() { value.current = ''; if (api.current && widget.current) api.current.reset(widget.current); }
  }), []);
  useEffect(() => {
    let active = true;
    if (!siteKey) return;
    loadTurnstile().then(turnstile => {
      if (!active || !element.current) return;
      api.current = turnstile;
      widget.current = turnstile.render(element.current, {
        sitekey: siteKey, appearance: 'interaction-only', action: 'lead', theme: 'auto',
        callback: (token: string) => { value.current = token; },
        'expired-callback': () => { value.current = ''; },
        'error-callback': () => { value.current = ''; }
      });
    }).catch(() => { value.current = ''; });
    return () => { active = false; if (api.current && widget.current) api.current.remove(widget.current); widget.current = null; };
  }, [siteKey]);
  return <div ref={element} className="ql-turnstile" />;
});
