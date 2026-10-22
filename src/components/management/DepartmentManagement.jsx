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
      latitude: 11.0065,
      longitude: 124.6075,
      radiusM: 500,
    },
    {
      id: 2,
      name: 'Technology Department',
      college: 'College of Technology',
      collegeCode: 'COT',
      employeeCount: 8,
      activeEvaluations: 1,
      latitude: 11.0068,
      longitude: 124.6072,
      radiusM: 500,
    },
    {
      id: 3,
      name: 'Library Office',
      college: 'Administrative and Support Services',
      collegeCode: 'ADMIN',
      employeeCount: 5,
      activeEvaluations: 0,
      latitude: 11.0062,
      longitude: 124.6080,
      radiusM: 400,
    },
  ],
  onAddDepartment = () => {},
  onUpdateDepartment = () => {},
  onDeleteDepartment = () => {},
  onBack = null,
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedDeptId, setExpandedDeptId] = useState(null);
  const [newDeptName, setNewDeptName] = useState('');
  const [newCollege, setNewCollege] = useState('College of Technology');
  const [newCollegeCode, setNewCollegeCode] = useState('COT');
  const [deleteError, setDeleteError] = useState(null);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    onAddDepartment({
      name: newDeptName,
      college: newCollege,
      collegeCode: newCollegeCode,
    });
    setNewDeptName('');
    setShowAddModal(false);
  };

  const handleDelete = (dept) => {
    // Referential Integrity Rule (UC-10, FR-23)
    if (dept.employeeCount > 0 || dept.activeEvaluations > 0) {
      setDeleteError(
        `Cannot delete "${dept.name}": This department possesses active employee accounts (${dept.employeeCount}) or pending evaluation cycles (${dept.activeEvaluations}). Reassign personnel first.`
      );
      return;
    }
    setDeleteError(null);
    onDeleteDepartment(dept.id);
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px' }}>Department Management (UC-10)</h1>
          <p className="muted" style={{ margin: 0 }}>
            Configure university colleges, offices, and campus geofence boundary coordinates.
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

      {deleteError && (
        <div className="flash flash-danger flash-shake" style={{ marginBottom: '18px' }}>
          {deleteError}
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Department Name</th>
              <th>College / Scope</th>
              <th>Personnel</th>
              <th>Active Cycles</th>
              <th>Geofence Boundary</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((d) => (
              <React.Fragment key={d.id}>
                <tr>
                  <td><b>{d.name}</b></td>
                  <td>{d.college} ({d.collegeCode})</td>
                  <td>{d.employeeCount} employees</td>
                  <td>
                    {d.activeEvaluations > 0 ? (
                      <span className="badge badge-inprogress">{d.activeEvaluations} Active</span>
                    ) : (
                      <span className="muted">None</span>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-completed">
                      {d.radiusM}m Radius
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm"
                      onClick={() => setExpandedDeptId(expandedDeptId === d.id ? null : d.id)}
                      style={{ marginRight: '6px' }}
                    >
                      {expandedDeptId === d.id ? 'Close Map' : 'Set Boundary'}
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{ color: 'var(--red-600)' }}
                      onClick={() => handleDelete(d)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>

                {/* Expanded Geofence Editor */}
                {expandedDeptId === d.id && (
                  <tr>
                    <td colSpan="6" style={{ background: '#f8fafc', padding: '18px' }}>
                      <div className="flex-between" style={{ marginBottom: '10px' }}>
                        <b style={{ color: 'var(--brand-700)' }}>
                          Geofence Boundary for {d.name}
                        </b>
                        <span className="muted" style={{ fontSize: '12px' }}>
                          Drag marker or click map to reposition boundary center
                        </span>
                      </div>
                      <div
                        style={{
                          height: '240px',
                          background: '#e2e8f0',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '14px',
                        }}
                      >
                        <div style={{ textAlign: 'center', color: 'var(--ink-700)' }}>
                          🗺️ <b>Campus Boundary Center</b>
                          <div style={{ fontSize: '13px', marginTop: '4px' }}>
                            Lat: {d.latitude.toFixed(6)}, Lng: {d.longitude.toFixed(6)} (Radius: {d.radiusM}m)
                          </div>
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Latitude</label>
                          <input className="form-control" type="number" step="0.000001" defaultValue={d.latitude} />
                        </div>
                        <div className="form-group">
                          <label>Longitude</label>
                          <input className="form-control" type="number" step="0.000001" defaultValue={d.longitude} />
                        </div>
                        <div className="form-group">
                          <label>Radius (meters)</label>
                          <input className="form-control" type="number" defaultValue={d.radiusM} />
                        </div>
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setExpandedDeptId(null);
                          onUpdateDepartment(d.id, { latitude: d.latitude, longitude: d.longitude, radiusM: d.radiusM });
                        }}
                      >
                        Save Boundary Coordinates
                      </button>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Department Modal */}
      {showAddModal && (
        <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}>
          <div className="modal-card">
            <div className="modal-header">
              <div className="card-title" style={{ margin: 0 }}>Add New Department</div>
              <button type="button" className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="form-group">
                <label>Department Name</label>
                <input
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
                  <label>College / Unit</label>
                  <input
                    className="form-control"
                    type="text"
                    required
                    value={newCollege}
                    onChange={(e) => setNewCollege(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>College Code</label>
                  <input
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
