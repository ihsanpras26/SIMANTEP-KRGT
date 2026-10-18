import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

export default function ClassificationPicker({
  options,
  onValueChange,
  ...inputProps
}) {
  const listId = useId();
  const input = useRef(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [above, setAbove] = useState(false);
  useEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = input.current?.getBoundingClientRect();
      if (rect)
        setAbove(
          window.innerHeight - rect.bottom - 120 < 180 && rect.top > 220,
        );
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);
  const query = inputProps.value.trim().toLocaleLowerCase('id-ID');
  const matches = useMemo(
    () =>
      options
        .filter((option) =>
          `${option.kode} ${option.deskripsi}`
            .toLocaleLowerCase('id-ID')
            .includes(query),
        )
        .sort(
          (a, b) =>
            Number(b.kode.toLocaleLowerCase('id-ID') === query) -
            Number(a.kode.toLocaleLowerCase('id-ID') === query),
        ),
    [options, query],
  );
  const visible = matches.slice(0, 50);
  const expanded = open && !inputProps.disabled;
  const select = (option) => {
    onValueChange(option.kode);
    setOpen(false);
    setActive(-1);
    input.current?.focus();
  };
  return (
    <div className="classification-picker">
      <div className="classification-input-wrap">
        <Search size={16} aria-hidden="true" />
        <input
          {...inputProps}
          ref={input}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={expanded ? listId : undefined}
          aria-activedescendant={
            expanded && active >= 0 && visible[active]
              ? `${listId}-${active}`
              : undefined
          }
          autoComplete="off"
          placeholder="Cari kode atau deskripsi"
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            onValueChange(event.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onBlur={(event) => {
            setOpen(false);
            setActive(-1);
            inputProps.onBlur?.(event);
          }}
          onKeyDown={(event) => {
            if (event.isComposing || event.nativeEvent.isComposing) return;
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              setOpen(true);
              const next = visible.length
                ? active < 0
                  ? event.key === 'ArrowDown'
                    ? 0
                    : visible.length - 1
                  : (active +
                      (event.key === 'ArrowDown' ? 1 : -1) +
                      visible.length) %
                    visible.length
                : -1;
              setActive(next);
              requestAnimationFrame(() =>
                document
                  .getElementById(`${listId}-${next}`)
                  ?.scrollIntoView({ block: 'nearest' }),
              );
            } else if (event.key === 'Enter' && expanded) {
              event.preventDefault();
              if (visible.length)
                select(visible[active < 0 ? 0 : active] || visible[0]);
            } else if (event.key === 'Escape' && expanded) {
              event.preventDefault();
              event.stopPropagation();
              setOpen(false);
              setActive(-1);
            }
          }}
        />
        <ChevronDown
          size={15}
          className="classification-chevron"
          aria-hidden="true"
        />
      </div>
      {expanded && (
        <div className={`classification-popover ${above ? 'opens-above' : ''}`}>
          <div
            id={listId}
            role="listbox"
            aria-label="Pilihan klasifikasi"
            className="classification-options"
          >
            {visible.map((option, index) => (
              <div
                id={`${listId}-${index}`}
                key={option.id ?? option.kode}
                role="option"
                aria-selected={inputProps.value === option.kode}
                className={`classification-option ${active === index ? 'is-active' : ''}`}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => select(option)}
              >
                <span className="classification-option-code">
                  {option.kode}
                </span>
                <span>{option.deskripsi}</span>
                {inputProps.value === option.kode && (
                  <Check size={15} aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
          {!visible.length && (
            <p className="classification-no-results" role="status">
              Kode tidak ditemukan. Coba kode atau deskripsi lain.
            </p>
          )}
          {matches.length > visible.length && (
            <p className="classification-result-note">
              {visible.length} dari {matches.length} pilihan. Persempit
              pencarian Anda.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
