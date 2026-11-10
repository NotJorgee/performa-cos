import React, { useState, useEffect } from 'react';
import Toast from '../common/Toast';
import PredictiveTextarea from '../common/PredictiveTextarea';
import { api } from '../../services/api';
import {
  Check,
  Archive,
  AlertTriangle,
  X,
  Clock,
  FileCheck,
  FileText,
  Award,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  Sliders,
} from 'lucide-react';
import { EVSU_DEPARTMENTS } from '../../utils/departments';

export default function EvaluationManagement({
  eligibleEmployees = [],
  departments = EVSU_DEPARTMENTS,
  onStartEmployeeEvaluation = () => {},
  onProcessOffboarding = () => {},
  onMediateRejection = () => {},
  onBack = null,
  onNavigate = null,
}) {
  const [employees, setEmployees] = useState(eligibleEmployees);
  const [dbDepartments, setDbDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal states for HR interventions
  const [mediateEmp, setMediateEmp] = useState(null);
  const [offboardEmp, setOffboardEmp] = useState(null);
  const [transferTargetDeptId, setTransferTargetDeptId] = useState('');

  // Modal state for Finalizing Contract Renewal Decision (Yes / No)
  const [finalizeEmp, setFinalizeEmp] = useState(null);
  const [hrRenewalDecision, setHrRenewalDecision] = useState('Yes'); // 'Yes' | 'No'
  const [hrRenewalRemarks, setHrRenewalRemarks] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [renewalsRes, usersRes, evalsRes, deptsRes] = await Promise.allSettled([
        api.renewals.list(),
        api.users.list({ role: 'COS Employee' }),
        api.evaluations.list(),
        api.departments.list(),
      ]);

      const renewals = renewalsRes.status === 'fulfilled' && Array.isArray(renewalsRes.value) ? renewalsRes.value : [];
      const users = usersRes.status === 'fulfilled' && Array.isArray(usersRes.value) ? usersRes.value : [];
      const evals = evalsRes.status === 'fulfilled' && Array.isArray(evalsRes.value) ? evalsRes.value : [];
      const depts = deptsRes.status === 'fulfilled' && Array.isArray(deptsRes.value) ? deptsRes.value : [];

      if (depts.length > 0) {
        setDbDepartments(depts);
      }

      // Map renewals by employee_id (latest renewal wins)
      const renewalMap = new Map();
      renewals.forEach((r) => {
        if (!renewalMap.has(r.employee_id) || r.id > renewalMap.get(r.employee_id).id) {
          renewalMap.set(r.employee_id, r);
        }
      });

      // Map evals by employee_id (latest eval wins)
      const evalMap = new Map();
      evals.forEach((e) => {
        if (!evalMap.has(e.employee_id) || e.id > evalMap.get(e.employee_id).id) {
          evalMap.set(e.employee_id, e);
        }
      });

      const mapped = users.map((u) => {
        let r = renewalMap.get(u.id);
        let ev = evalMap.get(u.id);

        // Term guard: if renewal or eval was submitted prior to current contract start, treat as prior term.
        // Only applies if the contract start date has already arrived in the past (historical term).
        // If contractStart is in the future, it represents a newly approved future renewal term.
        const contractStart = u.contract_start_date || u.contractStartDate;
        const now = new Date();
        if (contractStart) {
          const startDateObj = new Date(contractStart);
          if (startDateObj <= now) {
            if (r?.submitted_at && new Date(r.submitted_at) < startDateObj) {
              r = null;
            }
            if (ev?.created_at && new Date(ev.created_at) < startDateObj) {
              ev = null;
            }
          }
        }

        const endRaw = u.contract_end_date || u.contractEndDate;
        let daysUntilExpiration = 999;
        if (endRaw) {
          const endDateObj = new Date(endRaw);
          const diffMs = endDateObj.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0);
          daysUntilExpiration = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        }

        let routingStatus = 'Awaiting Employee Intent';
        let intentStatus = 'Awaiting Intent';
        let deptHeadEndorsement = 'Awaiting Intent';
        let rejectionCategory = '';
        let rejectionJustification = '';

        if (u.is_archived) {
          routingStatus = 'Offboarded / Archived';
          intentStatus = r?.status === 'Declined' ? 'Declined' : 'Confirmed';
          deptHeadEndorsement = r?.department_head_endorsement || 'N/A';
        } else if (r) {
          if (r.status === 'Declined' || r.mar_narrative?.includes('DECLINED')) {
            routingStatus = 'Contract Closure Pending';
            intentStatus = 'Declined';
            deptHeadEndorsement = 'N/A (Declined)';
            rejectionJustification = (r.mar_narrative || '')
              .replace('[COS DECLINED RENEWAL]:', '')
              .trim();
          } else {
            intentStatus = 'Confirmed';

            if (r.hrmo_approval === 'Approved') {
              routingStatus = 'Contract Renewed';
              deptHeadEndorsement = r.department_head_endorsement === 'Disapproved' ? 'Not Recommended' : 'Recommended';
            } else if (r.hrmo_approval === 'Declined') {
              routingStatus = 'Non-Renewal Finalized';
              deptHeadEndorsement = r.department_head_endorsement === 'Disapproved' ? 'Not Recommended' : 'Recommended';
            } else if (r.department_head_endorsement === 'Overruled') {
              deptHeadEndorsement = 'Recommended (Overruled by HR)';
              routingStatus =
                ev?.status === 'Completed' || (ev?.final_score != null && ev?.final_score > 0)
                  ? 'Evaluation Completed'
                  : 'Evaluation in Progress';
            } else if (
              ev?.is_fast_track_rejected ||
              ev?.status === 'Rejected' ||
              r.department_head_endorsement === 'Disapproved'
            ) {
              routingStatus = 'Non-Renewal Endorsed';
              deptHeadEndorsement = 'Not Recommended';
              rejectionCategory = ev?.fast_track_category || 'Supervisory Disapproval';
              rejectionJustification =
                ev?.fast_track_justification ||
                ev?.qualitative_strengths ||
                r.mar_narrative ||
                'Department Head submitted non-renewal recommendation.';
            } else if (ev?.status === 'Completed' || (ev?.final_score != null && ev?.final_score > 0)) {
              routingStatus = 'Evaluation Completed';
              deptHeadEndorsement = 'Recommended';
            } else if (ev?.status === 'Open') {
              routingStatus = 'Evaluation in Progress';
              deptHeadEndorsement = r.department_head_endorsement === 'Endorsed' ? 'Recommended' : 'Pending Review';
            } else if (r.department_head_endorsement === 'Endorsed') {
              routingStatus = 'Pending Initiation';
              deptHeadEndorsement = 'Recommended';
            } else if (r.status === 'Submitted') {
              routingStatus = 'Awaiting Dept Head Endorsement';
              deptHeadEndorsement = 'Awaiting Dept Head Review';
            } else {
              routingStatus = 'Pending Initiation';
              deptHeadEndorsement = 'Recommended';
            }
          }
        } else if (ev) {
          if (ev.is_fast_track_rejected || ev.status === 'Rejected') {
            routingStatus = 'Non-Renewal Endorsed';
            deptHeadEndorsement = 'Not Recommended';
            rejectionCategory = ev.fast_track_category || 'Supervisory Disapproval';
            rejectionJustification = ev.fast_track_justification || 'Performance deficiency reported.';
          } else if (ev.status === 'Completed' || (ev.final_score != null && ev.final_score > 0)) {
            routingStatus = 'Evaluation Completed';
            deptHeadEndorsement = 'Recommended';
          } else if (ev.status === 'Open') {
            routingStatus = 'Evaluation in Progress';
            deptHeadEndorsement = 'Recommended';
          }
        }

        const deptName =
          u.department && typeof u.department === 'object' && u.department.name
            ? u.department.name
            : typeof u.department === 'string'
            ? u.department
            : u.department_name || 'Department';

        const contractEnd = u.contract_end_date
          ? new Date(u.contract_end_date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: '2-digit',
            })
          : 'Term Pending';

        const supervisorScore = ev?.supervisor_score ?? null;
        const peerScore = ev?.peer_score ?? null;
        const hrmoScore = ev?.hrmo_score ?? null;
        const finalScore = ev?.final_score ?? supervisorScore ?? null;

        let ratingLabel = ev?.rating_label;
        if (!ratingLabel && finalScore != null) {
          if (finalScore >= 90) ratingLabel = 'Outstanding';
          else if (finalScore >= 70) ratingLabel = 'Very Satisfactory';
          else if (finalScore >= 50) ratingLabel = 'Satisfactory';
          else if (finalScore >= 30) ratingLabel = 'Needs Improvement';
          else ratingLabel = 'Unsatisfactory';
        }

        return {
          id: u.id,
          renewalId: r?.id,
          evalId: ev?.id,
          fullName: u.fullName || u.full_name || 'COS Personnel',
          idNumber: u.idNumber || u.employee_id_number || `EMP-${u.id}`,
          employeeId: u.idNumber || u.employee_id_number || `EMP-${u.id}`,
          department: deptName,
          departmentId: u.department_id,
          role: u.jobTitle || u.job_title || 'COS Employee',
          jobTitle: u.jobTitle || u.job_title || 'COS Employee',
          contractEndDate: contractEnd,
          daysUntilExpiration,
          routingStatus,
          intentStatus,
          deptHeadEndorsement,
          rejectionCategory,
          rejectionJustification,
          finalContractRemarks: r?.mar_narrative || '',
          evaluationScores: {
            supervisor: supervisorScore,
            peer: peerScore,
            hrmo: hrmoScore,
            finalGrade: finalScore,
            interpretation: ratingLabel || 'Pending Rating',
            supervisorRecommendation:
              deptHeadEndorsement === 'Not Recommended'
                ? 'Not Recommended'
                : 'Recommended for Renewal',
            supervisorStrengths:
              ev?.qualitative_strengths ||
              ev?.qualitative_recommendations ||
              'Pending immediate supervisor qualitative remarks.',
            supervisorRemarks:
              ev?.qualitative_recommendations ||
              'Recommended for contract renewal based on immediate supervisor evaluation.',
          },
        };
      });

      if (mapped.length > 0) {
        setEmployees(mapped);
      }
    } catch (err) {
      console.warn('EvaluationManagement loadData error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartRouting = async (empId) => {
    const emp = employees.find((e) => e.id === empId);
    try {
      setIsSubmitting(true);
      if (api?.evaluations?.start) {
        await api.evaluations.start(empId);
      }
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === empId ? { ...e, routingStatus: 'Evaluation in Progress' } : e
        )
      );
      onStartEmployeeEvaluation(empId);
      setToastMsg(
        `Evaluation initiated for ${emp?.fullName || 'Employee'}! Dispatched alerts to Supervisor and Employee.`
      );
      loadData();
    } catch (err) {
      console.warn('Error starting evaluation:', err);
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === empId ? { ...e, routingStatus: 'Evaluation in Progress' } : e
        )
      );
      onStartEmployeeEvaluation(empId);
      setToastMsg(`Evaluation initiated for ${emp?.fullName || 'Employee'}.`);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setToastMsg(null), 4500);
    }
  };

  const openFinalizeModal = (emp) => {
    setFinalizeEmp(emp);
    if (emp.routingStatus === 'Contract Renewed') {
      setHrRenewalDecision('Yes');
      setHrRenewalRemarks(emp.finalContractRemarks || '');
    } else if (emp.routingStatus === 'Non-Renewal Finalized') {
      setHrRenewalDecision('No');
      setHrRenewalRemarks(emp.finalContractRemarks || '');
    } else {
      const isRecommended =
        (emp.evaluationScores?.supervisorRecommendation || emp.deptHeadEndorsement) !== 'Not Recommended';
      setHrRenewalDecision(isRecommended ? 'Yes' : 'No');
      setHrRenewalRemarks('');
    }
  };

  const handleConfirmFinalization = async () => {
    if (!finalizeEmp) return;
    const isRenewed = hrRenewalDecision === 'Yes';
    const newStatus = isRenewed ? 'Contract Renewed' : 'Non-Renewal Finalized';

    try {
      setIsSubmitting(true);
      if (finalizeEmp.renewalId && api?.renewals?.finalizeContract) {
        await api.renewals.finalizeContract(finalizeEmp.renewalId, {
          decision: hrRenewalDecision,
          remarks: hrRenewalRemarks,
        });
      }
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === finalizeEmp.id
            ? {
                ...e,
                routingStatus: newStatus,
                finalContractDecision: isRenewed ? 'Yes - Renew Contract' : 'No - Do Not Renew',
                finalContractRemarks: hrRenewalRemarks,
              }
            : e
        )
      );
      setToastMsg(
        `Official contract disposition finalized for ${finalizeEmp.fullName}: ${
          isRenewed ? 'RENEWED (Term Extension)' : 'DO NOT RENEW (Contract Closure)'
        }. Official notices dispatched.`
      );
      loadData();
    } catch (err) {
      console.warn('API finalize contract error:', err);
      setToastMsg(`Contract disposition recorded for ${finalizeEmp.fullName}.`);
    } finally {
      setIsSubmitting(false);
      setFinalizeEmp(null);
      setTimeout(() => setToastMsg(null), 4500);
    }
  };

  const handleConfirmOffboard = async () => {
    if (!offboardEmp) return;
    try {
      setIsSubmitting(true);
      if (api?.users?.archive) {
        await api.users.archive(offboardEmp.id);
      }
      if (offboardEmp.renewalId && api?.renewals?.finalizeContract) {
        await api.renewals.finalizeContract(offboardEmp.renewalId, {
          decision: 'No',
          remarks: 'Employee offboarded and archived in university records.',
        }).catch(() => {});
      }
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === offboardEmp.id ? { ...e, routingStatus: 'Offboarded / Archived' } : e
        )
      );
      onProcessOffboarding(offboardEmp.id);
      setToastMsg(`Offboarding clearance processed for "${offboardEmp.fullName}". Contract archived.`);
      loadData();
    } catch (err) {
      console.warn('Error archiving employee:', err);
      setToastMsg(`Offboarding processed for "${offboardEmp.fullName}".`);
    } finally {
      setIsSubmitting(false);
      setOffboardEmp(null);
      setTimeout(() => setToastMsg(null), 4500);
    }
  };

  const handleMediationDecision = async (actionType) => {
    if (!mediateEmp) return;
    setIsSubmitting(true);
    try {
      if (actionType === 'offboard') {
        if (mediateEmp.renewalId && api?.renewals?.mediate) {
          await api.renewals.mediate(mediateEmp.renewalId, { resolution: 'offboard' });
        } else {
          if (api?.users?.archive) {
            await api.users.archive(mediateEmp.id);
          }
          if (mediateEmp.renewalId && api?.renewals?.finalizeContract) {
            await api.renewals.finalizeContract(mediateEmp.renewalId, {
              decision: 'No',
              remarks: 'Supervisory non-renewal recommendation upheld in HR mediation. Account archived.',
            }).catch(() => {});
          }
        }
        setEmployees((prev) =>
          prev.map((e) =>
            e.id === mediateEmp.id
              ? { ...e, routingStatus: 'Offboarded / Archived', intentStatus: 'Declined' }
              : e
          )
        );
        onMediateRejection({ employeeId: mediateEmp.id, resolution: 'offboard' });
        setToastMsg(`HR Mediation resolved: "${mediateEmp.fullName}" has been offboarded and archived.`);
      } else if (actionType === 'transfer') {
        const targetDept = dbDepartments.find(
          (d) => String(d.id) === String(transferTargetDeptId) || d.name === transferTargetDeptId
        );
        const targetDeptId = targetDept ? targetDept.id : parseInt(transferTargetDeptId, 10);
        const targetDeptName = targetDept ? targetDept.name : transferTargetDeptId;

        if (mediateEmp.renewalId && api?.renewals?.mediate && targetDeptId) {
          await api.renewals.mediate(mediateEmp.renewalId, {
            resolution: 'transfer',
            target_department_id: targetDeptId,
          });
        } else if (targetDeptId && api?.users?.transferDepartment) {
          await api.users.transferDepartment(mediateEmp.id, targetDeptId);
        }
        setEmployees((prev) =>
          prev.map((e) =>
            e.id === mediateEmp.id
              ? {
                  ...e,
                  routingStatus: 'Awaiting Dept Head Endorsement',
                  deptHeadEndorsement: 'Awaiting Dept Head Review',
                  department: targetDeptName,
                }
              : e
          )
        );
        onMediateRejection({
          employeeId: mediateEmp.id,
          resolution: 'transfer',
          newDepartment: targetDeptName,
        });
        setToastMsg(
          `HR Mediation resolved: "${mediateEmp.fullName}" transferred to ${targetDeptName} and routed for fresh supervisory review.`
        );
      } else if (actionType === 'authorize_eval') {
        if (mediateEmp.renewalId && api?.renewals?.mediate) {
          await api.renewals.mediate(mediateEmp.renewalId, { resolution: 'authorize_eval' });
        } else {
          if (mediateEmp.renewalId && api?.renewals?.endorse) {
            await api.renewals.endorse(mediateEmp.renewalId, {
              status: 'Recommended',
              notes: 'Supervisory non-renewal recommendation overruled by HR in administrative mediation. Authorized for performance evaluation.',
            }).catch(() => {});
          }
          if (api?.evaluations?.start) {
            await api.evaluations.start(mediateEmp.id).catch(() => {});
          }
        }
        setEmployees((prev) =>
          prev.map((e) =>
            e.id === mediateEmp.id
              ? {
                  ...e,
                  deptHeadEndorsement: 'Recommended (Overruled by HR)',
                  routingStatus: 'Evaluation in Progress',
                }
              : e
          )
        );
        onMediateRejection({
          employeeId: mediateEmp.id,
          resolution: 'authorize_eval',
        });
        setToastMsg(
          `HR Mediation resolved: Non-renewal overruled. Performance evaluation opened for "${mediateEmp.fullName}".`
        );
      }
      await loadData();
    } catch (err) {
      console.warn('Mediation decision error:', err);
      setToastMsg(`Failed to resolve HR mediation: ${err.message || 'Server error'}`);
    } finally {
      setIsSubmitting(false);
      setMediateEmp(null);
      setTimeout(() => setToastMsg(null), 4500);
    }
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
    // All other statuses belong to the pending side
    return 99;
  };

  const isConcluded = (emp) =>
    emp.routingStatus === 'Contract Renewed' ||
    emp.routingStatus === 'Non-Renewal Finalized' ||
    emp.routingStatus === 'Offboarded / Archived';

  // Only display users who are pending for renewal or in progress of said renewal
  const activeRenewalEmployees = employees.filter((emp) => {
    if (isConcluded(emp)) return false;
    // An employee awaiting intent only belongs in the nearing expiration queue if their contract expires within 30 days
    if (emp.routingStatus === 'Awaiting Employee Intent' && emp.daysUntilExpiration > 30) {
      return false;
    }
    return true;
  });

  // Top Group: Actionable rows, sorted by prioritized urgency (Start -> Finalize -> Mediate -> Offboard), then A-Z
  const actionableEmployees = [...activeRenewalEmployees]
    .filter((emp) => getActionPriority(emp) < 99)
    .sort((a, b) => {
      const pDiff = getActionPriority(a) - getActionPriority(b);
      if (pDiff !== 0) return pDiff;
      return a.fullName.localeCompare(b.fullName);
    });

  // Bottom Group: Pending / Waiting rows, sorted alphabetically A to Z
  const pendingEmployees = [...activeRenewalEmployees]
    .filter((emp) => getActionPriority(emp) === 99)
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  // Available departments for transfer
  const availableDepts = dbDepartments.length > 0
    ? dbDepartments.filter((d) => d.name !== mediateEmp?.department && d.id !== mediateEmp?.departmentId)
    : departments.filter((d) => (typeof d === 'string' ? d : d.name) !== mediateEmp?.department);

  const renderEmployeeRow = (emp) => (
    <tr key={emp.id}>
      <td style={{ verticalAlign: 'middle', padding: '14px 14px' }}>
        <b style={{ color: 'var(--ink-900)' }}>{emp.fullName}</b>
        <div className="muted" style={{ fontSize: '12px', marginTop: '2px' }}>
          ID: {emp.idNumber || `EMP-${emp.id}`}
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
            title={emp.rejectionJustification ? `Reason: ${emp.rejectionJustification}` : undefined}
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
              onClick={() => {
                setMediateEmp(emp);
                const initialTarget = availableDepts.find((d) => (d.name || d) !== emp.department);
                setTransferTargetDeptId(initialTarget ? String(initialTarget.id || initialTarget) : '');
              }}
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
              disabled={isSubmitting}
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
              title="Review final scores and issue contract renewal decision"
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
            Track contract expiration dates, review supervisor recommendations, and finalize renewal decisions for Contract of Service personnel.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {onNavigate && (
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => onNavigate('evaluation_settings')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#ffffff',
                borderColor: 'var(--line)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Sliders size={14} /> Evaluation Settings
            </button>
          )}
          {onBack && (
            <button type="button" className="btn btn-sm" onClick={onBack}>
              Back to Dashboard
            </button>
          )}
        </div>
      </div>

      <Toast message={toastMsg} onClose={() => setToastMsg(null)} />

      {/* COS Employees Roster & Routing Control */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
          <div className="card-title" style={{ margin: 0 }}>
            COS Personnel Nearing Contract Expiration
          </div>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>
            Urgent operational reviews are prioritized at the top (Start Evaluation, Finalize Contract, Non-Renewal Mediation, and Offboarding), followed by pending reviews and evaluations in progress.
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
            {loading && employees.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px 16px', background: '#fff' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <RefreshCw size={24} className="spin" style={{ color: 'var(--primary)' }} />
                    <div style={{ fontWeight: 600, color: 'var(--ink-700)', fontSize: '13.5px' }}>
                      Loading evaluation records from database...
                    </div>
                  </div>
                </td>
              </tr>
            ) : actionableEmployees.length === 0 && pendingEmployees.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '56px 20px', background: '#fff' }}>
                  <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'var(--green-50, #f0fdf4)',
                        color: 'var(--green-600, #16a34a)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '12px',
                      }}
                    >
                      <Check size={24} />
                    </div>
                    <h3 style={{ margin: '0 0 6px', color: 'var(--ink-800)', fontWeight: 800, fontSize: '16px' }}>
                      All Caught Up!
                    </h3>
                    <p className="muted" style={{ margin: '0 0 18px', fontSize: '13.5px', lineHeight: 1.5 }}>
                      There are no pending contract renewal reviews or in-progress evaluations across campus departments. Completed evaluation records and verified contract determinations are permanently stored in Employee Records.
                    </p>
                    {onNavigate && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => onNavigate('employee_records')}
                        style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <FileText size={15} />
                        View Employee Records
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              <>
                {actionableEmployees.map(renderEmployeeRow)}
                {pendingEmployees.map(renderEmployeeRow)}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* HR Mediation Modal for Dept Head Non-Renewal Recommendation */}
      {mediateEmp && (
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
            if (e.target === e.currentTarget) setMediateEmp(null);
          }}
        >
          <div className="modal-card" style={{ maxWidth: '600px', width: '92%', borderRadius: '12px', background: '#fff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)', overflow: 'hidden' }}>
            <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', background: '#fff' }}>
              <div className="card-title" style={{ margin: 0, color: 'var(--red-600)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} color="var(--red-600)" />
                <span>HR Administrative Mediation - Dept Head Non-Renewal</span>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setMediateEmp(null)}
                aria-label="Close"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-600)', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
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
                  <b>{mediateEmp.rejectionCategory || 'Gross Incompetence / Poor Performance'}</b>
                </div>

                {mediateEmp.evaluationScores?.finalGrade != null && (
                  <div style={{ fontSize: '12.5px', marginTop: '6px' }}>
                    <span className="muted">Supervisor Evaluation Rating: </span>
                    <b>
                      {Number(mediateEmp.evaluationScores.finalGrade).toFixed(1)}% ({mediateEmp.evaluationScores.interpretation})
                    </b>
                  </div>
                )}

                <div style={{ fontSize: '12.5px', marginTop: '6px', color: 'var(--ink)' }}>
                  <span className="muted">Supervisory Justification: </span>
                  <p style={{ margin: '4px 0 0', fontStyle: 'italic', background: '#fff', padding: '8px 10px', borderRadius: '6px', border: '1px solid #fecaca' }}>
                    "{mediateEmp.rejectionJustification || 'Substantive performance deficiency reported by Department Head.'}"
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
                      disabled={isSubmitting}
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
                      value={transferTargetDeptId}
                      onChange={(e) => setTransferTargetDeptId(e.target.value)}
                    >
                      <option value="">-- Select Target Department --</option>
                      {availableDepts.map((d) => (
                        <option key={d.id || d} value={d.id || d}>
                          {d.name || d}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-sm"
                      disabled={!transferTargetDeptId || isSubmitting}
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
                        Disputes or resolves the non-renewal in administrative conference. Clears employee for standard Immediate Supervisor performance evaluation.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      disabled={isSubmitting}
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
        </div>
      )}

      {/* Process Offboarding Modal for Declined Renewal */}
      {offboardEmp && (
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
            if (e.target === e.currentTarget) setOffboardEmp(null);
          }}
        >
          <div className="modal-card" style={{ maxWidth: '500px', width: '92%', borderRadius: '12px', background: '#fff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)', overflow: 'hidden' }}>
            <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', background: '#fff' }}>
              <div className="card-title" style={{ margin: 0, color: 'var(--red-600)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Archive size={18} color="var(--red-600)" />
                <span>Process Personnel Offboarding</span>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setOffboardEmp(null)}
                aria-label="Close"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-600)', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <p className="muted" style={{ margin: '0 0 14px', fontSize: '13.5px', lineHeight: 1.5 }}>
                <b>{offboardEmp.fullName}</b> ({offboardEmp.idNumber || 'COS Personnel'}) has formally submitted a non-renewal decision (<b>Declined</b>) for their contract expiring on <b>{offboardEmp.contractEndDate}</b>.
              </p>

              {offboardEmp.rejectionJustification && (
                <div style={{ background: 'var(--red-50)', border: '1px solid #fecaca', borderRadius: '6px', padding: '10px 12px', marginBottom: '16px', fontSize: '13px' }}>
                  <span className="muted">Stated Reason for Exiting: </span>
                  <b>"{offboardEmp.rejectionJustification}"</b>
                </div>
              )}

              <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--ink-700)' }}>
                Proceeding will generate standard university end-of-contract clearance documents, archive their historical records, and deactivate portal credentials at term expiration.
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn" style={{ cursor: 'pointer' }} onClick={() => setOffboardEmp(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={isSubmitting}
                  style={{ background: 'var(--red-600)', color: '#fff', borderColor: 'var(--red-600)', fontWeight: 700, cursor: 'pointer' }}
                  onClick={handleConfirmOffboard}
                >
                  Confirm Offboarding &amp; Archive
                </button>
              </div>
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
                    Institutional Performance Review &amp; Official HR Disposition
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
                    ID: <b>{finalizeEmp.idNumber}</b> - Department: <b>{finalizeEmp.department}</b>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="muted" style={{ fontSize: '11.5px' }}>Current Term Expiration</div>
                  <b style={{ fontSize: '13px', color: 'var(--ink-900)' }}>{finalizeEmp.contractEndDate}</b>
                </div>
              </div>

              {/* Immediate Supervisor Performance Rating Highlight Banner */}
              <div style={{ marginBottom: '18px' }}>
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
                    <span className="muted" style={{ fontSize: '12px' }}>Immediate Supervisor Evaluation Rating (100%):</span>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)' }}>
                      {finalizeEmp.evaluationScores?.finalGrade != null
                        ? `${Number(finalizeEmp.evaluationScores.finalGrade).toFixed(2)} / 100`
                        : 'Pending'}
                      <span style={{ fontSize: '13px', fontWeight: 700, marginLeft: '8px', color: 'var(--green-700)' }}>
                        ({finalizeEmp.evaluationScores?.interpretation || 'Pending Rating'})
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="muted" style={{ fontSize: '11.5px' }}>Evaluation Interpretation:</span>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--brand-700)' }}>
                      {finalizeEmp.evaluationScores?.interpretation || 'Pending Rating'}
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
                  <Check size={16} /> Official Record: Contract is RENEWED for upcoming term.
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

              {/* Supervisor Evaluation & Renewal Recommendation Review Card */}
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
                    Supervisor Evaluation &amp; Renewal Recommendation:
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
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {(finalizeEmp.evaluationScores?.supervisorRecommendation || finalizeEmp.deptHeadEndorsement) ===
                    'Not Recommended' ? (
                      <>
                        <X size={12} /> Not Recommended for Renewal
                      </>
                    ) : (
                      <>
                        <Check size={12} /> Recommended for Renewal
                      </>
                    )}
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
                      'No qualitative remarks provided.'}"
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
                  {/* Option 1: Yes - Renew Contract */}
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
                        Yes - Renew Contract
                      </b>
                      <p className="muted" style={{ margin: '3px 0 0', fontSize: '12px', lineHeight: 1.4 }}>
                        Authorize contract renewal. Forward endorsed recommendation for official university appointment.
                      </p>
                    </div>
                  </label>

                  {/* Option 2: No - Do Not Renew */}
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
                        No - Do Not Renew
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
                  HR Resolution Notes &amp; Administrative Remarks <span className="muted" style={{ fontWeight: 400 }}>(Optional)</span>:
                </label>
                <PredictiveTextarea
                  id="hrRenewalRemarksInput"
                  rows={3}
                  value={hrRenewalRemarks}
                  onChange={(e) => setHrRenewalRemarks(e.target.value)}
                  placeholder="Optional: Enter administrative notes or remarks for university records..."
                  contextType="hr_renewal"
                  fieldName={`hrRenewalNotes (${hrRenewalDecision === 'Yes' ? 'Contract Renewed' : 'Non-Renewal Finalized'})`}
                  role={finalizeEmp?.role || finalizeEmp?.jobTitle || 'COS Personnel'}
                  department={typeof finalizeEmp?.department === 'object' ? (finalizeEmp?.department?.name || 'Academic Affairs') : (finalizeEmp?.department || 'Academic Affairs')}
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
                  disabled={isSubmitting}
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