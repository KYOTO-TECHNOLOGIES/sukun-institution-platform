import React, { useContext, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import AuthContext from '../contexts/authContext';
import { authAxios } from '../axiosInstance';
import { errorMessage } from './api';
import { resources, ResourceAction } from './resources';
import { FormField, initial } from './ResourceForm';
import RecordDetails, { humanize, recordTitle, RecordValue } from './RecordDetails';
import { Glyph, Skeleton, WorkspaceDialog } from './WorkspaceUI';
import './workspace.css';

type OpenMode = 'modal' | 'page';
const pageSize = 15;
export default function ResourcePage() {
    const location = useLocation(); const navigate = useNavigate(); const { recordId } = useParams();
    const [params, setParams] = useSearchParams();
    const name = location.pathname.split('/')[2]; const config = resources[name];
    const listPath = '/workspace/' + name;
    const detailId = recordId || params.get('record');
    const page = Math.max(0, Math.floor(Number(params.get('page')) || 0));
    const query = params.get('q') || ''; const studentFilter = params.get('student');
    const { userData, permissions } = useContext(AuthContext); const cache = useQueryClient();
    const [search, setSearch] = useState(query);
    const [mode, setMode] = useState<OpenMode>(() => { try { return localStorage.getItem('sukun.record-view') === 'page' ? 'page' : 'modal'; } catch { return 'modal'; } });
    const [editing, setEditing] = useState<any>(undefined); const [action, setAction] = useState<ResourceAction | null>(null);
    const [values, setValues] = useState<any>({}); const [busy, setBusy] = useState(false);
    const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [removing, setRemoving] = useState<any>(null);
    const canWrite = !config?.readOnly && !!(permissions as any)?.[config?.permission + '_write'];
    const fields = action?.fields || config?.fields || [];
    const listParams = new URLSearchParams(params); listParams.delete('record');
    const suffix = listParams.toString() ? '?' + listParams.toString() : '';
    const listUrl = listPath + suffix;
    const detailUrl = (id: any) => listPath + '/' + encodeURIComponent(id) + suffix;
    useEffect(() => { setEditing(undefined); setRemoving(null); setError(''); setNotice(''); }, [name]);
    useEffect(() => { setSearch(query); }, [name, query]);
    useEffect(() => {
        if (search === query) return;
        const timer = setTimeout(() => setParams(current => { const next = new URLSearchParams(current); search ? next.set('q', search) : next.delete('q'); next.delete('page'); return next; }, { replace: true }), 300);
        return () => clearTimeout(timer);
    }, [search, query, setParams]);
    useEffect(() => { document.title = (recordId ? 'Record details · ' : '') + (config?.title || 'Workspace') + ' | Sukun'; }, [config, recordId]);
    const list = useQuery({ queryKey: ['workspace', name, page, query, studentFilter], queryFn: () => authAxios.get(config.endpoint, { params: { limit: pageSize, offset: page * pageSize, search: query, ...(studentFilter ? { student: studentFilter } : {}) } }).then(r => r.data), enabled: !!config && !recordId, placeholderData: keepPreviousData });
    const detail = useQuery({ queryKey: ['workspace-detail', name, detailId], queryFn: () => authAxios.get(config.endpoint + encodeURIComponent(detailId!) + '/').then(r => r.data), enabled: !!config && !!detailId, retry: false });
    const rows: any[] = list.data?.results || (Array.isArray(list.data) ? list.data : []);
    const count = list.data?.count ?? rows.length;
    useEffect(() => { if (!list.isPlaceholderData && list.isSuccess && page > 0 && !rows.length) setParams(current => { const next = new URLSearchParams(current); next.set('page', String(Math.max(0, Math.ceil(count / pageSize) - 1))); return next; }, { replace: true }); }, [list.isPlaceholderData, list.isSuccess, rows.length, page, count, setParams]);
    const selectMode = (next: OpenMode) => { setMode(next); try { localStorage.setItem('sukun.record-view', next); } catch { /* Keep preference in memory when storage is unavailable. */ } };
    const openDetail = (row: any, chosen = mode) => { if (chosen === 'page') navigate(detailUrl(row.id)); else { const next = new URLSearchParams(params); next.set('record', row.id); setParams(next); } };
    const closeDetail = () => navigate(listUrl, { replace: true });
    const open = (row: any, selected: ResourceAction | null = null) => { setError(''); setAction(selected); setEditing(row); setValues(initial(selected?.fields || config.fields, selected ? {} : row || (studentFilter ? { student: studentFilter } : {}))); };
    const invalidate = async () => { await Promise.all([cache.invalidateQueries({ queryKey: ['workspace'] }), cache.invalidateQueries({ queryKey: ['workspace-detail'] }), cache.invalidateQueries({ queryKey: ['options'] }), cache.invalidateQueries({ queryKey: ['institution-dashboard'] })]); };
    const save = async (event: React.FormEvent) => {
        event.preventDefault(); setBusy(true); setError('');
        try {
            const payload: any = { ...values };
            for (const field of fields) {
                if (payload[field.key] === '' && ['relation', 'date', 'datetime-local'].includes(field.type || '')) payload[field.key] = null;
                if (editing?.id && field.type === 'password' && !payload[field.key]) delete payload[field.key];
                if (field.type === 'datetime-local' && payload[field.key]) payload[field.key] = new Date(payload[field.key]).toISOString();
            }
            if (action) await authAxios.post(config.endpoint + editing.id + '/' + action.endpoint, { ...action.payload, ...payload });
            else {
                if (config.institution) payload.institution = userData.institution;
                if (editing?.id) await authAxios.patch(config.endpoint + editing.id + '/', payload);
                else await authAxios.post(config.endpoint, payload);
            }
            setNotice(action ? action.label + ' completed.' : 'Changes saved.'); await invalidate(); setEditing(undefined);
        } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
    };
    const remove = async () => {
        setBusy(true); setError('');
        try { await authAxios.delete(config.endpoint + removing.id + '/'); setRemoving(null); if (detailId) closeDetail(); setNotice('Record removed.'); await invalidate(); }
        catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
    };
    const rowActions = (row: any, inDetail = false) => <>
        {canWrite && !config.noEdit && row.status !== 'ENROLLED' && <button onClick={() => open(row)} className={inDetail ? 'workspace-primary' : ''}>{inDetail && <Glyph name='edit' size={15} />}{inDetail ? 'Edit record' : 'Edit'}</button>}
        {(config.actions || []).filter(a => (canWrite || a.link) && (!a.visible || a.visible(row, userData.user_type))).map(a => a.link ? <a key={a.label} className='workspace-button' href={a.link(row)} target={a.link(row).startsWith('/api/') ? '_blank' : undefined} rel='noreferrer'>{a.label}<Glyph name='expand' size={13} /></a> : <button key={a.label} onClick={() => open(row, a)}>{a.label}</button>)}
        {canWrite && !config.noDelete && <button className='workspace-danger' onClick={() => { setError(''); setRemoving(row); }}>Delete</button>}
    </>;
    const detailContent = <>{detail.isLoading ? <Skeleton rows={6} /> : detail.isError ? <div className='workspace-empty'><Glyph name='file' size={30} /><h3>We couldn’t open this record</h3><p>{(detail.error as any)?.response?.status === 404 ? 'It may have been removed, or it is no longer available to your account.' : errorMessage(detail.error)}</p><button onClick={() => detail.refetch()}>Try again</button></div> : detail.data && <RecordDetails config={config} row={detail.data} actions={rowActions(detail.data, true)} />}</>;
    if (!config) return <div className='workspace-empty'>Workspace not found.</div>;
    return <div className='workspace resource-workspace'>
        {recordId ? <>
            <div className='detail-page-nav'><Link to={listUrl}><Glyph name='back' size={16} />Back to {config.title.toLowerCase()}</Link><span>Record details</span><button onClick={() => navigate(listUrl + (suffix ? '&' : '?') + 'record=' + encodeURIComponent(recordId))}><Glyph name='panel' size={16} />Open as modal</button></div>
            {notice && <div className='workspace-notice' role='status'><span><Glyph name='check' />{notice}</span><button onClick={() => setNotice('')} aria-label='Dismiss notification'><Glyph name='close' size={16} /></button></div>}
            <section className='workspace-panel detail-page'>{detailContent}</section>
        </> : <>
            <header className='workspace-heading'><div><div className='workspace-eyebrow'><span className='eyebrow-dot' />INSTITUTION WORKSPACE</div><h1>{config.title}<span className='heading-count' aria-hidden='true'>{list.isLoading ? '…' : count}</span></h1><p>{config.subtitle}</p></div>{canWrite && !config.noCreate && <button className='workspace-primary' onClick={() => open(null)}>+ Add {name === 'enquiries' ? 'enquiry' : 'record'}</button>}</header>
            {notice && <div className='workspace-notice' role='status'><span><Glyph name='check' />{notice}</span><button onClick={() => setNotice('')} aria-label='Dismiss notification'><Glyph name='close' size={16} /></button></div>}
            <section className='workspace-panel resource-panel' aria-busy={list.isFetching}>
                <div className='resource-panel-heading'><div><Glyph name='grid' /><h2>All records</h2>{studentFilter && <span className='workspace-badge'>Student history</span>}</div><span><span className='live-dot' />{list.isFetching ? 'Updating…' : 'Up to date'}</span></div>
                <div className='workspace-toolbar resource-toolbar'><div className='record-search'><Glyph name='search' /><input aria-label='Search records' placeholder={'Search ' + config.title.toLowerCase() + '…'} value={search} onChange={e => setSearch(e.target.value)} />{search && <button aria-label='Clear search' onClick={() => setSearch('')}><Glyph name='close' size={15} /></button>}</div><div className='view-preference'><span>Open records in</span><div className='segmented-control' role='group' aria-label='Open records in'><button aria-pressed={mode === 'modal'} onClick={() => selectMode('modal')}><Glyph name='panel' size={15} />Quick view</button><button aria-pressed={mode === 'page'} onClick={() => selectMode('page')}><Glyph name='expand' size={15} />Full page</button></div></div><button className='icon-button' aria-label='Refresh records' title='Refresh records' disabled={list.isFetching} onClick={() => list.refetch()}><Glyph name='refresh' className={list.isFetching ? 'is-spinning' : ''} /></button></div>
                {list.isError ? <div className='workspace-error' role='alert'>{errorMessage(list.error)} <button onClick={() => list.refetch()}>Try again</button></div> : list.isLoading ? <Skeleton /> : <>
                    <div className='workspace-table-scroll'><table className='resource-table'><thead><tr>{config.columns.map(column => <th key={column} scope='col'>{humanize(column)}</th>)}<th scope='col' className='actions-heading'>Actions</th></tr></thead><tbody>{rows.map(row => <tr key={row.id} className='record-row' onClick={event => { if ((event.target as HTMLElement).closest('a,button,input,select') || window.getSelection()?.toString()) return; openDetail(row); }}>
                        {config.columns.map((column, index) => <td key={column}>{index === 0 ? <Link className='record-primary-link' to={detailUrl(row.id)} onClick={event => { if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) { event.preventDefault(); openDetail(row); } }}><RecordValue value={row[column]} fieldKey={column} field={config.fields.find(f => f.key === column)} /><Glyph name='chevron' size={14} /></Link> : <RecordValue value={row[column]} fieldKey={column} field={config.fields.find(f => f.key === column)} />}</td>)}
                        <td><div className='workspace-row-actions'><button className='row-view-button' aria-label={'View details for ' + recordTitle(row, config)} title='Quick view' onClick={() => openDetail(row, 'modal')}><Glyph name='panel' size={15} />View</button>{rowActions(row)}</div></td>
                    </tr>)}</tbody></table></div>
                    {!rows.length && <div className='workspace-empty'><span className='empty-illustration'><Glyph name={query ? 'search' : 'file'} size={30} /></span><h3>{query ? 'No matching records' : 'A clear space for your next step'}</h3><p>{query ? 'Try a different name or keyword, or clear your search to see all records.' : config.subtitle}</p>{query ? <button onClick={() => setSearch('')}>Clear search</button> : canWrite && !config.noCreate && <button className='workspace-primary' onClick={() => open(null)}>Add your first record</button>}</div>}
                    <footer className='workspace-pagination'><span>{count ? page * pageSize + 1 : 0}–{Math.min((page + 1) * pageSize, count)} of {count} records<span className='table-hint'>Click a row to explore its details</span></span><button disabled={!page || list.isPlaceholderData} onClick={() => setParams(current => { const next = new URLSearchParams(current); next.set('page', String(page - 1)); return next; })}><Glyph name='back' size={15} />Previous</button><span className='page-indicator'>{page + 1} / {Math.max(1, Math.ceil(count / pageSize))}</span><button disabled={(page + 1) * pageSize >= count || list.isPlaceholderData} onClick={() => setParams(current => { const next = new URLSearchParams(current); next.set('page', String(page + 1)); return next; })}>Next<Glyph name='arrow' size={15} /></button></footer>
                </>}
            </section>
            <div className='workspace-context-note'><Glyph name='help' size={15} /><span>Choose how you explore. Quick view keeps your place; full page gives each record room.</span></div>
        </>}
        {detailId && !recordId && editing === undefined && !removing && <WorkspaceDialog title='Record details' className='record-modal' onClose={closeDetail} tools={<Link className='workspace-button' to={detailUrl(detailId)}><Glyph name='expand' size={15} />Open full page</Link>}>{notice && <div className='workspace-notice' role='status'>{notice}</div>}{detailContent}<footer><span className='dialog-hint'>Press Esc to close</span><button onClick={closeDetail}>Done</button></footer></WorkspaceDialog>}
        {editing !== undefined && <WorkspaceDialog title={action?.label || (editing ? 'Edit record' : 'New record')} busy={busy} onClose={() => setEditing(undefined)}><form onSubmit={save}><div className='form-intro'><p>{action ? 'Review the information below to continue.' : 'Keep the details complete and easy for your team to find.'}</p><span>* Required fields</span></div><div className='workspace-form'>{fields.map(field => <FormField key={field.key} field={field} value={values[field.key]} onChange={value => setValues((current: any) => ({ ...current, [field.key]: value }))} />)}</div>{error && <div className='workspace-error' role='alert'>{error}</div>}<footer><button type='button' disabled={busy} onClick={() => setEditing(undefined)}>Cancel</button><button className='workspace-primary' disabled={busy}>{busy ? 'Saving…' : action?.label || 'Save record'}</button></footer></form></WorkspaceDialog>}
        {removing && <WorkspaceDialog title='Delete this record?' className='small' busy={busy} onClose={() => setRemoving(null)}><p><strong>{recordTitle(removing, config)}</strong> will be removed. Linked records may also be affected. This cannot be undone.</p>{error && <div className='workspace-error' role='alert'>{error}</div>}<footer><button disabled={busy} onClick={() => setRemoving(null)}>Cancel</button><button className='workspace-danger' disabled={busy} onClick={remove}>{busy ? 'Deleting…' : 'Delete record'}</button></footer></WorkspaceDialog>}
    </div>;
}
