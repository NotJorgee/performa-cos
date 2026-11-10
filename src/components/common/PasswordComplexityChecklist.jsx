import React from 'react';
import { Check } from 'lucide-react';
import { evaluatePasswordComplexity } from '../../utils/onboardingHelpers';

export default function PasswordComplexityChecklist({ password = '' }) {
  if (!password) return null;

  const { hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial } =
    evaluatePasswordComplexity(password);

  const rules = [
    { key: 'length', label: '8+ Characters', passed: hasMinLength },
    { key: 'upper', label: 'Uppercase (A-Z)', passed: hasUpper },
    { key: 'lower', label: 'Lowercase (a-z)', passed: hasLower },
    { key: 'number', label: 'Number (0-9)', passed: hasNumber },
    { key: 'special', label: 'Symbol (!@#$)', passed: hasSpecial },
  ];

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '6px' }}>
      {rules.map((rule) => (
        <span
          key={rule.key}
          style={{
            fontSize: '10.5px',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: '4px',
            background: rule.passed ? '#dcfce7' : '#f1f5f9',
            color: rule.passed ? '#15803d' : '#64748b',
            border: `1px solid ${rule.passed ? '#86efac' : '#e2e8f0'}`,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
          }}
        >
          {rule.passed ? <Check size={11} strokeWidth={2.5} /> : <span>-</span>}
          <span>{rule.label}</span>
        </span>
      ))}
    </div>
  );
}
