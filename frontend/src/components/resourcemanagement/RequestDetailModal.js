import React, { useState, useEffect, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { Combobox, Transition } from '@headlessui/react';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid';
import { adminUserAPI } from '../../services/api';
import { toast } from 'react-toastify';

// Helper Functions
export const getStatusIcon = (status) => {
  switch (status) {
    case 'PENDING':
      return <ClockIcon className="h-5 w-5 text-yellow-500" />;
    case 'APPROVAL_REQUIRED':
      return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />;
    case 'APPROVED':
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    case 'REJECTED':
      return <XCircleIcon className="h-5 w-5 text-red-500" />;
    default:
      return <ClockIcon className="h-5 w-5 text-gray-500" />;
  }
};

export const getStatusBadge = (status) => {
  const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border";
  switch (status) {
    case 'PENDING':
      return `${baseClasses} bg-amber-500/10 text-amber-400 border-amber-500/30`;
    case 'APPROVAL_REQUIRED':
      return `${baseClasses} bg-orange-500/10 text-orange-400 border-orange-500/30`;
    case 'APPROVED':
      return `${baseClasses} bg-emerald-500/10 text-emerald-400 border-emerald-500/30`;
    case 'REJECTED':
      return `${baseClasses} bg-rose-500/10 text-rose-400 border-rose-500/30`;
    default:
      return `${baseClasses} bg-gray-500/10 text-gray-400 border-gray-500/30`;
  }
};

export const getPriorityBadge = (priority) => {
  const baseClasses = "inline-flex items-center px-2 py-1.5 rounded-lg text-xs font-bold shadow-sm";
  switch (priority) {
    case 'LOW':
      return `${baseClasses} bg-emerald-500/10 text-emerald-400 border border-emerald-500/20`;
    case 'MEDIUM':
      return `${baseClasses} bg-amber-500/10 text-amber-400 border border-amber-500/20`;
    case 'HIGH':
      return `${baseClasses} bg-orange-500/10 text-orange-400 border border-orange-500/20`;
    case 'URGENT':
      return `${baseClasses} bg-rose-500/10 text-rose-400 border border-rose-500/20`;
    default:
      return `${baseClasses} bg-gray-500/10 text-gray-400 border border-gray-500/20`;
  }
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const RequestDetailModal = ({ 
  request, 
  onClose, 
  theme, 
  isAdminLike, 
  approveMutation, 
  rejectMutation, 
  requestApprovalMutation, 
  updateRequestMutation 
}) => {
  const [approverEmail, setApproverEmail] = useState('');
  const [assignedTo, setAssignedTo] = useState(request?.assigned_to || null);
  const [requiresApproval, setRequiresApproval] = useState(Boolean(request?.requires_approval));
  const [notes, setNotes] = useState(request?.notes || '');
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (request) {
      setAssignedTo(request.assigned_to || null);
      setRequiresApproval(Boolean(request.requires_approval));
      setNotes(request.notes || '');
      setApproverEmail(request.approver_email || '');
    }
  }, [request]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await adminUserAPI.getUsers();
        const data = res?.data?.results || res?.data || [];
        if (mounted) setUsers(data);
      } catch (e) {
        setUsers([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (!request) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] transition-all duration-500">
      <div className={`bg-slate-950 border ${theme.cardBorder || 'border-white/10'} rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.9)] max-w-4xl w-full max-h-[85vh] overflow-y-auto custom-scrollbar relative border-white/10 mt-10`}>
        <div className={`sticky top-0 bg-slate-900 border-b border-white/10 px-8 py-5 rounded-t-3xl z-30 flex items-center justify-between shadow-lg`}>
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
              <EyeIcon className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h3 className={`text-2xl font-black bg-gradient-to-r ${theme.primaryGradient || 'from-indigo-500 to-purple-500'} bg-clip-text text-transparent tracking-tight`}>Request Details</h3>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none font-mono">#{request.ticket_number}</p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            title="Close"
            className="p-2 bg-white/10 hover:bg-indigo-500 text-white rounded-xl transition-all duration-300 group flex items-center justify-center border border-white/10 hover:border-indigo-400 active:scale-95 shadow-xl"
          >
            <XMarkIcon className="h-7 w-7 text-white" />
          </button>
        </div>

        <div className="p-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Status</label>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                    {getStatusIcon(request.status)}
                  </div>
                  <span className={getStatusBadge(request.status)}>
                    {request.status_display || request.status}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Priority</label>
                <span className={getPriorityBadge(request.priority)}>
                  {request.priority_display || request.priority}
                </span>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Request Type</label>
                <p className="text-white font-medium text-lg">{request.request_type === 'IT' ? 'IT Support' : 'New Access'}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Requested At</label>
                <p className="text-white font-mono">{formatDate(request.requested_at)}</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Duration</label>
                <p className="text-white font-medium">{request.duration} days</p>
              </div>

              {request.expires_at && (
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Expires At</label>
                  <p className="text-rose-200 font-mono">{formatDate(request.expires_at)}</p>
                </div>
              )}
            </div>
          </div>

          {request.request_type !== 'IT' && (
            <div className="border-t border-white/10 pt-8">
              <h4 className="text-lg font-bold text-white mb-6">Resource Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Resource</label>
                  <p className="text-white text-lg font-medium">{request.resource_name || 'N/A'}</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Access Level</label>
                  <p className="text-white text-lg font-medium">{request.access_level_name || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-white/10 pt-10">
            <label className="block text-sm font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Justification</label>
            <div
              className="prose prose-invert max-w-none text-gray-300 bg-black/40 rounded-2xl p-8 border border-white/5 leading-relaxed shadow-inner"
              dangerouslySetInnerHTML={{ __html: request.justification || '<span class="text-gray-500 italic font-light font-serif">No justification provided.</span>' }}
            />
          </div>

          {(request.approved_by || request.approved_at || request.status === 'REJECTED') && (
            <div className="border-t border-white/10 pt-8">
              <h4 className="text-lg font-bold text-white mb-6">Approval Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-xl bg-black/20 border border-white/5">
                {request.status === 'REJECTED' && request.rejected_by_name && (
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Rejected By</label>
                    <p className="text-rose-200">{request.rejected_by_name}</p>
                  </div>
                )}
                {request.status !== 'REJECTED' && request.approved_by && (
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Approved By</label>
                    <p className="text-emerald-200">{request.approved_by_name || request.approved_by}</p>
                  </div>
                )}
                {request.approved_at && (
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Approved At</label>
                    <p className="text-white font-mono">{formatDate(request.approved_at)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {isAdminLike && (
            <div className="border-t border-white/10 pt-10 pb-6">
              <div className="bg-gradient-to-br from-indigo-500/[0.08] to-purple-500/[0.08] border border-indigo-500/20 rounded-3xl p-8 shadow-[inset_0_0_40px_rgba(0,0,0,0.2)]">
                <h4 className="text-sm font-black text-indigo-400/80 uppercase tracking-[0.2em] mb-8 flex items-center">
                  <div className="p-1.5 bg-indigo-500/10 rounded-lg mr-3">
                    <CheckCircleIcon className="w-4 h-4" />
                  </div>
                  Admin Control Panel
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-indigo-200">Assigned To</label>
                    <Combobox value={assignedTo} onChange={setAssignedTo}>
                      <div className="relative mt-1">
                        <div className="relative w-full cursor-default overflow-hidden rounded-xl bg-white/5 border border-white/10 text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all hover:bg-white/10 hover:border-white/20">
                          <Combobox.Input
                            className="w-full border-none py-3 pl-4 pr-10 text-sm leading-5 text-white bg-transparent focus:ring-0 placeholder-gray-500"
                            displayValue={(userId) => {
                              const user = users.find(u => u.id === userId);
                              if (!user) return 'Unassigned';
                              return user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || user.email;
                            }}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search employee..."
                          />
                          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                          </Combobox.Button>
                        </div>
                        <Transition
                          as={Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                          afterLeave={() => setQuery('')}
                        >
                          <Combobox.Options className="absolute mt-2 max-h-60 w-full overflow-auto rounded-xl bg-slate-800 py-1 text-base shadow-2xl ring-1 ring-white/10 focus:outline-none sm:text-sm z-50 backdrop-blur-xl">
                            <Combobox.Option
                              value={null}
                              className={({ active }) =>
                                `relative cursor-default select-none py-3 pl-10 pr-4 ${
                                  active ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-300'
                                }`
                              }
                            >
                              {({ selected, active }) => (
                                <>
                                  <span className={`block truncate ${selected ? 'font-bold text-indigo-400' : 'font-normal'}`}>
                                    Unassigned
                                  </span>
                                  {selected ? (
                                    <span className={`absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-400`}>
                                      <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                    </span>
                                  ) : null}
                                </>
                              )}
                            </Combobox.Option>
                            
                            {users.filter((user) => {
                              const name = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
                              const username = (user.username || '').toLowerCase();
                              const email = (user.email || '').toLowerCase();
                              const search = query.toLowerCase();
                              return name.includes(search) || username.includes(search) || email.includes(search);
                            }).map((user) => (
                              <Combobox.Option
                                key={user.id}
                                className={({ active }) =>
                                  `relative cursor-default select-none py-3 pl-10 pr-4 ${
                                    active ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-300'
                                  }`
                                }
                                value={user.id}
                              >
                                {({ selected, active }) => (
                                  <>
                                    <span className={`block truncate ${selected ? 'font-bold text-indigo-400' : 'font-normal'}`}>
                                      {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || user.email}
                                    </span>
                                    {selected ? (
                                      <span className={`absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-400`}>
                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                      </span>
                                    ) : null}
                                  </>
                                )}
                              </Combobox.Option>
                            ))}
                          </Combobox.Options>
                        </Transition>
                      </div>
                    </Combobox>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-7 border border-white/10 bg-white/5 px-5 py-3 rounded-xl hover:bg-white/10 hover:border-white/20 transition-colors shadow-sm">
                    <input
                      id="requiresApproval"
                      type="checkbox"
                      checked={requiresApproval}
                      onChange={(e) => setRequiresApproval(e.target.checked)}
                      className="h-5 w-5 text-indigo-500 border-white/20 rounded bg-white/5 focus:ring-indigo-500 focus:ring-offset-0 focus:ring-offset-transparent cursor-pointer"
                    />
                    <label htmlFor="requiresApproval" className="text-sm font-bold text-white cursor-pointer select-none">Requires Manager Approval</label>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-indigo-200">Status</label>
                    <input
                      value={request.status_display || request.status}
                      disabled
                      className="px-4 py-3 border border-white/5 rounded-xl bg-black/20 text-gray-400 cursor-not-allowed font-medium"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-indigo-200">{request.status === 'REJECTED' ? 'Rejected By' : 'Approved By'}</label>
                    <input
                      value={(request.status === 'REJECTED' ? (request.rejected_by_name || '') : (request.approved_by_name || ''))}
                      disabled
                      className="px-4 py-3 border border-white/5 rounded-xl bg-black/20 text-gray-400 cursor-not-allowed placeholder-gray-600 font-medium"
                      placeholder="Pending..."
                    />
                  </div>
                  
                  <div className="md:col-span-2 flex flex-col gap-2 mt-2">
                    <label className="text-sm font-bold text-indigo-200">Admin Notes</label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add internal notes or comments..."
                      className="px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors hover:bg-white/10 hover:border-white/20 placeholder-gray-500 resize-none shadow-sm"
                    />
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-4 items-center pt-6 border-t border-indigo-500/20">
                  <button
                    onClick={async () => {
                      if (approveMutation) {
                        await approveMutation.mutateAsync(request.id);
                        onClose();
                      }
                    }}
                    disabled={!approveMutation || approveMutation.isLoading || request.status === 'APPROVED'}
                    className="px-6 py-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold rounded-xl hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/50 transition-all disabled:opacity-50 shadow-sm"
                  >
                    {approveMutation?.isLoading ? 'Approving...' : 'Approve Request'}
                  </button>
                  
                  <button
                    onClick={async () => {
                      if (rejectMutation) {
                        await rejectMutation.mutateAsync(request.id);
                        onClose();
                      }
                    }}
                    disabled={!rejectMutation || rejectMutation.isLoading || request.status === 'REJECTED'}
                    className="px-6 py-3 bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold rounded-xl hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/50 transition-all disabled:opacity-50 shadow-sm"
                  >
                    {rejectMutation?.isLoading ? 'Rejecting...' : 'Reject Request'}
                  </button>
                  
                  <div className="w-px h-10 bg-indigo-500/20 mx-2 hidden md:block"></div>
                  
                  <div className="flex gap-2 flex-grow flex-wrap">
                    <input
                      type="email"
                      value={approverEmail}
                      onChange={(e) => setApproverEmail(e.target.value)}
                      placeholder="Manager email..."
                      className="px-4 py-3 bg-white/5 border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors min-w-[200px] flex-grow placeholder-gray-500 shadow-sm"
                    />
                    <button
                      onClick={async () => {
                        const email = (approverEmail || '').trim();
                        if (!email) {
                          toast.error('Please enter approver email');
                          return;
                        }
                        if (requestApprovalMutation) {
                          await requestApprovalMutation.mutateAsync({ id: request.id, approver_email: email });
                          onClose();
                        }
                      }}
                      disabled={!requestApprovalMutation || requestApprovalMutation.isLoading || !approverEmail}
                      className="px-6 py-3 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold rounded-xl hover:bg-indigo-500/30 hover:border-indigo-500/50 hover:text-indigo-200 transition-all disabled:opacity-50 whitespace-nowrap shadow-sm"
                    >
                      {requestApprovalMutation?.isLoading ? 'Sending...' : 'Request Approval'}
                    </button>
                  </div>
                  
                  <div className="w-full mt-2 md:mt-0 md:w-auto">
                    <button
                      onClick={async () => {
                        const payload = {
                          assigned_to: assignedTo,
                          requires_approval: requiresApproval,
                          notes: notes,
                          approver_email: approverEmail || null,
                        };
                        if (updateRequestMutation) {
                          await updateRequestMutation.mutateAsync({ id: request.id, data: payload });
                          onClose();
                        }
                      }}
                      disabled={!updateRequestMutation || updateRequestMutation.isLoading}
                      className="w-full px-8 py-3 bg-gradient-to-r from-blue-600/90 to-indigo-600/90 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                    >
                      {updateRequestMutation?.isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default RequestDetailModal;
