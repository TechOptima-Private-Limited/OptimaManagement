


// // import React, { useState, useEffect } from 'react';
// // import { 
// //   Plus,
// //   UserPlus,
// //   FileText,
// //   CheckCircle,
// //   XCircle,
// //   Clock,
// //   Eye,
// //   Edit,
// //   Trash2
// // } from 'lucide-react';

// // const OnboardingManagement = () => {
// //   const [employees, setEmployees] = useState([]);
// //   const [loading, setLoading] = useState(true);
// //   const [filter, setFilter] = useState('all');
// //   const [showCreateModal, setShowCreateModal] = useState(false);
// //   const [showDetailsModal, setShowDetailsModal] = useState(false);
// //   const [showDocumentListModal, setShowDocumentListModal] = useState(false);
// //   const [documentsList, setDocumentsList] = useState([]);
// //   const [selectedEmployee, setSelectedEmployee] = useState(null);
// //   const [newEmployee, setNewEmployee] = useState({
// //     name: '',
// //     email: '',
// //     employee_type: 'employee',
// //     position: '',
// //     salary_lpa: '',
// //     joining_date: ''
// //   });
// //   const [showUploadModal, setShowUploadModal] = useState(false);
// //   const [showDocumentStatusModal, setShowDocumentStatusModal] = useState(false);
// //   const [showEditModal, setShowEditModal] = useState(false);
// //   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
// //   const [uploadingEmployee, setUploadingEmployee] = useState(null);
// //   const [editingEmployee, setEditingEmployee] = useState(null);
// //   const [deletingEmployee, setDeletingEmployee] = useState(null);
// //   const [documentStatus, setDocumentStatus] = useState(null);
// //   const [fileInputs, setFileInputs] = useState([{ id: 1, docType: 'Aadhar and PAN Card', file: null }]);

// //   // Mock toast function since we don't have react-toastify in this environment
// //   const toast = {
// //     success: (message) => alert(`Success: ${message}`),
// //     error: (message) => alert(`Error: ${message}`)
// //   };

// //   useEffect(() => {
// //     fetchEmployees();
// //   }, [filter]);

// //   const fetchEmployees = async () => {
// //     try {
// //       setLoading(true);
// //       const queryParams = filter !== 'all' ? `?status=${filter}` : '';
// //       const response = await fetch(`http://127.0.0.1:8000/api/onboarding/employees/${queryParams}`, {
// //         headers: {
// //           'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
// //           'Content-Type': 'application/json',
// //         },
// //       });

// //       if (response.ok) {
// //         const data = await response.json();
// //         setEmployees(data.results || data);
// //       } else {
// //         toast.error('Failed to fetch employees');
// //       }
// //     } catch (error) {
// //       console.error('Error:', error);
// //       toast.error('Failed to fetch employees');
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const documentTypes = [
// //     { value: 'Aadhar and PAN Card', label: 'Aadhar and PAN Card' },
// //     { value: 'Last 6 months payslips', label: 'Last 6 months payslips' },
// //     { value: 'Educational Certificates (Degree)', label: 'Educational Certificates (Degree)' },
// //     { value: 'Previous Offer Letter', label: 'Previous Offer Letter' },
// //     { value: 'Relieving & Experience Letters', label: 'Relieving & Experience Letters' },
// //     { value: 'Appraisal/Hike Letters', label: 'Appraisal/Hike Letters' },
// //   ];

// //   const addFileInput = () => {
// //     const newId = Math.max(...fileInputs.map(f => f.id)) + 1;
// //     setFileInputs([...fileInputs, { id: newId, docType: 'Aadhar and PAN Card', file: null }]);
// //   };

// //   const removeFileInput = (id) => {
// //     if (fileInputs.length > 1) {
// //       setFileInputs(fileInputs.filter(f => f.id !== id));
// //     }
// //   };

// //   const handleFileChange = (id, file) => {
// //     setFileInputs(fileInputs.map(f => 
// //       f.id === id ? { ...f, file } : f
// //     ));
// //   };

// //   const handleDocTypeChange = (id, docType) => {
// //     setFileInputs(fileInputs.map(f => 
// //       f.id === id ? { ...f, docType } : f
// //     ));
// //   };

// //   const createEmployee = async () => {
// //     try {
// //       const response = await fetch('http://127.0.0.1:8000/api/onboarding/employees/', {
// //         method: 'POST',
// //         headers: {
// //           'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
// //           'Content-Type': 'application/json',
// //         },
// //         body: JSON.stringify(newEmployee),
// //       });

// //       if (response.ok) {
// //         const result = await response.json();
// //         toast.success('Employee created successfully!');
// //         setShowCreateModal(false);
// //         setNewEmployee({
// //           name: '',
// //           email: '',
// //           employee_type: 'employee',
// //           position: '',
// //           salary_lpa: '',
// //           joining_date: ''
// //         });
// //         setFileInputs([{ id: 1, docType: 'Aadhar and PAN Card', file: null }]);
// //         fetchEmployees();
// //       } else {
// //         const error = await response.json();
// //         toast.error(error.detail || 'Failed to create employee');
// //       }
// //     } catch (error) {
// //       console.error('Error:', error);
// //       toast.error('Failed to create employee');
// //     }
// //   };

// //   const uploadDocuments = async () => {
// //     if (!uploadingEmployee) return;

// //     try {
// //       const formData = new FormData();

// //       fileInputs.forEach(fileInput => {
// //         if (fileInput.file) {
// //           formData.append(`document_${fileInput.docType}`, fileInput.file);
// //         }
// //       });

// //       const response = await fetch(`http://127.0.0.1:8000/api/onboarding/employees/${uploadingEmployee.id}/upload_documents/`, {
// //         method: 'POST',
// //         headers: {
// //           'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
// //         },
// //         body: formData,
// //       });

// //       if (response.ok) {
// //         const result = await response.json();
// //         toast.success(`Documents uploaded successfully! ${result.files_uploaded?.length || 0} files processed.`);

// //         // Close upload modal
// //         setShowUploadModal(false);
// //         setUploadingEmployee(null);
// //         setFileInputs([{ id: 1, docType: 'Aadhar and PAN Card', file: null }]);

// //         // Refresh employees list
// //         fetchEmployees();

// //         // Automatically open document status modal to show updated status and allow more uploads
// //         setTimeout(() => {
// //           fetchDocumentStatus(uploadingEmployee.id);
// //         }, 500); // Small delay to ensure the upload modal is closed first

// //       } else {
// //         const error = await response.json();
// //         toast.error(error.message || 'Failed to upload documents');
// //       }
// //     } catch (error) {
// //       console.error('Error:', error);
// //       toast.error('Failed to upload documents');
// //     }
// //   };

// //   const fetchDocumentsList = async (employeeId) => {
// //     try {
// //       const response = await fetch(`http://127.0.0.1:8000/api/onboarding/employees/${employeeId}/list_documents/`, {
// //         headers: {
// //           'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
// //           'Content-Type': 'application/json',
// //         },
// //       });

// //       if (response.ok) {
// //         const data = await response.json();
// //         setDocumentsList(data);
// //         setShowDocumentListModal(true);
// //       } else {
// //         toast.error('Failed to fetch documents list');
// //       }
// //     } catch (error) {
// //       console.error('Error:', error);
// //       toast.error('Failed to fetch documents list');
// //     }
// //   };

// //   const downloadDocument = (employeeId, docType, fileName) => {
// //     const url = `http://127.0.0.1:8000/api/onboarding/employees/${employeeId}/download_document/?doc_type=${encodeURIComponent(docType)}`;

// //     // Create a temporary link and click it to download
// //     const link = document.createElement('a');
// //     link.href = url;
// //     link.download = fileName || 'document';

// //     // Add authorization header by opening in new tab
// //     window.open(url, '_blank');
// //   };

// //   const viewDocument = (employeeId, docType) => {
// //     const url = `http://127.0.0.1:8000/api/onboarding/employees/${employeeId}/view_document/?doc_type=${encodeURIComponent(docType)}`;
// //     window.open(url, '_blank');
// //   };

// //   const fetchDocumentStatus = async (employeeId) => {
// //     try {
// //       const response = await fetch(`http://127.0.0.1:8000/api/onboarding/employees/${employeeId}/documents_status/`, {
// //         headers: {
// //           'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
// //           'Content-Type': 'application/json',
// //         },
// //       });

// //       if (response.ok) {
// //         const data = await response.json();
// //         setDocumentStatus(data);
// //         setShowDocumentStatusModal(true);
// //       } else {
// //         toast.error('Failed to fetch document status');
// //       }
// //     } catch (error) {
// //       console.error('Error:', error);
// //       toast.error('Failed to fetch document status');
// //     }
// //   };

// //   const updateEmployee = async () => {
// //     if (!editingEmployee) return;

// //     try {
// //       const response = await fetch(`http://127.0.0.1:8000/api/onboarding/employees/${editingEmployee.id}/`, {
// //         method: 'PUT',
// //         headers: {
// //           'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
// //           'Content-Type': 'application/json',
// //         },
// //         body: JSON.stringify(editingEmployee),
// //       });

// //       if (response.ok) {
// //         toast.success('Employee updated successfully!');
// //         setShowEditModal(false);
// //         setEditingEmployee(null);
// //         fetchEmployees();
// //       } else {
// //         const error = await response.json();
// //         toast.error(error.detail || 'Failed to update employee');
// //       }
// //     } catch (error) {
// //       console.error('Error:', error);
// //       toast.error('Failed to update employee');
// //     }
// //   };

// //   const deleteEmployee = async () => {
// //     if (!deletingEmployee) return;

// //     try {
// //       const response = await fetch(`http://127.0.0.1:8000/api/onboarding/employees/${deletingEmployee.id}/`, {
// //         method: 'DELETE',
// //         headers: {
// //           'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
// //         },
// //       });

// //       if (response.ok) {
// //         toast.success('Employee deleted successfully!');
// //         setShowDeleteConfirm(false);
// //         setDeletingEmployee(null);
// //         fetchEmployees();
// //       } else {
// //         toast.error('Failed to delete employee');
// //       }
// //     } catch (error) {
// //       console.error('Error:', error);
// //       toast.error('Failed to delete employee');
// //     }
// //   };

// //   const updateEmployeeStatus = async (employeeId, status) => {
// //     try {
// //       const response = await fetch(`http://127.0.0.1:8000/api/onboarding/employees/${employeeId}/update_status/`, {
// //         method: 'POST',
// //         headers: {
// //           'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
// //           'Content-Type': 'application/json',
// //         },
// //         body: JSON.stringify({ status }),
// //       });

// //       if (response.ok) {
// //         toast.success(`Status updated to ${status}`);
// //         fetchEmployees();
// //       } else {
// //         toast.error('Failed to update status');
// //       }
// //     } catch (error) {
// //       console.error('Error:', error);
// //       toast.error('Failed to update status');
// //     }
// //   };

// //   // New function to check if employee has all documents uploaded
// //   const checkDocumentCompletionStatus = async (employeeId) => {
// //     try {
// //       const response = await fetch(`http://127.0.0.1:8000/api/onboarding/employees/${employeeId}/documents_status/`, {
// //         headers: {
// //           'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
// //           'Content-Type': 'application/json',
// //         },
// //       });

// //       if (response.ok) {
// //         const data = await response.json();
// //         return data.is_complete;
// //       }
// //       return false;
// //     } catch (error) {
// //       console.error('Error:', error);
// //       return false;
// //     }
// //   };

// //   const getStatusColor = (status) => {
// //     switch (status) {
// //       case 'pending':
// //         return 'bg-yellow-100 text-yellow-800';
// //       case 'accepted':
// //         return 'bg-green-100 text-green-800';
// //       case 'rejected':
// //         return 'bg-red-100 text-red-800';
// //       default:
// //         return 'bg-gray-100 text-gray-800';
// //     }
// //   };

// //   const getEmployeeTypeColor = (type) => {
// //     switch (type) {
// //       case 'intern':
// //         return 'bg-blue-100 text-blue-800';
// //       case 'employee':
// //         return 'bg-green-100 text-green-800';
// //       default:
// //         return 'bg-gray-100 text-gray-800';
// //     }
// //   };

// //   const filteredEmployees = (employees || []).filter(emp => {
// //     if (filter === 'all') return true;
// //     return emp.status === filter;
// //   });

// //   const employeeCounts = {
// //     all: (employees || []).length,
// //     pending: (employees || []).filter(e => e.status === 'pending').length,
// //     accepted: (employees || []).filter(e => e.status === 'accepted').length,
// //     rejected: (employees || []).filter(e => e.status === 'rejected').length,
// //   };

// //   if (loading) {
// //     return (
// //       <div className="flex justify-center items-center h-64">
// //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
// //       {/* Header */}
// //       <div className="flex items-center justify-between mb-6">
// //         <div>
// //           <h1 className="text-2xl font-bold text-gray-900">Onboarding Management</h1>
// //           <p className="mt-1 text-sm text-gray-600">
// //             Manage employee onboarding process and document verification
// //           </p>
// //         </div>
// //         <button
// //           onClick={() => setShowCreateModal(true)}
// //           className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
// //         >
// //           <Plus className="h-4 w-4 mr-2" />
// //           Add Employee
// //         </button>
// //       </div>

// //       {/* Stats Cards */}
// //       <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
// //         {[
// //           { key: 'all', label: 'Total', count: employeeCounts.all, color: 'bg-blue-500' },
// //           { key: 'pending', label: 'Pending', count: employeeCounts.pending, color: 'bg-yellow-500' },
// //           { key: 'accepted', label: 'Accepted', count: employeeCounts.accepted, color: 'bg-green-500' },
// //           { key: 'rejected', label: 'Rejected', count: employeeCounts.rejected, color: 'bg-red-500' },
// //         ].map((stat) => (
// //           <div key={stat.key} className="bg-white rounded-lg shadow p-6">
// //             <div className="flex items-center">
// //               <div className={`flex-shrink-0 p-3 rounded-md ${stat.color} text-white`}>
// //                 <span className="text-lg font-bold">{stat.count}</span>
// //               </div>
// //               <div className="ml-4">
// //                 <h3 className="text-lg font-medium text-gray-900">{stat.label}</h3>
// //                 <p className="text-sm text-gray-500">Employees</p>
// //               </div>
// //             </div>
// //           </div>
// //         ))}
// //       </div>

// //       {/* Filter Tabs */}
// //       <div className="mb-6">
// //         <div className="border-b border-gray-200">
// //           <nav className="-mb-px flex space-x-8">
// //             {[
// //               { key: 'all', label: 'All' },
// //               { key: 'pending', label: 'Pending' },
// //               { key: 'accepted', label: 'Accepted' },
// //               { key: 'rejected', label: 'Rejected' },
// //             ].map((tab) => (
// //               <button
// //                 key={tab.key}
// //                 onClick={() => setFilter(tab.key)}
// //                 className={`py-2 px-1 border-b-2 font-medium text-sm ${
// //                   filter === tab.key
// //                     ? 'border-blue-500 text-blue-600'
// //                     : 'border-transparent text-gray-500 hover:text-gray-700'
// //                 }`}
// //               >
// //                 {tab.label} ({employeeCounts[tab.key]})
// //               </button>
// //             ))}
// //           </nav>
// //         </div>
// //       </div>

// //       {/* Employees Table */}
// //       <div className="bg-white shadow overflow-hidden sm:rounded-md">
// //         <ul className="divide-y divide-gray-200">
// //           {filteredEmployees.length === 0 ? (
// //             <div className="text-center py-12">
// //               <UserPlus className="mx-auto h-12 w-12 text-gray-400" />
// //               <h3 className="mt-2 text-sm font-medium text-gray-900">No employees found</h3>
// //               <p className="mt-1 text-sm text-gray-500">
// //                 {employees.length === 0 
// //                   ? "Get started by adding your first employee to the onboarding process."
// //                   : "No employees match your current filter."
// //                 }
// //               </p>
// //               {employees.length === 0 && (
// //                 <div className="mt-6">
// //                   <button
// //                     onClick={() => setShowCreateModal(true)}
// //                     className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
// //                   >
// //                     <Plus className="h-4 w-4 mr-2" />
// //                     Add First Employee
// //                   </button>
// //                 </div>
// //               )}
// //             </div>
// //           ) : (
// //             filteredEmployees.map((employee) => (
// //               <li key={employee.id} className="px-6 py-4">
// //                 <div className="flex items-center justify-between">
// //                   <div className="flex items-center space-x-4">
// //                     <div className="flex-shrink-0 h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center">
// //                       <span className="text-white font-medium text-lg">
// //                         {employee.name.charAt(0).toUpperCase()}
// //                       </span>
// //                     </div>
// //                     <div className="flex-1 min-w-0">
// //                       <div className="flex items-center space-x-3">
// //                         <h3 className="text-lg font-medium text-gray-900 truncate">
// //                           {employee.name}
// //                         </h3>
// //                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(employee.status)}`}>
// //                           {employee.status}
// //                         </span>
// //                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEmployeeTypeColor(employee.employee_type)}`}>
// //                           {employee.employee_type}
// //                         </span>
// //                       </div>
// //                       <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
// //                         <span>{employee.email}</span>
// //                         {employee.position && <span>• {employee.position}</span>}
// //                         {employee.salary_lpa && <span>• ₹{employee.salary_lpa} LPA</span>}
// //                         {employee.joining_date && <span>• Joining: {new Date(employee.joining_date).toLocaleDateString()}</span>}
// //                       </div>
// //                     </div>
// //                   </div>

// //                   <div className="flex items-center space-x-2">
// //                     <button
// //                       onClick={() => {
// //                         setSelectedEmployee(employee);
// //                         setShowDetailsModal(true);
// //                       }}
// //                       className="inline-flex items-center justify-center w-8 h-8 border border-gray-300 rounded-md text-gray-600 bg-white hover:bg-gray-50"
// //                       title="View Details"
// //                     >
// //                       <Eye className="h-4 w-4" />
// //                     </button>

// //                     <button
// //                       onClick={() => {
// //                         setEditingEmployee({...employee});
// //                         setShowEditModal(true);
// //                       }}
// //                       className="inline-flex items-center justify-center w-8 h-8 border border-blue-300 rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100"
// //                       title="Edit Employee"
// //                     >
// //                       <Edit className="h-4 w-4" />
// //                     </button>

// //                     <button
// //                       onClick={() => {
// //                         setDeletingEmployee(employee);
// //                         setShowDeleteConfirm(true);
// //                       }}
// //                       className="inline-flex items-center justify-center w-8 h-8 border border-red-300 rounded-md text-red-600 bg-red-50 hover:bg-red-100"
// //                       title="Delete Employee"
// //                     >
// //                       <Trash2 className="h-4 w-4" />
// //                     </button>

// //                     {/* Only show document status button */}
// //                     <button
// //                       onClick={() => fetchDocumentStatus(employee.id)}
// //                       className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
// //                       title="Check Document Status"
// //                     >
// //                       <FileText className="h-4 w-4 mr-1" />
// //                       Documents
// //                     </button>

// //                     {/* Show Accept/Reject buttons only for pending status employees with complete documents */}
// //                     {employee.status === 'pending' && (
// //                       <PendingEmployeeActions 
// //                         employee={employee} 
// //                         onStatusUpdate={updateEmployeeStatus}
// //                         checkDocumentStatus={checkDocumentCompletionStatus}
// //                       />
// //                     )}
// //                   </div>
// //                 </div>
// //               </li>
// //             ))
// //           )}
// //         </ul>
// //       </div>

// //       {/* Create Employee Modal - Enhanced Design */}
// //       {showCreateModal && (
// //         <div className="fixed inset-0 z-50 overflow-y-auto">
// //           <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
// //             <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-50 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}></div>
// //             <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
// //               {/* Header with gradient */}
// //               <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
// //                 <div className="flex items-center">
// //                   <div className="flex-shrink-0">
// //                     <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
// //                       <UserPlus className="h-6 w-6 text-white" />
// //                     </div>
// //                   </div>
// //                   <div className="ml-4">
// //                     <h3 className="text-xl font-bold text-white">
// //                       Add New Employee
// //                     </h3>
// //                     <p className="text-blue-100 text-sm">
// //                       Create a new employee profile for onboarding
// //                     </p>
// //                   </div>
// //                 </div>
// //               </div>

// //               <div className="bg-white px-6 py-6">
// //                 <div className="space-y-6">
// //                   {/* Name Field */}
// //                   <div className="group">
// //                     <label className="block text-sm font-semibold text-gray-700 mb-2">
// //                       Full Name <span className="text-red-500">*</span>
// //                     </label>
// //                     <div className="relative">
// //                       <input
// //                         type="text"
// //                         value={newEmployee.name}
// //                         onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
// //                         className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none text-gray-700 placeholder-gray-400"
// //                         placeholder="Enter employee's full name"
// //                       />
// //                       <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
// //                         <div className="w-2 h-2 bg-blue-500 rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
// //                       </div>
// //                     </div>
// //                   </div>

// //                   {/* Email Field */}
// //                   <div className="group">
// //                     <label className="block text-sm font-semibold text-gray-700 mb-2">
// //                       Email Address <span className="text-red-500">*</span>
// //                     </label>
// //                     <div className="relative">
// //                       <input
// //                         type="email"
// //                         value={newEmployee.email}
// //                         onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
// //                         className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none text-gray-700 placeholder-gray-400"
// //                         placeholder="employee@company.com"
// //                       />
// //                       <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
// //                         <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
// //                         </svg>
// //                       </div>
// //                     </div>
// //                   </div>

// //                   {/* Employee Type and Position Row */}
// //                   <div className="grid grid-cols-2 gap-4">
// //                     <div>
// //                       <label className="block text-sm font-semibold text-gray-700 mb-2">
// //                         Employee Type
// //                       </label>
// //                       <select
// //                         value={newEmployee.employee_type}
// //                         onChange={(e) => setNewEmployee({...newEmployee, employee_type: e.target.value})}
// //                         className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none text-gray-700 bg-white"
// //                       >
// //                         <option value="intern">🎓 Intern</option>
// //                         <option value="employee">👔 Employee</option>
// //                       </select>
// //                     </div>

// //                     <div>
// //                       <label className="block text-sm font-semibold text-gray-700 mb-2">
// //                         Position
// //                       </label>
// //                       <input
// //                         type="text"
// //                         value={newEmployee.position}
// //                         onChange={(e) => setNewEmployee({...newEmployee, position: e.target.value})}
// //                         className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none text-gray-700 placeholder-gray-400"
// //                         placeholder="Job title"
// //                       />
// //                     </div>
// //                   </div>

// //                   {/* Salary and Joining Date Row */}
// //                   <div className="grid grid-cols-2 gap-4">
// //                     <div>
// //                       <label className="block text-sm font-semibold text-gray-700 mb-2">
// //                         Salary (LPA)
// //                       </label>
// //                       <div className="relative">
// //                         <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
// //                         <input
// //                           type="number"
// //                           step="0.01"
// //                           value={newEmployee.salary_lpa}
// //                           onChange={(e) => setNewEmployee({...newEmployee, salary_lpa: e.target.value})}
// //                           className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none text-gray-700 placeholder-gray-400"
// //                           placeholder="0.00"
// //                         />
// //                         <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">LPA</span>
// //                       </div>
// //                     </div>

// //                     <div>
// //                       <label className="block text-sm font-semibold text-gray-700 mb-2">
// //                         Joining Date
// //                       </label>
// //                       <input
// //                         type="date"
// //                         value={newEmployee.joining_date}
// //                         onChange={(e) => setNewEmployee({...newEmployee, joining_date: e.target.value})}
// //                         className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none text-gray-700"
// //                       />
// //                     </div>
// //                   </div>

// //                   {/* Info Box */}
// //                   <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
// //                     <div className="flex">
// //                       <div className="flex-shrink-0">
// //                         <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
// //                           <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
// //                         </svg>
// //                       </div>
// //                       <div className="ml-3">
// //                         <h3 className="text-sm font-medium text-blue-800">
// //                           Next Steps
// //                         </h3>
// //                         <div className="mt-2 text-sm text-blue-700">
// //                           <p>After creating the employee, you can upload their documents and manage their onboarding process.</p>
// //                         </div>
// //                       </div>
// //                     </div>
// //                   </div>
// //                 </div>
// //               </div>

// //               {/* Footer with gradient buttons */}
// //               <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse sm:space-x-reverse sm:space-x-3">
// //                 <button
// //                   onClick={createEmployee}
// //                   className="w-full inline-flex justify-center items-center rounded-xl border border-transparent shadow-lg px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-base font-semibold text-white hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-200 transform hover:scale-105 transition-all duration-200 sm:ml-3 sm:w-auto sm:text-sm"
// //                 >
// //                   <UserPlus className="h-4 w-4 mr-2" />
// //                   Create Employee
// //                 </button>
// //                 <button
// //                   onClick={() => setShowCreateModal(false)}
// //                   className="mt-3 w-full inline-flex justify-center rounded-xl border-2 border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200 sm:mt-0 sm:w-auto sm:text-sm"
// //                 >
// //                   Cancel
// //                 </button>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       {/* Employee Details Modal */}
// //       {showDetailsModal && selectedEmployee && (
// //         <div className="fixed inset-0 z-50 overflow-y-auto">
// //           <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
// //             <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowDetailsModal(false)}></div>
// //             <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
// //               <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
// //                 <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
// //                   Employee Details - {selectedEmployee.name}
// //                 </h3>
// //                 <div className="space-y-4">
// //                   <div>
// //                     <label className="block text-sm font-medium text-gray-700">Email</label>
// //                     <p className="mt-1 text-sm text-gray-900">{selectedEmployee.email}</p>
// //                   </div>
// //                   <div>
// //                     <label className="block text-sm font-medium text-gray-700">Employee Type</label>
// //                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEmployeeTypeColor(selectedEmployee.employee_type)}`}>
// //                       {selectedEmployee.employee_type}
// //                     </span>
// //                   </div>
// //                   <div>
// //                     <label className="block text-sm font-medium text-gray-700">Status</label>
// //                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedEmployee.status)}`}>
// //                       {selectedEmployee.status}
// //                     </span>
// //                   </div>
// //                   <div>
// //                     <label className="block text-sm font-medium text-gray-700">Position</label>
// //                     <p className="mt-1 text-sm text-gray-900">{selectedEmployee.position || 'Not specified'}</p>
// //                   </div>
// //                   <div>
// //                     <label className="block text-sm font-medium text-gray-700">Salary (LPA)</label>
// //                     <p className="mt-1 text-sm text-gray-900">{selectedEmployee.salary_lpa ? `₹${selectedEmployee.salary_lpa}` : 'Not specified'}</p>
// //                   </div>
// //                   <div>
// //                     <label className="block text-sm font-medium text-gray-700">Joining Date</label>
// //                     <p className="mt-1 text-sm text-gray-900">{selectedEmployee.joining_date ? new Date(selectedEmployee.joining_date).toLocaleDateString() : 'Not specified'}</p>
// //                   </div>
// //                 </div>
// //               </div>
// //               <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
// //                 <button
// //                   onClick={() => setShowDetailsModal(false)}
// //                   className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
// //                 >
// //                   Close
// //                 </button>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       {/* Edit Employee Modal */}
// //       {showEditModal && editingEmployee && (
// //         <div className="fixed inset-0 z-50 overflow-y-auto">
// //           <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
// //             <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowEditModal(false)}></div>
// //             <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
// //               <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
// //                 <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
// //                   Edit Employee - {editingEmployee.name}
// //                 </h3>
// //                 <div className="space-y-4">
// //                   <div>
// //                     <label className="block text-sm font-medium text-gray-700">Name</label>
// //                     <input
// //                       type="text"
// //                       value={editingEmployee.name}
// //                       onChange={(e) => setEditingEmployee({...editingEmployee, name: e.target.value})}
// //                       className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
// //                     />
// //                   </div>
// //                   <div>
// //                     <label className="block text-sm font-medium text-gray-700">Email</label>
// //                     <input
// //                       type="email"
// //                       value={editingEmployee.email}
// //                       onChange={(e) => setEditingEmployee({...editingEmployee, email: e.target.value})}
// //                       className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
// //                     />
// //                   </div>
// //                   <div>
// //                     <label className="block text-sm font-medium text-gray-700">Employee Type</label>
// //                     <select
// //                       value={editingEmployee.employee_type}
// //                       onChange={(e) => setEditingEmployee({...editingEmployee, employee_type: e.target.value})}
// //                       className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
// //                     >
// //                       <option value="intern">Intern</option>
// //                       <option value="employee">Employee</option>
// //                     </select>
// //                   </div>
// //                   <div>
// //                     <label className="block text-sm font-medium text-gray-700">Position</label>
// //                     <input
// //                       type="text"
// //                       value={editingEmployee.position || ''}
// //                       onChange={(e) => setEditingEmployee({...editingEmployee, position: e.target.value})}
// //                       className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
// //                     />
// //                   </div>
// //                   <div>
// //                     <label className="block text-sm font-medium text-gray-700">Salary (LPA)</label>
// //                     <input
// //                       type="number"
// //                       step="0.01"
// //                       value={editingEmployee.salary_lpa || ''}
// //                       onChange={(e) => setEditingEmployee({...editingEmployee, salary_lpa: e.target.value})}
// //                       className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
// //                     />
// //                   </div>
// //                   <div>
// //                     <label className="block text-sm font-medium text-gray-700">Joining Date</label>
// //                     <input
// //                       type="date"
// //                       value={editingEmployee.joining_date || ''}
// //                       onChange={(e) => setEditingEmployee({...editingEmployee, joining_date: e.target.value})}
// //                       className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
// //                     />
// //                   </div>
// //                 </div>
// //               </div>
// //               <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
// //                 <button
// //                   onClick={updateEmployee}
// //                   className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
// //                 >
// //                   Update Employee
// //                 </button>
// //                 <button
// //                   onClick={() => {
// //                     setShowEditModal(false);
// //                     setEditingEmployee(null);
// //                   }}
// //                   className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
// //                 >
// //                   Cancel
// //                 </button>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       {/* Delete Confirmation Modal */}
// //       {showDeleteConfirm && deletingEmployee && (
// //         <div className="fixed inset-0 z-50 overflow-y-auto">
// //           <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
// //             <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowDeleteConfirm(false)}></div>
// //             <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
// //               <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
// //                 <div className="sm:flex sm:items-start">
// //                   <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
// //                     <Trash2 className="h-6 w-6 text-red-600" />
// //                   </div>
// //                   <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
// //                     <h3 className="text-lg leading-6 font-medium text-gray-900">
// //                       Delete Employee
// //                     </h3>
// //                     <div className="mt-2">
// //                       <p className="text-sm text-gray-500">
// //                         Are you sure you want to delete <strong>{deletingEmployee.name}</strong>? This action cannot be undone and will also delete all associated documents.
// //                       </p>
// //                     </div>
// //                   </div>
// //                 </div>
// //               </div>
// //               <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
// //                 <button
// //                   onClick={deleteEmployee}
// //                   className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
// //                 >
// //                   Delete
// //                 </button>
// //                 <button
// //                   onClick={() => {
// //                     setShowDeleteConfirm(false);
// //                     setDeletingEmployee(null);
// //                   }}
// //                   className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
// //                 >
// //                   Cancel
// //                 </button>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       {/* Document Status Modal */}
// //       {showDocumentStatusModal && documentStatus && (
// //         <div className="fixed inset-0 z-50 overflow-y-auto">
// //           <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
// //             <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowDocumentStatusModal(false)}></div>
// //             <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
// //               <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
// //                 <div className="flex items-center justify-between mb-4">
// //                   <h3 className="text-lg leading-6 font-medium text-gray-900">
// //                     Document Status - {documentStatus.employee_name}
// //                   </h3>
// //                   <div className="flex items-center space-x-2">
// //                     <div className={`px-3 py-1 rounded-full text-sm font-medium ${
// //                       documentStatus.is_complete 
// //                         ? 'bg-green-100 text-green-800' 
// //                         : 'bg-red-100 text-red-800'
// //                     }`}>
// //                       {documentStatus.completion_percentage}% Complete
// //                     </div>
// //                   </div>
// //                 </div>

// //                 {/* Progress Bar */}
// //                 <div className="mb-6">
// //                   <div className="flex justify-between text-sm text-gray-600 mb-1">
// //                     <span>Progress</span>
// //                     <span>{documentStatus.total_uploaded} of {documentStatus.total_required} required documents</span>
// //                   </div>
// //                   <div className="w-full bg-gray-200 rounded-full h-2">
// //                     <div 
// //                       className={`h-2 rounded-full transition-all duration-300 ${
// //                         documentStatus.is_complete ? 'bg-green-500' : 'bg-blue-500'
// //                       }`}
// //                       style={{ width: `${documentStatus.completion_percentage}%` }}
// //                     ></div>
// //                   </div>
// //                 </div>

// //                 {/* Unified Document List */}
// //                 <div className="mb-6">
// //                   <h4 className="text-md font-medium text-gray-700 mb-3 flex items-center">
// //                     <FileText className="h-5 w-5 mr-2" />
// //                     Required Documents
// //                   </h4>
// //                   <div className="space-y-2">
// //                     {/* Create a unified list of all required documents */}
// //                     {(() => {
// //                       const allRequiredDocs = [
// //                         'Aadhar and PAN Card',
// //                         'Last 6 months payslips',
// //                         'Educational Certificates (Degree)',
// //                         'Previous Offer Letter',
// //                         'Relieving & Experience Letters',
// //                         'Appraisal/Hike Letters'
// //                       ];

// //                       return allRequiredDocs.map((docType, index) => {
// //                         const isUploaded = documentStatus.required_documents.uploaded.some(doc => doc.doc_type === docType);

// //                         return (
// //                           <div key={index} className={`flex items-center justify-between p-3 border rounded-md ${
// //                             isUploaded 
// //                               ? 'bg-green-50 border-green-200' 
// //                               : 'bg-red-50 border-red-200'
// //                           }`}>
// //                             <div className="flex items-center">
// //                               <div className={`w-2 h-2 rounded-full mr-3 ${
// //                                 isUploaded ? 'bg-green-500' : 'bg-red-500'
// //                               }`}></div>
// //                               <span className={`text-sm font-medium ${
// //                                 isUploaded ? 'text-green-800' : 'text-red-800'
// //                               }`}>
// //                                 {docType}
// //                               </span>
// //                             </div>

// //                             <div className="flex items-center space-x-2">
// //                               {isUploaded ? (
// //                                 <>
// //                                   <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
// //                                     ✓ Uploaded
// //                                   </span>
// //                                   <button
// //                                     onClick={() => viewDocument(documentStatus.employee_id, docType)}
// //                                     className="inline-flex items-center px-2 py-1 border border-green-300 rounded text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100"
// //                                     title="View Document"
// //                                   >
// //                                     <Eye className="h-3 w-3 mr-1" />
// //                                     View
// //                                   </button>
// //                                   <button
// //                                     onClick={() => downloadDocument(documentStatus.employee_id, docType, `${docType}.pdf`)}
// //                                     className="inline-flex items-center px-2 py-1 border border-blue-300 rounded text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100"
// //                                     title="Download Document"
// //                                   >
// //                                     <FileText className="h-3 w-3 mr-1" />
// //                                     Download
// //                                   </button>
// //                                 </>
// //                               ) : (
// //                                 <>
// //                                   <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
// //                                     Required
// //                                   </span>
// //                                   <button
// //                                     onClick={() => {
// //                                       setShowDocumentStatusModal(false);
// //                                       setUploadingEmployee({ 
// //                                         id: documentStatus.employee_id, 
// //                                         name: documentStatus.employee_name 
// //                                       });
// //                                       setFileInputs([{ id: 1, docType: docType, file: null }]);
// //                                       setShowUploadModal(true);
// //                                     }}
// //                                     className="inline-flex items-center px-2 py-1 border border-transparent rounded text-xs font-medium text-white bg-blue-600 hover:bg-blue-700"
// //                                     title="Upload Document"
// //                                   >
// //                                     <Plus className="h-3 w-3 mr-1" />
// //                                     Upload
// //                                   </button>
// //                                 </>
// //                               )}
// //                             </div>
// //                           </div>
// //                         );
// //                       });
// //                     })()}
// //                   </div>
// //                 </div>

// //                 {/* Optional Documents (if any exist) */}
// //                 {documentStatus.optional_documents.length > 0 && (
// //                   <div className="mb-4">
// //                     <h4 className="text-md font-medium text-blue-700 mb-3 flex items-center">
// //                       <FileText className="h-5 w-5 mr-2" />
// //                       Optional Documents ({documentStatus.optional_documents.length})
// //                     </h4>
// //                     <div className="space-y-2">
// //                       {documentStatus.optional_documents.map((doc, index) => (
// //                         <div key={index} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md">
// //                           <div className="flex items-center">
// //                             <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
// //                             <span className="text-sm font-medium text-blue-800">{doc.label}</span>
// //                           </div>
// //                           <div className="flex items-center space-x-2">
// //                             <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">✓ Uploaded</span>
// //                             <button
// //                               onClick={() => viewDocument(documentStatus.employee_id, doc.doc_type)}
// //                               className="inline-flex items-center px-2 py-1 border border-blue-300 rounded text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100"
// //                             >
// //                               <Eye className="h-3 w-3 mr-1" />
// //                               View
// //                             </button>
// //                           </div>
// //                         </div>
// //                       ))}
// //                     </div>
// //                   </div>
// //                 )}

// //                 {/* Completion Message */}
// //                 {documentStatus.is_complete && (
// //                   <div className="bg-green-50 border border-green-200 rounded-md p-4">
// //                     <div className="flex">
// //                       <div className="flex-shrink-0">
// //                         <CheckCircle className="h-5 w-5 text-green-400" />
// //                       </div>
// //                       <div className="ml-3">
// //                         <h3 className="text-sm font-medium text-green-800">
// //                           All Required Documents Uploaded!
// //                         </h3>
// //                         <div className="mt-2 text-sm text-green-700">
// //                           <p>This employee has uploaded all required documents for onboarding and is ready for approval.</p>
// //                         </div>
// //                       </div>
// //                     </div>
// //                   </div>
// //                 )}
// //               </div>
// //               <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
// //                 <button
// //                   onClick={() => setShowDocumentStatusModal(false)}
// //                   className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
// //                 >
// //                   Close
// //                 </button>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       {/* Documents List Modal */}
// //       {showDocumentListModal && documentsList && (
// //         <div className="fixed inset-0 z-50 overflow-y-auto">
// //           <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
// //             <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowDocumentListModal(false)}></div>
// //             <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
// //               <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
// //                 <div className="flex items-center justify-between mb-4">
// //                   <h3 className="text-lg leading-6 font-medium text-gray-900">
// //                     Documents for {documentsList.employee_name}
// //                   </h3>
// //                   <span className="text-sm text-gray-500">
// //                     {documentsList.total_documents} documents
// //                   </span>
// //                 </div>

// //                 {documentsList.documents && documentsList.documents.length > 0 ? (
// //                   <div className="space-y-3">
// //                     {documentsList.documents.map((doc, index) => (
// //                       <div key={index} className="border border-gray-200 rounded-lg p-4">
// //                         <div className="flex items-center justify-between">
// //                           <div className="flex-1">
// //                             <h4 className="text-md font-medium text-gray-900">
// //                               {doc.doc_type_display}
// //                             </h4>
// //                             <div className="mt-1 text-sm text-gray-500 space-y-1">
// //                               <p><strong>File:</strong> {doc.file_name || 'No filename'}</p>
// //                               <p><strong>Size:</strong> {doc.file_size_display}</p>
// //                               <p><strong>Uploaded:</strong> {new Date(doc.uploaded_at).toLocaleString()}</p>
// //                             </div>
// //                           </div>

// //                           <div className="flex items-center space-x-2 ml-4">
// //                             {doc.has_file_data ? (
// //                               <>
// //                                 <button
// //                                   onClick={() => viewDocument(documentsList.employee_id, doc.doc_type)}
// //                                   className="inline-flex items-center px-3 py-1 border border-blue-300 rounded-md text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100"
// //                                   title="View Document"
// //                                 >
// //                                   <Eye className="h-4 w-4 mr-1" />
// //                                   View
// //                                 </button>
// //                                 <button
// //                                   onClick={() => downloadDocument(documentsList.employee_id, doc.doc_type, doc.file_name)}
// //                                   className="inline-flex items-center px-3 py-1 border border-green-300 rounded-md text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100"
// //                                   title="Download Document"
// //                                 >
// //                                   <FileText className="h-4 w-4 mr-1" />
// //                                   Download
// //                                 </button>
// //                               </>
// //                             ) : (
// //                               <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-red-100 text-red-800">
// //                                 No file data
// //                               </span>
// //                             )}
// //                           </div>
// //                         </div>
// //                       </div>
// //                     ))}
// //                   </div>
// //                 ) : (
// //                   <div className="text-center py-8">
// //                     <FileText className="mx-auto h-12 w-12 text-gray-400" />
// //                     <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
// //                     <p className="mt-1 text-sm text-gray-500">
// //                       This employee hasn't uploaded any documents yet.
// //                     </p>
// //                   </div>
// //                 )}
// //               </div>
// //               <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
// //                 <button
// //                   onClick={() => setShowDocumentListModal(false)}
// //                   className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
// //                 >
// //                   Close
// //                 </button>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       {/* Upload Documents Modal */}
// //       {showUploadModal && uploadingEmployee && (
// //         <div className="fixed inset-0 z-50 overflow-y-auto">
// //           <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
// //             <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowUploadModal(false)}></div>
// //             <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
// //               <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
// //                 <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
// //                   Upload Documents - {uploadingEmployee.name}
// //                 </h3>

// //                 <div className="mb-4 p-3 bg-blue-50 rounded-md">
// //                   <div className="flex items-center">
// //                     <div className="flex-shrink-0">
// //                       <FileText className="h-5 w-5 text-blue-400" />
// //                     </div>
// //                     <div className="ml-3">
// //                       <p className="text-sm text-blue-800">
// //                         Upload required documents for {uploadingEmployee.name}'s onboarding process.
// //                       </p>
// //                     </div>
// //                   </div>
// //                 </div>

// //                 <div className="space-y-4">
// //                   <div className="flex items-center justify-between mb-3">
// //                     <label className="block text-sm font-medium text-gray-700">Documents to Upload</label>
// //                     <button
// //                       type="button"
// //                       onClick={addFileInput}
// //                       className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
// //                     >
// //                       <Plus className="h-4 w-4 mr-1" />
// //                       Add Document
// //                     </button>
// //                   </div>

// //                   {fileInputs.map((fileInput, index) => (
// //                     <div key={fileInput.id} className="flex items-center space-x-3 mb-3 p-3 bg-gray-50 rounded-lg border">
// //                       <div className="flex-1">
// //                         <label className="block text-xs font-medium text-gray-600 mb-1">Document Type</label>
// //                         <select
// //                           value={fileInput.docType}
// //                           onChange={(e) => handleDocTypeChange(fileInput.id, e.target.value)}
// //                           className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
// //                         >
// //                           {documentTypes.map(type => (
// //                             <option key={type.value} value={type.value}>
// //                               {type.label}
// //                             </option>
// //                           ))}
// //                         </select>
// //                       </div>
// //                       <div className="flex-1">
// //                         <label className="block text-xs font-medium text-gray-600 mb-1">Select File</label>
// //                         <input
// //                           type="file"
// //                           onChange={(e) => handleFileChange(fileInput.id, e.target.files[0])}
// //                           className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
// //                           accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
// //                         />
// //                         {fileInput.file && (
// //                           <p className="text-xs text-green-600 mt-1">
// //                             ✓ {fileInput.file.name}
// //                           </p>
// //                         )}
// //                       </div>
// //                       {fileInputs.length > 1 && (
// //                         <button
// //                           type="button"
// //                           onClick={() => removeFileInput(fileInput.id)}
// //                           className="flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-800 transition-colors duration-200 mt-6"
// //                           title="Remove this document"
// //                         >
// //                           <XCircle className="h-4 w-4" />
// //                         </button>
// //                       )}
// //                     </div>
// //                   ))}

// //                   <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
// //                     <div className="flex">
// //                       <div className="flex-shrink-0">
// //                         <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
// //                           <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
// //                         </svg>
// //                       </div>
// //                       <div className="ml-3">
// //                         <p className="text-xs text-yellow-800">
// //                           <strong>Accepted formats:</strong> PDF, DOC, DOCX, JPG, JPEG, PNG<br/>
// //                           <strong>Maximum file size:</strong> 10MB per file
// //                         </p>
// //                       </div>
// //                     </div>
// //                   </div>
// //                 </div>
// //               </div>
// //               <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
// //                 <button
// //                   onClick={uploadDocuments}
// //                   className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
// //                 >
// //                   Upload Documents
// //                 </button>
// //                 <button
// //                   onClick={() => {
// //                     setShowUploadModal(false);
// //                     setUploadingEmployee(null);
// //                     setFileInputs([{ id: 1, docType: 'Aadhar and PAN Card', file: null }]);
// //                   }}
// //                   className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
// //                 >
// //                   Cancel
// //                 </button>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// // // Component to handle pending employee actions with document verification
// // const PendingEmployeeActions = ({ employee, onStatusUpdate, checkDocumentStatus }) => {
// //   const [documentsComplete, setDocumentsComplete] = useState(null);
// //   const [checking, setChecking] = useState(true);

// //   useEffect(() => {
// //     const checkDocuments = async () => {
// //       try {
// //         setChecking(true);
// //         const isComplete = await checkDocumentStatus(employee.id);
// //         setDocumentsComplete(isComplete);
// //       } catch (error) {
// //         console.error('Error checking document status:', error);
// //         setDocumentsComplete(false);
// //       } finally {
// //         setChecking(false);
// //       }
// //     };

// //     checkDocuments();
// //   }, [employee.id, checkDocumentStatus]);

// //   if (checking) {
// //     return (
// //       <div className="inline-flex items-center px-3 py-1 text-sm text-gray-500">
// //         <Clock className="h-4 w-4 mr-1 animate-spin" />
// //         Checking...
// //       </div>
// //     );
// //   }

// //   if (!documentsComplete) {
// //     return (
// //       <div className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 rounded-md text-sm font-medium">
// //         <Clock className="h-4 w-4 mr-1" />
// //         Pending Documents
// //       </div>
// //     );
// //   }

// //   return (
// //     <>
// //       <button
// //         onClick={() => onStatusUpdate(employee.id, 'accepted')}
// //         className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700"
// //         title="Accept Employee"
// //       >
// //         <CheckCircle className="h-4 w-4 mr-1" />
// //         Accept
// //       </button>
// //       <button
// //         onClick={() => onStatusUpdate(employee.id, 'rejected')}
// //         className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
// //         title="Reject Employee"
// //       >
// //         <XCircle className="h-4 w-4 mr-1" />
// //         Reject
// //       </button>
// //     </>
// //   );
// // };

// // export default OnboardingManagement;



// import React, { useState, useEffect } from 'react';
// import { 
//   Plus,
//   UserPlus,
//   FileText,
//   CheckCircle,
//   XCircle,
//   Clock,
//   Eye,
//   Edit,
//   Trash2,
//   Download,
//   Upload,
//   Star,
//   TrendingUp
// } from 'lucide-react';

// const OnboardingManagement = () => {
//   const [employees, setEmployees] = useState([]);
//   const [departments, setDepartments] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [filter, setFilter] = useState('all');
//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [showDetailsModal, setShowDetailsModal] = useState(false);
//   const [showDocumentListModal, setShowDocumentListModal] = useState(false);
//   const [documentsList, setDocumentsList] = useState([]);
//   const [selectedEmployee, setSelectedEmployee] = useState(null);
//   const [newEmployee, setNewEmployee] = useState({
//     name: '',
//     email: '',
//     employee_type: 'employee',
//     position: '',
//     salary_lpa: '',
//     joining_date: ''
//   });
//   const [showUploadModal, setShowUploadModal] = useState(false);
//   const [showDocumentStatusModal, setShowDocumentStatusModal] = useState(false);
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
//   const [uploadingEmployee, setUploadingEmployee] = useState(null);
//   const [editingEmployee, setEditingEmployee] = useState(null);
//   const [deletingEmployee, setDeletingEmployee] = useState(null);
//   const [documentStatus, setDocumentStatus] = useState(null);
//   const [fileInputs, setFileInputs] = useState([{ id: 1, docType: 'Aadhar and PAN Card', file: null }]);

//   // Mock toast function since we don't have react-toastify in this environment
//   const toast = {
//     success: (message) => alert(`Success: ${message}`),
//     error: (message) => alert(`Error: ${message}`)
//   };

//   useEffect(() => {
//     fetchEmployees();
//   }, [filter]);

//   const fetchEmployees = async () => {
//     try {
//       setLoading(true);
//       const queryParams = filter !== 'all' ? `?status=${filter}` : '';
//       const response = await fetch(`http://127.0.0.1:8000/api/onboarding/employees/${queryParams}`, {
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
//           'Content-Type': 'application/json',
//         },
//       });

//       if (response.ok) {
//         const data = await response.json();
//         setEmployees(data.results || data);
//       } else {
//         toast.error('Failed to fetch employees');
//       }
//     } catch (error) {
//       console.error('Error:', error);
//       toast.error('Failed to fetch employees');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const documentTypes = [
//     { value: 'Aadhar and PAN Card', label: 'Aadhar and PAN Card' },
//     { value: 'Last 6 months payslips', label: 'Last 6 months payslips' },
//     { value: 'Educational Certificates (Degree)', label: 'Educational Certificates (Degree)' },
//     { value: 'Previous Offer Letter', label: 'Previous Offer Letter' },
//     { value: 'Relieving & Experience Letters', label: 'Relieving & Experience Letters' },
//     { value: 'Appraisal/Hike Letters', label: 'Appraisal/Hike Letters' },
//   ];

//   const addFileInput = () => {
//     const newId = Math.max(...fileInputs.map(f => f.id)) + 1;
//     setFileInputs([...fileInputs, { id: newId, docType: 'Aadhar and PAN Card', file: null }]);
//   };

//   const removeFileInput = (id) => {
//     if (fileInputs.length > 1) {
//       setFileInputs(fileInputs.filter(f => f.id !== id));
//     }
//   };

//   const handleFileChange = (id, file) => {
//     setFileInputs(fileInputs.map(f => 
//       f.id === id ? { ...f, file } : f
//     ));
//   };

//   const handleDocTypeChange = (id, docType) => {
//     setFileInputs(fileInputs.map(f => 
//       f.id === id ? { ...f, docType } : f
//     ));
//   };

//   const createEmployee = async () => {
//     try {
//       const response = await fetch('http://127.0.0.1:8000/api/onboarding/employees/', {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(newEmployee),
//       });

//       if (response.ok) {
//         const result = await response.json();
//         toast.success('Employee created successfully!');
//         setShowCreateModal(false);
//         setNewEmployee({
//           name: '',
//           email: '',
//           employee_type: 'employee',
//           position: '',
//           salary_lpa: '',
//           joining_date: ''
//         });
//         setFileInputs([{ id: 1, docType: 'Aadhar and PAN Card', file: null }]);
//         fetchEmployees();
//       } else {
//         const error = await response.json();
//         toast.error(error.detail || 'Failed to create employee');
//       }
//     } catch (error) {
//       console.error('Error:', error);
//       toast.error('Failed to create employee');
//     }
//   };

//   const uploadDocuments = async () => {
//     if (!uploadingEmployee) return;

//     try {
//       const formData = new FormData();

//       fileInputs.forEach(fileInput => {
//         if (fileInput.file) {
//           formData.append(`document_${fileInput.docType}`, fileInput.file);
//         }
//       });

//       const response = await fetch(`http://127.0.0.1:8000/api/onboarding/employees/${uploadingEmployee.id}/upload_documents/`, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
//         },
//         body: formData,
//       });

//       if (response.ok) {
//         const result = await response.json();
//         toast.success(`Documents uploaded successfully! ${result.files_uploaded?.length || 0} files processed.`);

//         setShowUploadModal(false);
//         setUploadingEmployee(null);
//         setFileInputs([{ id: 1, docType: 'Aadhar and PAN Card', file: null }]);

//         fetchEmployees();

//         setTimeout(() => {
//           fetchDocumentStatus(uploadingEmployee.id);
//         }, 500);

//       } else {
//         const error = await response.json();
//         toast.error(error.message || 'Failed to upload documents');
//       }
//     } catch (error) {
//       console.error('Error:', error);
//       toast.error('Failed to upload documents');
//     }
//   };

//   const fetchDocumentStatus = async (employeeId) => {
//     try {
//       const response = await fetch(`http://127.0.0.1:8000/api/onboarding/employees/${employeeId}/documents_status/`, {
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
//           'Content-Type': 'application/json',
//         },
//       });

//       if (response.ok) {
//         const data = await response.json();
//         setDocumentStatus(data);
//         setShowDocumentStatusModal(true);
//       } else {
//         toast.error('Failed to fetch document status');
//       }
//     } catch (error) {
//       console.error('Error:', error);
//       toast.error('Failed to fetch document status');
//     }
//   };

//   const updateEmployee = async () => {
//     if (!editingEmployee) return;

//     try {
//       const response = await fetch(`http://127.0.0.1:8000/api/onboarding/employees/${editingEmployee.id}/`, {
//         method: 'PUT',
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(editingEmployee),
//       });

//       if (response.ok) {
//         toast.success('Employee updated successfully!');
//         setShowEditModal(false);
//         setEditingEmployee(null);
//         fetchEmployees();
//       } else {
//         const error = await response.json();
//         toast.error(error.detail || 'Failed to update employee');
//       }
//     } catch (error) {
//       console.error('Error:', error);
//       toast.error('Failed to update employee');
//     }
//   };

//   const deleteEmployee = async () => {
//     if (!deletingEmployee) return;

//     try {
//       const response = await fetch(`http://127.0.0.1:8000/api/onboarding/employees/${deletingEmployee.id}/`, {
//         method: 'DELETE',
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
//         },
//       });

//       if (response.ok) {
//         toast.success('Employee deleted successfully!');
//         setShowDeleteConfirm(false);
//         setDeletingEmployee(null);
//         fetchEmployees();
//       } else {
//         toast.error('Failed to delete employee');
//       }
//     } catch (error) {
//       console.error('Error:', error);
//       toast.error('Failed to delete employee');
//     }
//   };

//   const updateEmployeeStatus = async (employeeId, status) => {
//     try {
//       const response = await fetch(`http://127.0.0.1:8000/api/onboarding/employees/${employeeId}/update_status/`, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ status }),
//       });

//       if (response.ok) {
//         toast.success(`Status updated to ${status}`);
//         fetchEmployees();
//       } else {
//         toast.error('Failed to update status');
//       }
//     } catch (error) {
//       console.error('Error:', error);
//       toast.error('Failed to update status');
//     }
//   };

//   const checkDocumentCompletionStatus = async (employeeId) => {
//     try {
//       const response = await fetch(`http://127.0.0.1:8000/api/onboarding/employees/${employeeId}/documents_status/`, {
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
//           'Content-Type': 'application/json',
//         },
//       });

//       if (response.ok) {
//         const data = await response.json();
//         return data.is_complete;
//       }
//       return false;
//     } catch (error) {
//       console.error('Error:', error);
//       return false;
//     }
//   };

//   const getStatusColor = (status) => {
//     switch (status) {
//       case 'pending':
//         return 'bg-amber-100 text-amber-800 border-amber-200';
//       case 'accepted':
//         return 'bg-emerald-100 text-emerald-800 border-emerald-200';
//       case 'rejected':
//         return 'bg-rose-100 text-rose-800 border-rose-200';
//       default:
//         return 'bg-gray-100 text-gray-800 border-gray-200';
//     }
//   };

//   const getEmployeeTypeColor = (type) => {
//     switch (type) {
//       case 'intern':
//         return 'bg-blue-100 text-blue-800 border-blue-200';
//       case 'employee':
//         return 'bg-green-100 text-green-800 border-green-200';
//       default:
//         return 'bg-gray-100 text-gray-800 border-gray-200';
//     }
//   };

//   const getEmployeeInitials = (name) => {
//     return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
//   };

//   const getProfileGradient = (name) => {
//     const gradients = [
//       'from-violet-500 to-purple-600',
//       'from-blue-500 to-cyan-600', 
//       'from-emerald-500 to-teal-600',
//       'from-amber-500 to-orange-600',
//       'from-rose-500 to-pink-600',
//       'from-indigo-500 to-blue-600'
//     ];
//     const index = name.length % gradients.length;
//     return gradients[index];
//   };

//   const filteredEmployees = (employees || []).filter(emp => {
//     if (filter === 'all') return true;
//     return emp.status === filter;
//   });

//   const employeeCounts = {
//     all: (employees || []).length,
//     pending: (employees || []).filter(e => e.status === 'pending').length,
//     accepted: (employees || []).filter(e => e.status === 'accepted').length,
//     rejected: (employees || []).filter(e => e.status === 'rejected').length,
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex justify-center items-center">
//         <div className="text-center">
//           <div className="relative">
//             <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-spin">
//               <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
//             </div>
//           </div>
//           <p className="mt-4 text-lg font-medium text-gray-600">Loading onboarding data...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
//       {/* Enhanced Header Section */}
//       <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-700">
//         <div className="absolute inset-0 bg-black opacity-10"></div>

//         {/* Decorative elements */}
//         <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-32 -translate-y-32"></div>
//         <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-48 translate-y-48"></div>

//         <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
//           <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
//             <div className="flex-1">
//               <div className="flex items-center space-x-3 mb-4">
//                 <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
//                   <UserPlus className="h-8 w-8 text-white" />
//                 </div>
//                 <Star className="h-6 w-6 text-yellow-300 animate-pulse" />
//               </div>

//               <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3">
//                 Onboarding Management
//               </h1>
//               <p className="text-xl text-blue-100 mb-6">
//                 Streamline your employee onboarding process with document verification and status tracking
//               </p>

//               <div className="flex items-center space-x-6 text-blue-100">
//                 <div className="flex items-center space-x-2">
//                   <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
//                   <span className="text-sm font-medium">{employeeCounts.all} Total Candidates</span>
//                 </div>
//                 <div className="flex items-center space-x-2">
//                   <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
//                   <span className="text-sm font-medium">{employeeCounts.pending} Pending Review</span>
//                 </div>
//               </div>
//             </div>

//             <div className="mt-8 lg:mt-0">
//               <button
//                 onClick={() => setShowCreateModal(true)}
//                 className="group relative inline-flex items-center px-8 py-4 bg-white text-indigo-600 rounded-xl font-semibold shadow-2xl hover:shadow-white/25 transform hover:scale-105 transition-all duration-300"
//               >
//                 <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
//                 Add Employee
//                 <div className="absolute inset-0 bg-gradient-to-r from-white to-blue-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
//         {/* Enhanced Stats Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
//           {[
//             { key: 'all', label: 'Total Candidates', count: employeeCounts.all, color: 'from-blue-500 to-blue-600', icon: UserPlus },
//             { key: 'pending', label: 'Pending Review', count: employeeCounts.pending, color: 'from-amber-500 to-amber-600', icon: Clock },
//             { key: 'accepted', label: 'Accepted', count: employeeCounts.accepted, color: 'from-emerald-500 to-emerald-600', icon: CheckCircle },
//             { key: 'rejected', label: 'Rejected', count: employeeCounts.rejected, color: 'from-rose-500 to-rose-600', icon: XCircle },
//           ].map((stat) => {
//             const Icon = stat.icon;
//             return (
//               <div key={stat.key} className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50 overflow-hidden">
//                 <div className="p-6">
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center space-x-4">
//                       <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
//                         <Icon className="h-6 w-6 text-white" />
//                       </div>
//                       <div>
//                         <p className="text-3xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">
//                           {stat.count}
//                         </p>
//                         <p className="text-sm font-medium text-gray-600">
//                           {stat.label}
//                         </p>
//                       </div>
//                     </div>
//                     <TrendingUp className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors duration-300" />
//                   </div>
//                 </div>
//               </div>
//             );
//           })}
//         </div>

//         {/* Enhanced Filter Tabs */}
//         <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-white/50 p-6">
//           <div className="border-b border-gray-200">
//             <nav className="-mb-px flex space-x-8">
//               {[
//                 { key: 'all', label: 'All Candidates' },
//                 { key: 'pending', label: 'Pending Review' },
//                 { key: 'accepted', label: 'Accepted' },
//                 { key: 'rejected', label: 'Rejected' },
//               ].map((tab) => (
//                 <button
//                   key={tab.key}
//                   onClick={() => setFilter(tab.key)}
//                   className={`py-3 px-1 border-b-2 font-semibold text-sm transition-all duration-200 ${
//                     filter === tab.key
//                       ? 'border-indigo-500 text-indigo-600'
//                       : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//                   }`}
//                 >
//                   {tab.label} ({employeeCounts[tab.key]})
//                 </button>
//               ))}
//             </nav>
//           </div>
//         </div>

//         {/* Enhanced Employee Cards */}
//         <div className="grid grid-cols-1 gap-6">
//           {filteredEmployees.length === 0 ? (
//             <div className="text-center py-20">
//               <div className="relative mx-auto w-32 h-32 mb-8">
//                 <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full animate-pulse"></div>
//                 <UserPlus className="absolute inset-4 text-indigo-300" />
//               </div>
//               <h3 className="text-2xl font-bold text-gray-900 mb-2">No candidates found</h3>
//               <p className="text-gray-500 mb-6 max-w-md mx-auto">
//                 {employees.length === 0 
//                   ? "Get started by adding your first candidate to the onboarding process."
//                   : "No candidates match your current filter."
//                 }
//               </p>
//               {employees.length === 0 && (
//                 <button
//                   onClick={() => setShowCreateModal(true)}
//                   className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors duration-200"
//                 >
//                   <Plus className="h-5 w-5 mr-2" />
//                   Add First Candidate
//                 </button>
//               )}
//             </div>
//           ) : (
//             filteredEmployees.map((employee, index) => {
//               const employeeInitials = getEmployeeInitials(employee.name);
//               const profileGradient = getProfileGradient(employee.name);

//               return (
//                 <div 
//                   key={employee.id} 
//                   className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/50 overflow-hidden transform hover:-translate-y-1"
//                   style={{ animationDelay: `${index * 100}ms` }}
//                 >
//                   <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-indigo-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

//                   <div className="relative p-6">
//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center space-x-4">
//                         <div className="relative">
//                           <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${profileGradient} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
//                             <span className="text-white font-bold text-lg">
//                               {employeeInitials}
//                             </span>
//                           </div>
//                           <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-400 rounded-full border-2 border-white flex items-center justify-center">
//                             <div className="w-2 h-2 bg-white rounded-full"></div>
//                           </div>
//                         </div>

//                         <div className="flex-1">
//                           <div className="flex items-center space-x-3 mb-2">
//                             <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">
//                               {employee.name}
//                             </h3>
//                             <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(employee.status)}`}>
//                               {employee.status}
//                             </span>
//                             <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getEmployeeTypeColor(employee.employee_type)}`}>
//                               {employee.employee_type}
//                             </span>
//                           </div>
//                           <div className="flex items-center space-x-4 text-sm text-gray-600">
//                             <span className="font-medium">{employee.email}</span>
//                             {employee.position && <span>• {employee.position}</span>}
//                             {employee.salary_lpa && <span>• ₹{employee.salary_lpa} LPA</span>}
//                             {employee.joining_date && <span>• Joining: {new Date(employee.joining_date).toLocaleDateString()}</span>}
//                           </div>
//                         </div>
//                       </div>

//                       <div className="flex items-center space-x-2">
//                         <button
//                           onClick={() => {
//                             setSelectedEmployee(employee);
//                             setShowDetailsModal(true);
//                           }}
//                           className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100"
//                           title="View Details"
//                         >
//                           <Eye className="h-5 w-5" />
//                         </button>

//                         <button
//                           onClick={() => {
//                             setEditingEmployee({...employee});
//                             setShowEditModal(true);
//                           }}
//                           className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100"
//                           title="Edit Employee"
//                         >
//                           <Edit className="h-5 w-5" />
//                         </button>

//                         <button
//                           onClick={() => {
//                             setDeletingEmployee(employee);
//                             setShowDeleteConfirm(true);
//                           }}
//                           className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100"
//                           title="Delete Employee"
//                         >
//                           <Trash2 className="h-5 w-5" />
//                         </button>

//                         <button
//                           onClick={() => fetchDocumentStatus(employee.id)}
//                           className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105"
//                           title="Check Document Status"
//                         >
//                           <FileText className="h-4 w-4 mr-2" />
//                           Documents
//                         </button>

//                         {employee.status === 'pending' && (
//                           <PendingEmployeeActions 
//                             employee={employee} 
//                             onStatusUpdate={updateEmployeeStatus}
//                             checkDocumentStatus={checkDocumentCompletionStatus}
//                           />
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               );
//             })
//           )}
//         </div>
//       </div>

//       {/* All the existing modals with enhanced styling would go here */}
//       {/* For brevity, I'm including just the create modal as an example */}

//       {/* Enhanced Create Employee Modal */}
//       {showCreateModal && (
//         <div className="fixed inset-0 z-50 overflow-y-auto">
//           <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
//             <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity duration-300" onClick={() => setShowCreateModal(false)}></div>

//             <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-gray-100">
//               {/* Header with gradient */}
//               <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-6">
//                 <div className="flex items-center">
//                   <div className="flex-shrink-0">
//                     <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
//                       <UserPlus className="h-6 w-6 text-white" />
//                     </div>
//                   </div>
//                   <div className="ml-4">
//                     <h3 className="text-2xl font-bold text-white">
//                       Add New Candidate
//                     </h3>
//                     <p className="text-blue-100 text-sm">
//                       Create a new candidate profile for onboarding process
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 px-6 py-8">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   <div className="md:col-span-2">
//                     <label className="block text-sm font-semibold text-gray-700 mb-2">
//                       Full Name <span className="text-red-500">*</span>
//                     </label>
//                     <input
//                       type="text"
//                       value={newEmployee.name}
//                       onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
//                       className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none"
//                       placeholder="Enter candidate's full name"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm font-semibold text-gray-700 mb-2">
//                       Email Address <span className="text-red-500">*</span>
//                     </label>
//                     <input
//                       type="email"
//                       value={newEmployee.email}
//                       onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
//                       className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none"
//                       placeholder="candidate@company.com"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm font-semibold text-gray-700 mb-2">
//                       Employee Type
//                     </label>
//                     <select
//                       value={newEmployee.employee_type}
//                       onChange={(e) => setNewEmployee({...newEmployee, employee_type: e.target.value})}
//                       className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none"
//                     >
//                       <option value="intern">🎓 Intern</option>
//                       <option value="employee">👔 Employee</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-sm font-semibold text-gray-700 mb-2">
//                       Position
//                     </label>
//                     <input
//                       type="text"
//                       value={newEmployee.position}
//                       onChange={(e) => setNewEmployee({...newEmployee, position: e.target.value})}
//                       className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none"
//                       placeholder="Job title"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm font-semibold text-gray-700 mb-2">
//                       Salary (LPA)
//                     </label>
//                     <div className="relative">
//                       <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
//                       <input
//                         type="number"
//                         step="0.01"
//                         value={newEmployee.salary_lpa}
//                         onChange={(e) => setNewEmployee({...newEmployee, salary_lpa: e.target.value})}
//                         className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none"
//                         placeholder="0.00"
//                       />
//                       <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">LPA</span>
//                     </div>
//                   </div>

//                   <div>
//                     <label className="block text-sm font-semibold text-gray-700 mb-2">
//                       Joining Date
//                     </label>
//                     <input
//                       type="date"
//                       value={newEmployee.joining_date}
//                       onChange={(e) => setNewEmployee({...newEmployee, joining_date: e.target.value})}
//                       className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none"
//                     />
//                   </div>
//                 </div>

//                 <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
//                   <div className="flex">
//                     <div className="flex-shrink-0">
//                       <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
//                         <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
//                       </svg>
//                     </div>
//                     <div className="ml-3">
//                       <h3 className="text-sm font-medium text-blue-800">
//                         Next Steps
//                       </h3>
//                       <div className="mt-2 text-sm text-blue-700">
//                         <p>After creating the candidate, you can upload their documents and manage their onboarding process.</p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse sm:space-x-reverse sm:space-x-3">
//                 <button
//                   onClick={createEmployee}
//                   className="w-full inline-flex justify-center items-center rounded-xl border border-transparent shadow-lg px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-base font-semibold text-white hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 transform hover:scale-105 transition-all duration-200 sm:ml-3 sm:w-auto sm:text-sm"
//                 >
//                   <UserPlus className="h-4 w-4 mr-2" />
//                   Create Candidate
//                 </button>
//                 <button
//                   onClick={() => setShowCreateModal(false)}
//                   className="mt-3 w-full inline-flex justify-center rounded-xl border-2 border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200 sm:mt-0 sm:w-auto sm:text-sm"
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Enhanced Document Status Modal */}
//       {showDocumentStatusModal && documentStatus && (
//         <div className="fixed inset-0 z-50 overflow-y-auto">
//           <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
//             <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity duration-300" onClick={() => setShowDocumentStatusModal(false)}></div>

//             <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full border border-gray-100">
//               {/* Header */}
//               <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-6">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center">
//                     <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
//                       <FileText className="h-6 w-6 text-white" />
//                     </div>
//                     <div className="ml-4">
//                       <h3 className="text-2xl font-bold text-white">
//                         Document Status
//                       </h3>
//                       <p className="text-blue-100">
//                         {documentStatus.employee_name}
//                       </p>
//                     </div>
//                   </div>
//                   <div className={`px-4 py-2 rounded-xl font-bold text-sm ${
//                     documentStatus.is_complete 
//                       ? 'bg-emerald-100 text-emerald-800' 
//                       : 'bg-rose-100 text-rose-800'
//                   }`}>
//                     {documentStatus.completion_percentage}% Complete
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 p-6">
//                 {/* Progress Bar */}
//                 <div className="mb-8">
//                   <div className="flex justify-between text-sm font-medium text-gray-600 mb-2">
//                     <span>Progress</span>
//                     <span>{documentStatus.total_uploaded} of {documentStatus.total_required} required documents</span>
//                   </div>
//                   <div className="w-full bg-gray-200 rounded-full h-3">
//                     <div 
//                       className={`h-3 rounded-full transition-all duration-500 ${
//                         documentStatus.is_complete ? 'bg-emerald-500' : 'bg-indigo-500'
//                       }`}
//                       style={{ width: `${documentStatus.completion_percentage}%` }}
//                     ></div>
//                   </div>
//                 </div>

//                 {/* Required Documents */}
//                 <div className="mb-6">
//                   <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
//                     <FileText className="h-5 w-5 mr-2 text-indigo-500" />
//                     Required Documents
//                   </h4>
//                   <div className="grid gap-3">
//                     {(() => {
//                       const allRequiredDocs = [
//                         'Aadhar and PAN Card',
//                         'Last 6 months payslips',
//                         'Educational Certificates (Degree)',
//                         'Previous Offer Letter',
//                         'Relieving & Experience Letters',
//                         'Appraisal/Hike Letters'
//                       ];

//                       return allRequiredDocs.map((docType, index) => {
//                         const isUploaded = documentStatus.required_documents.uploaded.some(doc => doc.doc_type === docType);

//                         return (
//                           <div key={index} className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
//                             isUploaded 
//                               ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100' 
//                               : 'bg-rose-50 border-rose-200 hover:bg-rose-100'
//                           }`}>
//                             <div className="flex items-center">
//                               <div className={`w-3 h-3 rounded-full mr-3 ${
//                                 isUploaded ? 'bg-emerald-500' : 'bg-rose-500'
//                               }`}></div>
//                               <span className={`font-medium ${
//                                 isUploaded ? 'text-emerald-800' : 'text-rose-800'
//                               }`}>
//                                 {docType}
//                               </span>
//                             </div>

//                             <div className="flex items-center space-x-2">
//                               {isUploaded ? (
//                                 <>
//                                   <span className="text-xs text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200 font-medium">
//                                     ✓ Uploaded
//                                   </span>
//                                   <button className="inline-flex items-center px-3 py-1 border border-emerald-300 rounded-lg text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors duration-200">
//                                     <Eye className="h-3 w-3 mr-1" />
//                                     View
//                                   </button>
//                                   <button className="inline-flex items-center px-3 py-1 border border-blue-300 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors duration-200">
//                                     <Download className="h-3 w-3 mr-1" />
//                                     Download
//                                   </button>
//                                 </>
//                               ) : (
//                                 <>
//                                   <span className="text-xs text-rose-600 bg-rose-100 px-3 py-1 rounded-full border border-rose-200 font-medium">
//                                     Required
//                                   </span>
//                                   <button
//                                     onClick={() => {
//                                       setShowDocumentStatusModal(false);
//                                       setUploadingEmployee({ 
//                                         id: documentStatus.employee_id, 
//                                         name: documentStatus.employee_name 
//                                       });
//                                       setFileInputs([{ id: 1, docType: docType, file: null }]);
//                                       setShowUploadModal(true);
//                                     }}
//                                     className="inline-flex items-center px-3 py-1 border border-transparent rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
//                                   >
//                                     <Upload className="h-3 w-3 mr-1" />
//                                     Upload
//                                   </button>
//                                 </>
//                               )}
//                             </div>
//                           </div>
//                         );
//                       });
//                     })()}
//                   </div>
//                 </div>

//                 {/* Completion Message */}
//                 {documentStatus.is_complete && (
//                   <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
//                     <div className="flex">
//                       <div className="flex-shrink-0">
//                         <CheckCircle className="h-6 w-6 text-emerald-400" />
//                       </div>
//                       <div className="ml-3">
//                         <h3 className="text-lg font-bold text-emerald-800">
//                           All Required Documents Uploaded!
//                         </h3>
//                         <div className="mt-2 text-emerald-700">
//                           <p>This candidate has uploaded all required documents for onboarding and is ready for approval.</p>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 )}
//               </div>

//               <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
//                 <button
//                   onClick={() => setShowDocumentStatusModal(false)}
//                   className="w-full inline-flex justify-center rounded-xl border-2 border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200 sm:ml-3 sm:w-auto sm:text-sm"
//                 >
//                   Close
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Enhanced Employee Details Modal */}
//       {showDetailsModal && selectedEmployee && (
//         <div className="fixed inset-0 z-50 overflow-y-auto">
//           <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
//             <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity duration-300" onClick={() => setShowDetailsModal(false)}></div>

//             <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-100">
//               {/* Header */}
//               <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-6">
//                 <div className="flex items-center">
//                   <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
//                     <Eye className="h-6 w-6 text-white" />
//                   </div>
//                   <div className="ml-4">
//                     <h3 className="text-2xl font-bold text-white">
//                       Employee Details
//                     </h3>
//                     <p className="text-blue-100">
//                       {selectedEmployee.name}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 p-6">
//                 <div className="space-y-6">
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
//                       <p className="text-sm text-gray-900 bg-white/70 rounded-lg px-3 py-2">{selectedEmployee.email}</p>
//                     </div>
//                     <div>
//                       <label className="block text-sm font-semibold text-gray-700 mb-1">Employee Type</label>
//                       <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getEmployeeTypeColor(selectedEmployee.employee_type)}`}>
//                         {selectedEmployee.employee_type}
//                       </span>
//                     </div>
//                   </div>

//                   <div>
//                     <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
//                     <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(selectedEmployee.status)}`}>
//                       {selectedEmployee.status}
//                     </span>
//                   </div>

//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-sm font-semibold text-gray-700 mb-1">Position</label>
//                       <p className="text-sm text-gray-900 bg-white/70 rounded-lg px-3 py-2">{selectedEmployee.position || 'Not specified'}</p>
//                     </div>
//                     <div>
//                       <label className="block text-sm font-semibold text-gray-700 mb-1">Salary (LPA)</label>
//                       <p className="text-sm text-gray-900 bg-white/70 rounded-lg px-3 py-2">{selectedEmployee.salary_lpa ? `₹${selectedEmployee.salary_lpa}` : 'Not specified'}</p>
//                     </div>
//                   </div>

//                   <div>
//                     <label className="block text-sm font-semibold text-gray-700 mb-1">Joining Date</label>
//                     <p className="text-sm text-gray-900 bg-white/70 rounded-lg px-3 py-2">{selectedEmployee.joining_date ? new Date(selectedEmployee.joining_date).toLocaleDateString() : 'Not specified'}</p>
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
//                 <button
//                   onClick={() => setShowDetailsModal(false)}
//                   className="w-full inline-flex justify-center rounded-xl border-2 border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200 sm:ml-3 sm:w-auto sm:text-sm"
//                 >
//                   Close
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Enhanced Edit Modal */}
//       {showEditModal && editingEmployee && (
//         <div className="fixed inset-0 z-50 overflow-y-auto">
//           <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
//             <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity duration-300" onClick={() => setShowEditModal(false)}></div>

//             <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-gray-100">
//               {/* Header */}
//               <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-6">
//                 <div className="flex items-center">
//                   <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
//                     <Edit className="h-6 w-6 text-white" />
//                   </div>
//                   <div className="ml-4">
//                     <h3 className="text-2xl font-bold text-white">
//                       Edit Candidate
//                     </h3>
//                     <p className="text-blue-100">
//                       {editingEmployee.name}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 px-6 py-8">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   <div className="md:col-span-2">
//                     <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
//                     <input
//                       type="text"
//                       value={editingEmployee.name}
//                       onChange={(e) => setEditingEmployee({...editingEmployee, name: e.target.value})}
//                       className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
//                     <input
//                       type="email"
//                       value={editingEmployee.email}
//                       onChange={(e) => setEditingEmployee({...editingEmployee, email: e.target.value})}
//                       className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-semibold text-gray-700 mb-2">Employee Type</label>
//                     <select
//                       value={editingEmployee.employee_type}
//                       onChange={(e) => setEditingEmployee({...editingEmployee, employee_type: e.target.value})}
//                       className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none"
//                     >
//                       <option value="intern">Intern</option>
//                       <option value="employee">Employee</option>
//                     </select>
//                   </div>
//                   <div>
//                     <label className="block text-sm font-semibold text-gray-700 mb-2">Position</label>
//                     <input
//                       type="text"
//                       value={editingEmployee.position || ''}
//                       onChange={(e) => setEditingEmployee({...editingEmployee, position: e.target.value})}
//                       className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-semibold text-gray-700 mb-2">Salary (LPA)</label>
//                     <input
//                       type="number"
//                       step="0.01"
//                       value={editingEmployee.salary_lpa || ''}
//                       onChange={(e) => setEditingEmployee({...editingEmployee, salary_lpa: e.target.value})}
//                       className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none"
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-semibold text-gray-700 mb-2">Joining Date</label>
//                     <input
//                       type="date"
//                       value={editingEmployee.joining_date || ''}
//                       onChange={(e) => setEditingEmployee({...editingEmployee, joining_date: e.target.value})}
//                       className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none"
//                     />
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
//                 <button
//                   onClick={updateEmployee}
//                   className="w-full inline-flex justify-center items-center rounded-xl border border-transparent shadow-lg px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-base font-semibold text-white hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-200 transform hover:scale-105 transition-all duration-200 sm:ml-3 sm:w-auto sm:text-sm"
//                 >
//                   <CheckCircle className="h-4 w-4 mr-2" />
//                   Update Candidate
//                 </button>
//                 <button
//                   onClick={() => {
//                     setShowEditModal(false);
//                     setEditingEmployee(null);
//                   }}
//                   className="mt-3 w-full inline-flex justify-center rounded-xl border-2 border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200 sm:mt-0 sm:w-auto sm:text-sm"
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Enhanced Delete Confirmation Modal */}
//       {showDeleteConfirm && deletingEmployee && (
//         <div className="fixed inset-0 z-50 overflow-y-auto">
//           <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
//             <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity duration-300" onClick={() => setShowDeleteConfirm(false)}></div>

//             <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-100">
//               <div className="bg-gradient-to-br from-gray-50 to-red-50/30 px-6 py-6">
//                 <div className="sm:flex sm:items-start">
//                   <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-xl bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
//                     <Trash2 className="h-6 w-6 text-red-600" />
//                   </div>
//                   <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
//                     <h3 className="text-xl font-bold text-gray-900">
//                       Delete Employee
//                     </h3>
//                     <div className="mt-2">
//                       <p className="text-sm text-gray-500">
//                         Are you sure you want to delete <strong className="text-gray-900">{deletingEmployee.name}</strong>? This action cannot be undone and will also delete all associated documents.
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//               <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
//                 <button
//                   onClick={deleteEmployee}
//                   className="w-full inline-flex justify-center items-center rounded-xl border border-transparent shadow-lg px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-base font-semibold text-white hover:from-red-700 hover:to-rose-700 focus:outline-none focus:ring-4 focus:ring-red-200 transform hover:scale-105 transition-all duration-200 sm:ml-3 sm:w-auto sm:text-sm"
//                 >
//                   <Trash2 className="h-4 w-4 mr-2" />
//                   Delete
//                 </button>
//                 <button
//                   onClick={() => {
//                     setShowDeleteConfirm(false);
//                     setDeletingEmployee(null);
//                   }}
//                   className="mt-3 w-full inline-flex justify-center rounded-xl border-2 border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200 sm:mt-0 sm:w-auto sm:text-sm"
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Enhanced Upload Documents Modal */}
//       {showUploadModal && uploadingEmployee && (
//         <div className="fixed inset-0 z-50 overflow-y-auto">
//           <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
//             <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity duration-300" onClick={() => setShowUploadModal(false)}></div>

//             <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full border border-gray-100">
//               {/* Header */}
//               <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-6">
//                 <div className="flex items-center">
//                   <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
//                     <Upload className="h-6 w-6 text-white" />
//                   </div>
//                   <div className="ml-4">
//                     <h3 className="text-2xl font-bold text-white">
//                       Upload Documents
//                     </h3>
//                     <p className="text-green-100">
//                       {uploadingEmployee.name}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-gradient-to-br from-gray-50 to-green-50/30 p-6">
//                 <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
//                   <div className="flex items-center">
//                     <div className="flex-shrink-0">
//                       <FileText className="h-5 w-5 text-blue-400" />
//                     </div>
//                     <div className="ml-3">
//                       <p className="text-sm font-medium text-blue-800">
//                         Upload required documents for {uploadingEmployee.name}'s onboarding process.
//                       </p>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="space-y-4">
//                   <div className="flex items-center justify-between mb-4">
//                     <label className="block text-lg font-bold text-gray-800">Documents to Upload</label>
//                     <button
//                       type="button"
//                       onClick={addFileInput}
//                       className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105"
//                     >
//                       <Plus className="h-4 w-4 mr-2" />
//                       Add Document
//                     </button>
//                   </div>

//                   {fileInputs.map((fileInput, index) => (
//                     <div key={fileInput.id} className="bg-white/70 rounded-xl border-2 border-gray-200 p-4">
//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                         <div>
//                           <label className="block text-sm font-semibold text-gray-700 mb-2">Document Type</label>
//                           <select
//                             value={fileInput.docType}
//                             onChange={(e) => handleDocTypeChange(fileInput.id, e.target.value)}
//                             className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 outline-none"
//                           >
//                             {documentTypes.map(type => (
//                               <option key={type.value} value={type.value}>
//                                 {type.label}
//                               </option>
//                             ))}
//                           </select>
//                         </div>
//                         <div className="flex items-end space-x-2">
//                           <div className="flex-1">
//                             <label className="block text-sm font-semibold text-gray-700 mb-2">Select File</label>
//                             <input
//                               type="file"
//                               onChange={(e) => handleFileChange(fileInput.id, e.target.files[0])}
//                               className="w-full text-sm border-2 border-gray-200 rounded-xl px-3 py-3 bg-white/70 backdrop-blur-sm focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 outline-none file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
//                               accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
//                             />
//                             {fileInput.file && (
//                               <p className="text-xs text-green-600 mt-1 font-medium">
//                                 ✓ {fileInput.file.name}
//                               </p>
//                             )}
//                           </div>
//                           {fileInputs.length > 1 && (
//                             <button
//                               type="button"
//                               onClick={() => removeFileInput(fileInput.id)}
//                               className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-800 transition-colors duration-200"
//                               title="Remove this document"
//                             >
//                               <XCircle className="h-5 w-5" />
//                             </button>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   ))}

//                   <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
//                     <div className="flex">
//                       <div className="flex-shrink-0">
//                         <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
//                           <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
//                         </svg>
//                       </div>
//                       <div className="ml-3">
//                         <p className="text-sm font-medium text-amber-800">
//                           <strong>Accepted formats:</strong> PDF, DOC, DOCX, JPG, JPEG, PNG<br/>
//                           <strong>Maximum file size:</strong> 10MB per file
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
//                 <button
//                   onClick={uploadDocuments}
//                   className="w-full inline-flex justify-center items-center rounded-xl border border-transparent shadow-lg px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-base font-semibold text-white hover:from-green-700 hover:to-teal-700 focus:outline-none focus:ring-4 focus:ring-green-200 transform hover:scale-105 transition-all duration-200 sm:ml-3 sm:w-auto sm:text-sm"
//                 >
//                   <Upload className="h-4 w-4 mr-2" />
//                   Upload Documents
//                 </button>
//                 <button
//                   onClick={() => {
//                     setShowUploadModal(false);
//                     setUploadingEmployee(null);
//                     setFileInputs([{ id: 1, docType: 'Aadhar and PAN Card', file: null }]);
//                   }}
//                   className="mt-3 w-full inline-flex justify-center rounded-xl border-2 border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200 sm:mt-0 sm:w-auto sm:text-sm"
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Enhanced Documents List Modal */}
//       {showDocumentListModal && documentsList && (
//         <div className="fixed inset-0 z-50 overflow-y-auto">
//           <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
//             <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity duration-300" onClick={() => setShowDocumentListModal(false)}></div>

//             <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full border border-gray-100">
//               {/* Header */}
//               <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-6">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center">
//                     <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
//                       <FileText className="h-6 w-6 text-white" />
//                     </div>
//                     <div className="ml-4">
//                       <h3 className="text-2xl font-bold text-white">
//                         Documents List
//                       </h3>
//                       <p className="text-purple-100">
//                         {documentsList.employee_name}
//                       </p>
//                     </div>
//                   </div>
//                   <div className="bg-white/20 px-4 py-2 rounded-xl">
//                     <span className="text-sm font-medium text-white">
//                       {documentsList.total_documents} documents
//                     </span>
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-gradient-to-br from-gray-50 to-purple-50/30 p-6">
//                 {documentsList.documents && documentsList.documents.length > 0 ? (
//                   <div className="grid gap-4">
//                     {documentsList.documents.map((doc, index) => (
//                       <div key={index} className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
//                         <div className="flex items-center justify-between">
//                           <div className="flex-1">
//                             <h4 className="text-lg font-bold text-gray-900 mb-2">
//                               {doc.doc_type_display}
//                             </h4>
//                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
//                               <div>
//                                 <span className="font-semibold text-gray-800">File:</span> {doc.file_name || 'No filename'}
//                               </div>
//                               <div>
//                                 <span className="font-semibold text-gray-800">Size:</span> {doc.file_size_display}
//                               </div>
//                               <div>
//                                 <span className="font-semibold text-gray-800">Uploaded:</span> {new Date(doc.uploaded_at).toLocaleString()}
//                               </div>
//                             </div>
//                           </div>

//                           <div className="flex items-center space-x-2 ml-6">
//                             {doc.has_file_data ? (
//                               <>
//                                 {/* <button
//                                   onClick={() => viewDocument(documentsList.employee_id, doc.doc_type)}
//                                   className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105"
//                                 >
//                                   <Eye className="h-4 w-4 mr-2" />
//                                   View
//                                 </button>
//                                 <button
//                                   onClick={() => downloadDocument(documentsList.employee_id, doc.doc_type, doc.file_name)}
//                                   className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-teal-700 transition-all duration-200 transform hover:scale-105"
//                                 >
//                                   <Download className="h-4 w-4 mr-2" />
//                                   Download
//                                 </button> */}
//                               </>
//                             ) : (
//                               <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium bg-red-100 text-red-800 border border-red-200">
//                                 No file data
//                               </span>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 ) : (
//                   <div className="text-center py-12">
//                     <div className="relative mx-auto w-24 h-24 mb-6">
//                       <div className="absolute inset-0 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full animate-pulse"></div>
//                       <FileText className="absolute inset-4 text-purple-300" />
//                     </div>
//                     <h3 className="text-xl font-bold text-gray-900 mb-2">No documents found</h3>
//                     <p className="text-gray-500">
//                       This employee hasn't uploaded any documents yet.
//                     </p>
//                   </div>
//                 )}
//               </div>

//               <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
//                 <button
//                   onClick={() => setShowDocumentListModal(false)}
//                   className="w-full inline-flex justify-center rounded-xl border-2 border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200 sm:ml-3 sm:w-auto sm:text-sm"
//                 >
//                   Close
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// // Component to handle pending employee actions with document verification
// const PendingEmployeeActions = ({ employee, onStatusUpdate, checkDocumentStatus }) => {
//   const [documentsComplete, setDocumentsComplete] = useState(null);
//   const [checking, setChecking] = useState(true);

//   useEffect(() => {
//     const checkDocuments = async () => {
//       try {
//         setChecking(true);
//         const isComplete = await checkDocumentStatus(employee.id);
//         setDocumentsComplete(isComplete);
//       } catch (error) {
//         console.error('Error checking document status:', error);
//         setDocumentsComplete(false);
//       } finally {
//         setChecking(false);
//       }
//     };

//     checkDocuments();
//   }, [employee.id, checkDocumentStatus]);

//   if (checking) {
//     return (
//       <div className="inline-flex items-center px-3 py-1 text-sm text-gray-500">
//         <Clock className="h-4 w-4 mr-1 animate-spin" />
//         Checking...
//       </div>
//     );
//   }

//   if (!documentsComplete) {
//     return (
//       <div className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 rounded-md text-sm font-medium">
//         <Clock className="h-4 w-4 mr-1" />
//         Pending Documents
//       </div>
//     );
//   }

//   return (
//     <>
//       <button
//         onClick={() => onStatusUpdate(employee.id, 'accepted')}
//         className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-medium hover:from-emerald-700 hover:to-green-700 transition-all duration-200 transform hover:scale-105"
//         title="Accept Employee"
//       >
//         <CheckCircle className="h-4 w-4 mr-1" />
//         Accept
//       </button>
//       <button
//         onClick={() => onStatusUpdate(employee.id, 'rejected')}
//         className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-xl font-medium hover:from-rose-700 hover:to-red-700 transition-all duration-200 transform hover:scale-105"
//         title="Reject Employee"
//       >
//         <XCircle className="h-4 w-4 mr-1" />
//         Reject
//       </button>
//     </>
//   );
// };

// export default OnboardingManagement;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Plus,
  UserPlus,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  Star,
  TrendingUp,
  RotateCcw,
  AlertTriangle,
  LinkIcon,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  Shield,
  Filter,
  Search
} from 'lucide-react';

const OnboardingManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [showDocumentStatusModal, setShowDocumentStatusModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDocumentListModal, setShowDocumentListModal] = useState(false);
  const [documentsList, setDocumentsList] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [deletingEmployee, setDeletingEmployee] = useState(null);
  const [uploadingEmployee, setUploadingEmployee] = useState(null);
  const [documentStatus, setDocumentStatus] = useState(null);
  const [fileInputs, setFileInputs] = useState([{ id: 1, docType: 'Aadhar and PAN Card', file: null }]);
  const [newEmployee, setNewEmployee] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    employee_type: 'employee',
    department: '',
    position: '',
    current_address: '',
    permanent_address: '',
    joining_date: ''
  });

  // Mock toast function - replace with your actual toast implementation
  const toast = {
    success: (message) => {
      // Replace with your toast library
      console.log('Success:', message);
      alert(`Success: ${message}`);
    },
    error: (message) => {
      // Replace with your toast library
      console.log('Error:', message);
      alert(`Error: ${message}`);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [filter]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      let queryParams = '';

      if (filter === 'pending') {
        queryParams = '?status=pending';
      } else if (filter === 'accepted') {
        queryParams = '?status=accepted';
      } else if (filter === 'rejected') {
        queryParams = '?status=rejected';
      } else if (filter === 'deleted') {
        queryParams = '?deleted_only=true';
      }
      // 'all' doesn't need params - it will show active employees by default

      const { data } = await api.get(`/onboarding/employees/${queryParams}`);
      setEmployees(data.results || data);
    } catch (error) {
      console.error('Error:', error);
      if (error?.response?.status === 401) {
        toast.error('Session expired. Redirecting to login...');
      } else {
        toast.error('Failed to fetch employees');
      }
    } finally {
      setLoading(false);
    }
  };

  const createEmployee = async () => {
    try {
      // Normalize and validate input
      const deptChoices = ['hr', 'it', 'finance', 'marketing', 'sales', 'operations', 'development', 'design', 'qa', 'support'];
      const positionChoices = [
        'hr_manager', 'hr_executive', 'hr_intern',
        'it_manager', 'system_admin', 'network_engineer', 'it_support',
        'senior_developer', 'junior_developer', 'full_stack_developer', 'frontend_developer', 'backend_developer', 'devops_engineer', 'tech_lead',
        'ui_designer', 'ux_designer', 'graphic_designer',
        'qa_engineer', 'test_lead',
        'finance_manager', 'accountant', 'finance_executive',
        'marketing_manager', 'sales_manager', 'sales_executive', 'digital_marketer',
        'customer_support', 'team_lead',
        'project_manager', 'operations_manager',
        'intern', 'trainee'
      ];

      const mapEmployeeType = (val) => {
        if (!val) return undefined;
        const v = String(val).toLowerCase();
        if (v === 'intern' || v === 'fresher') return 'fresher';
        if (v === 'employee') return 'employee';
        return undefined;
      };

      const payload = {
        first_name: newEmployee.first_name?.trim(),
        last_name: newEmployee.last_name?.trim(),
        email: newEmployee.email?.trim(),
        phone_number: newEmployee.phone_number?.trim(),
        employee_type: mapEmployeeType(newEmployee.employee_type || 'employee') || 'employee',
        department: deptChoices.includes(String(newEmployee.department || '').toLowerCase()) ? String(newEmployee.department).toLowerCase() : undefined,
        position: positionChoices.includes(String(newEmployee.position || '').toLowerCase()) ? String(newEmployee.position).toLowerCase() : undefined,
        current_address: newEmployee.current_address ?? undefined,
        permanent_address: newEmployee.permanent_address ?? undefined,
        joining_date: newEmployee.joining_date || undefined,
      };

      // Client-side required checks
      const missing = [];
      if (!payload.first_name) missing.push('First name');
      if (!payload.last_name) missing.push('Last name');
      if (!payload.email) missing.push('Email');
      if (!payload.phone_number) missing.push('Phone number');
      if (!payload.employee_type) missing.push('Employee type');
      if (missing.length) {
        toast.error(`Please fill required fields: ${missing.join(', ')}`);
        return;
      }

      // Strip empty values
      Object.keys(payload).forEach((k) => {
        if (payload[k] === undefined || payload[k] === '') delete payload[k];
      });

      const { data: result } = await api.post('/onboarding/employees/create/', payload);
      toast.success('Employee created successfully!');
      setShowCreateModal(false);
      setNewEmployee({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        employee_type: 'employee',
        department: '',
        position: '',
        current_address: '',
        permanent_address: '',
        joining_date: ''
      });
      fetchEmployees();
    } catch (error) {
      console.error('Error:', error);
      const data = error?.response?.data;
      let msg = data?.detail;
      if (!msg && data && typeof data === 'object') {
        try {
          msg = Object.entries(data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join(' | ');
        } catch (_) { }
      }
      toast.error(msg || 'Failed to create employee');
    }
  };

  const updateEmployee = async () => {
    if (!editingEmployee) return;

    try {
      const deptChoices = ['hr', 'it', 'finance', 'marketing', 'sales', 'operations', 'development', 'design', 'qa', 'support'];
      const positionChoices = [
        'hr_manager', 'hr_executive', 'hr_intern',
        'it_manager', 'system_admin', 'network_engineer', 'it_support',
        'senior_developer', 'junior_developer', 'full_stack_developer', 'frontend_developer', 'backend_developer', 'devops_engineer', 'tech_lead',
        'ui_designer', 'ux_designer', 'graphic_designer',
        'qa_engineer', 'test_lead',
        'finance_manager', 'accountant', 'finance_executive',
        'marketing_manager', 'sales_manager', 'sales_executive', 'digital_marketer',
        'customer_support', 'team_lead',
        'project_manager', 'operations_manager',
        'intern', 'trainee'
      ];

      const mapEmployeeType = (val) => {
        if (!val) return undefined;
        const v = String(val).toLowerCase();
        if (v === 'intern' || v === 'fresher') return 'fresher';
        if (v === 'employee') return 'employee';
        return undefined;
      };

      const payload = {
        first_name: editingEmployee.first_name?.trim(),
        last_name: editingEmployee.last_name?.trim(),
        email: editingEmployee.email?.trim(),
        phone_number: editingEmployee.phone_number?.trim(),
        employee_type: mapEmployeeType(editingEmployee.employee_type),
        department: deptChoices.includes(String(editingEmployee.department || '').toLowerCase()) ? String(editingEmployee.department).toLowerCase() : undefined,
        position: positionChoices.includes(String(editingEmployee.position || '').toLowerCase()) ? String(editingEmployee.position).toLowerCase() : undefined,
        current_address: editingEmployee.current_address ?? undefined,
        permanent_address: editingEmployee.permanent_address ?? undefined,
        joining_date: editingEmployee.joining_date || undefined,
      };

      Object.keys(payload).forEach((k) => {
        if (payload[k] === undefined || payload[k] === '') delete payload[k];
      });

      const response = await fetch(`http://127.0.0.1:8000/api/onboarding/employees/${editingEmployee.id}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('Employee updated successfully!');
        setShowEditModal(false);
        setEditingEmployee(null);
        fetchEmployees();
      } else {
        let errorMsg = 'Failed to update employee';
        try {
          const error = await response.json();
          errorMsg = error?.detail || Object.entries(error || {})
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join(' | ') || errorMsg;
        } catch { }
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update employee');
    }
  };

  const softDeleteEmployee = async (employeeId) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/onboarding/employees/${employeeId}/soft_delete/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('Employee deleted successfully!');
        setShowDeleteConfirm(false);
        setDeletingEmployee(null);
        fetchEmployees();
      } else {
        toast.error('Failed to delete employee');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete employee');
    }
  };

  const restoreEmployee = async (employeeId) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/onboarding/employees/${employeeId}/restore/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('Employee restored successfully!');
        setShowRestoreConfirm(false);
        setDeletingEmployee(null);
        fetchEmployees();
      } else {
        toast.error('Failed to restore employee');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to restore employee');
    }
  };

  const fetchDocumentStatus = async (employeeId) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/onboarding/employees/${employeeId}/documents_status/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDocumentStatus(data);
        setShowDocumentStatusModal(true);
      } else {
        toast.error('Failed to fetch document status');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to fetch document status');
    }
  };

  const fetchDocumentsList = async (employeeId) => {
    try {
      const { data } = await api.get(`/onboarding/employees/${employeeId}/list_documents/`);
      setDocumentsList(data);
      setShowDocumentListModal(true);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to fetch documents list');
    }
  };

  const updateEmployeeStatus = async (employeeId, status) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/onboarding/employees/${employeeId}/update_status/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast.success(`Status updated to ${status}`);
        fetchEmployees();
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update status');
    }
  };

  const uploadDocuments = async () => {
    if (!uploadingEmployee) return;

    try {
      const formData = new FormData();

      fileInputs.forEach(fileInput => {
        if (fileInput.file) {
          formData.append(`document_${fileInput.docType}`, fileInput.file);
        }
      });

      const response = await fetch(`http://127.0.0.1:8000/api/onboarding/employees/${uploadingEmployee.id}/upload_documents/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Documents uploaded successfully! ${result.files_uploaded?.length || 0} files processed.`);

        setShowUploadModal(false);
        setUploadingEmployee(null);
        setFileInputs([{ id: 1, docType: 'Aadhar and PAN Card', file: null }]);

        fetchEmployees();

        setTimeout(() => {
          fetchDocumentStatus(uploadingEmployee.id);
        }, 500);

      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to upload documents');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to upload documents');
    }
  };

  const checkDocumentCompletionStatus = async (employeeId) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/onboarding/employees/${employeeId}/documents_status/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.is_complete;
      }
      return false;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  const documentTypes = [
    { value: 'Aadhar and PAN Card', label: 'Aadhar and PAN Card' },
    { value: 'Last 6 months payslips', label: 'Last 6 months payslips' },
    { value: 'Educational Certificates (Degree)', label: 'Educational Certificates (Degree)' },
    { value: 'Previous Offer Letter', label: 'Previous Offer Letter' },
    { value: 'Relieving & Experience Letters', label: 'Relieving & Experience Letters' },
    { value: 'Appraisal/Hike Letters', label: 'Appraisal/Hike Letters' },
  ];

  const addFileInput = () => {
    const newId = Math.max(...fileInputs.map(f => f.id)) + 1;
    setFileInputs([...fileInputs, { id: newId, docType: 'Aadhar and PAN Card', file: null }]);
  };

  const removeFileInput = (id) => {
    if (fileInputs.length > 1) {
      setFileInputs(fileInputs.filter(f => f.id !== id));
    }
  };

  const handleFileChange = (id, file) => {
    setFileInputs(fileInputs.map(f =>
      f.id === id ? { ...f, file } : f
    ));
  };

  const handleDocTypeChange = (id, docType) => {
    setFileInputs(fileInputs.map(f =>
      f.id === id ? { ...f, docType } : f
    ));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'accepted':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'rejected':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEmployeeTypeColor = (type) => {
    switch (type) {
      case 'fresher':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'employee':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEmployeeInitials = (employee) => {
    const firstName = employee.first_name || '';
    const lastName = employee.last_name || '';
    const fullName = `${firstName} ${lastName}`;
    return fullName.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const getProfileGradient = (employee) => {
    const gradients = [
      'from-violet-500 to-purple-600',
      'from-blue-500 to-cyan-600',
      'from-emerald-500 to-teal-600',
      'from-amber-500 to-orange-600',
      'from-rose-500 to-pink-600',
      'from-indigo-500 to-blue-600'
    ];
    const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`;
    const index = fullName.length % gradients.length;
    return gradients[index];
  };

  const filteredEmployees = (employees || []).filter(emp => {
    // Apply filter logic
    let matchesFilter = true;
    if (filter === 'all') matchesFilter = !emp.is_deleted;
    else if (filter === 'deleted') matchesFilter = emp.is_deleted;
    else if (filter === 'pending') matchesFilter = !emp.is_deleted && emp.status === 'pending';
    else if (filter === 'accepted') matchesFilter = !emp.is_deleted && emp.status === 'accepted';
    else if (filter === 'rejected') matchesFilter = !emp.is_deleted && emp.status === 'rejected';

    // Apply search logic
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      (emp.first_name || '').toLowerCase().includes(searchLower) ||
      (emp.last_name || '').toLowerCase().includes(searchLower) ||
      (emp.email || '').toLowerCase().includes(searchLower) ||
      (emp.department || '').toLowerCase().includes(searchLower) ||
      (emp.position || '').toLowerCase().includes(searchLower);

    return matchesFilter && matchesSearch;
  });

  const employeeCounts = {
    all: (employees || []).filter(e => !e.is_deleted).length,
    pending: (employees || []).filter(e => !e.is_deleted && e.status === 'pending').length,
    accepted: (employees || []).filter(e => !e.is_deleted && e.status === 'accepted').length,
    rejected: (employees || []).filter(e => !e.is_deleted && e.status === 'rejected').length,
    deleted: (employees || []).filter(e => e.is_deleted).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex justify-center items-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full animate-spin">
              <div className="absolute top-0 left-0 w-20 h-20 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          </div>
          <p className="mt-4 text-lg font-medium text-gray-600">Loading onboarding data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Enhanced Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-700">
        <div className="absolute inset-0 bg-black opacity-10"></div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-48 translate-y-48"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <UserPlus className="h-8 w-8 text-white" />
                </div>
                <Star className="h-6 w-6 text-yellow-300 animate-pulse" />
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3">
                Onboarding Management
              </h1>
              <p className="text-xl text-blue-100 mb-6">
                Streamline your employee onboarding process with document verification and status tracking
              </p>

              <div className="flex items-center space-x-6 text-blue-100">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">{employeeCounts.all} Total Candidates</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">{employeeCounts.pending} Pending Review</span>
                </div>
              </div>
            </div>

            <div className="mt-8 lg:mt-0 flex flex-col lg:flex-row gap-4">
              {/* Generate Link Button */}
              <Link
                to="/onboarding/link-generator"
                className="group relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-2xl hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300"
              >
                <LinkIcon className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                Generate Link
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {[
            { key: 'all', label: 'Active Candidates', count: employeeCounts.all, color: 'from-blue-500 to-blue-600', icon: UserPlus },
            { key: 'pending', label: 'Pending Review', count: employeeCounts.pending, color: 'from-amber-500 to-amber-600', icon: Clock },
            { key: 'accepted', label: 'Accepted', count: employeeCounts.accepted, color: 'from-emerald-500 to-emerald-600', icon: CheckCircle },
            { key: 'rejected', label: 'Rejected', count: employeeCounts.rejected, color: 'from-rose-500 to-rose-600', icon: XCircle },
            { key: 'deleted', label: 'Deleted', count: employeeCounts.deleted, color: 'from-gray-500 to-gray-600', icon: Trash2 },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.key} className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">
                          {stat.count}
                        </p>
                        <p className="text-sm font-medium text-gray-600">
                          {stat.label}
                        </p>
                      </div>
                    </div>
                    <TrendingUp className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors duration-300" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enhanced Filter and Search */}
        <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-white/50 p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Filter Tabs */}
            <div className="flex space-x-2">
              {[
                { key: 'all', label: 'Active', count: employeeCounts.all },
                { key: 'pending', label: 'Pending', count: employeeCounts.pending },
                { key: 'accepted', label: 'Accepted', count: employeeCounts.accepted },
                { key: 'rejected', label: 'Rejected', count: employeeCounts.rejected },
                { key: 'deleted', label: 'Deleted', count: employeeCounts.deleted },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 ${filter === tab.key
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative lg:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Enhanced Employee Cards */}
        <div className="grid grid-cols-1 gap-6">
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-20">
              <div className="relative mx-auto w-32 h-32 mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full animate-pulse"></div>
                <UserPlus className="absolute inset-4 text-indigo-300" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No candidates found</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {employees.length === 0
                  ? "Get started by adding your first candidate to the onboarding process."
                  : "No candidates match your current filter and search criteria."
                }
              </p>
              {employees.length === 0 && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors duration-200"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add First Candidate
                </button>
              )}
            </div>
          ) : (
            filteredEmployees.map((employee, index) => {
              const employeeInitials = getEmployeeInitials(employee);
              const profileGradient = getProfileGradient(employee);

              return (
                <div
                  key={employee.id}
                  className={`group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/50 overflow-hidden transform hover:-translate-y-1 ${employee.is_deleted ? 'opacity-75' : ''
                    }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-indigo-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <div className="relative p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${profileGradient} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 ${employee.is_deleted ? 'grayscale' : ''
                            }`}>
                            <span className="text-white font-bold text-lg">
                              {employeeInitials}
                            </span>
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-400 rounded-full border-2 border-white flex items-center justify-center">
                            {employee.is_deleted ? (
                              <Trash2 className="h-3 w-3 text-rose-500" />
                            ) : employee.is_self_submitted ? (
                              <CheckCircle className="h-3 w-3 text-emerald-500" />
                            ) : (
                              <Clock className="h-3 w-3 text-amber-500" />
                            )}
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className={`text-xl font-bold group-hover:text-indigo-600 transition-colors duration-300 ${employee.is_deleted ? 'line-through text-gray-500' : 'text-gray-900'
                              }`}>
                              {employee.first_name} {employee.last_name}
                              {employee.is_deleted && <span className="text-rose-500 ml-2">[DELETED]</span>}
                            </h3>

                            {!employee.is_deleted && employee.status && (
                              <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(employee.status)}`}>
                                {employee.status}
                              </span>
                            )}

                            {employee.employee_type && (
                              <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getEmployeeTypeColor(employee.employee_type)}`}>
                                {employee.employee_type}
                              </span>
                            )}

                            {employee.is_self_submitted && !employee.is_deleted && (
                              <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border bg-emerald-100 text-emerald-800 border-emerald-200">
                                ✓ Self-Submitted
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="font-medium">{employee.email}</span>
                            {employee.phone_number && <span>• {employee.phone_number}</span>}
                            {employee.department && <span>• {employee.department}</span>}
                            {employee.position && <span>• {employee.position}</span>}
                            {employee.joining_date && <span>• Joining: {new Date(employee.joining_date).toLocaleDateString()}</span>}
                          </div>

                          {/* Submission Info */}
                          {employee.is_self_submitted && employee.submitted_at && (
                            <div className="mt-2 text-xs text-gray-500">
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                📅 Submitted: {new Date(employee.submitted_at).toLocaleDateString()} at {new Date(employee.submitted_at).toLocaleTimeString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedEmployee(employee);
                            setShowDetailsModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100"
                          title="View Details"
                        >
                          <Eye className="h-5 w-5" />
                        </button>

                        {employee.is_deleted ? (
                          <button
                            onClick={() => {
                              setDeletingEmployee(employee);
                              setShowRestoreConfirm(true);
                            }}
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-medium hover:from-emerald-700 hover:to-green-700 transition-all duration-200 transform hover:scale-105"
                            title="Restore Employee"
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restore
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingEmployee({ ...employee });
                                setShowEditModal(true);
                              }}
                              className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 opacity-0 group-hover:opacity-100"
                              title="Edit Employee"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </button>

                            <button
                              onClick={() => {
                                setDeletingEmployee(employee);
                                setShowDeleteConfirm(true);
                              }}
                              className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-xl font-medium hover:from-rose-700 hover:to-red-700 transition-all duration-200 transform hover:scale-105 opacity-0 group-hover:opacity-100"
                              title="Delete Employee"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </button>

                            <button
                              onClick={() => fetchDocumentsList(employee.id)}
                              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105"
                              title="Check Document Status"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Documents
                            </button>

                            {employee.status === 'pending' && (
                              <PendingEmployeeActions
                                employee={employee}
                                onStatusUpdate={updateEmployeeStatus}
                                checkDocumentStatus={checkDocumentCompletionStatus}
                              />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showDocumentListModal && documentsList && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowDocumentListModal(false)}></div>
            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold">Documents - {documentsList.employee_name}</h3>
                <p className="text-sm text-gray-500">{documentsList.total_documents} uploaded</p>
              </div>
              <div className="px-6 py-4">
                {documentsList.documents && documentsList.documents.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {documentsList.documents.map((doc, idx) => (
                      <li key={idx} className="py-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{doc.doc_type}</p>
                          {doc.name && <p className="text-xs text-gray-500 break-all">{doc.name}</p>}
                        </div>
                        <div className="flex items-center space-x-2">
                          {doc.url ? (
                            <>
                              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="px-3 py-1 text-sm rounded-md border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100">View</a>
                              <a href={doc.url} download className="px-3 py-1 text-sm rounded-md border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100">Download</a>
                            </>
                          ) : (
                            <span className="text-xs text-gray-500">No URL</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No documents uploaded yet.</p>
                    <div className="mt-4 flex items-center justify-center space-x-2">
                      <button onClick={() => { setShowDocumentListModal(false); fetchDocumentStatus(documentsList.employee_id); }} className="px-4 py-2 rounded-md bg-indigo-600 text-white">View Status</button>
                    </div>
                  </div>
                )}
              </div>
              <div className="px-6 py-3 bg-gray-50 flex justify-end">
                <button onClick={() => setShowDocumentListModal(false)} className="inline-flex items-center px-4 py-2 rounded-md border border-gray-300 bg-white text-sm">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Create Employee Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity duration-300" onClick={() => setShowCreateModal(false)}></div>

            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-gray-100">
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                    <UserPlus className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-2xl font-bold text-white">
                      Add New Candidate
                    </h3>
                    <p className="text-blue-100 text-sm">
                      Create a new candidate profile for onboarding process
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newEmployee.first_name}
                      onChange={(e) => setNewEmployee({ ...newEmployee, first_name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none"
                      placeholder="Enter first name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newEmployee.last_name}
                      onChange={(e) => setNewEmployee({ ...newEmployee, last_name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none"
                      placeholder="Enter last name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={newEmployee.email}
                      onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none"
                      placeholder="candidate@company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={newEmployee.phone_number}
                      onChange={(e) => setNewEmployee({ ...newEmployee, phone_number: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none"
                      placeholder="+91 9876543210"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Employee Type
                    </label>
                    <select
                      value={newEmployee.employee_type}
                      onChange={(e) => setNewEmployee({ ...newEmployee, employee_type: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none"
                    >
                      <option value="fresher">🎓 Fresher</option>
                      <option value="employee">👔 Employee</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Joining Date
                    </label>
                    <input
                      type="date"
                      value={newEmployee.joining_date}
                      onChange={(e) => setNewEmployee({ ...newEmployee, joining_date: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse sm:space-x-reverse sm:space-x-3">
                <button
                  onClick={createEmployee}
                  className="w-full inline-flex justify-center items-center rounded-xl border border-transparent shadow-lg px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-base font-semibold text-white hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 transform hover:scale-105 transition-all duration-200 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Candidate
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-xl border-2 border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Edit Employee Modal */}
      {showEditModal && editingEmployee && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity duration-300" onClick={() => setShowEditModal(false)}></div>

            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-gray-100">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                    <Edit className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-2xl font-bold text-white">
                      Edit Employee
                    </h3>
                    <p className="text-blue-100 text-sm">
                      {editingEmployee.first_name} {editingEmployee.last_name}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      value={editingEmployee.first_name}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, first_name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      value={editingEmployee.last_name}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, last_name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={editingEmployee.email}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, email: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={editingEmployee.phone_number || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, phone_number: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                    <select
                      value={editingEmployee.department || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, department: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none"
                    >
                      <option value="">Select Department</option>
                      <option value="hr">HR</option>
                      <option value="it">IT</option>
                      <option value="finance">Finance</option>
                      <option value="marketing">Marketing</option>
                      <option value="sales">Sales</option>
                      <option value="development">Development</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Position</label>
                    <select
                      value={editingEmployee.position || ''}
                      onChange={(e) => setEditingEmployee({ ...editingEmployee, position: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none"
                    >
                      <option value="">Select Position</option>
                      <option value="manager">Manager</option>
                      <option value="senior_developer">Senior Developer</option>
                      <option value="junior_developer">Junior Developer</option>
                      <option value="hr_executive">HR Executive</option>
                      <option value="finance_executive">Finance Executive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
                <button
                  onClick={updateEmployee}
                  className="w-full inline-flex justify-center items-center rounded-xl border border-transparent shadow-lg px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-base font-semibold text-white hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-200 transform hover:scale-105 transition-all duration-200 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Update Employee
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-xl border-2 border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Delete Confirmation Modal */}
      {showDeleteConfirm && deletingEmployee && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity duration-300" onClick={() => setShowDeleteConfirm(false)}></div>

            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-100">
              <div className="bg-gradient-to-br from-gray-50 to-red-50/30 px-6 py-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-xl bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-xl font-bold text-gray-900">
                      Delete Employee
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete <strong className="text-gray-900">{deletingEmployee.first_name} {deletingEmployee.last_name}</strong>?
                        This will soft delete the employee record. You can restore it later if needed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => softDeleteEmployee(deletingEmployee.id)}
                  className="w-full inline-flex justify-center items-center rounded-xl border border-transparent shadow-lg px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-base font-semibold text-white hover:from-red-700 hover:to-rose-700 focus:outline-none focus:ring-4 focus:ring-red-200 transform hover:scale-105 transition-all duration-200 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-xl border-2 border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Restore Confirmation Modal */}
      {showRestoreConfirm && deletingEmployee && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity duration-300" onClick={() => setShowRestoreConfirm(false)}></div>

            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-100">
              <div className="bg-gradient-to-br from-gray-50 to-green-50/30 px-6 py-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-xl bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                    <RotateCcw className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-xl font-bold text-gray-900">
                      Restore Employee
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to restore <strong className="text-gray-900">{deletingEmployee.first_name} {deletingEmployee.last_name}</strong>?
                        This will reactivate the employee record and make it visible in the active employees list.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => restoreEmployee(deletingEmployee.id)}
                  className="w-full inline-flex justify-center items-center rounded-xl border border-transparent shadow-lg px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-base font-semibold text-white hover:from-emerald-700 hover:to-green-700 focus:outline-none focus:ring-4 focus:ring-emerald-200 transform hover:scale-105 transition-all duration-200 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restore
                </button>
                <button
                  onClick={() => setShowRestoreConfirm(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-xl border-2 border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Employee Details Modal */}
      {showDetailsModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity duration-300" onClick={() => setShowDetailsModal(false)}></div>

            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full border border-gray-100">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                    <Eye className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-2xl font-bold text-white">
                      Employee Details
                    </h3>
                    <p className="text-blue-100">
                      {selectedEmployee.first_name} {selectedEmployee.last_name}
                      {selectedEmployee.is_deleted && <span className="text-rose-300"> [DELETED]</span>}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2">Basic Information</h4>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                      <p className="text-sm text-gray-900 bg-white/70 rounded-lg px-3 py-2">
                        {selectedEmployee.first_name} {selectedEmployee.last_name}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                      <p className="text-sm text-gray-900 bg-white/70 rounded-lg px-3 py-2">{selectedEmployee.email}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                      <p className="text-sm text-gray-900 bg-white/70 rounded-lg px-3 py-2">{selectedEmployee.phone_number || 'Not provided'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Employee Type</label>
                      <p className="text-sm text-gray-900 bg-white/70 rounded-lg px-3 py-2">{selectedEmployee.employee_type || 'Not specified'}</p>
                    </div>
                  </div>

                  {/* Employment Details */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2">Employment Details</h4>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Department</label>
                      <p className="text-sm text-gray-900 bg-white/70 rounded-lg px-3 py-2">{selectedEmployee.department || 'Not assigned'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Position</label>
                      <p className="text-sm text-gray-900 bg-white/70 rounded-lg px-3 py-2">{selectedEmployee.position || 'Not assigned'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Joining Date</label>
                      <p className="text-sm text-gray-900 bg-white/70 rounded-lg px-3 py-2">
                        {selectedEmployee.joining_date ? new Date(selectedEmployee.joining_date).toLocaleDateString() : 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Information */}
                <div className="mt-6 space-y-4">
                  <h4 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2">Status Information</h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/70 rounded-lg p-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Submission Status</label>
                      {selectedEmployee.is_self_submitted ? (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5 text-emerald-500" />
                          <span className="text-sm font-medium text-emerald-700">Self-Submitted</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Clock className="h-5 w-5 text-amber-500" />
                          <span className="text-sm font-medium text-amber-700">Pending</span>
                        </div>
                      )}
                      {selectedEmployee.submitted_at && (
                        <p className="text-xs text-gray-500 mt-1">
                          Submitted: {new Date(selectedEmployee.submitted_at).toLocaleString()}
                        </p>
                      )}
                    </div>

                    <div className="bg-white/70 rounded-lg p-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">IT Notification</label>
                      {selectedEmployee.it_notification_sent ? (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5 text-blue-500" />
                          <span className="text-sm font-medium text-blue-700">Notified</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <XCircle className="h-5 w-5 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Not Notified</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-white/70 rounded-lg p-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Account Status</label>
                      {selectedEmployee.is_deleted ? (
                        <div className="flex items-center space-x-2">
                          <Trash2 className="h-5 w-5 text-rose-500" />
                          <span className="text-sm font-medium text-rose-700">Deleted</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5 text-emerald-500" />
                          <span className="text-sm font-medium text-emerald-700">Active</span>
                        </div>
                      )}
                      {selectedEmployee.deleted_at && (
                        <p className="text-xs text-gray-500 mt-1">
                          Deleted: {new Date(selectedEmployee.deleted_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Document Status */}
                <div className="mt-6">
                  <h4 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">Document Status</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: 'aadhar_pan', label: 'Aadhar & PAN Card' },
                      { key: 'payslips', label: 'Payslips' },
                      { key: 'educational_certificates', label: 'Educational Certificates' },
                      { key: 'previous_offer_letter', label: 'Previous Offer Letter' },
                      { key: 'relieving_experience_letters', label: 'Relieving & Experience Letters' },
                      { key: 'appraisal_hike_letters', label: 'Appraisal/Hike Letters' },
                    ].map((doc) => {
                      const collected = selectedEmployee[`${doc.key}_collected`];
                      const file = selectedEmployee[`${doc.key}_file`];

                      return (
                        <div key={doc.key} className="bg-white/70 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">{doc.label}</span>
                            <div className="flex items-center space-x-2">
                              {collected && (
                                <CheckCircle className="h-4 w-4 text-emerald-500" title="Collected" />
                              )}
                              {file && (
                                <FileText className="h-4 w-4 text-blue-500" title="File Uploaded" />
                              )}
                              {!collected && !file && (
                                <XCircle className="h-4 w-4 text-gray-400" title="Not Collected" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="w-full inline-flex justify-center rounded-xl border-2 border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Component to handle pending employee actions with document verification
const PendingEmployeeActions = ({ employee, onStatusUpdate, checkDocumentStatus }) => {
  const [documentsComplete, setDocumentsComplete] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkDocuments = async () => {
      try {
        setChecking(true);
        const isComplete = await checkDocumentStatus(employee.id);
        setDocumentsComplete(isComplete);
      } catch (error) {
        console.error('Error checking document status:', error);
        setDocumentsComplete(false);
      } finally {
        setChecking(false);
      }
    };

    checkDocuments();
  }, [employee.id, checkDocumentStatus]);

  if (checking) {
    return (
      <div className="inline-flex items-center px-3 py-1 text-sm text-gray-500">
        <Clock className="h-4 w-4 mr-1 animate-spin" />
        Checking...
      </div>
    );
  }

  if (!documentsComplete) {
    return (
      <div className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 rounded-md text-sm font-medium">
        <Clock className="h-4 w-4 mr-1" />
        Pending Documents
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => onStatusUpdate(employee.id, 'accepted')}
        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl font-medium hover:from-emerald-700 hover:to-green-700 transition-all duration-200 transform hover:scale-105"
        title="Accept Employee"
      >
        <CheckCircle className="h-4 w-4 mr-1" />
        Accept
      </button>
      <button
        onClick={() => onStatusUpdate(employee.id, 'rejected')}
        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-xl font-medium hover:from-rose-700 hover:to-red-700 transition-all duration-200 transform hover:scale-105"
        title="Reject Employee"
      >
        <XCircle className="h-4 w-4 mr-1" />
        Reject
      </button>
    </>
  );
};

export default OnboardingManagement;