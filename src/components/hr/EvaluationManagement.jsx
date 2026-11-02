import React, { useState } from 'react';
import { Check, Archive, AlertTriangle, X, Clock, FileCheck, Award } from 'lucide-react';

export default function EvaluationManagement({
  eligibleEmployees = [
    {
      id: 101,
      idNumber: 'G10222026JMR',
      fullName: 'Jorge Mikhael Gubantes',
      jobTitle: 'Admin Aide',
      department: 'Computer Studies Department',
      cosCategory: 'Administrative',
      contractEndDate: 'Dec 31, 2026',
      intentStatus: 'Confirmed',
      deptHeadEndorsement: 'Recommended',
      routingStatus: 'Pending Initiation', // 'Pending Initiation' | 'Evaluation in Progress' | 'Evaluation Completed' | 'Contract Renewed' | etc.
      evaluationScores: {
        supervisor: 93.3,
        peer: 90.0,
        hrmo: 93.3,
        finalGrade: 92.6,
        interpretation: 'Outstanding',
        supervisorRecommendation: 'Recommended for Renewal',
        supervisorStrengths: 'Consistently produces exceptional quality administrative outputs with zero defect. Spearheaded student query backlog clearance.',
      },
    },
    {
      id: 102,
      idNumber: 'R10222026IJM',
      fullName: 'Ian Joseph Ranoco',
      jobTitle: 'Admin Aide',
      department: 'Computer Studies Department',
      cosCategory: 'Administrative',
      contractEndDate: 'Dec 31, 2026',
      intentStatus: 'Confirmed',
      deptHeadEndorsement: 'Recommended',
      routingStatus: 'Evaluation Completed', // Finished evaluation ready for HR renewal decision!
      evaluationScores: {
        supervisor: 90.0,
        peer: 86.7,
        hrmo: 90.0,
        finalGrade: 89.3,
        interpretation: 'Very Satisfactory',
        supervisorRecommendation: 'Recommended for Renewal',
        supervisorStrengths: 'Demonstrates strong organizational skills and dependable support during university accreditation cycles.',
      },
    },
    {
      id: 103,
      idNumber: 'M10222026CBM',
      fullName: 'Carlos Mendoza',
      jobTitle: 'Maintenance Technician',
      department: 'Maintenance/Janitorial (MESO) Office',
      cosCategory: 'Maintenance/Janitorial',
      contractEndDate: 'Dec 31, 2026',
      intentStatus: 'Confirmed',
      deptHeadEndorsement: 'Recommended',
      routingStatus: 'Evaluation in Progress', // In progress evaluation!
      evaluationScores: {
        supervisor: 66.7,
        peer: 70.0,
        hrmo: 68.0,
        finalGrade: 68.0,
        interpretation: 'Needs Improvement',
        supervisorRecommendation: 'Renewal Subject to Evaluation',
        supervisorStrengths: 'Reliable physical campus sanitation and waste handling. Requires closer monitoring on emergency facility repair response times.',
      },
    },
    {
      id: 104,
      idNumber: 'P10222026JLP',
      fullName: 'Jeramae Pace',
      jobTitle: 'Library Aide',
      department: 'Library Office',
      cosCategory: 'Administrative',
      contractEndDate: 'Dec 31, 2026',
      intentStatus: 'Awaiting Intent',
      deptHeadEndorsement: 'Awaiting Intent',
      routingStatus: 'Awaiting Employee Intent',
      evaluationScores: {
        supervisor: 80.0,
        peer: 76.7,
        hrmo: 80.0,
        finalGrade: 79.3,
        interpretation: 'Satisfactory',
        supervisorRecommendation: 'Recommended for Renewal',
        supervisorStrengths: 'Good library cataloging assistance and student desk support.',
      },
    },
    {
      id: 105,
      idNumber: 'E10222026ABC',
      fullName: 'Elena Santos',
      jobTitle: 'Laboratory Aide',
      department: 'Engineering Department',
      cosCategory: 'Administrative',
      contractEndDate: 'Dec 31, 2026',
      intentStatus: 'Declined',
      deptHeadEndorsement: 'N/A (Declined)',
      declineReason: 'Pursuing full-time graduate degree program.',
      routingStatus: 'Contract Closure Pending',
    },
    {
      id: 106,
      idNumber: 'D10222026XYZ',
      fullName: 'Danilo Cruz',
      jobTitle: 'Technical Aide',
      department: 'Technology Department',
      cosCategory: 'Administrative',
      contractEndDate: 'Dec 31, 2026',
      intentStatus: 'Confirmed',
      deptHeadEndorsement: 'Not Recommended',
      routingStatus: 'Non-Renewal Endorsed',
      rejectionCategory: 'Gross Incompetence / Poor Performance',
      rejectionJustification: 'Repeated non-compliance with laboratory equipment calibration standards and unattended safety violations.',
    },
    {
      id: 107,
      idNumber: 'S10222026MGA',
      fullName: 'Maria Santos',
      jobTitle: 'Clerical Assistant',
      department: 'Education Department',
      cosCategory: 'Administrative',
      contractEndDate: 'Dec 31, 2026',
      intentStatus: 'Confirmed',
      deptHeadEndorsement: 'Awaiting Dept Head Review',
      routingStatus: 'Awaiting Dept Head Endorsement',
      evaluationScores: {
        supervisor: 85.0,
        peer: 82.5,
        hrmo: 85.0,
        finalGrade: 84.5,
        interpretation: 'Very Satisfactory',
        supervisorRecommendation: 'Recommended for Renewal',
        supervisorStrengths: 'Consistently ensures timely record coordination and organized departmental files.',
      },
    },
  ],
  departments = [
    'Computer Studies Department',
    'Technology Department',
    'Engineering Department',
    'Education Department',
    'Library Office',
    'Maintenance/Janitorial (MESO) Office',
  ],
  onStartEmployeeEvaluation = () => {},
  onProcessOffboarding = () => {},
  onMediateRejection = () => {},
  onBack = null,
}) {
  const [employees, setEmployees] = useState(eligibleEmployees);
  const [toastMsg, setToastMsg] = useState(null);

  // Modal states for HR interventions
  const [mediateEmp, setMediateEmp] = useState(null);
  const [offboardEmp, setOffboardEmp] = useState(null);
  const [transferTargetDept, setTransferTargetDept] = useState(departments[0]);

  // Modal state for Finalizing Contract Renewal Decision (Yes / No)
  const [finalizeEmp, setFinalizeEmp] = useState(null);
  const [hrRenewalDecision, setHrRenewalDecision] = useState('Yes'); // 'Yes' | 'No'
  const [hrRenewalRemarks, setHrRenewalRemarks] = useState('');

  const handleStartRouting = (empId) => {
    setEmployees(
      employees.map((e) =>
        e.id === empId ? { ...e, routingStatus: 'Evaluation in Progress' } : e
      )
    );
    const emp = employees.find((e) => e.id === empId);
    onStartEmployeeEvaluation(empId);
    setToastMsg(
      `Evaluation initiated for ${emp?.fullName || 'Employee'}! Dispatched alerts to Supervisor, Peers, and HRMO.`
    );
    setTimeout(() => setToastMsg(null), 4500);
  };

  const openFinalizeModal = (emp) => {
    setFinalizeEmp(emp);
    if (emp.routingStatus === 'Contract Renewed') {
      setHrRenewalDecision('Yes');
      setHrRenewalRemarks(emp.finalContractRemarks || 'Contract renewed for upcoming 6-month term.');
    } else if (emp.routingStatus === 'Non-Renewal Finalized') {
      setHrRenewalDecision('No');
      setHrRenewalRemarks(emp.finalContractRemarks || 'Contract expired. Non-renewal finalized.');
    } else {
      const isRecommended =
        (emp.evaluationScores?.supervisorRecommendation || emp.deptHeadEndorsement) !== 'Not Recommended';
      setHrRenewalDecision(isRecommended ? 'Yes' : 'No');
      setHrRenewalRemarks(
        isRecommended
          ? 'Triad evaluation and supervisory endorsement verified. Approved for standard 6-month contract renewal.'
          : 'Supervisory non-renewal upheld. Contract will conclude at term expiration.'
      );
    }
  };

  const handleConfirmFinalization = () => {
    if (!finalizeEmp) return;
    const isRenewed = hrRenewalDecision === 'Yes';
    const newStatus = isRenewed ? 'Contract Renewed' : 'Non-Renewal Finalized';

    setEmployees(
      employees.map((e) =>
        e.id === finalizeEmp.id
          ? {
              ...e,
              routingStatus: newStatus,
              finalContractDecision: isRenewed ? 'Yes — Renew Contract' : 'No — Do Not Renew',
              finalContractRemarks: hrRenewalRemarks,
            }
          : e
      )
    );

    setToastMsg(
      `Official contract disposition finalized for ${finalizeEmp.fullName}: ${
        isRenewed ? 'RENEWED (6-Month Extension)' : 'DO NOT RENEW (Contract Closure)'
      }.`
    );
    setFinalizeEmp(null);
    setTimeout(() => setToastMsg(null), 4500);
  };

  const handleConfirmOffboard = () => {
    if (!offboardEmp) return;
    setEmployees(
      employees.map((e) =>
        e.id === offboardEmp.id ? { ...e, routingStatus: 'Offboarded / Archived' } : e
      )
    );
    onProcessOffboarding(offboardEmp.id);
    setToastMsg(`Offboarding clearance processed for "${offboardEmp.fullName}". Contract archived.`);
    setOffboardEmp(null);
    setTimeout(() => setToastMsg(null), 4500);
  };

  const handleMediationDecision = (actionType) => {
    if (!mediateEmp) return;
    if (actionType === 'offboard') {
      setEmployees(
        employees.map((e) =>
          e.id === mediateEmp.id
            ? { ...e, routingStatus: 'Offboarded / Archived', intentStatus: 'Declined' }
            : e
        )
      );
      onMediateRejection({ employeeId: mediateEmp.id, resolution: 'offboard' });
      setToastMsg(`HR Mediation resolved: "${mediateEmp.fullName}" has been offboarded and archived.`);
    } else if (actionType === 'transfer') {
      setEmployees(
        employees.map((e) =>
          e.id === mediateEmp.id
            ? {
                ...e,
                routingStatus: 'Intervention Transfer Scheduled',
                department: `${e.department} → ${transferTargetDept}`,
              }
            : e
        )
      );
      onMediateRejection({
        employeeId: mediateEmp.id,
        resolution: 'transfer',
        newDepartment: transferTargetDept,
      });
      setToastMsg(
        `HR Mediation resolved: Intervention transfer scheduled for "${mediateEmp.fullName}" to ${transferTargetDept} for the next cycle.`
      );
    } else if (actionType === 'authorize_eval') {
      setEmployees(
        employees.map((e) =>
          e.id === mediateEmp.id
            ? {
                ...e,
                deptHeadEndorsement: 'Recommended (Overruled by HR)',
                routingStatus: 'Pending Initiation',
              }
            : e
        )
      );
      onMediateRejection({
        employeeId: mediateEmp.id,
        resolution: 'authorize_eval',
      });
      setToastMsg(
        `HR Mediation resolved: Non-renewal overruled. "${mediateEmp.fullName}" cleared for evaluation initiation.`
      );
    }
    setMediateEmp(null);
    setTimeout(() => setToastMsg(null), 4500);
  };

  // Prioritized urgency hierarchy for actionable rows:
  // 1. Start Evaluation (Highest urgency / initiation)
  // 2. Finalize Contract (Renewal decision on completed evaluation)
  // 3. Mediate Non-Renewal (Dept Head non-renewal endorsement)
  // 4. Process Offboarding (Employee intent declined)
  const getActionPriority = (emp) => {
    if (
      emp.routingStatus === 'Pending Initiation' &&
      (emp.deptHeadEndorsement === 'Recommended' || emp.deptHeadEndorsement?.includes('Overruled'))
    ) {
      return 1;
    }
    if (emp.routingStatus === 'Evaluation Completed') {
      return 2;
    }
    if (
      emp.routingStatus === 'Non-Renewal Endorsed' ||
      emp.deptHeadEndorsement === 'Not Recommended' ||
      emp.routingStatus === 'Supervisor Veto'
    ) {
      return 3;
    }
    if (
      (emp.intentStatus === 'Declined' || emp.intent === 'Declined' || emp.routingStatus === 'Contract Closure Pending') &&
      emp.routingStatus !== 'Offboarded / Archived'
    ) {
      return 4;
    }
    // All other statuses belong to the pending side (Evaluation in Progress, Awaiting Endorsement, Awaiting Intent, Completed, Archived, etc.)
    return 99;
  };

  // Top Group: Actionable rows, sorted by prioritized urgency (Start -> Finalize -> Mediate -> Offboard), then A-Z
  const actionableEmployees = [...employees]
    .filter((emp) => getActionPriority(emp) < 99)
    .sort((a, b) => {
      const pDiff = getActionPriority(a) - getActionPriority(b);
      if (pDiff !== 0) return pDiff;
      return a.fullName.localeCompare(b.fullName);
    });

  // Bottom Group: Pending / Waiting / Finalized rows, sorted alphabetically A to Z
  const pendingEmployees = [...employees]
    .filter((emp) => getActionPriority(emp) === 99)
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  const renderEmployeeRow = (emp) => (
    <tr key={emp.id}>
      <td style={{ verticalAlign: 'middle', padding: '14px 14px' }}>
        <b style={{ color: 'var(--ink-900)' }}>{emp.fullName}</b>
        <div className="muted" style={{ fontSize: '12px', marginTop: '2px' }}>
          ID: {emp.idNumber || 'G10222026JMR'}
        </div>
      </td>
      <td style={{ verticalAlign: 'middle', padding: '14px 14px', color: 'var(--ink-800)', fontSize: '13.5px' }}>
        {emp.department}
      </td>
      <td style={{ verticalAlign: 'middle', textAlign: 'center', padding: '14px 14px' }}>
        {emp.intentStatus === 'Confirmed' ? (
          <span
            className="badge badge-completed"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', fontSize: '12px', fontWeight: 700 }}
          >
            <Check size={12} /> Confirmed
          </span>
        ) : emp.intentStatus === 'Declined' ? (
          <span
            className="badge badge-delete"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', fontSize: '12px', fontWeight: 700 }}
          >
            <X size={12} /> Declined
          </span>
        ) : (
          <span
            className="badge"
            style={{
              background: '#fef3c7',
              color: '#b45309',
              border: '1px solid #fde68a',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            <Clock size={12} /> Awaiting Intent
          </span>
        )}
      </td>
      <td style={{ verticalAlign: 'middle', textAlign: 'center', padding: '14px 14px' }}>
        {emp.deptHeadEndorsement === 'Recommended' ||
        emp.deptHeadEndorsement === 'Recommended (Overruled by HR)' ? (
          <span
            className="badge badge-completed"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', fontSize: '12px', fontWeight: 700 }}
          >
            <Check size={12} /> {emp.deptHeadEndorsement === 'Recommended (Overruled by HR)' ? 'Recommended (HR)' : 'Recommended'}
          </span>
        ) : emp.deptHeadEndorsement === 'Not Recommended' ? (
          <span
            className="badge badge-delete"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', fontSize: '12px', fontWeight: 700 }}
          >
            <AlertTriangle size={12} /> Not Recommended
          </span>
        ) : emp.deptHeadEndorsement === 'N/A (Declined)' ? (
          <span
            className="badge"
            style={{
              background: '#f1f5f9',
              color: '#64748b',
              border: '1px solid #cbd5e1',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            <X size={12} /> N/A (Declined)
          </span>
        ) : emp.routingStatus === 'Awaiting Dept Head Endorsement' ||
          emp.deptHeadEndorsement === 'Awaiting Dept Head Review' ? (
          <span
            className="badge"
            style={{
              background: '#fef3c7',
              color: '#b45309',
              border: '1px solid #fde68a',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            <Clock size={12} /> Awaiting Dept Head
          </span>
        ) : emp.intentStatus === 'Awaiting Intent' ? (
          <span
            className="badge"
            style={{
              background: '#fef3c7',
              color: '#b45309',
              border: '1px solid #fde68a',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            <Clock size={12} /> Awaiting Intent
          </span>
        ) : (
          <span
            className="badge"
            style={{
              background: '#fef3c7',
              color: '#b45309',
              border: '1px solid #fde68a',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            <Clock size={12} /> Pending Review
          </span>
        )}
      </td>
      <td style={{ verticalAlign: 'middle', textAlign: 'center', padding: '14px 14px', fontSize: '13px', color: 'var(--ink-700)', whiteSpace: 'nowrap' }}>
        {emp.contractEndDate}
      </td>
      <td style={{ verticalAlign: 'middle', textAlign: 'center', padding: '14px 14px' }}>
        {emp.routingStatus === 'Non-Renewal Endorsed' ||
        emp.routingStatus === 'Supervisor Veto' ? (
          <span
            className="badge badge-delete"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap' }}
          >
            <AlertTriangle size={12} /> Non-Renewal Endorsed
          </span>
        ) : emp.routingStatus === 'Offboarded / Archived' ? (
          <span
            className="badge badge-delete"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            <Archive size={12} /> Offboarded
          </span>
        ) : emp.intentStatus === 'Declined' || emp.intent === 'Declined' ? (
          <span
            className="badge badge-delete"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
            title={emp.declineReason ? `Reason: ${emp.declineReason}` : undefined}
          >
            <X size={12} /> Declined
          </span>
        ) : emp.routingStatus === 'Intervention Transfer Scheduled' ? (
          <span
            className="badge badge-pending"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap' }}
          >
            <Clock size={12} /> Transfer Scheduled
          </span>
        ) : emp.routingStatus === 'Evaluation in Progress' ||
          emp.routingStatus === 'Routing Active' ? (
          <span
            className="badge"
            style={{
              background: '#fef3c7',
              color: '#b45309',
              border: '1px solid #fde68a',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            <Clock size={12} /> Evaluation in Progress
          </span>
        ) : emp.routingStatus === 'Evaluation Completed' ? (
          <span
            className="badge"
            style={{
              background: '#dcfce7',
              color: '#15803d',
              border: '1px solid #bbf7d0',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            <Check size={12} /> Evaluation Completed
          </span>
        ) : emp.routingStatus === 'Contract Renewed' ? (
          <span
            className="badge"
            style={{
              background: '#dcfce7',
              color: '#15803d',
              border: '1px solid #bbf7d0',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            <Check size={12} /> Contract Renewed
          </span>
        ) : emp.routingStatus === 'Non-Renewal Finalized' ? (
          <span
            className="badge badge-delete"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            <X size={12} /> Non-Renewal Finalized
          </span>
        ) : emp.routingStatus === 'Pending Initiation' ? (
          <span
            className="badge badge-inprogress"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap' }}
          >
            <Clock size={12} /> Ready for Evaluation
          </span>
        ) : emp.routingStatus === 'Awaiting Dept Head Endorsement' ? (
          <span
            className="badge"
            style={{
              background: '#fef3c7',
              color: '#b45309',
              border: '1px solid #fde68a',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            <Clock size={12} /> Awaiting Dept Head
          </span>
        ) : emp.routingStatus === 'Awaiting Employee Intent' ||
          emp.intentStatus === 'Awaiting Intent' ? (
          <span
            className="badge"
            style={{
              background: '#fef3c7',
              color: '#b45309',
              border: '1px solid #fde68a',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            <Clock size={12} /> Awaiting Intent
          </span>
        ) : (
          <span className="badge badge-completed" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap' }}>
            {emp.routingStatus}
          </span>
        )}
      </td>
      <td style={{ verticalAlign: 'middle', textAlign: 'right', padding: '14px 16px' }}>
        <div style={{ display: 'inline-flex', justifyContent: 'flex-end', alignItems: 'center', minHeight: '32px' }}>
          {emp.routingStatus === 'Non-Renewal Endorsed' ||
          emp.routingStatus === 'Supervisor Veto' ||
          emp.deptHeadEndorsement === 'Not Recommended' ? (
            <button
              type="button"
              className="btn btn-sm"
              style={{
                background: 'var(--red-600)',
                color: '#fff',
                borderColor: 'var(--red-600)',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                fontSize: '12.5px',
                whiteSpace: 'nowrap',
              }}
              onClick={() => setMediateEmp(emp)}
            >
              <AlertTriangle size={14} />
              Mediate Non-Renewal
            </button>
          ) : emp.intentStatus === 'Declined' || emp.intent === 'Declined' ? (
            emp.routingStatus === 'Offboarded / Archived' ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#64748b',
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  whiteSpace: 'nowrap',
                }}
              >
                <Archive size={13} /> Archived in Records
              </span>
            ) : (
              <button
                type="button"
                className="btn btn-sm"
                style={{
                  background: 'var(--red-600)',
                  color: '#fff',
                  borderColor: 'var(--red-600)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  fontSize: '12.5px',
                  whiteSpace: 'nowrap',
                }}
                onClick={() => setOffboardEmp(emp)}
              >
                <Archive size={14} />
                Process Offboarding
              </button>
            )
          ) : emp.routingStatus === 'Pending Initiation' &&
            (emp.deptHeadEndorsement === 'Recommended' ||
              emp.deptHeadEndorsement === 'Recommended (Overruled by HR)') ? (
            <button
              type="button"
              className="btn btn-sm btn-primary"
              style={{
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                fontSize: '12.5px',
                whiteSpace: 'nowrap',
              }}
              onClick={() => handleStartRouting(emp.id)}
            >
              <Check size={14} />
              Start Evaluation
            </button>
          ) : emp.routingStatus === 'Evaluation Completed' ? (
            <button
              type="button"
              className="btn btn-sm btn-primary"
              style={{
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                fontSize: '12.5px',
                whiteSpace: 'nowrap',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
              onClick={() => openFinalizeModal(emp)}
              title="Review final triad scores and issue contract renewal decision"
            >
              <FileCheck size={14} />
              Finalize Contract
            </button>
          ) : emp.routingStatus === 'Evaluation in Progress' ||
            emp.routingStatus === 'Routing Active' ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#b45309',
                background: '#fef3c7',
                border: '1px solid #fde68a',
                padding: '5px 12px',
                borderRadius: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              <Clock size={13} /> Still in Evaluation
            </span>
          ) : emp.routingStatus === 'Contract Renewed' ||
            emp.routingStatus === 'Non-Renewal Finalized' ? (
            <button
              type="button"
              className="btn btn-sm btn-outline"
              style={{
                fontSize: '12.5px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                cursor: 'pointer',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
              onClick={() => openFinalizeModal(emp)}
              title="View finalized contract decision and scores"
            >
              {emp.routingStatus === 'Contract Renewed' ? (
                <Check size={13} color="var(--green-700)" />
              ) : (
                <X size={13} color="var(--red-600)" />
              )}
              View Decision
            </button>
          ) : emp.routingStatus === 'Offboarded / Archived' ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#64748b',
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                padding: '5px 12px',
                borderRadius: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              <Archive size={13} /> Archived in Records
            </span>
          ) : emp.routingStatus === 'Intervention Transfer Scheduled' ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#b45309',
                background: '#fef3c7',
                border: '1px solid #fde68a',
                padding: '5px 12px',
                borderRadius: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              <Clock size={13} /> Pending Next Cycle
            </span>
          ) : emp.routingStatus === 'Awaiting Dept Head Endorsement' ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#b45309',
                background: '#fef3c7',
                border: '1px solid #fde68a',
                padding: '5px 12px',
                borderRadius: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              <Clock size={13} /> Waiting for Dept Head
            </span>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#b45309',
                background: '#fef3c7',
                border: '1px solid #fde68a',
                padding: '5px 12px',
                borderRadius: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              <Clock size={13} /> Requires Employee Intent
            </span>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div style={{ paddingBottom: '32px' }}>
      <div className="flex-between" style={{ marginBottom: '20px', paddingTop: '4px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px' }}>Evaluation Management Module</h1>
          <p className="muted" style={{ margin: 0 }}>
            Continuous individualized contract lifecycle tracking and concurrent evaluation routing for eligible COS personnel nearing 6-month contract expiration.
          </p>
        </div>
        {onBack && (
          <button type="button" className="btn btn-sm" onClick={onBack}>
            ← Back to Dashboard
          </button>
        )}
      </div>

      {toastMsg && (
        <div className="flash flash-success" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Check size={16} />
          {toastMsg}
        </div>
      )}

      {/* COS Employees Roster & Routing Control */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
          <div className="card-title" style={{ margin: 0 }}>
            COS Personnel Nearing 6-Month Contract Expiration
          </div>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>
            Urgent operational reviews are prioritized at the top (Start Evaluation, Finalize Contract, Non-Renewal Mediation, and Offboarding), followed by pending evaluations and completed records.
          </p>
        </div>

        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px 14px' }}>Employee Name</th>
              <th style={{ textAlign: 'left', padding: '12px 14px' }}>Department</th>
              <th style={{ textAlign: 'center', padding: '12px 14px', whiteSpace: 'nowrap' }}>Employee Intent</th>
              <th style={{ textAlign: 'center', padding: '12px 14px', whiteSpace: 'nowrap' }}>Dept Head Endorsement</th>
              <th style={{ textAlign: 'center', padding: '12px 14px', whiteSpace: 'nowrap' }}>Contract End</th>
              <th style={{ textAlign: 'center', padding: '12px 14px', whiteSpace: 'nowrap' }}>Status</th>
              <th style={{ textAlign: 'right', padding: '12px 16px', whiteSpace: 'nowrap' }}>Workflow Action</th>
            </tr>
          </thead>
          <tbody>
            {actionableEmployees.map(renderEmployeeRow)}
            {pendingEmployees.map(renderEmployeeRow)}
          </tbody>
        </table>
      </div>

      {/* HR Mediation Modal for Dept Head Non-Renewal Recommendation */}
      {mediateEmp && (
        <div
          className="modal-overlay open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMediateEmp(null);
          }}
        >
          <div className="modal-card" style={{ maxWidth: '580px', width: '92%' }}>
            <div className="modal-header">
              <div className="card-title" style={{ margin: 0, color: 'var(--red-600)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} color="var(--red-600)" />
                <span>HR Administrative Mediation — Dept Head Non-Renewal</span>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setMediateEmp(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <p className="muted" style={{ margin: '0 0 16px', fontSize: '13px', lineHeight: 1.5 }}>
              The Department Head for <b>{mediateEmp.department}</b> has formally submitted a <b>Non-Renewal Recommendation</b> following the employee's intent confirmation. Review the supervisory grounds and determine the appropriate administrative resolution:
            </p>

            {/* Personnel & Grounds Summary */}
            <div
              style={{
                background: 'var(--red-50)',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '14px',
                marginBottom: '18px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <span className="emp-id-chip" style={{ marginRight: '8px' }}>{mediateEmp.idNumber}</span>
                  <b>{mediateEmp.fullName}</b>
                </div>
                <span className="badge badge-delete" style={{ fontWeight: 700 }}>Not Recommended</span>
              </div>

              <div style={{ fontSize: '12.5px', marginTop: '6px' }}>
                <span className="muted">Grounds Category: </span>
                <b>{mediateEmp.rejectionCategory || mediateEmp.vetoCategory || 'Gross Incompetence / Poor Performance'}</b>
              </div>

              <div style={{ fontSize: '12.5px', marginTop: '6px', color: 'var(--ink)' }}>
                <span className="muted">Supervisory Justification: </span>
                <p style={{ margin: '4px 0 0', fontStyle: 'italic', background: '#fff', padding: '8px 10px', borderRadius: '6px', border: '1px solid #fecaca' }}>
                  "{mediateEmp.rejectionJustification || mediateEmp.vetoJustification || 'Substantive performance deficiency reported by Department Head.'}"
                </p>
              </div>
            </div>

            {/* Mediation Actions Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Option 1: Confirm Offboarding */}
              <div style={{ border: '1px solid var(--line)', borderRadius: '8px', padding: '12px 14px', background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <b style={{ color: 'var(--red-600)', fontSize: '13.5px' }}>Resolution A: Uphold Non-Renewal &amp; Offboard</b>
                    <p className="muted" style={{ margin: '2px 0 0', fontSize: '12px' }}>
                      Accepts supervisory non-renewal recommendation. Disables portal access and moves personnel to archived directory.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ background: 'var(--red-600)', color: '#fff', borderColor: 'var(--red-600)', fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer' }}
                    onClick={() => handleMediationDecision('offboard')}
                  >
                    Confirm Offboarding
                  </button>
                </div>
              </div>

              {/* Option 2: Intervention Transfer */}
              <div style={{ border: '1px solid var(--line)', borderRadius: '8px', padding: '12px 14px', background: '#fff' }}>
                <b style={{ color: 'var(--amber-600)', fontSize: '13.5px' }}>Resolution B: Execute Intervention Transfer</b>
                <p className="muted" style={{ margin: '2px 0 10px', fontSize: '12px' }}>
                  Overrules contract termination by reassigning the employee to a new department for their next contract cycle.
                </p>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <select
                    className="form-control"
                    style={{ flex: 1, fontSize: '13px' }}
                    value={transferTargetDept}
                    onChange={(e) => setTransferTargetDept(e.target.value)}
                  >
                    {departments
                      .filter((d) => d !== mediateEmp.department)
                      .map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ background: '#d97706', color: '#fff', border: 'none', fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer' }}
                    onClick={() => handleMediationDecision('transfer')}
                  >
                    Execute Transfer
                  </button>
                </div>
              </div>

              {/* Option 3: Overrule and Authorize Evaluation */}
              <div style={{ border: '1px solid var(--line)', borderRadius: '8px', padding: '12px 14px', background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <b style={{ color: 'var(--green-700)', fontSize: '13.5px' }}>Resolution C: Overrule &amp; Authorize Evaluation</b>
                    <p className="muted" style={{ margin: '2px 0 0', fontSize: '12px' }}>
                      Disputes or resolves the non-renewal in administrative conference. Clears employee for standard 50/20/30 triad evaluation.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    style={{ fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer' }}
                    onClick={() => handleMediationDecision('authorize_eval')}
                  >
                    Authorize Evaluation
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
              <button type="button" className="btn" style={{ cursor: 'pointer' }} onClick={() => setMediateEmp(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Process Offboarding Modal for Declined Renewal */}
      {offboardEmp && (
        <div
          className="modal-overlay open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOffboardEmp(null);
          }}
        >
          <div className="modal-card" style={{ maxWidth: '500px', width: '92%' }}>
            <div className="modal-header">
              <div className="card-title" style={{ margin: 0, color: 'var(--red-600)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Archive size={18} color="var(--red-600)" />
                <span>Process Personnel Offboarding</span>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setOffboardEmp(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <p className="muted" style={{ margin: '0 0 14px', fontSize: '13.5px', lineHeight: 1.5 }}>
              <b>{offboardEmp.fullName}</b> ({offboardEmp.idNumber || 'COS Personnel'}) has formally submitted a non-renewal decision (<b>Declined</b>) for their contract expiring on <b>{offboardEmp.contractEndDate}</b>.
            </p>

            {offboardEmp.declineReason && (
              <div style={{ background: 'var(--red-50)', border: '1px solid #fecaca', borderRadius: '6px', padding: '10px 12px', marginBottom: '16px', fontSize: '13px' }}>
                <span className="muted">Stated Reason for Exiting: </span>
                <b>"{offboardEmp.declineReason}"</b>
              </div>
            )}

            <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--ink-700)' }}>
              Proceeding will generate standard university end-of-contract clearance documents, archive their historical MARs and evaluation records, and deactivate portal credentials at term expiration.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn" style={{ cursor: 'pointer' }} onClick={() => setOffboardEmp(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                style={{ background: 'var(--red-600)', color: '#fff', borderColor: 'var(--red-600)', fontWeight: 700, cursor: 'pointer' }}
                onClick={handleConfirmOffboard}
              >
                Confirm Offboarding &amp; Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HR Finalize Contract Renewal Decision Modal */}
      {finalizeEmp && (
        <div
          className="modal-overlay open"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setFinalizeEmp(null);
          }}
        >
          <div
            className="modal-card"
            style={{
              maxWidth: '640px',
              width: '100%',
              borderRadius: '12px',
              background: '#fff',
              maxHeight: '94vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            }}
          >
            <div
              className="modal-header"
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--line)',
                background: '#f8fafc',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck size={20} style={{ color: 'var(--primary)' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--ink-900)' }}>
                    Finalize Contract Renewal Decision
                  </h3>
                  <div className="muted" style={{ fontSize: '12px', marginTop: '2px' }}>
                    Institutional Triad Performance Review &amp; Official HR Disposition
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setFinalizeEmp(null)}
                aria-label="Close"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-600)', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              {/* Employee Information Card */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <b style={{ fontSize: '14.5px', color: 'var(--ink-900)' }}>{finalizeEmp.fullName}</b>
                    <span className="badge badge-dept" style={{ fontSize: '11px', padding: '2px 8px' }}>
                      {finalizeEmp.jobTitle || 'Admin Aide'}
                    </span>
                  </div>
                  <div className="muted" style={{ fontSize: '12px', marginTop: '2px' }}>
                    ID: <b>{finalizeEmp.idNumber}</b> • Department: <b>{finalizeEmp.department}</b>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="muted" style={{ fontSize: '11.5px' }}>Current Term Expiration</div>
                  <b style={{ fontSize: '13px', color: 'var(--ink-900)' }}>{finalizeEmp.contractEndDate}</b>
                </div>
              </div>

              {/* Final Triad Evaluation Scores Grid */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--ink-800)', marginBottom: '8px' }}>
                  Final Triad Evaluation Results &amp; Component Breakdown:
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '10px',
                    marginBottom: '12px',
                  }}
                >
                  {/* Supervisor (50%) */}
                  <div style={{ background: '#f8fafc', border: '1px solid var(--line)', borderRadius: '8px', padding: '10px 12px', textAlign: 'center' }}>
                    <div className="muted" style={{ fontSize: '11.5px', fontWeight: 600 }}>Supervisor (50%)</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ink-900)', marginTop: '2px' }}>
                      {(finalizeEmp.evaluationScores?.supervisor || 90.0).toFixed(1)}%
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--brand-700)', fontWeight: 600 }}>
                      {((finalizeEmp.evaluationScores?.supervisor || 90.0) * 0.5).toFixed(2)} pts
                    </div>
                  </div>

                  {/* Peer (20%) */}
                  <div style={{ background: '#f8fafc', border: '1px solid var(--line)', borderRadius: '8px', padding: '10px 12px', textAlign: 'center' }}>
                    <div className="muted" style={{ fontSize: '11.5px', fontWeight: 600 }}>COS Peer (20%)</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ink-900)', marginTop: '2px' }}>
                      {(finalizeEmp.evaluationScores?.peer || 86.7).toFixed(1)}%
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--brand-700)', fontWeight: 600 }}>
                      {((finalizeEmp.evaluationScores?.peer || 86.7) * 0.2).toFixed(2)} pts
                    </div>
                  </div>

                  {/* HRMO (30%) */}
                  <div style={{ background: '#f8fafc', border: '1px solid var(--line)', borderRadius: '8px', padding: '10px 12px', textAlign: 'center' }}>
                    <div className="muted" style={{ fontSize: '11.5px', fontWeight: 600 }}>HRMO (30%)</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ink-900)', marginTop: '2px' }}>
                      {(finalizeEmp.evaluationScores?.hrmo || 90.0).toFixed(1)}%
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--brand-700)', fontWeight: 600 }}>
                      {((finalizeEmp.evaluationScores?.hrmo || 90.0) * 0.3).toFixed(2)} pts
                    </div>
                  </div>
                </div>

                {/* Composite Score Highlight Banner */}
                <div
                  style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <div>
                    <span className="muted" style={{ fontSize: '12px' }}>Final Composite Grade (50/20/30 Triad):</span>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)' }}>
                      {(finalizeEmp.evaluationScores?.finalGrade || 89.3).toFixed(2)} / 100
                      <span style={{ fontSize: '13px', fontWeight: 700, marginLeft: '8px', color: 'var(--green-700)' }}>
                        ({finalizeEmp.evaluationScores?.interpretation || 'Very Satisfactory'})
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="muted" style={{ fontSize: '11.5px' }}>Appraisal Interpretation:</span>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--brand-700)' }}>
                      {finalizeEmp.evaluationScores?.interpretation || 'Very Satisfactory'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Banner for Already Finalized Records */}
              {finalizeEmp.routingStatus === 'Contract Renewed' && (
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#15803d',
                    fontSize: '12.5px',
                    fontWeight: 600,
                  }}
                >
                  <Check size={16} /> Official Record: Contract is RENEWED for the Jan 01, 2027 – Jun 30, 2027 cycle.
                </div>
              )}
              {finalizeEmp.routingStatus === 'Non-Renewal Finalized' && (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#b91c1c',
                    fontSize: '12.5px',
                    fontWeight: 600,
                  }}
                >
                  <X size={16} /> Official Record: Non-renewal finalized. Employment concludes on {finalizeEmp.contractEndDate}.
                </div>
              )}

              {/* Supervisor Appraisal & Renewal Recommendation Review Card */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  marginBottom: '16px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                    flexWrap: 'wrap',
                    gap: '6px',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '13px',
                      color: 'var(--ink-800)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Award size={16} style={{ color: 'var(--primary)' }} />
                    Supervisor Appraisal &amp; Renewal Recommendation:
                  </div>
                  <span
                    className="badge"
                    style={{
                      background:
                        (finalizeEmp.evaluationScores?.supervisorRecommendation || finalizeEmp.deptHeadEndorsement) ===
                        'Not Recommended'
                          ? '#fee2e2'
                          : '#dcfce7',
                      color:
                        (finalizeEmp.evaluationScores?.supervisorRecommendation || finalizeEmp.deptHeadEndorsement) ===
                        'Not Recommended'
                          ? '#b91c1c'
                          : '#15803d',
                      border:
                        (finalizeEmp.evaluationScores?.supervisorRecommendation || finalizeEmp.deptHeadEndorsement) ===
                        'Not Recommended'
                          ? '1px solid #fecaca'
                          : '1px solid #bbf7d0',
                      fontWeight: 700,
                      padding: '3px 9px',
                      fontSize: '11.5px',
                    }}
                  >
                    {(finalizeEmp.evaluationScores?.supervisorRecommendation || finalizeEmp.deptHeadEndorsement) ===
                    'Not Recommended'
                      ? '✖ Not Recommended for Renewal'
                      : '✓ ' +
                        (finalizeEmp.evaluationScores?.supervisorRecommendation ||
                          finalizeEmp.deptHeadEndorsement ||
                          'Recommended for Renewal')}
                  </span>
                </div>

                {/* Supervisor Written Remarks */}
                <div
                  style={{
                    fontSize: '12.5px',
                    color: 'var(--ink-700)',
                    background: '#fff',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--line)',
                    lineHeight: 1.5,
                  }}
                >
                  <div
                    className="muted"
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                      marginBottom: '3px',
                    }}
                  >
                    Supervisor Justification &amp; Performance Remarks:
                  </div>
                  <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--ink-900)' }}>
                    "{finalizeEmp.evaluationScores?.supervisorStrengths ||
                      finalizeEmp.evaluationScores?.supervisorRemarks ||
                      'Consistently meets university performance standards and maintains excellent administrative support.'}"
                  </p>
                </div>
              </div>

              {/* HR Contract Decision Radio Options (Yes / No) */}
              <div style={{ marginBottom: '18px' }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '13px',
                    color: 'var(--ink-800)',
                    marginBottom: '8px',
                  }}
                >
                  Official Institutional Contract Disposition:
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '12px',
                  }}
                >
                  {/* Option 1: Yes — Renew Contract */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border:
                        hrRenewalDecision === 'Yes'
                          ? '2px solid var(--green-700)'
                          : '1px solid var(--line)',
                      background: hrRenewalDecision === 'Yes' ? '#f0fdf4' : '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <input
                      type="radio"
                      name="hrRenewalDecision"
                      value="Yes"
                      checked={hrRenewalDecision === 'Yes'}
                      onChange={() => setHrRenewalDecision('Yes')}
                      style={{ marginTop: '3px', cursor: 'pointer' }}
                    />
                    <div>
                      <b style={{ fontSize: '13.5px', color: 'var(--green-800)', display: 'block' }}>
                        Yes — Renew Contract
                      </b>
                      <p className="muted" style={{ margin: '3px 0 0', fontSize: '12px', lineHeight: 1.4 }}>
                        Authorize 6-month contract renewal for Jan 01, 2027 – Jun 30, 2027. Forward endorsed dossier for appointment.
                      </p>
                    </div>
                  </label>

                  {/* Option 2: No — Do Not Renew */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border:
                        hrRenewalDecision === 'No'
                          ? '2px solid var(--red-600)'
                          : '1px solid var(--line)',
                      background: hrRenewalDecision === 'No' ? '#fef2f2' : '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <input
                      type="radio"
                      name="hrRenewalDecision"
                      value="No"
                      checked={hrRenewalDecision === 'No'}
                      onChange={() => setHrRenewalDecision('No')}
                      style={{ marginTop: '3px', cursor: 'pointer' }}
                    />
                    <div>
                      <b style={{ fontSize: '13.5px', color: 'var(--red-700)', display: 'block' }}>
                        No — Do Not Renew
                      </b>
                      <p className="muted" style={{ margin: '3px 0 0', fontSize: '12px', lineHeight: 1.4 }}>
                        Contract concludes on expiration ({finalizeEmp.contractEndDate}). Initiate university clearance and offboarding.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Remarks Textarea */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ fontWeight: 600, fontSize: '12.5px' }}>
                  HR Resolution Notes &amp; Administrative Remarks:
                </label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={hrRenewalRemarks}
                  onChange={(e) => setHrRenewalRemarks(e.target.value)}
                  placeholder="Enter official resolution notes for university records..."
                  style={{ fontSize: '13px' }}
                />
              </div>

              {/* Modal Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setFinalizeEmp(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                  onClick={handleConfirmFinalization}
                >
                  <Check size={14} /> Confirm &amp; Finalize Decision
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
