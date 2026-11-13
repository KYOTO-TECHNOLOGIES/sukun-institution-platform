import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import './SearchableSelect.css';

export type SearchableOption = { value: string | number; label: string; disabled?: boolean };

type Props = {
    id?: string;
    name?: string;
    ariaLabel?: string;
    value?: string | number | Array<string | number>;
    options: SearchableOption[];
    onChange: (value: string | string[]) => void;
    placeholder?: string;
    multiple?: boolean;
    required?: boolean;
    disabled?: boolean;
    loading?: boolean;
    className?: string;
    emptyMessage?: string;
    onBlur?: () => void;
};

/** Accessible, searchable single and multi select used throughout the Sukun workspace. */
export default function SearchableSelect({
    id, name, ariaLabel, value = '', options, onChange, placeholder = 'Select an option', multiple = false,
    required = false, disabled = false, loading = false, className = '', emptyMessage = 'No matching options', onBlur,
}: Props) {
    const generatedId = useId();
    const inputId = id || generatedId;
    const listId = inputId + '-options';
    const root = useRef<HTMLDivElement>(null);
    const input = useRef<HTMLInputElement>(null);
    const menuSearch = useRef<HTMLInputElement>(null);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [active, setActive] = useState(0);
    const [above, setAbove] = useState(false);
    const values = (multiple ? (Array.isArray(value) ? value : value ? [value] : []) : [value]).map(String);
    const selected = options.filter(option => values.includes(String(option.value)));
    const normalized = query.trim().toLocaleLowerCase();
    const filtered = useMemo(() => options.filter(option => String(option.value) !== '' && (
        !normalized || option.label.toLocaleLowerCase().includes(normalized) || String(option.value).toLocaleLowerCase().includes(normalized)
    )), [normalized, options]);

    useEffect(() => { setActive(0); }, [query, open]);
    useEffect(() => {
        if (!open) return;
        const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) { setOpen(false); setQuery(''); } };
        document.addEventListener('pointerdown', close);
        return () => document.removeEventListener('pointerdown', close);
    }, [open]);

    const show = () => {
        if (disabled) return;
        const bounds = root.current?.getBoundingClientRect();
        setAbove(!!bounds && window.innerHeight - bounds.bottom < 300 && bounds.top > 300);
        setOpen(true); setQuery('');
        requestAnimationFrame(() => menuSearch.current?.focus());
    };
    const choose = (option: SearchableOption) => {
        if (option.disabled) return;
        const next = String(option.value);
        if (multiple) { onChange(values.includes(next) ? values.filter(item => item !== next) : [...values, next]); requestAnimationFrame(()=>menuSearch.current?.focus()); }
        else { onChange(next); setOpen(false); }
        setQuery('');
    };
    const clear = (event?: React.SyntheticEvent) => {
        event?.preventDefault(); event?.stopPropagation(); onChange(multiple ? [] : ''); setQuery(''); input.current?.focus();
    };
    const move = (step: number) => {
        if (!open) { show(); return; }
        if (filtered.length) setActive(current => (current + step + filtered.length) % filtered.length);
    };
    const display = open ? query : multiple ? '' : selected[0]?.label || '';

    return <div ref={root} className={'sukun-select '+(open?'is-open ':'')+(disabled?'is-disabled ':'')+className}
        onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node)){setOpen(false);setQuery('');onBlur?.();}}}>
        <div className='sukun-select-control' onClick={show}>
            {multiple && selected.map(option => <span className='sukun-select-chip' key={String(option.value)}>{option.label}<button type='button' aria-label={'Remove '+option.label} disabled={disabled} onClick={event => { event.stopPropagation(); choose(option); }}>×</button></span>)}
            <input ref={input} id={inputId} role='combobox' type='text' autoComplete='off' spellCheck={false}
                aria-label={ariaLabel} aria-expanded={open} aria-controls={listId} aria-autocomplete='list'
                aria-activedescendant={open&&filtered[active]?listId+'-'+active:undefined}
                disabled={disabled} required={required&&!values.filter(Boolean).length} value={display}
                placeholder={loading?'Loading…':multiple&&selected.length&&!open?'Add another…':placeholder}
                onFocus={show} onChange={event => { if (!open) show(); setQuery(event.target.value); }}
                onKeyDown={event => {
                    if (event.key==='ArrowDown') { event.preventDefault(); move(1); }
                    else if (event.key==='ArrowUp') { event.preventDefault(); move(-1); }
                    else if (event.key==='Enter' && open) { event.preventDefault(); if (filtered[active]) choose(filtered[active]); }
                    else if (event.key==='Escape' && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); setQuery(''); }
                    else if (event.key==='Home' && open) { event.preventDefault(); setActive(0); }
                    else if (event.key==='End' && open) { event.preventDefault(); setActive(Math.max(0,filtered.length-1)); }
                    else if (event.key==='Backspace' && multiple && !query && values.length) onChange(values.slice(0,-1));
                }}/>
            {!!values.filter(Boolean).length&&!disabled&&<button type='button' className='sukun-select-clear' aria-label={'Clear '+(ariaLabel||placeholder)} onClick={clear}>×</button>}
            <button type='button' className='sukun-select-toggle' tabIndex={-1} disabled={disabled} aria-label={open?'Close options':'Open options'} onClick={event => { event.stopPropagation(); open ? (setOpen(false),setQuery('')) : show(); }}>⌄</button>
        </div>
        {name && (multiple ? values.map(item=><input key={item} type='hidden' name={name} value={item}/>) : <input type='hidden' name={name} value={values[0]||''}/>)}
        {open&&<div className={'sukun-select-menu '+(above?'above':'')}>
            <label className='sukun-select-search'><span aria-hidden='true'>⌕</span><input ref={menuSearch} type='search' autoComplete='off' value={query}
                aria-label={'Search '+(ariaLabel||placeholder)} placeholder='Type to search options…' onChange={event=>setQuery(event.target.value)}
                onKeyDown={event=>{
                    if(event.key==='ArrowDown'){event.preventDefault();move(1);}
                    else if(event.key==='ArrowUp'){event.preventDefault();move(-1);}
                    else if(event.key==='Enter'){event.preventDefault();if(filtered[active])choose(filtered[active]);}
                    else if(event.key==='Escape'){event.preventDefault();event.stopPropagation();setOpen(false);setQuery('');requestAnimationFrame(()=>root.current?.querySelector<HTMLButtonElement>('.sukun-select-toggle')?.focus());}
                }}/></label>
            <ul id={listId} role='listbox' aria-label={(ariaLabel||placeholder)+' options'} aria-multiselectable={multiple||undefined}>
                {filtered.map((option,index)=><li id={listId+'-'+index} key={String(option.value)} role='option' data-value={String(option.value)}
                    aria-selected={values.includes(String(option.value))} aria-disabled={option.disabled||undefined}
                    className={(index===active?'is-active ':'')+(values.includes(String(option.value))?'is-selected ':'')+(option.disabled?'is-disabled':'')}
                    onPointerMove={()=>setActive(index)} onMouseDown={event=>event.preventDefault()} onClick={()=>choose(option)}>
                    <span>{option.label}</span>{values.includes(String(option.value))&&<b aria-hidden='true'>✓</b>}
                </li>)}
            </ul>
            {!filtered.length&&<div className='sukun-select-empty' role='status'>{emptyMessage}<small>Try another name or value.</small></div>}
        </div>}
    </div>;
}
