import React, { useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import AuthContext from '../contexts/authContext';
import { Field, Resource, resources } from './resources';
import { allRecords } from './api';
import { Glyph } from './WorkspaceUI';

export const humanize = (key: string) => key.replace(/__/g, ' ').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
export const recordTitle = (row: any, config: Resource) => String(row.full_name || row.name || row.title || row.event_name || row.fee_name || row.visitor_name || [row.first_name, row.last_name].filter(Boolean).join(' ') || row.student_name || row.receipt_number || row.display_name || row[config.columns[0]] || 'Record details');
const privateKey = (key: string) => /password|secret|access_token|refresh_token/i.test(key);
const dateKey = (key: string) => /(^date$|_date$|_at$|^date_of_birth$|^next_follow_up$|^from_date$|^to_date$)/.test(key);
const moneyKey = (key: string) => /(^amount$|amount_|_amount$|^balance$|^budget$|^spent$|^net_pay$|^basic$|^allowances$|^deductions$|_cost$|_fee$)/.test(key);

export function displayValue(value: any, key = '', field?: Field): string {
    if (value === null || value === undefined || value === '') return 'Not provided';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.map(item => displayValue(item)).join(', ') || 'None';
    if (typeof value === 'object') return Object.entries(value).filter(([k]) => !privateKey(k)).map(([k, v]) => humanize(k) + ': ' + displayValue(v, k)).join(' · ') || 'No overrides';
    const option = field?.options?.find(o => String(Array.isArray(o) ? o[0] : o) === String(value));
    if (option) return Array.isArray(option) ? option[1] : humanize(option);
    if (dateKey(key) && /^\d{4}-\d{2}-\d{2}/.test(String(value))) {
        const date = new Date(String(value).length === 10 ? value + 'T12:00:00' : value);
        if (!Number.isNaN(date.getTime())) return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) + (String(value).includes('T') ? ' · ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');
    }
    if (moneyKey(key) && Number.isFinite(Number(value))) return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (['status', 'stage', 'user_type', 'priority', 'condition'].includes(key)) return humanize(String(value));
    return String(value);
}

export function RecordValue({ value, fieldKey, field }: { value: any; fieldKey: string; field?: Field }) {
    if (value === null || value === undefined || value === '') return <span className='value-empty'>Not provided</span>;
    if (['status', 'stage', 'condition', 'priority'].includes(fieldKey)) return <span className={'workspace-badge ' + String(value).toLowerCase()}><span className='badge-dot' />{humanize(String(value))}</span>;
    if (typeof value === 'boolean') return <span className={'record-boolean ' + (value ? 'yes' : '')}>{value && <Glyph name='check' size={14} />}{value ? 'Yes' : 'No'}</span>;
    if ((field?.type === 'url' || /_url$|^website$/.test(fieldKey)) && /^https?:\/\//i.test(String(value))) return <a href={value} target='_blank' rel='noreferrer' className='detail-external'>{String(value)}<Glyph name='expand' size={14} /></a>;
    if ((field?.type === 'email' || fieldKey === 'email') && /^[^\s@]+@[^\s@]+$/.test(String(value))) return <a href={'mailto:' + value}>{value}</a>;
    return <>{displayValue(value, fieldKey, field)}</>;
}

function RelationValue({ field, row }: { field: Field; row: any }) {
    const { permissions } = useContext(AuthContext);
    const related = Object.entries(resources).find(([, config]) => config.endpoint === field.endpoint);
    const aliases: Record<string, string[]> = { class_obj: ['class_name'], teacher: ['teacher_name'], class_teacher: ['teacher_name'], user: ['parent_name', 'full_name'], fee_structure: ['fee_name'], student_fee: ['student_name'], payment: ['receipt_number'] };
    const provided = [...(aliases[field.key] || []), field.key + '_name', field.key + '_title'].map(key => row[key]).find(Boolean);
    const ids = Array.isArray(row[field.key]) ? row[field.key] : [row[field.key]].filter(v => v !== null && v !== undefined && v !== '');
    const canRead = !related || !!(permissions as any)?.[related[1].permission + '_read'];
    const options = useQuery({ queryKey: ['options', field.endpoint], queryFn: () => allRecords(field.endpoint!), enabled: !!field.endpoint && !provided && !!ids.length && canRead, retry: false, staleTime: 60000 });
    if (!ids.length && !provided) return <span className='value-empty'>Not linked</span>;
    if (options.isLoading && !provided) return <span className='value-empty'>Loading linked record…</span>;
    return <span className='detail-relations'>{ids.length ? ids.map((id: any) => {
        const item = options.data?.find((entry: any) => String(entry.id) === String(id));
        const text = provided || item?.[field.optionLabel || 'name'] || item?.full_name || item?.title || 'Linked record';
        return related && canRead ? <Link key={id} to={'/workspace/' + related[0] + '/' + encodeURIComponent(id)}>{text}<Glyph name='arrow' size={13} /></Link> : <span key={id} title={String(id)}>{text}</span>;
    }) : provided}</span>;
}

export default function RecordDetails({ config, row, actions }: { config: Resource; row: any; actions?: React.ReactNode }) {
    const configured = config.fields.filter(field => field.type !== 'password' && !privateKey(field.key));
    const seen = new Set(configured.map(field => field.key));
    const companions = new Set(configured.filter(field => field.endpoint).flatMap(field => [field.key + '_name', field.key + '_title', ...(field.key === 'class_obj' ? ['class_name'] : [])]));
    const internal = new Set(['id', 'institution', 'created_at', 'updated_at', 'user', 'actor', 'assigned_to', 'created_by', 'updated_by', 'marked_by', 'completed_by', 'sender', 'issued_by']);
    const extra = [...config.columns, ...Object.keys(row)].filter((key, index, keys) => keys.indexOf(key) === index && !seen.has(key) && !companions.has(key) && !privateKey(key) && !internal.has(key) && !(/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(String(row[key]))) && (config.columns.includes(key) || typeof row[key] !== 'object'));
    const fields: Field[] = [...configured, ...extra.map(key => ({ key, label: humanize(key) }))];
    const long = fields.filter(field => field.type === 'textarea' || ['notes', 'description', 'message', 'answer', 'feedback', 'instructions', 'content', 'submission_text', 'teacher_remarks'].includes(field.key));
    const short = fields.filter(field => !long.includes(field));
    const title = recordTitle(row, config);
    const status = row.status || row.stage;
    const renderField = (field: Field) => <div className='record-field' key={field.key}><dt>{field.label}</dt><dd>{['relation', 'multirelation'].includes(field.type || '') ? <RelationValue field={field} row={row} /> : <RecordValue value={row[field.key]} fieldKey={field.key} field={field} />}</dd></div>;
    return <div className='record-details'>
        <div className='record-hero'><span className='record-avatar'>{title.split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase()}</span><div><span className='workspace-eyebrow'>{config.title}</span><h2>{title}</h2><div className='record-subline'>{status && <RecordValue value={status} fieldKey={row.status ? 'status' : 'stage'} />}{row.is_active !== undefined && <span className={'record-boolean ' + (row.is_active ? 'yes' : '')}>{row.is_active ? 'Active' : 'Inactive'}</span>}<span>Record overview</span></div></div></div>
        {actions && <div className='record-actionbar'>{actions}</div>}
        <section className='record-section'><div className='record-section-heading'><Glyph name='file' /><h3>Details</h3><span>{short.length} fields</span></div><dl className='record-fields'>{short.map(renderField)}</dl></section>
        {!!long.length && <section className='record-section'><div className='record-section-heading'><Glyph name='edit' /><h3>Notes & information</h3></div><dl className='record-fields long-fields'>{long.map(renderField)}</dl></section>}
        <footer className='record-meta'><span><Glyph name='clock' size={15} />{row.updated_at ? 'Updated ' + displayValue(row.updated_at, 'updated_at') : row.created_at ? 'Created ' + displayValue(row.created_at, 'created_at') : 'Saved institution record'}</span><span className='record-id' title={String(row.id)}>ID: {row.id}</span></footer>
    </div>;
}
