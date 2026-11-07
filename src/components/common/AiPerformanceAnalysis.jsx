import React from 'react';
import { Award, TrendingUp, ListChecks, Zap, Sparkles } from 'lucide-react';

export default function AiPerformanceAnalysis({
  aiSummary = null,
  totalDarEntries = 84,
  employeeName = '',
  action = null,
  scrollable = false,
  maxHeight = 'calc(100vh - 120px)',
}) {
  if (!aiSummary) return null;

  const {
    confidenceScore = 94,
    monthlyAccomplishments = [
      'Successfully maintained 100% technical resolution uptime for 24 lab workstations in Computer Studies Department.',
      'Digitally processed and validated 150 student clearance forms within institutional turnaround limits.',
      'Configured and calibrated 12 multimedia audiovisual terminals for department academic assemblies.',
      'Spearheaded student query backlog clearance and automated laboratory terminal inventory logs.',
    ],
    workTrends = [
      'Consistent daily output averaging 2.1 tasks completed per working day.',
      'Workload peaked during midterm examination weeks (Oct 12–16) with 38 student clearance validations resolved.',
      'Task turnaround time improved by 28% from month 1 to month 3 with zero errors or revisions required.',
      'Consistent task delivery across all verified accomplishment entries.',
    ],
    frequentActivities = [
      { label: 'Laboratory Hardware Diagnostics & Maintenance', pct: '42%' },
      { label: 'Student Document Verification & Clearance Routing', pct: '31%' },
      { label: 'Audio-Visual Support for Campus Assemblies', pct: '18%' },
      { label: 'Equipment Inventory & Supplies Encoding', pct: '9%' },
    ],
    productivitySummary = {
      totalTasks: totalDarEntries || 84,
      dailyAverage: '2.1 tasks/day',
      completionRate: '100%',
      reliabilityIndex: 'High Reliability',
      qualityAssessment: 'Zero error backlog; high-quality output on all tasks',
    },
  } = aiSummary;

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid var(--line)',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        display: 'flex',
        flexDirection: 'column',
        ...(scrollable ? { maxHeight: maxHeight, overflow: 'hidden' } : {}),
      }}
    >
      {/* Header with Sparkles & Confidence */}
      <div
        className="flex-between"
        style={{
          borderBottom: '1px solid var(--line)',
          padding: '16px 20px',
          background: '#ffffff',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--brand-50, #fdf2f4)',
              color: 'var(--brand-700, #7a0c2e)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--ink-900)' }}>
              AI Performance Summary (Daily Reports)
            </div>
            <div className="muted" style={{ fontSize: '11.5px' }}>
              Generated from {totalDarEntries} verified DARs for {employeeName || 'staff'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span
            className="badge badge-completed"
            style={{ fontSize: '11.5px', fontWeight: 700, padding: '3px 10px' }}
          >
            Confidence: {confidenceScore}%
          </span>
          {action}
        </div>
      </div>

      {/* Vertical Stack: 4 Structured Dimensions */}
      <div
        className={scrollable ? 'ai-summary-scroll' : ''}
        style={{
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          ...(scrollable ? { overflowY: 'auto', flex: 1 } : {}),
        }}
      >
        {/* 1. Monthly Accomplishments */}
        <div
          style={{
            background: '#fafbfc',
            borderRadius: '10px',
            border: '1px solid var(--line)',
            padding: '14px 16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '10px',
              color: 'var(--brand-700, #7a0c2e)',
              fontWeight: 700,
              fontSize: '13.5px',
            }}
          >
            <Award size={17} />
            <span>1. Monthly Accomplishments</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: 1.6, color: 'var(--ink-800)' }}>
            {monthlyAccomplishments.map((item, i) => (
              <li key={i} style={{ marginBottom: i === monthlyAccomplishments.length - 1 ? 0 : '6px' }}>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* 2. Trends in Completed Work */}
        <div
          style={{
            background: '#fafbfc',
            borderRadius: '10px',
            border: '1px solid var(--line)',
            padding: '14px 16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '10px',
              color: 'var(--blue-600, #2563eb)',
              fontWeight: 700,
              fontSize: '13.5px',
            }}
          >
            <TrendingUp size={17} />
            <span>2. Trends in Completed Work</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: 1.6, color: 'var(--ink-800)' }}>
            {workTrends.map((item, i) => (
              <li key={i} style={{ marginBottom: i === workTrends.length - 1 ? 0 : '6px' }}>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* 3. Frequently Assigned Activities */}
        <div
          style={{
            background: '#fafbfc',
            borderRadius: '10px',
            border: '1px solid var(--line)',
            padding: '14px 16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px',
              color: 'var(--green-700, #15803d)',
              fontWeight: 700,
              fontSize: '13.5px',
            }}
          >
            <ListChecks size={17} />
            <span>3. Frequently Assigned Activities</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {frequentActivities.map((act, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  fontSize: '13px',
                }}
              >
                <span style={{ color: 'var(--ink-800)', flex: 1 }}>{act.label}</span>
                <span
                  style={{
                    background: '#e2e8f0',
                    color: 'var(--ink-800)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '12px',
                    minWidth: '42px',
                    textAlign: 'center',
                  }}
                >
                  {act.pct}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Productivity Summary */}
        <div
          style={{
            background: '#fafbfc',
            borderRadius: '10px',
            border: '1px solid var(--line)',
            padding: '14px 16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px',
              color: 'var(--amber-700, #b45309)',
              fontWeight: 700,
              fontSize: '13.5px',
            }}
          >
            <Zap size={17} />
            <span>4. Productivity Summary</span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              marginBottom: '10px',
            }}
          >
            <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '8px', padding: '12px 14px' }}>
              <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Total DARs</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ink-900)', marginTop: '2px' }}>
                {productivitySummary.totalTasks} tasks
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '8px', padding: '12px 14px' }}>
              <div className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Daily Output</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ink-900)', marginTop: '2px' }}>
                {productivitySummary.dailyAverage}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
