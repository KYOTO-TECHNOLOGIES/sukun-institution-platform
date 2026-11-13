import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Resource } from './resources';
import RecordDetails, { humanize, RecordValue, recordTitle } from './RecordDetails';
import { Glyph, WorkspaceDialog } from './WorkspaceUI';

/** Detail browsing for read-only tables embedded in a student or learner page. */
export default function RelatedRecordsTable({ config, rows, namespace, pageHref, actions, emptyMessage = 'No records to show yet.' }: { config: Resource; rows: any[]; namespace: string; pageHref?: (row: any) => string; actions?: (row: any) => React.ReactNode; emptyMessage?: string }) {
    const [params, setParams] = useSearchParams();
    const [mode, setMode] = useState(() => { try { return localStorage.getItem('sukun.record-view') || 'modal'; } catch { return 'modal'; } });
    const selected = params.get('record');
    const row = params.get('section') === namespace ? rows.find(item => String(item.id) === selected) : null;
    const isPage = params.get('display') === 'page';
    const href = (item: any, display = mode) => { const next = new URLSearchParams(params); next.set('record', item.id); next.set('section', namespace); next.set('display', display); return '?' + next.toString(); };
    const close = () => setParams(current => { const next = new URLSearchParams(current); ['record', 'section', 'display'].forEach(key => next.delete(key)); return next; }, { replace: true });
    const choose = (value: string) => { setMode(value); try { localStorage.setItem('sukun.record-view', value); } catch { /* Keep the selection usable without storage. */ } };
    if (row && isPage) return <><div className='detail-page-nav'><button onClick={close}><Glyph name='back' size={15} />Back to {config.title.toLowerCase()}</button><Link to={href(row, 'modal')}>Open as modal</Link></div><div className='workspace-panel'><RecordDetails config={config} row={row} /></div></>;
    return <>
        <div className='workspace-toolbar resource-toolbar'><span>Open records in</span><div className='segmented-control' role='group' aria-label='Open records in'><button aria-pressed={mode === 'modal'} onClick={() => choose('modal')}><Glyph name='panel' size={15} />Quick view</button><button aria-pressed={mode === 'page'} onClick={() => choose('page')}><Glyph name='expand' size={15} />Full page</button></div></div>
        <div className='workspace-table-scroll'><table className='resource-table'><thead><tr>{config.columns.map(key => <th scope='col' key={key}>{humanize(key)}</th>)}<th scope='col'>Details</th>{actions&&<th scope='col'>Actions</th>}</tr></thead><tbody>{rows.map(item => <tr key={item.id} className='record-row' onClick={event => { if (!(event.target as HTMLElement).closest('a,button') && !window.getSelection()?.toString()) event.currentTarget.querySelector<HTMLAnchorElement>('a')?.click(); }}>{config.columns.map((key, index) => <td key={key}>{index === 0 ? <Link className='record-primary-link' to={mode === 'page' && pageHref ? pageHref(item) : href(item)}><RecordValue fieldKey={key} value={item[key]} /><Glyph name='chevron' size={14} /></Link> : <RecordValue fieldKey={key} value={item[key]} />}</td>)}<td><Link className='workspace-button' aria-label={'View details for ' + recordTitle(item, config)} to={href(item, 'modal')}><Glyph name='panel' size={14} />View</Link></td>{actions&&<td>{actions(item)}</td>}</tr>)}</tbody></table></div>
        {!rows.length&&<div className='workspace-empty'><Glyph name='file' size={28}/><p>{emptyMessage}</p></div>}
        {row && <WorkspaceDialog title='Record details' className='record-modal' onClose={close} tools={<Link className='workspace-button' to={pageHref ? pageHref(row) : href(row, 'page')}><Glyph name='expand' size={15} />Open full page</Link>}><RecordDetails config={config} row={row} /><footer><span className='dialog-hint'>Press Esc to close</span><button onClick={close}>Done</button></footer></WorkspaceDialog>}
    </>;
}
