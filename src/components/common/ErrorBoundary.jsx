import React from 'react';
import evsuSeal from '../../assets/images/evsu-seal.png';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  handleClearAndReload = () => {
    localStorage.removeItem('performa_token');
    localStorage.removeItem('performa_user');
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8fafc',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            padding: '24px',
          }}
        >
          <div
            style={{
              maxWidth: '560px',
              width: '100%',
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
              padding: '32px',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
              <img src={evsuSeal} alt="EVSU Seal" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
              <div style={{ textAlign: 'left' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--brand-700, #7a1128)' }}>
                  PerformaCOS
                </h2>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', letterSpacing: '0.04em' }}>
                  EASTERN VISAYAS STATE UNIVERSITY
                </span>
              </div>
            </div>

            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#fee2e2',
                color: '#dc2626',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                fontWeight: 700,
                marginBottom: '16px',
              }}
            >
              !
            </div>

            <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: '#0f172a' }}>
              Application Render Notice
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '13.5px', color: '#475569', lineHeight: 1.5 }}>
              An unexpected issue occurred while displaying this page. You can try reloading or clearing your local session cache.
            </p>

            {this.state.error && (
              <div
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  fontSize: '12px',
                  color: '#334155',
                  textAlign: 'left',
                  fontFamily: 'monospace',
                  marginBottom: '20px',
                  wordBreak: 'break-all',
                  maxHeight: '120px',
                  overflowY: 'auto',
                }}
              >
                {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  background: 'var(--brand-700, #7a1128)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                }}
              >
                Reload Page
              </button>
              <button
                type="button"
                onClick={this.handleClearAndReload}
                style={{
                  background: '#f8fafc',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  padding: '10px 18px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                }}
              >
                Reset Session & Login
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
