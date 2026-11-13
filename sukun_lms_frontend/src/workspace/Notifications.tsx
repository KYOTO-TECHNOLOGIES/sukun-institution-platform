import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AuthContext from '../contexts/authContext';
import { authAxios } from '../axiosInstance';
import { Glyph, Skeleton, WorkspaceDialog } from './WorkspaceUI';
import SearchableSelect from '../components/SearchableSelect';
import './notifications.css';

type InboxItem = { id: string; module: string; module_label: string; title: string; message: string; href: string; attention: boolean; created_at: string; read_at: string | null };
type Preferences = { toasts_enabled: boolean; muted_modules: string[] };
type Summary = { unread_count: number; preferences: Preferences; modules: { key: string; label: string }[] };
type Connection = 'connecting' | 'live' | 'reconnecting';
type Context = { summary?: Summary; connection: Connection; error: boolean; refresh: () => void; read: (id: string) => Promise<void>; readAll: () => Promise<void>; savePreferences: (value: Partial<Preferences>) => Promise<void> };
const NotificationContext = createContext<Context>({} as Context);
const endpoint = '/api/notifications/';
const listOf = (data: any): InboxItem[] => data.results || data;
const cachePrefixes = new Set(['workspace', 'workspace-detail', 'options', 'institution-dashboard', 'portal', 'portal-course', 'student-profile']);
const failure = 'Could not save that change. Please try again.';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { userData } = useContext(AuthContext);
    const userId = userData?.id;
    const cache = useQueryClient();
    const navigate = useNavigate();
    const navigateRef = useRef(navigate);
    navigateRef.current = navigate;
    const [connection, setConnection] = useState<Connection>('connecting');
    const query = useQuery<Summary>({
        queryKey: ['notifications', userId, 'summary'], enabled: !!userId,
        queryFn: () => authAxios.get(endpoint + 'summary/').then(r => r.data),
        staleTime: 0, refetchInterval: 30000, retry: 1,
    });
    const preferences = useRef<Preferences>();
    preferences.current = query.data?.preferences;
    const refresh = useCallback(() => { void cache.invalidateQueries({ queryKey: ['notifications', userId] }); }, [cache, userId]);
    const read = useCallback(async (id: string) => { await authAxios.post(endpoint + id + '/read/'); refresh(); }, [refresh]);
    const readAll = useCallback(async () => { await authAxios.post(endpoint + 'read-all/'); refresh(); }, [refresh]);
    const savePreferences = useCallback(async (value: Partial<Preferences>) => {
        const key = ['notifications', userId, 'summary'];
        const previous = cache.getQueryData<Summary>(key);
        void cache.cancelQueries({ queryKey: key });
        if (previous) {
            preferences.current = { ...previous.preferences, ...value };
            cache.setQueryData<Summary>(key, { ...previous, preferences: preferences.current });
        }
        try {
            const { data } = await authAxios.patch(endpoint + 'preferences/', value);
            preferences.current = data;
            cache.setQueryData<Summary>(key, current => current ? { ...current, preferences: data } : current);
        } catch (error) {
            preferences.current = previous?.preferences;
            if (previous) cache.setQueryData(key, previous);
            throw error;
        } finally { refresh(); }
    }, [cache, userId, refresh]);

    useEffect(() => {
        if (!userId) return;
        let stopped = false;
        let socket: WebSocket | undefined;
        let reconnect: ReturnType<typeof setTimeout> | undefined;
        let heartbeat: ReturnType<typeof setInterval> | undefined;
        let lastPong = Date.now();
        let attempt = 0;
        const seen = new Set<string>();
        const liveToasts = new Set<string>();
        const sync = () => { if (!stopped) refresh(); };
        const schedule = () => {
            if (stopped || reconnect) return;
            setConnection('reconnecting');
            reconnect = setTimeout(() => { reconnect = undefined; void connect(); }, Math.min(30000, 1000 * 2 ** attempt++) + Math.random() * 500);
        };
        const changed = async (event: { ids?: string[]; reason?: string }) => {
            sync();
            if (event.reason !== 'created') return;
            void cache.invalidateQueries({ predicate: entry => cachePrefixes.has(String(entry.queryKey[0])) });
            const ids = (event.ids || []).filter(id => !seen.has(id));
            ids.forEach(id => seen.add(id));
            if (seen.size > 1000) { const keep = [...seen].slice(-500); seen.clear(); keep.forEach(id => seen.add(id)); }
            if (!ids.length || document.visibilityState !== 'visible') return;
            try {
                const { data } = await authAxios.get(endpoint, { params: { ids: ids.join(','), page_size: 100 } });
                if (stopped) return;
                const pref = preferences.current;
                if (!pref?.toasts_enabled) return;
                const important = listOf(data).filter(item => item.attention && !item.read_at && !pref.muted_modules.includes(item.module));
                if (!important.length || liveToasts.size >= 3) return;
                const first = important[0];
                const toastId = 'inbox-' + first.id;
                liveToasts.add(toastId);
                toast.info(<div className='notification-toast'>
                    <strong>{important.length > 1 ? important.length + ' new updates need your attention' : first.title}</strong>
                    <p>{important.length > 1 ? 'Open your inbox to review them together.' : first.module_label}</p>
                    <button onClick={() => { toast.dismiss(toastId); navigateRef.current('/notifications'); }}>Open inbox <span aria-hidden='true'>→</span></button>
                </div>, { toastId, autoClose: 6500, closeOnClick: false, onClose: () => liveToasts.delete(toastId) });
            } catch { /* The persistent inbox and polling recover a missed delivery. */ }
        };
        const connect = async () => {
            try {
                // Refresh an expired access cookie before the browser's cookie-only handshake.
                await authAxios.get('/api/auth/me/');
                if (stopped) return;
                setConnection(attempt ? 'reconnecting' : 'connecting');
                const url = new URL('/ws/notifications/', window.location.origin);
                url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
                socket = new WebSocket(url);
                socket.onmessage = message => {
                    if (stopped) return;
                    let event: any;
                    try { event = JSON.parse(message.data); } catch { return; }
                    if (event.type === 'notifications.ready') {
                        attempt = 0; lastPong = Date.now(); setConnection('live'); sync();
                        heartbeat = setInterval(() => {
                            if (Date.now() - lastPong > 65000) socket?.close();
                            else if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'ping' }));
                        }, 25000);
                    } else if (event.type === 'pong') lastPong = Date.now();
                    else if (event.type === 'notifications.changed') void changed(event);
                };
                socket.onerror = () => socket?.close();
                socket.onclose = () => { clearInterval(heartbeat); schedule(); };
            } catch { schedule(); }
        };
        const visible = () => {
            if (document.visibilityState !== 'visible') return;
            sync();
            if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'ping' }));
        };
        setConnection('connecting');
        void connect();
        document.addEventListener('visibilitychange', visible);
        window.addEventListener('online', visible);
        return () => {
            stopped = true; clearTimeout(reconnect); clearInterval(heartbeat);
            if (socket) { socket.onclose = null; socket.close(); }
            liveToasts.forEach(id => toast.dismiss(id));
            document.removeEventListener('visibilitychange', visible);
            window.removeEventListener('online', visible);
        };
    }, [userId, cache, refresh]);

    return <NotificationContext.Provider value={{ summary: query.data, connection, error: query.isError, refresh, read, readAll, savePreferences }}>{children}</NotificationContext.Provider>;
}

function ConnectionStatus() {
    const { connection, error } = useContext(NotificationContext);
    const live = connection === 'live' && !error;
    return <span className={'notification-connection ' + (live ? 'is-live' : '')} title={live ? 'Your inbox updates automatically' : 'Reconnecting automatically. Your saved notifications remain in the inbox.'}><i />{live ? 'Live updates' : error ? 'Waiting for connection' : connection === 'connecting' ? 'Connecting…' : 'Reconnecting…'}</span>;
}

export function NotificationBell() {
    const { summary } = useContext(NotificationContext);
    const [open, setOpen] = useState(false);
    const count = summary?.unread_count || 0;
    return <>
        <button className='notification-bell' aria-label={'Notifications' + (count ? ', ' + count + ' unread' : '')} aria-haspopup='dialog' onClick={() => setOpen(true)}>
            <Glyph name='bell' size={20} />{count > 0 && <span className='notification-badge' aria-hidden='true'>{count > 99 ? '99+' : count}</span>}
        </button>
        {open && createPortal(<div className='workspace notification-portal'><WorkspaceDialog title='Your notifications' className='notification-dialog' onClose={() => setOpen(false)} tools={<Link to='/notifications' className='icon-button' onClick={() => setOpen(false)} aria-label='Open full inbox'><Glyph name='expand' /></Link>}>
            <div className='notification-dialog-status'><ConnectionStatus /><span>{count} unread</span></div>
            <InboxList compact onNavigate={() => setOpen(false)} />
            <div className='notification-dialog-footer'><Link to='/notifications' onClick={() => setOpen(false)}>View all notifications <Glyph name='arrow' /></Link><span>Only important updates show a popup.</span></div>
        </WorkspaceDialog></div>, document.body)}
    </>;
}

function when(value: string) {
    const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return minutes + 'm ago';
    if (minutes < 1440) return Math.floor(minutes / 60) + 'h ago';
    return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function InboxList({ compact = false, onNavigate }: { compact?: boolean; onNavigate?: () => void }) {
    const { userData } = useContext(AuthContext);
    const { summary, read, readAll } = useContext(NotificationContext);
    const [params, setParams] = useSearchParams();
    const [previewUnread, setPreviewUnread] = useState(false);
    const unread = compact ? previewUnread : params.get('unread') === 'true';
    const module = compact ? '' : params.get('module') || '';
    const page = compact ? 1 : Math.max(1, Number(params.get('page')) || 1);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const navigate = useNavigate();
    const query = useQuery({
        queryKey: ['notifications', userData?.id, 'list', { unread, module, page, compact }],
        queryFn: () => authAxios.get(endpoint, { params: { unread, module, page, page_size: compact ? 6 : 20 } }).then(r => r.data),
        staleTime: 0, refetchInterval: 30000,
    });
    const filter = (value: Record<string, string>) => { const next = new URLSearchParams(params); Object.entries(value).forEach(([key, val]) => val ? next.set(key, val) : next.delete(key)); next.delete('page'); setParams(next); };
    const act = async (fn: () => Promise<void>) => { setBusy(true); setError(''); try { await fn(); return true; } catch { setError(failure); return false; } finally { setBusy(false); } };
    const open = async (item: InboxItem) => {
        if (!await act(() => read(item.id))) return;
        if (item.href) { onNavigate?.(); navigate(item.href); }
    };
    const items = query.data ? listOf(query.data) : [];
    return <>
        <div className='notification-toolbar'>
            <div className='notification-filters' aria-label='Filter notifications'>
                <button className={!unread ? 'is-selected' : ''} aria-pressed={!unread} onClick={() => compact ? setPreviewUnread(false) : filter({ unread: '' })}>All</button>
                <button className={unread ? 'is-selected' : ''} aria-pressed={unread} onClick={() => compact ? setPreviewUnread(true) : filter({ unread: 'true' })}>Unread {summary?.unread_count ? <span>{summary.unread_count}</span> : null}</button>
            </div>
            {!compact && <div className='notification-module-filter'><SearchableSelect ariaLabel='Filter by module' value={module} placeholder='All modules' options={(summary?.modules||[]).map(item=>({value:item.key,label:item.label}))} onChange={next=>filter({module:next as string})}/></div>}
            <button className='notification-mark-all' disabled={busy || !summary?.unread_count} onClick={() => void act(readAll)}><Glyph name='check' size={16} /> Mark all read</button>
        </div>
        {error && <div className='workspace-error' role='alert'>{error}</div>}
        {query.isLoading ? <Skeleton rows={compact ? 3 : 5} /> : query.isError ? <div className='workspace-empty'><h3>We couldn't load your inbox</h3><p>Your notifications are saved. Try again when your connection returns.</p><button onClick={() => void query.refetch()}>Try again</button></div> : !items.length ? <div className='notification-empty'><span><Glyph name={unread ? 'check' : 'bell'} size={28} /></span><h3>{unread ? "You're all caught up" : 'A quieter place for updates'}</h3><p>{unread ? 'No unread notifications in this view.' : 'Updates for your modules, tasks, and notices will appear here.'}</p></div> :
            <ul className='notification-list'>{items.map(item => <li key={item.id} className={item.read_at ? '' : 'is-unread'}>
                <span className={'notification-kind ' + (item.attention ? 'needs-attention' : '')}><Glyph name={item.attention ? 'bell' : 'file'} size={18} /></span>
                <div className='notification-content'><div className='notification-meta'><span>{item.module_label}</span><time dateTime={item.created_at} title={new Date(item.created_at).toLocaleString()}>{when(item.created_at)}</time></div>
                    <h3>{item.title}{!item.read_at && <span className='notification-unread-dot' aria-label='Unread' />}</h3><p>{item.message}</p>
                    {item.href && <Link className='notification-open' to={item.href} aria-disabled={busy} onClick={event => { if (busy) { event.preventDefault(); return; } if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) { event.preventDefault(); void open(item); } else { void act(() => read(item.id)); } }}>View details <Glyph name='arrow' size={15} /></Link>}
                </div>
                {!item.read_at && <button className='notification-read' aria-label={'Mark read: ' + item.title} title='Mark as read' disabled={busy} onClick={() => void act(() => read(item.id))}><Glyph name='check' size={17} /></button>}
            </li>)}</ul>}
        {!compact && query.data?.count > 20 && <div className='notification-pagination'><span>{query.data.count} notifications</span><button disabled={page <= 1} onClick={() => { const next = new URLSearchParams(params); next.set('page', String(page - 1)); setParams(next); }}>Previous</button><span>Page {page}</span><button disabled={!query.data.next} onClick={() => { const next = new URLSearchParams(params); next.set('page', String(page + 1)); setParams(next); }}>Next</button></div>}
    </>;
}

function NotificationPreferences() {
    const { summary, savePreferences } = useContext(NotificationContext);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    if (!summary) return null;
    const pref = summary.preferences;
    const save = async (value: Partial<Preferences>) => { setBusy(true); setError(''); try { await savePreferences(value); } catch { setError(failure); } finally { setBusy(false); } };
    return <aside className='notification-preferences workspace-panel'><span className='workspace-eyebrow'>YOUR FOCUS, YOUR CHOICE</span><h2>Keep it calm</h2><p>Every update stays in your inbox. Popups are reserved for items that may need your attention.</p>
        <label className='notification-toggle'><span><strong>Important popups</strong><small>Notices, approvals, learning and attendance alerts</small></span><input type='checkbox' role='switch' checked={pref.toasts_enabled} disabled={busy} onChange={event => void save({ toasts_enabled: event.target.checked })} /></label>
        <details><summary>Choose popup modules</summary><div className='notification-module-options'>{summary.modules.map(item => <label key={item.key}><input type='checkbox' checked={!pref.muted_modules.includes(item.key)} disabled={busy || !pref.toasts_enabled} onChange={event => void save({ muted_modules: event.target.checked ? pref.muted_modules.filter(key => key !== item.key) : [...pref.muted_modules, item.key] })} />{item.label}</label>)}</div></details>
        {error && <p role='alert' className='workspace-error'>{error}</p>}
        <div className='notification-tip'><Glyph name='help' size={18} /><p>Changes you make yourself won't send you another notification. Opening the inbox won't mark everything as read.</p></div>
    </aside>;
}

export default function NotificationsPage() {
    const { summary, refresh } = useContext(NotificationContext);
    return <div className='workspace notification-page'><header className='workspace-heading'><div><span className='workspace-eyebrow'>STAY IN THE LOOP</span><h1>Your inbox <span className='notification-heading-count'>{summary?.unread_count || 0}</span></h1><p>Relevant updates, in one place. Pick up where you left off.</p></div><div className='notification-page-actions'><ConnectionStatus /><button onClick={refresh} aria-label='Refresh notifications'><Glyph name='refresh' size={17} /> Refresh</button></div></header>
        <div className='notification-layout'><section className='workspace-panel notification-inbox' aria-label='Notification inbox'><InboxList /></section><NotificationPreferences /></div>
    </div>;
}
