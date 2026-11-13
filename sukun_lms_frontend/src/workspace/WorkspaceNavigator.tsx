import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Glyph, WorkspaceDialog } from './WorkspaceUI';

export default function WorkspaceNavigator({ links, onClose }: { links: { title: string; path: string; group: string }[]; onClose: () => void }) {
    const [search, setSearch] = useState(''); const input = useRef<HTMLInputElement>(null);
    useEffect(() => { const timer = setTimeout(() => input.current?.focus(), 50); return () => clearTimeout(timer); }, []);
    const matches = links.filter(link => (link.title + ' ' + link.group).toLowerCase().includes(search.toLowerCase()));
    return <WorkspaceDialog title='Find your next step' onClose={onClose} className='navigator-modal'>
        <div className='navigator-search'><div className='record-search'><Glyph name='search' /><input ref={input} aria-label='Search workspace pages' placeholder='Search pages, people, or operations…' value={search} onChange={event => setSearch(event.target.value)} onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); document.querySelector<HTMLAnchorElement>('.navigator-results a')?.focus(); } }} /></div></div>
        <nav className='navigator-results' aria-label='Matching pages'>{matches.map(link => <Link key={link.path} to={link.path} onClick={onClose}><Glyph name='file' size={19} /><div><strong>{link.title}</strong><small>{link.group}</small></div><Glyph name='arrow' size={16} /></Link>)}{!matches.length && <div className='workspace-empty'><h3>No pages found</h3><p>Try a module name, such as students, fees, or learning.</p><button onClick={() => setSearch('')}>Clear search</button></div>}</nav>
        <footer><span className='dialog-hint'>{matches.length} pages available · Tab to navigate · Enter to open</span><button onClick={onClose}>Done</button></footer>
    </WorkspaceDialog>;
}

export function WorkspaceGuide({ onClose }: { onClose: () => void }) {
    return <WorkspaceDialog title='A little clarity, every day' onClose={onClose}>
        <div className='guide-items'><article><span><Glyph name='panel' /></span><div><h3>Explore any record</h3><p>Click a row to see its details. Choose Quick view to stay in the table, or Full page for a dedicated view you can bookmark.</p></div></article><article><span><Glyph name='search' /></span><div><h3>Get where you need to go</h3><p>Use Find a page in the sidebar or press Ctrl / ⌘ + K to jump between the pages available to your role.</p></div></article><article><span><Glyph name='edit' /></span><div><h3>Take the next step</h3><p>Edit details and use record actions from the table or detail view. Your search and page stay in place when you return.</p></div></article></div><footer><button className='workspace-primary' onClick={onClose}>Got it</button></footer>
    </WorkspaceDialog>;
}
