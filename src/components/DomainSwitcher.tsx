import { useId } from 'react';
import { DOMAIN_OPTIONS } from '../lib/domain';
import type { Domain } from '../types/graph';

interface DomainControlProps {
  domain: Domain;
  onChange: (domain: Domain) => void;
}

function DomainSegment({ domain, onChange, labelledBy }: DomainControlProps & { labelledBy: string }) {
  return (
    <div className="segment domain-switch-segment" role="group" aria-labelledby={labelledBy}>
      {DOMAIN_OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={domain === option.id}
          data-testid={`domain-option-${option.id}`}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** Desktop topbar control. Distinct from ThemeSwitcher (appearance) and ThemeBar (explore chips). */
export function DomainSwitcher({ domain, onChange }: DomainControlProps) {
  const labelId = useId();
  return (
    <div className="domain-switch" data-testid="domain-switch">
      <span className="domain-switch-label" id={labelId}>
        知识主题
      </span>
      <DomainSegment domain={domain} onChange={onChange} labelledBy={labelId} />
    </div>
  );
}

/** Mobile 「更多」 menu group — same testids as desktop for reachability checks. */
export function DomainOptions({ domain, onChange }: DomainControlProps) {
  const labelId = useId();
  return (
    <div className="more-domain" data-testid="domain-switch">
      <p className="more-domain-label" id={labelId}>
        知识主题
      </p>
      <DomainSegment domain={domain} onChange={onChange} labelledBy={labelId} />
    </div>
  );
}
