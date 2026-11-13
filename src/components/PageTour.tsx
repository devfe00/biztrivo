import { useEffect, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { RotateCcw, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { TOUR_TARGETS, hasSeenTour, markTourSeen, resetTours, tourCopy, tourLabels } from '@/lib/page-tours';

const REPLAY_EVENT = 'biztrivo:replay-tours';

export function ReplayTutorials({ uid }: { uid: string }) {
  const { lang } = useI18n();
  return <Button variant="outline" data-tour="replay" onClick={() => {
    resetTours(uid);
    window.dispatchEvent(new Event(REPLAY_EVENT));
  }}><RotateCcw className="h-4 w-4 mr-2" />{tourLabels[lang].replay}</Button>;
}

export default function PageTour({ uid, path, ready }: { uid: string; path: string; ready: boolean }) {
  const { lang } = useI18n();
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const replay = () => setRevision(value => value + 1);
    window.addEventListener(REPLAY_EVENT, replay);
    return () => window.removeEventListener(REPLAY_EVENT, replay);
  }, []);

  useEffect(() => {
    const definitions = TOUR_TARGETS[path];
    if (!ready || !definitions || hasSeenTour(uid, path)) return;
    let disposed = false;
    let started = false;
    let controls: Root | undefined;
    let tour: ReturnType<typeof driver> | undefined;
    const previousFocus = document.activeElement;
    const labels = tourLabels[lang];
    const start = () => {
      if (disposed || started) return;
      const scope = document.querySelector('[data-tour-page]');
      if (!scope || document.querySelector('[role="dialog"]')) return;
      const steps = definitions.flatMap(({ target, copy }) => {
        const element = scope.querySelector(target);
        const content = tourCopy(path === '/mei' || path === '/das-mei' ? 'pt' : lang, copy);
        if (!(element instanceof HTMLElement) || !element.getClientRects().length || !content) return [];
        return [{ element, popover: { title: content[0], description: content[1] } }];
      });
      // Wait for loading/conditional targets, rather than displaying an unanchored tip.
      if (steps.length !== definitions.length) return;
      started = true;
      const overlay = getComputedStyle(document.documentElement).getPropertyValue('--tour-overlay').trim();
      tour = driver({
        steps, animate: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        smoothScroll: false, allowClose: true, overlayClickBehavior: 'close',
        disableActiveInteraction: true, overlayColor: `hsl(${overlay})`, overlayOpacity: 0.65,
        stagePadding: 6, stageRadius: 8, popoverOffset: 12,
        popoverClass: 'biztrivo-tour', showProgress: true, progressText: labels.progress,
        showButtons: [],
        onPopoverRender: popover => {
          controls?.unmount();
          popover.wrapper.setAttribute('role', 'dialog');
          popover.wrapper.setAttribute('aria-modal', 'true');
          popover.wrapper.setAttribute('aria-label', popover.title.textContent || 'Biztrivo');
          popover.closeButton.style.display = 'none';
          popover.footer.style.display = 'flex';
          popover.footerButtons.innerHTML = '';
          controls = createRoot(popover.footerButtons);
          const index = tour?.getActiveIndex() ?? 0;
          controls.render(<div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => tour?.destroy()}>{labels.skip}</Button>
            {index > 0 && <Button variant="ghost" size="icon" title={labels.previous} aria-label={labels.previous} onClick={() => tour?.movePrevious()}><ArrowLeft className="h-4 w-4" /></Button>}
            <Button size="sm" autoFocus onClick={() => tour?.moveNext()}>{index === steps.length - 1 ? labels.done : labels.next}<ArrowRight className="ml-2 h-4 w-4" /></Button>
          </div>);
          popover.wrapper.onkeydown = event => {
            if (event.key !== 'Tab') return;
            const buttons = Array.from(popover.wrapper.querySelectorAll<HTMLButtonElement>('button:not([disabled])')).filter(button => button.getClientRects().length);
            const first = buttons[0];
            const last = buttons[buttons.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
          };
        },
        onDestroyed: () => {
          controls?.unmount();
          controls = undefined;
          if (!disposed) {
            markTourSeen(uid, path);
            if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
          }
        },
      });
      tour.drive();
    };
    // Poll only while mounting to allow page animations and asynchronous data to settle.
    const timeout = window.setTimeout(start, 700);
    const interval = window.setInterval(start, 500);
    return () => {
      disposed = true;
      window.clearTimeout(timeout);
      window.clearInterval(interval);
      tour?.destroy();
      controls?.unmount();
    };
  }, [uid, path, ready, lang, revision]);
  return null;
}