import React, { useState } from 'react';
import { UserCheck, Briefcase, Phone, MapPin, AlertCircle, X, ShieldAlert } from 'lucide-react';
import api from '../../services/api';

export default function CompleteProfileModal({
  currentUser,
  isOpen = false,
  onClose = () => {},
  onProfileCompleted = () => {},
}) {
  if (!isOpen) return null;

  const currentJob = currentUser?.jobTitle || currentUser?.job_title || currentUser?.position || '';
  const currentPhone = currentUser?.contactNumber || currentUser?.contact_number || '';
  const currentEmergency = currentUser?.emergencyContact || currentUser?.emergency_contact || '';
  const currentOffice = currentUser?.officeLocation || currentUser?.office_location || '';

  const [jobTitle, setJobTitle] = useState(
    currentJob === 'COS Staff' || currentJob === 'COS Employee' ? '' : currentJob
  );
  const [contactNumber, setContactNumber] = useState(currentPhone);
  const [emergencyContact, setEmergencyContact] = useState(currentEmergency);
  const [officeLocation, setOfficeLocation] = useState(currentOffice);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanJob = jobTitle.trim();
    const cleanPhone = contactNumber.trim();

    if (!cleanJob) {
      setErrorMessage('Please enter your Job Position or Designation.');
      return;
    }

    if (!cleanPhone) {
      setErrorMessage('Please enter your official contact / mobile phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        job_title: cleanJob,
        contact_number: cleanPhone,
        emergency_contact: emergencyContact.trim() || null,
        office_location: officeLocation.trim() || null,
      };

      const updated = await api.users.updateContact(currentUser.id, payload);
      onProfileCompleted(updated || payload);
      onClose();
    } catch (err) {
      console.error('Failed to complete profile:', err);
      setErrorMessage(err.message || 'Failed to update personnel profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '520px',
          background: '#ffffff',
          borderRadius: '14px',
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.25)',
          border: '1px solid var(--line)',
          padding: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '94vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 22px',
            borderBottom: '1px solid var(--line)',
            background: '#fff',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: '#fef3c7',
              color: '#b45309',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <UserCheck size={24} />
          </div>
          <div style={{ flex: 1, minWidth: 0, paddingRight: '10px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 4px', color: 'var(--ink-900)' }}>
              Complete Personnel Profile
            </h2>
            <p style={{ fontSize: '12.5px', color: 'var(--ink-500)', margin: 0, lineHeight: 1.45 }}>
              Please enter your job title and contact details to finish setting up your account.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--ink-400)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink-700)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ink-400)')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          {errorMessage && (
            <div
              style={{
                padding: '10px 14px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '12.5px',
                color: '#991b1b',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Job Position / Designation */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '12.5px', fontWeight: 700, display: 'block', marginBottom: '6px', color: 'var(--ink-800)' }}>
              Job Position / Designation <span style={{ color: 'var(--red-600)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                required
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Administrative Aide VI / Instructor I"
                className="form-control"
                style={{ width: '100%', paddingLeft: '36px', height: '42px', fontSize: '14px' }}
              />
              <Briefcase
                size={16}
                color="var(--ink-400)"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--ink-500)', marginTop: '4px', display: 'block' }}>
              Your role or position on campus. HR can adjust this if needed.
            </span>
          </div>

          {/* Official Contact Number */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '12.5px', fontWeight: 700, display: 'block', marginBottom: '6px', color: 'var(--ink-800)' }}>
              Official Contact / Mobile Number <span style={{ color: 'var(--red-600)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="tel"
                required
                autoComplete="tel"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="e.g. 0123 456 7890"
                className="form-control"
                style={{ width: '100%', paddingLeft: '36px', height: '42px', fontSize: '14px' }}
              />
              <Phone
                size={16}
                color="var(--ink-400)"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--ink-500)', marginTop: '4px', display: 'block' }}>
              Used by HRMO and your department head for official communications.
            </span>
          </div>

          {/* Emergency Contact */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '12.5px', fontWeight: 700, display: 'block', marginBottom: '6px', color: 'var(--ink-800)' }}>
              Emergency Contact Person &amp; Phone <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--ink-400)' }}>(Optional)</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="e.g. Juan Dela Cruz (Spouse) - 0123 456 7890"
                className="form-control"
                style={{ width: '100%', paddingLeft: '36px', height: '42px', fontSize: '14px' }}
              />
              <ShieldAlert
                size={16}
                color="var(--ink-400)"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          {/* Office Station / Desk Location */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '12.5px', fontWeight: 700, display: 'block', marginBottom: '6px', color: 'var(--ink-800)' }}>
              Office Station / Room Assignment <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--ink-400)' }}>(Optional)</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={officeLocation}
                onChange={(e) => setOfficeLocation(e.target.value)}
                placeholder="e.g. IT Building, IT Office"
                className="form-control"
                style={{ width: '100%', paddingLeft: '36px', height: '42px', fontSize: '14px' }}
              />
              <MapPin
                size={16}
                color="var(--ink-400)"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          {/* Action Button */}
          <div style={{ marginTop: '8px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{
                width: '100%',
                height: '44px',
                fontSize: '14px',
                fontWeight: 800,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: 'var(--brand-700, #7a1128)',
                borderRadius: '8px',
              }}
            >
              {isSubmitting ? 'Saving Profile...' : 'Save & Complete Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
