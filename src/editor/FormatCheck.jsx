import { useMemo } from 'react';
import { runChecks } from '../validate/rules.js';
import { Icon, icons } from './controls.jsx';

const GROUPS = [
  { key: 'fail', label: 'Needs fixing' },
  { key: 'advisory', label: 'Check yourself' },
  { key: 'pass', label: 'Passing' },
  { key: 'guaranteed', label: "Can't go wrong" },
];

export function useFormatCheck(data, fill) {
  return useMemo(() => runChecks(data, fill), [data, fill]);
}

export default function FormatCheck({ result, rd, open, onClose }) {
  if (!open) return null;
  const { items, failCount, fixableCount } = result;

  const fixAll = () => items.filter((i) => i.status === 'fail' && i.fix).forEach((i) => i.fix(rd));

  return (
    <aside className="rm-drawer">
      <div className="rm-drawer-head">
        <Icon d={icons.check} />
        <h3>Format Check</h3>
        <span className={`rm-badge${failCount ? ' is-fail' : ' is-ok'}`}>
          {failCount ? `${failCount} to fix` : 'All clear'}
        </span>
        <button className="rm-iconbtn" onClick={onClose} title="Close">
          <Icon d={icons.close} size={14} />
        </button>
      </div>

      <div className="rm-drawer-body">
        <p className="rm-drawer-intro">
          Checked against the Training &amp; Placement office's Common Mistakes guide.
        </p>

        {fixableCount > 0 && (
          <button className="rm-btn rm-btn-primary rm-fixall" onClick={fixAll}>
            Fix {fixableCount} automatically
          </button>
        )}

        {GROUPS.map(({ key, label }) => {
          const group = items.filter((i) => i.status === key);
          if (!group.length) return null;
          return (
            <div className="rm-check-group" key={key}>
              <div className="rm-check-grouphead">{label} <span>{group.length}</span></div>
              {group.map((i) => (
                <div className={`rm-check rm-check-${i.status}`} key={i.id}>
                  <span className="rm-check-mark" aria-hidden="true" />
                  <div className="rm-check-body">
                    <div className="rm-check-title">
                      {i.title}
                      <span className="rm-check-rule">{i.rule}</span>
                    </div>
                    <div className="rm-check-detail">{i.detail}</div>
                    {i.status === 'fail' && i.fix && (
                      <button className="rm-btn rm-btn-secondary rm-check-fix" onClick={() => i.fix(rd)}>
                        Fix this
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
