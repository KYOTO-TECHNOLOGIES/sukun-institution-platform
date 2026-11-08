import React, { useEffect, useId, useRef, useState } from 'react';
import { callingCodes, primaryRegions } from './phoneCountries';
import 'flag-icons/css/flag-icons.min.css';
import './CountryPhoneInput.css';

interface CountryPhoneInputProps {
    id: string;
    name?: string;
    value?: string;
    onChange?: (value: string) => void;
    required?: boolean;
    disabled?: boolean;
    autoComplete?: string;
}

const names = new Intl.DisplayNames(['en'], { type: 'region' });
const preferred = ['in', 'ae', 'sa', 'qa', 'om', 'kw', 'bh'];
const countries = Object.entries(callingCodes).map(([iso, code]) => ({
    iso, code, name: names.of(iso.toUpperCase()) || iso.toUpperCase(),
    flag: iso === 'ac' ? 'sh-ac' : iso === 'ta' ? 'sh-ta' : iso,
})).sort((a, b) => {
    const aIndex = preferred.indexOf(a.iso), bIndex = preferred.indexOf(b.iso);
    return (aIndex < 0 ? 99 : aIndex) - (bIndex < 0 ? 99 : bIndex) || a.name.localeCompare(b.name);
});

function parseSavedNumber(value: string) {
    const digits = value.replace(/\D/g, '');
    if (value.startsWith('+')) {
        const match = countries.filter(c => digits.startsWith(c.code)).sort((a, b) => b.code.length - a.code.length)[0];
        if (match) return { iso: primaryRegions[match.code] || match.iso, national: digits.slice(match.code.length) };
    }
    return { iso: 'in', national: digits };
}

function normalizeNational(raw: string, code: string) {
    const digits = raw.replace(/\D/g, '');
    if (raw.trim().startsWith('+')) {
        if (!digits.startsWith(code)) return { national: raw, mismatch: true };
        return { national: digits.slice(code.length), mismatch: false };
    }
    return { national: digits, mismatch: false };
}

/** The calling code belongs to the country selector; only the national number is editable. */
export default function CountryPhoneInput({
    id, name, value, onChange, required = false, disabled = false, autoComplete = 'tel-national',
}: CountryPhoneInputProps) {
    const initial = parseSavedNumber(value || '');
    const [iso, setIso] = useState(initial.iso);
    const [national, setNational] = useState(initial.national);
    const [mismatch, setMismatch] = useState(false);
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [above, setAbove] = useState(false);
    const root = useRef<HTMLDivElement>(null);
    const input = useRef<HTMLInputElement>(null);
    const button = useRef<HTMLButtonElement>(null);
    const searchInput = useRef<HTMLInputElement>(null);
    const lastEmitted = useRef(value);
    const listId = useId();
    const country = countries.find(c => c.iso === iso)!;
    const number = national && !mismatch ? '+' + country.code + national : '';
    const query = search.trim().toLowerCase().replace(/^\+/, '');
    const filtered = countries.filter(c => c.name.toLowerCase().includes(query) || c.code.startsWith(query) || c.iso === query);

    useEffect(() => {
        if (value !== undefined && value !== lastEmitted.current) {
            const saved = parseSavedNumber(value);
            setIso(saved.iso); setNational(saved.national); setMismatch(false);
            lastEmitted.current = value;
        }
    }, [value]);

    useEffect(() => {
        input.current?.setCustomValidity(mismatch ? 'Select the matching country code before entering this international number.'
            : required && !national ? 'Enter a phone number.'
            : number.length > 16 ? 'International phone numbers can contain at most 15 digits.' : '');
    }, [mismatch, national, number, required]);

    useEffect(() => {
        if (!open) return;
        searchInput.current?.focus();
        const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
        document.addEventListener('pointerdown', outside);
        return () => document.removeEventListener('pointerdown', outside);
    }, [open]);

    const update = (raw: string, nextIso = iso) => {
        const nextCode = callingCodes[nextIso];
        const normalized = normalizeNational(raw, nextCode);
        const next = normalized.national && !normalized.mismatch ? '+' + nextCode + normalized.national : '';
        setIso(nextIso); setNational(normalized.national); setMismatch(normalized.mismatch);
        lastEmitted.current = next;
        onChange?.(next);
    };
    const choose = (nextIso: string) => { update(national, nextIso); setOpen(false); setSearch(''); input.current?.focus(); };
    const toggle = () => {
        const bounds = button.current?.getBoundingClientRect();
        setAbove(!!bounds && window.innerHeight - bounds.bottom < 280 && bounds.top > 280);
        setSearch(''); setOpen(!open);
    };
    const focusOption = (index: number) => {
        const options = root.current?.querySelectorAll<HTMLElement>('[role="option"]');
        if (options?.length) options[(index + options.length) % options.length].focus();
    };

    return <div ref={root} className='sukun-phone-input'
        onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false); }}
        onKeyDown={event => {
            if (open && event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); button.current?.focus(); }
        }}>
        <button ref={button} type='button' className='sukun-country-button' disabled={disabled}
            aria-label={country.name + ': + ' + country.code} aria-haspopup='listbox' aria-expanded={open}
            aria-controls={open ? listId : undefined} onClick={toggle}
            onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); if (!open) toggle(); else focusOption(0); } }}>
            <span className={'fi fi-' + country.flag} aria-hidden='true' />
            <span>+{country.code}</span><span className='sukun-country-chevron' aria-hidden='true'>▾</span>
        </button>
        <input ref={input} id={id} className='sukun-national-number' type='tel' inputMode='tel'
            autoComplete={autoComplete} placeholder='Mobile number' required={required} disabled={disabled}
            value={national} aria-invalid={mismatch || undefined} aria-describedby={mismatch ? id + '-phone-error' : undefined}
            onChange={event => update(event.target.value)} />
        {name && <input type='hidden' name={name} value={number} disabled={disabled} />}
        {open && <div className={'sukun-country-popover' + (above ? ' above' : '')}>
            <input ref={searchInput} type='search' className='sukun-country-search' value={search}
                aria-label='Search country or calling code' placeholder='Search country or calling code'
                onChange={event => setSearch(event.target.value)}
                onKeyDown={event => {
                    if (event.key === 'ArrowDown') { event.preventDefault(); focusOption(0); }
                    if (event.key === 'ArrowUp') { event.preventDefault(); focusOption(-1); }
                    if (event.key === 'Enter') { event.preventDefault(); if (filtered[0]) choose(filtered[0].iso); }
                }} />
            <ul id={listId} role='listbox' aria-label='Country calling codes' className='sukun-country-options'>
                {filtered.map((item, index) => <li key={item.iso} role='option' aria-selected={iso === item.iso}
                    tabIndex={-1} onClick={() => choose(item.iso)}
                    onKeyDown={event => {
                        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); focusOption(index + (event.key === 'ArrowDown' ? 1 : -1)); }
                        if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); focusOption(event.key === 'Home' ? 0 : -1); }
                        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(item.iso); }
                    }}>
                    <span className={'fi fi-' + item.flag} aria-hidden='true' /><span>{item.name}</span><span className='sukun-calling-code'>+{item.code}</span>
                </li>)}
            </ul>
            {!filtered.length && <p className='sukun-country-empty' role='status'>No matching countries</p>}
        </div>}
        {mismatch && <small id={id + '-phone-error'} className='sukun-phone-error'>Select the matching country code for this number.</small>}
    </div>;
}
