import React, { useState, useEffect } from 'react';
import { Settings, Check, AlertTriangle, X, Trash2, Lock } from 'lucide-react';
import { api } from '../../services/api';

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
  'IGP Office',
  'Campus Director Office',
  'Computer Studies Department',
  'SASO Office',
  'Engineering Department',
  'Administrative and Finance',
  'Hospitality & Tourism Management',
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

  useEffect(() => {
    let isMounted = true;
    api.departments
      .list()
      .then((depts) => {
        if (isMounted && Array.isArray(depts) && depts.length > 0) {
          const mapped = depts.map((d) => ({
            id: d.id,
            name: d.name,
            college: d.college || 'Academic Services',
            collegeCode: d.college_code || 'EVSU',
            employeeCount: 0,
            activeEvaluations: 0,
          }));
          setDeptList(mapped);
        }
      })
      .catch((err) => {
        console.warn('API departments fetch notice:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('');

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

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;

    let newDept = {
      id: Date.now(),
      name: newDeptName.trim(),
      college: newCollege.trim(),
      collegeCode: newCollegeCode.trim(),
      employeeCount: 0,
      activeEvaluations: 0,
    };

    try {
      const res = await api.departments.create({
        name: newDeptName.trim(),
        college: newCollege.trim(),
        college_code: newCollegeCode.trim(),
      });
      newDept.id = res.id;
      setToastMsg(`Department "${newDept.name}" created in database.`);
    } catch (err) {
      console.warn('API create department notice:', err);
      setToastMsg(`Department "${newDept.name}" added locally.`);
    }

    setDeptList([newDept, ...deptList]);
    onAddDepartment(newDept);
    setNewDeptName('');
    setShowAddModal(false);
    setTimeout(() => setToastMsg(null), 4500);
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!settingsDept || !editDeptName.trim()) return;

    const updated = {
      ...settingsDept,
      name: editDeptName.trim(),
      college: editCollege.trim(),
      collegeCode: editCollegeCode.trim(),
    };

    try {
      await api.departments.update(settingsDept.id, {
        name: editDeptName.trim(),
        college: editCollege.trim(),
        college_code: editCollegeCode.trim(),
      });
      setToastMsg(`Department "${updated.name}" updated in database.`);
    } catch (err) {
      console.warn('API update department notice:', err);
      setToastMsg(`Department settings updated for "${updated.name}".`);
    }

    setDeptList((prev) => prev.map((d) => (d.id === settingsDept.id ? updated : d)));
    onUpdateDepartment(settingsDept.id, updated);
    setSettingsDept(null);
    setTimeout(() => setToastMsg(null), 4500);
  };

  const handleDelete = async (dept) => {
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
      try {
        await api.departments.delete(dept.id);
        setToastMsg(`Department "${dept.name}" was successfully removed from database.`);
      } catch (err) {
        setDeleteError(err.message || `Cannot delete "${dept.name}".`);
        return;
      }
      setDeptList((prev) => prev.filter((d) => d.id !== dept.id));
      onDeleteDepartment(dept.id);
      setSettingsDept(null);
      setTimeout(() => setToastMsg(null), 4500);
    }
  };

  const colleges = Array.from(new Set(deptList.map((d) => d.college).filter(Boolean)));

  const filteredDepts = deptList.filter((d) => {
    const matchesSearch =
      !searchTerm ||
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.college.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.collegeCode && d.collegeCode.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCollege = !collegeFilter || d.college === collegeFilter;
    return matchesSearch && matchesCollege;
  });

  return (
    <div>
      {/* Page Header */}
      <div className="flex-between" style={{ marginBottom: '14px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px' }}>Department Management</h1>
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
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="flash flash-success" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Check size={16} /> <span>{toastMsg}</span>
        </div>
      )}

      {deleteError && (
        <div className="flash flash-danger flash-shake" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={16} /> <span>{deleteError}</span>
        </div>
      )}

      {/* Filter Row with Add Department on Same Level */}
      <div className="filter-row" style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
        <input
          className="form-control"
          type="text"
          placeholder="Search by department name, college, or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 2 }}
        />
        <select
          className="form-control"
          value={collegeFilter}
          onChange={(e) => setCollegeFilter(e.target.value)}
          style={{ flex: 1.2 }}
        >
          <option value="">All Colleges / Scopes</option>
          {colleges.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          className="btn btn-primary"
          type="button"
          style={{ whiteSpace: 'nowrap' }}
          onClick={() => setShowAddModal(true)}
        >
          + Add Department
        </button>
      </div>

      {/* Departments Roster Table without Geofence Boundary Column */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Department Name</th>
              <th>College / Scope</th>
              <th>Personnel</th>
              <th>Ongoing Evaluations</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredDepts.map((d) => (
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
                    <span className="badge badge-inprogress">{d.activeEvaluations} Ongoing</span>
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
                    <Settings size={14} /> Settings
                  </button>
                </td>
              </tr>
            ))}
            {filteredDepts.length === 0 && (
              <tr>
                <td colSpan="5" className="muted" style={{ padding: '24px', textAlign: 'center' }}>
                  {deptList.length === 0
                    ? 'No departments configured. Click "+ Add Department" to add one.'
                    : 'No departments matching search criteria.'}
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
                <Settings size={18} />
                <span>Department Settings</span>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setSettingsDept(null)}
                aria-label="Close"
              >
                <X size={18} />
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
                  {settingsDept.activeEvaluations} Ongoing Evals
                </span>
              </div>
            </div>

            {/* Delete Error inside Modal */}
            {deleteError && (
              <div className="flash flash-danger" style={{ marginBottom: '14px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={15} /> <span>{deleteError}</span>
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
              <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--red-700)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Trash2 size={16} />
                <span>Danger Zone — Delete Department</span>
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
                  <Lock size={14} />
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
                <X size={18} />
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
