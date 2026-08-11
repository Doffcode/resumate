// Small presentational controls for the editor sidebar.
export const Icon = ({ d, size = 15, className = '' }) => (
  <svg className={`rm-icon ${className}`.trim()} viewBox="0 0 24 24" style={{ width: size, height: size }}>
    {d.map((path, i) => <path key={i} d={path} />)}
  </svg>
);

export const icons = {
  chevron: ['M9 6l6 6-6 6'],
  plus: ['M12 5v14M5 12h14'],
  trash: ['M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14'],
  up: ['M12 19V5', 'M5 12l7-7 7 7'],
  down: ['M12 5v14', 'M19 12l-7 7-7-7'],
  download: ['M12 15V3', 'M7 10l5 5 5-5', 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4'],
  warn: ['M12 9v4M12 17h.01', 'M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z'],
  spark: ['M12 3l1.9 5.5L19.5 10l-5.6 1.5L12 17l-1.9-5.5L4.5 10l5.6-1.5z'],
  check: ['M9 11l3 3L22 4', 'M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11'],
  close: ['M18 6L6 18M6 6l12 12'],
  back: ['M19 12H5', 'M12 19l-7-7 7-7'],
  doc: ['M14 3v5h5', 'M6 3h8l5 5v13H6z'],
  edit: ['M4 20h4L18.5 9.5a2.1 2.1 0 00-3-3L5 17v3z'],
  menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
  upload: ['M12 3v12', 'M7 8l5-5 5 5', 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4'],
};

export function Switch({ checked, onChange, label }) {
  return (
    <label className="rm-switch" onClick={(e) => e.stopPropagation()} title={label}>
      <input type="checkbox" checked={checked} onChange={onChange} aria-label={label} />
      <span className="rm-track" />
      <span className="rm-thumb" />
    </label>
  );
}

export function Field({ label, value, onChange, placeholder, textarea }) {
  const Tag = textarea ? 'textarea' : 'input';
  return (
    <div className="rm-field">
      {label && <label>{label}</label>}
      <Tag
        className={textarea ? 'rm-textarea' : 'rm-input'}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function IconBtn({ icon, onClick, title, danger, disabled }) {
  return (
    <button
      className={`rm-iconbtn${danger ? ' is-danger' : ''}`}
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
    >
      <Icon d={icons[icon]} size={13} />
    </button>
  );
}

// The page-break inserter: a clickable divider that sits between items.
export function Breaker({ on, onToggle, title = 'Start new page here' }) {
  return (
    <button className={`rm-breaker${on ? ' is-on' : ''}`} onClick={onToggle} title={title}>
      <span className="rm-line" />
      <span className="rm-tag">{on ? 'Page break' : title}</span>
      <span className="rm-line" />
    </button>
  );
}

export function AddButton({ onClick, children, disabled }) {
  return (
    <button className="rm-add" onClick={onClick} disabled={disabled}>
      <Icon d={icons.plus} size={14} />
      {children}
    </button>
  );
}

// Move up / move down / delete cluster shared by every list item.
export function ItemControls({ onUp, onDown, onDelete, isFirst, isLast }) {
  return (
    <>
      <IconBtn icon="up" title="Move up" onClick={onUp} disabled={isFirst} />
      <IconBtn icon="down" title="Move down" onClick={onDown} disabled={isLast} />
      <IconBtn icon="trash" title="Delete" onClick={onDelete} danger />
    </>
  );
}
