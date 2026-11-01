import React from 'react';

/**
 * Calculates comparative performance trajectory between the current evaluation and previous cycle.
 * Classification thresholds:
 * - Improvement: Delta >= +1.0 pt
 * - Decline: Delta <= -1.0 pt
 * - Consistent: Within -1.0 pt to +1.0 pt
 * - Baseline: 1st Contract (no previous evaluation record)
 */
export function getComparativeTrajectory(currentScore, previousScore) {
  if (
    previousScore === null ||
    previousScore === undefined ||
    previousScore === '' ||
    Number.isNaN(Number(previousScore))
  ) {
    return {
      type: 'baseline',
      status: 'Baseline',
      delta: 0,
      deltaFormatted: 'N/A',
      label: 'Baseline',
      fullLabel: 'Baseline (1st Contract)',
      badgeText: '★ Baseline (1st Contract)',
      icon: '★',
      color: '#475569',
      bg: '#f1f5f9',
      border: '#cbd5e1',
      description: 'First contract on record. Serves as starting baseline.',
    };
  }

  const curr = Number(currentScore);
  const prev = Number(previousScore);
  const delta = Math.round((curr - prev) * 10) / 10;

  if (delta >= 1.0) {
    return {
      type: 'improvement',
      status: 'Improvement',
      delta,
      deltaFormatted: `+${delta.toFixed(1)}`,
      label: `+${delta.toFixed(1)} pts`,
      fullLabel: `+${delta.toFixed(1)} pts Improvement`,
      badgeText: `▲ +${delta.toFixed(1)} pts Improvement`,
      icon: '▲',
      color: '#15803d',
      bg: '#f0fdf4',
      border: '#bbf7d0',
      description: `Score improved by +${delta.toFixed(1)} points compared to previous contract.`,
    };
  }

  if (delta <= -1.0) {
    return {
      type: 'decline',
      status: 'Decline',
      delta,
      deltaFormatted: `${delta.toFixed(1)}`,
      label: `${delta.toFixed(1)} pts`,
      fullLabel: `${delta.toFixed(1)} pts Decline`,
      badgeText: `▼ ${delta.toFixed(1)} pts Decline`,
      icon: '▼',
      color: '#b91c1c',
      bg: '#fef2f2',
      border: '#fecaca',
      description: `Score decreased by ${Math.abs(delta).toFixed(1)} points compared to previous contract.`,
    };
  }

  return {
    type: 'consistent',
    status: 'Consistent',
    delta,
    deltaFormatted: delta === 0 ? '0.0' : (delta > 0 ? `+${delta.toFixed(1)}` : `${delta.toFixed(1)}`),
    label: `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} pts`,
    fullLabel: `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} pts Consistent`,
    badgeText: `▬ ${delta >= 0 ? '+' : ''}${delta.toFixed(1)} pts Consistent`,
    icon: '▬',
    color: '#0369a1',
    bg: '#f0f9ff',
    border: '#bae6fd',
    description: `Score remained steady within ±1.0 point of previous contract.`,
  };
}

/**
 * Computes cycle-over-cycle triad breakdown and deliverable task volume deltas
 */
export function getTriadComparativeDeltas(currentCycle, previousCycle) {
  if (!currentCycle || !previousCycle) return null;

  const finalDelta = Math.round((currentCycle.finalGrade - previousCycle.finalGrade) * 10) / 10;
  const supervisorDelta = Math.round(((currentCycle.supervisorScore || 0) - (previousCycle.supervisorScore || 0)) * 10) / 10;
  const peerDelta = Math.round(((currentCycle.peerScore || 0) - (previousCycle.peerScore || 0)) * 10) / 10;
  const hrmoDelta = Math.round(((currentCycle.hrmoScore || 0) - (previousCycle.hrmoScore || 0)) * 10) / 10;
  const marDelta = (currentCycle.marCount || 0) - (previousCycle.marCount || 0);

  const trajectory = getComparativeTrajectory(currentCycle.finalGrade, previousCycle.finalGrade);

  return {
    trajectory,
    currentPeriod: currentCycle.periodDates,
    previousPeriod: previousCycle.periodDates,
    currentScore: currentCycle.finalGrade,
    previousScore: previousCycle.finalGrade,
    finalDelta,
    finalDeltaFormatted: finalDelta >= 0 ? `+${finalDelta.toFixed(1)}` : `${finalDelta.toFixed(1)}`,
    triad: {
      supervisor: {
        weight: '50%',
        current: currentCycle.supervisorScore,
        previous: previousCycle.supervisorScore,
        delta: supervisorDelta,
        deltaFormatted: supervisorDelta >= 0 ? `+${supervisorDelta.toFixed(1)}%` : `${supervisorDelta.toFixed(1)}%`,
      },
      peer: {
        weight: '20%',
        current: currentCycle.peerScore,
        previous: previousCycle.peerScore,
        delta: peerDelta,
        deltaFormatted: peerDelta >= 0 ? `+${peerDelta.toFixed(1)}%` : `${peerDelta.toFixed(1)}%`,
      },
      hrmo: {
        weight: '30%',
        current: currentCycle.hrmoScore,
        previous: previousCycle.hrmoScore,
        delta: hrmoDelta,
        deltaFormatted: hrmoDelta >= 0 ? `+${hrmoDelta.toFixed(1)}%` : `${hrmoDelta.toFixed(1)}%`,
      },
    },
    mar: {
      current: currentCycle.marCount || 0,
      previous: previousCycle.marCount || 0,
      delta: marDelta,
      deltaFormatted: marDelta >= 0 ? `+${marDelta}` : `${marDelta}`,
      growthPct: previousCycle.marCount
        ? `${(((marDelta) / previousCycle.marCount) * 100).toFixed(1)}%`
        : 'N/A',
    },
  };
}

/**
 * Visual badge component for rendering trajectory badges cleanly.
 */
export function ComparativeTrajectoryBadge({ currentScore, previousScore, compact = false, showIcon = true }) {
  const traj = getComparativeTrajectory(currentScore, previousScore);

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: compact ? '11px' : '11.5px',
        fontWeight: 700,
        color: traj.color,
        background: traj.bg,
        border: `1px solid ${traj.border}`,
        padding: compact ? '2px 6px' : '2.5px 8px',
        borderRadius: '999px',
        lineHeight: 1.3,
        whiteSpace: 'nowrap',
      }}
      title={traj.description}
    >
      {showIcon && <span>{traj.icon}</span>}
      <span>{compact ? traj.label : traj.fullLabel}</span>
    </span>
  );
}
