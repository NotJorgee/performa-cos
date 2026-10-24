import React, { useState } from 'react';

const EVSU_DEPT_PRESETS = [
  'Disbursing / Cashier Office',
  'HRMDO Office',
  'School Clinic',
  'IPDO Office',
  'Research Office',
  'Sports And Development Office',
  'Quality Assurance & Accreditation Office',
  'Technology Department',
  'Guidance Office',
  'Extension Service Office',
  'Education Department',
  'Procurement Office',
  'Campus Director Office',
  'Computer Studies Department',
  'Engineering Department',
  'Administrative and Finance Office',
  'Library Office',
  'Registrar Office',
  'Maintenance/Janitorial (MESO) Office',
];

export default function DepartmentManagement({
  departments = [
    {
      id: 1,
      name: 'Computer Studies Department',
      college: 'College of Technology',
      collegeCode: 'COT',
      employeeCount: 12,
      activeEvaluations: 3,
    },
    {
      id: 2,
      name: 'Technology Department',
      college: 'College of Technology',
      collegeCode: 'COT',
      employeeCount: 8,
      activeEvaluations: 1,
    },
    {
      id: 3,
      name: 'Library Office',
      college: 'Administrative and Support Services',
      collegeCode: 'ADMIN',
      employeeCount: 5,
      activeEvaluations: 0,
    },
    {
      id: 4,
      name: 'Engineering Department',
      college: 'College of Engineering',
      collegeCode: 'COE',
      employeeCount: 10,
      activeEvaluations: 2,
    },
    {
      id: 5,
      name: 'Education Department',
      college: 'College of Education',
      collegeCode: 'COED',
      employeeCount: 6,
      activeEvaluations: 1,
    },
    {
      id: 6,
      name: 'HRMDO Office',
      college: 'Administrative and Support Services',
      collegeCode: 'ADMIN',
      employeeCount: 4,
      activeEvaluations: 0,
    },
  ],
  onAddDepartment = () => {},
  onUpdateDepartment = () => {},
  onDeleteDepartment = () => {},
  onBack = null,
}) {
  const [deptList, setDeptList] = useState(departments);
  const [showAddModal, setShowAddModal] = useState(false);
  const [settingsDept, setSettingsDept] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  // Add form fields
  const [newDeptName, setNewDeptName] = useState('');
  const [newCollege, setNewCollege] = useState('College of Technology');
  const [newCollegeCode, setNewCollegeCode] = useState('COT');

  // Edit settings form fields
  const [editDeptName, setEditDeptName] = useState('');
  const [editCollege, setEditCollege] = useState('');
  const [editCollegeCode, setEditCollegeCode] = useState('');

  const openDeptSettings = (dept) => {
    setSettingsDept(dept);
    setEditDeptName(dept.name);
    setEditCollege(dept.college);
    setEditCollegeCode(dept.collegeCode);
    setDeleteError(null);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    const newDept = {
      id: Date.now(),
      name: newDeptName.trim(),
      college: newCollege.trim(),
      collegeCode: newCollegeCode.trim(),
      employeeCount: 0,
      activeEvaluations: 0,
    };
    setDeptList([newDept, ...deptList]);
    onAddDepartment(newDept);
    setNewDeptName('');
    setShowAddModal(false);
    setToastMsg(`Department "${newDept.name}" added successfully.`);
    setTimeout(() => setToastMsg(null), 4500);
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    if (!settingsDept || !editDeptName.trim()) return;

    const updated = {
      ...settingsDept,
      name: editDeptName.trim(),
      college: editCollege.trim(),
      collegeCode: editCollegeCode.trim(),
    };

    setDeptList((prev) => prev.map((d) => (d.id === settingsDept.id ? updated : d)));
    onUpdateDepartment(settingsDept.id, updated);
    setToastMsg(`Department settings updated for "${updated.name}".`);
    setSettingsDept(null);
    setTimeout(() => setToastMsg(null), 4500);
  };

  const handleDelete = (dept) => {
    // Referential Integrity Rule (UC-10, FR-23)
    if (dept.employeeCount > 0 || dept.activeEvaluations > 0) {
      setDeleteError(
        `Cannot delete "${dept.name}": This department possesses active employee accounts (${dept.employeeCount}) or pending evaluation cycles (${dept.activeEvaluations}). Reassign personnel first.`
      );
      return;
    }
    if (
      window.confirm(
        `Are you sure you want to permanently delete "${dept.name}"? This action cannot be undone.`
      )
    ) {
      setDeleteError(null);
      setDeptList((prev) => prev.filter((d) => d.id !== dept.id));
      onDeleteDepartment(dept.id);
      setToastMsg(`Department "${dept.name}" was successfully removed.`);
      setSettingsDept(null);
      setTimeout(() => setToastMsg(null), 4500);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex-between" style={{ marginBottom: '14px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px' }}>Department Management (UC-10)</h1>
          <p className="muted" style={{ margin: 0 }}>
            Configure university colleges, academic departments, and institutional administrative offices.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {onBack && (
            <button className="btn btn-sm" type="button" onClick={onBack}>
              ← Back to Dashboard
            </button>
          )}
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => setShowAddModal(true)}
          >
            + Add Department
          </button>
        </div>
      </div>

      {/* Campus Geofence Info Notice */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'var(--brand-50)',
          border: '1px solid var(--brand-border)',
          borderRadius: '10px',
          padding: '10px 14px',
          marginBottom: '16px',
          fontSize: '13px',
          color: 'var(--ink-800)',
        }}
      >
        <span>📍</span>
        <div style={{ flex: 1 }}>
          <b>Campus Geofence is Universal:</b> Geofencing coordinates are centralized in the top-left <b>Hamburger Menu (☰ → Campus Geofence)</b> so all departments operate under a unified EVSU-Ormoc campus boundary.
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="flash flash-success" style={{ marginBottom: '16px' }}>
          ✓ {toastMsg}
        </div>
      )}

      {deleteError && (
        <div className="flash flash-danger flash-shake" style={{ marginBottom: '16px' }}>
          ⚠️ {deleteError}
        </div>
      )}

      {/* Departments Roster Table without Geofence Boundary Column */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Department Name</th>
              <th>College / Scope</th>
              <th>Personnel</th>
              <th>Active Cycles</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {deptList.map((d) => (
              <tr key={d.id}>
                <td>
                  <b>{d.name}</b>
                </td>
                <td>
                  {d.college} ({d.collegeCode})
                </td>
                <td>{d.employeeCount} employees</td>
                <td>
                  {d.activeEvaluations > 0 ? (
                    <span className="badge badge-inprogress">{d.activeEvaluations} Active</span>
                  ) : (
                    <span className="muted">None</span>
                  )}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    className="btn btn-sm"
                    type="button"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                    }}
                    onClick={() => openDeptSettings(d)}
                    title={`Edit Settings - ${d.name}`}
                  >
                    ⚙️ Settings
                  </button>
                </td>
              </tr>
            ))}
            {deptList.length === 0 && (
              <tr>
                <td colSpan="5" className="muted" style={{ padding: '24px', textAlign: 'center' }}>
                  No departments configured. Click "+ Add Department" to add one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 1. DEPARTMENT SETTINGS MODAL */}
      {settingsDept && (
        <div
          className="modal-overlay open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSettingsDept(null);
          }}
        >
          <div className="modal-card" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <div className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>⚙️ Department Settings</span>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setSettingsDept(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Department Summary Brief */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: '#f8fafc',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                marginBottom: '18px',
              }}
            >
              <div>
                <span className="emp-id-chip" style={{ marginBottom: '4px', display: 'inline-block' }}>
                  {settingsDept.collegeCode}
                </span>
                <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--ink)' }}>
                  {settingsDept.name}
                </div>
                <div className="muted" style={{ fontSize: '12px' }}>
                  {settingsDept.college}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-dept" style={{ display: 'block', marginBottom: '4px' }}>
                  {settingsDept.employeeCount} Personnel
                </span>
                <span className={`badge ${settingsDept.activeEvaluations > 0 ? 'badge-inprogress' : 'badge-completed'}`}>
                  {settingsDept.activeEvaluations} Active Evals
                </span>
              </div>
            </div>

            {/* Delete Error inside Modal */}
            {deleteError && (
              <div className="flash flash-danger" style={{ marginBottom: '14px', fontSize: '12.5px' }}>
                ⚠️ {deleteError}
              </div>
            )}

            {/* Edit Department Details Form */}
            <form onSubmit={handleSaveSettings}>
              <div className="section-label" style={{ marginTop: 0, marginBottom: '8px', color: 'var(--ink)' }}>
                Department Configuration
              </div>

              <div className="form-group">
                <label htmlFor="editDeptNameInput">
                  Department Name <span style={{ color: 'var(--red-600)' }}>*</span>
                </label>
                <input
                  id="editDeptNameInput"
                  className="form-control"
                  type="text"
                  required
                  list="editDeptPresets"
                  value={editDeptName}
                  onChange={(e) => setEditDeptName(e.target.value)}
                />
                <datalist id="editDeptPresets">
                  {EVSU_DEPT_PRESETS.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="editCollegeInput">
                    College / Institutional Unit <span style={{ color: 'var(--red-600)' }}>*</span>
                  </label>
                  <input
                    id="editCollegeInput"
                    className="form-control"
                    type="text"
                    required
                    value={editCollege}
                    onChange={(e) => setEditCollege(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="editCollegeCodeInput">
                    College Code <span style={{ color: 'var(--red-600)' }}>*</span>
                  </label>
                  <input
                    id="editCollegeCodeInput"
                    className="form-control"
                    type="text"
                    required
                    value={editCollegeCode}
                    onChange={(e) => setEditCollegeCode(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '22px' }}>
                <button type="submit" className="btn btn-primary" style={{ cursor: 'pointer' }}>
                  Save Department Changes
                </button>
              </div>
            </form>

            {/* Danger Zone: Delete Department with Referential Integrity */}
            <div
              style={{
                border: '1px solid var(--red-200, #fecaca)',
                background: '#fff5f5',
                borderRadius: '8px',
                padding: '14px 16px',
                marginBottom: '18px',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--red-700)', marginBottom: '4px' }}>
                🗑️ Danger Zone — Delete Department
              </div>
              <p className="muted" style={{ fontSize: '12px', margin: '0 0 10px', lineHeight: 1.4 }}>
                Permanently removes this department. Referential integrity prevents deletion if active personnel accounts or pending evaluation cycles are currently assigned.
              </p>

              {settingsDept.employeeCount > 0 || settingsDept.activeEvaluations > 0 ? (
                <div
                  style={{
                    background: '#fff',
                    border: '1px solid #fca5a5',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: 'var(--red-700)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>🔒</span>
                  <span>
                    Cannot delete: <b>{settingsDept.employeeCount} personnel</b> and <b>{settingsDept.activeEvaluations} active evaluations</b> assigned.
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn"
                  style={{
                    color: 'var(--red-600)',
                    borderColor: '#f3c2c2',
                    background: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                  onClick={() => handleDelete(settingsDept)}
                >
                  Delete Department
                </button>
              )}
            </div>

            <div className="flex-between">
              <span className="muted" style={{ fontSize: '12px' }}>
                EVSU-Ormoc Institutional Registry
              </span>
              <button
                type="button"
                className="btn"
                style={{ cursor: 'pointer' }}
                onClick={() => setSettingsDept(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. ADD DEPARTMENT MODAL */}
      {showAddModal && (
        <div
          className="modal-overlay open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
        >
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div className="card-title" style={{ margin: 0 }}>
                Add New Department
              </div>
              <button type="button" className="modal-close" onClick={() => setShowAddModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="form-group">
                <label htmlFor="newDeptName">Department Name</label>
                <input
                  id="newDeptName"
                  className="form-control"
                  type="text"
                  required
                  list="deptPresets"
                  placeholder="Select or type a department name"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                />
                <datalist id="deptPresets">
                  {EVSU_DEPT_PRESETS.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="newCollege">College / Unit</label>
                  <input
                    id="newCollege"
                    className="form-control"
                    type="text"
                    required
                    value={newCollege}
                    onChange={(e) => setNewCollege(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="newCollegeCode">College Code</label>
                  <input
                    id="newCollegeCode"
                    className="form-control"
                    type="text"
                    required
                    value={newCollegeCode}
                    onChange={(e) => setNewCollegeCode(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-between" style={{ marginTop: '16px' }}>
                <button type="button" className="btn" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
