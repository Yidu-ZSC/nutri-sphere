import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { SEARCH_DEBOUNCE_MS, type SearchHit } from '../lib/search';

interface SearchBarProps {
  hits: SearchHit[];
  truncated: boolean;
  onQuery: (query: string) => void;
  onSelect: (hit: SearchHit) => void;
}

export function SearchBar({ hits, truncated, onQuery, onSelect }: SearchBarProps) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => onQuery(text), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [text, onQuery]);

  useEffect(() => {
    setActive(0);
  }, [hits]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const showList = open && text.trim() !== '';
  const nodeHits = useMemo(() => hits.filter((hit) => hit.kind === 'node'), [hits]);
  const linkHits = useMemo(() => hits.filter((hit) => hit.kind === 'link'), [hits]);

  const choose = (hit: SearchHit) => {
    onSelect(hit);
    setOpen(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      setOpen(false);
      return;
    }
    if (!showList) {
      if (event.key === 'ArrowDown' && text.trim()) setOpen(true);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, Math.max(hits.length - 1, 0)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const hit = hits[active] ?? hits[0];
      if (hit) choose(hit);
    }
  };

  let optionIndex = 0;

  const renderHit = (hit: SearchHit) => {
    const index = optionIndex;
    optionIndex += 1;
    const selected = index === active;
    return (
      <li key={`${hit.kind}-${hit.id ?? hit.index ?? index}`} role="presentation">
        <button
          type="button"
          role="option"
          id={`${listId}-${index}`}
          aria-selected={selected}
          className={selected ? 'search-hit search-hit--active' : 'search-hit'}
          onMouseEnter={() => setActive(index)}
          onClick={() => choose(hit)}
        >
          <span className="search-hit-title">{hit.title}</span>
          <span className="search-hit-meta">{hit.subtitle}</span>
        </button>
      </li>
    );
  };

  return (
    <div className="search" ref={rootRef}>
      <label className="sr-only" htmlFor={`${listId}-input`}>
        搜索节点或关联
      </label>
      <input
        id={`${listId}-input`}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList && hits[active] ? `${listId}-${active}` : undefined}
        placeholder="搜索名称、别名、编号或关联"
        autoComplete="off"
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {text && (
        <button
          type="button"
          className="search-clear"
          aria-label="清空搜索"
          onClick={() => {
            setText('');
            onQuery('');
            setOpen(false);
          }}
        >
          清除
        </button>
      )}
      {showList && (
        <div className="search-pop" id={listId} role="listbox" aria-label="搜索结果">
          {hits.length === 0 ? (
            <p className="search-empty">无匹配结果</p>
          ) : (
            <>
              {nodeHits.length > 0 && (
                <div>
                  <p className="search-group">节点</p>
                  <ul>{nodeHits.map((hit) => renderHit(hit))}</ul>
                </div>
              )}
              {linkHits.length > 0 && (
                <div>
                  <p className="search-group">关联</p>
                  <ul>{linkHits.map((hit) => renderHit(hit))}</ul>
                </div>
              )}
              {truncated && <p className="search-note">仅显示前 20 条</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
