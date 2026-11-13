import React, { useEffect, useId, useRef } from 'react';

const paths = {
    bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
    search: 'm21 21-4.5-4.5M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
    arrow: 'M5 12h14m-5-5 5 5-5 5',
    back: 'M19 12H5m5-5-5 5 5 5',
    expand: 'M14 3h7v7m0-7-9 9M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5',
    panel: 'M4 4h16v16H4ZM14 4v16',
    close: 'm6 6 12 12M6 18 18 6',
    refresh: 'M20 7v5h-5M4 17v-5h5m-4.5-4a8 8 0 0 1 13-3L20 8M4 16l2.5 3a8 8 0 0 0 13-3',
    plus: 'M12 5v14M5 12h14',
    edit: 'm16 3 5 5-12 12-6 1 1-6ZM14 5l5 5',
    file: 'M14 2H5v20h14V7ZM14 2v6h5M8 12h8M8 16h6',
    grid: 'M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z',
    check: 'm5 12 4 4L19 6',
    clock: 'M12 8v4l3 2m7-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
    link: 'm10 13 4-4M8 16l-2 2a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m4 0 2-2a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0',
    menu: 'M4 6h16M4 12h16M4 18h16',
    help: 'M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3m0 3h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
    chevron: 'm9 5 7 7-7 7',
};

export function Glyph({ name, size = 18, className = '' }: { name: keyof typeof paths; size?: number; className?: string }) {
    return <svg className={'workspace-glyph ' + className} width={size} height={size} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.7' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'><path d={paths[name]} /></svg>;
}

export function Skeleton({ rows = 5 }: { rows?: number }) {
    return <div className='workspace-skeleton' role='status' aria-label='Loading records'><span className='sr-only'>Loading records…</span>{Array.from({ length: rows }, (_, i) => <div key={i}><i /><i /><i /></div>)}</div>;
}

/** Shared dialog: trap focus, lock background scrolling, and return focus to its opener. */
export function WorkspaceDialog({ title, children, onClose, busy = false, className = '', tools }: {
    title: string; children: React.ReactNode; onClose: () => void; busy?: boolean; className?: string; tools?: React.ReactNode;
}) {
    const id = useId();
    const ref = useRef<HTMLElement>(null);
    const close = useRef(onClose);
    const locked = useRef(busy);
    close.current = onClose;
    locked.current = busy;
    useEffect(() => {
        const opener = document.activeElement as HTMLElement;
        const overflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const focusable = () => Array.from(ref.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]') || []).filter(el => el.getClientRects().length);
        const frame = requestAnimationFrame(() => ref.current?.focus());
        const keydown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !locked.current) { event.preventDefault(); event.stopPropagation(); close.current(); }
            if (event.key === 'Tab') {
                const items = focusable(); const first = items[0]; const last = items[items.length - 1];
                if (!first) { event.preventDefault(); ref.current?.focus(); return; }
                if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { event.preventDefault(); last.focus(); }
                else if (!event.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) { event.preventDefault(); first.focus(); }
            }
        };
        const containFocus = (event: FocusEvent) => { if (!ref.current?.contains(event.target as Node)) ref.current?.focus(); };
        document.addEventListener('keydown', keydown);
        document.addEventListener('focusin', containFocus);
        return () => {
            cancelAnimationFrame(frame);
            document.removeEventListener('keydown', keydown);
            document.removeEventListener('focusin', containFocus);
            document.body.style.overflow = overflow;
            if (opener?.isConnected) opener.focus();
        };
    }, []);
    return <div className='workspace-modal-backdrop' onClick={event => { if (event.target === event.currentTarget && !locked.current) onClose(); }}>
        <section ref={ref} tabIndex={-1} role='dialog' aria-modal='true' aria-labelledby={id} className={'workspace-modal ' + className}>
            <header className='dialog-header'><div><span className='workspace-eyebrow'>SUKUN WORKSPACE</span><h2 id={id}>{title}</h2></div><div className='dialog-tools'>{tools}<button type='button' className='icon-button' aria-label='Close dialog' disabled={busy} onClick={onClose}><Glyph name='close' /></button></div></header>
            {children}
        </section>
    </div>;
}
