// import React, { useState } from 'react';
// import { useMutation, useQuery, useQueryClient } from 'react-query';
// import { toast } from 'react-toastify';
// import {
//   PlusIcon,
//   ServerIcon,
//   KeyIcon,
//   ClipboardDocumentListIcon,
//   ChartBarIcon,
//   Cog6ToothIcon,
//   BuildingOfficeIcon
// } from '@heroicons/react/24/outline';
// import { getCurrentUser } from '../../utils/auth';
// import api from '../../services/api';

// const AdminForms = () => {
//   const [activeForm, setActiveForm] = useState('resource-type');
//   const queryClient = useQueryClient();
//   const user = getCurrentUser();

//   // Resource Type Form
//   const ResourceTypeForm = () => {
//     const [formData, setFormData] = useState({
//       name: '',
//       description: '',
//       is_active: true
//     });

//     const createMutation = useMutation(
//       (data) => api.post('/resource-management/resource-types/', data),
//       {
//         onSuccess: () => {
//           toast.success('Resource type created successfully!');
//           setFormData({ name: '', description: '', is_active: true });
//           queryClient.invalidateQueries('resource-types');
//         },
//         onError: (error) => {
//           console.error('Error creating resource type:', error);
//           toast.error('Failed to create resource type');
//         }
//       }
//     );

//     const handleSubmit = (e) => {
//       e.preventDefault();
//       createMutation.mutate(formData);
//     };

//     return (
//       <div className="bg-white rounded-lg border border-gray-200 p-6">
//         <h3 className="text-lg font-semibold text-gray-900 mb-4">Add resource type</h3>
        
//         <div className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Name:
//             </label>
//             <input
//               type="text"
//               value={formData.name}
//               onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//               required
//               className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Description:
//             </label>
//             <textarea
//               value={formData.description}
//               onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//               rows={4}
//               className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//             />
//           </div>

//           <div className="flex items-center">
//             <input
//               type="checkbox"
//               id="is_active_rt"
//               checked={formData.is_active}
//               onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
//               className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
//             />
//             <label htmlFor="is_active_rt" className="ml-2 block text-sm text-gray-900">
//               Is active
//             </label>
//           </div>

//           <div className="flex space-x-3 pt-4">
//             <button
//               onClick={handleSubmit}
//               disabled={createMutation.isLoading}
//               className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
//             >
//               SAVE
//             </button>
//             <button
//               type="button"
//               className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
//             >
//               Save and add another
//             </button>
//             <button
//               type="button"
//               className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
//             >
//               Save and continue editing
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // Access Level Form
//   const AccessLevelForm = () => {
//     const [formData, setFormData] = useState({
//       name: '',
//       description: ''
//     });

//     const createMutation = useMutation(
//       (data) => api.post('/resource-management/access-levels/', data),
//       {
//         onSuccess: () => {
//           toast.success('Access level created successfully!');
//           setFormData({ name: '', description: '' });
//           queryClient.invalidateQueries('access-levels');
//         },
//         onError: (error) => {
//           console.error('Error creating access level:', error);
//           toast.error('Failed to create access level');
//         }
//       }
//     );

//     const handleSubmit = (e) => {
//       e.preventDefault();
//       createMutation.mutate(formData);
//     };

//     return (
//       <div className="bg-white rounded-lg border border-gray-200 p-6">
//         <h3 className="text-lg font-semibold text-gray-900 mb-4">Add access level</h3>
        
//         <div className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Name:
//             </label>
//             <input
//               type="text"
//               value={formData.name}
//               onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//               required
//               className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Description:
//             </label>
//             <textarea
//               value={formData.description}
//               onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//               rows={4}
//               className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//             />
//           </div>

//           <div className="flex space-x-3 pt-4">
//             <button
//               onClick={handleSubmit}
//               disabled={createMutation.isLoading}
//               className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
//             >
//               SAVE
//             </button>
//             <button
//               type="button"
//               className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
//             >
//               Save and add another
//             </button>
//             <button
//               type="button"
//               className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
//             >
//               Save and continue editing
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // Resource Form
//   const ResourceForm = () => {
//     const [formData, setFormData] = useState({
//       name: '',
//       resource_type: '',
//       description: '',
//       endpoint: '',
//       environment: '',
//       resource_team_email: 'resource-team@example.com',
//       requires_approval: false,
//       is_active: true
//     });

//     const { data: resourceTypesResponse } = useQuery(
//       'resource-types',
//       () => api.get('/resource-management/resource-types/')
//     );

//     const resourceTypes = resourceTypesResponse?.data?.results || resourceTypesResponse?.data || [];

//     const createMutation = useMutation(
//       (data) => api.post('/resource-management/resources/', data),
//       {
//         onSuccess: () => {
//           toast.success('Resource created successfully!');
//           setFormData({
//             name: '',
//             resource_type: '',
//             description: '',
//             endpoint: '',
//             environment: '',
//             resource_team_email: 'resource-team@example.com',
//             requires_approval: false,
//             is_active: true
//           });
//           queryClient.invalidateQueries(['resources']);
//         },
//         onError: (error) => {
//           console.error('Error creating resource:', error);
//           toast.error('Failed to create resource');
//         }
//       }
//     );

//     const handleSubmit = (e) => {
//       e.preventDefault();
//       createMutation.mutate(formData);
//     };

//     const environments = [
//       { value: '', label: '--------' },
//       { value: 'DEV', label: 'Development' },
//       { value: 'QA', label: 'Quality Assurance' },
//       { value: 'UAT', label: 'User Acceptance Testing' },
//       { value: 'PROD', label: 'Production' }
//     ];

//     return (
//       <div className="bg-white rounded-lg border border-gray-200 p-6">
//         <h3 className="text-lg font-semibold text-gray-900 mb-4">Add resource</h3>
        
//         <div className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Name:
//             </label>
//             <input
//               type="text"
//               value={formData.name}
//               onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//               required
//               className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Resource type:
//             </label>
//             <div className="flex items-center space-x-2">
//               <select
//                 value={formData.resource_type}
//                 onChange={(e) => setFormData({ ...formData, resource_type: e.target.value })}
//                 required
//                 className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//               >
//                 <option value="">--------</option>
//                 {resourceTypes.map(type => (
//                   <option key={type.id} value={type.id}>{type.name}</option>
//                 ))}
//               </select>
//               <button 
//                 type="button" 
//                 onClick={() => setActiveForm('resource-type')}
//                 className="text-green-600 hover:text-green-700"
//                 title="Add new resource type"
//               >
//                 <PlusIcon className="h-5 w-5" />
//               </button>
//             </div>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Description:
//             </label>
//             <textarea
//               value={formData.description}
//               onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//               rows={4}
//               className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Endpoint:
//             </label>
//             <input
//               type="url"
//               value={formData.endpoint}
//               onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
//               className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Environment:
//             </label>
//             <select
//               value={formData.environment}
//               onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
//               className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//             >
//               {environments.map(env => (
//                 <option key={env.value} value={env.value}>{env.label}</option>
//               ))}
//             </select>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Resource team email:
//             </label>
//             <input
//               type="email"
//               value={formData.resource_team_email}
//               onChange={(e) => setFormData({ ...formData, resource_team_email: e.target.value })}
//               className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//             />
//           </div>

//           <div className="space-y-2">
//             <div className="flex items-center">
//               <input
//                 type="checkbox"
//                 id="requires_approval"
//                 checked={formData.requires_approval}
//                 onChange={(e) => setFormData({ ...formData, requires_approval: e.target.checked })}
//                 className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
//               />
//               <label htmlFor="requires_approval" className="ml-2 block text-sm text-gray-900">
//                 Requires approval
//               </label>
//             </div>

//             <div className="flex items-center">
//               <input
//                 type="checkbox"
//                 id="is_active_resource"
//                 checked={formData.is_active}
//                 onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
//                 className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
//               />
//               <label htmlFor="is_active_resource" className="ml-2 block text-sm text-gray-900">
//                 Is active
//               </label>
//             </div>
//           </div>

//           <div className="flex space-x-3 pt-4">
//             <button
//               onClick={handleSubmit}
//               disabled={createMutation.isLoading}
//               className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
//             >
//               SAVE
//             </button>
//             <button
//               type="button"
//               className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
//             >
//               Save and add another
//             </button>
//             <button
//               type="button"
//               className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
//             >
//               Save and continue editing
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const adminForms = [
//     { id: 'resource-type', name: 'Resource Type', component: ResourceTypeForm },
//     { id: 'access-level', name: 'Access Level', component: AccessLevelForm },
//     { id: 'resource', name: 'Resource', component: ResourceForm }
//   ];

//   const ActiveFormComponent = adminForms.find(f => f.id === activeForm)?.component || ResourceTypeForm;

//   return (
//     <div className="p-6 space-y-6">
//       {/* Form Selector */}
//       <div className="bg-white rounded-lg border border-gray-200 p-4">
//         <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Forms</h2>
//         <div className="flex flex-wrap gap-2">
//           {adminForms.map((form) => (
//             <button
//               key={form.id}
//               onClick={() => setActiveForm(form.id)}
//               className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
//                 activeForm === form.id
//                   ? 'bg-blue-600 text-white'
//                   : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//               }`}
//             >
//               {form.name}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Active Form */}
//       <ActiveFormComponent />
//     </div>
//   );
// };

// export default AdminForms;

// import React, { useState, useEffect } from 'react';
// import { useMutation, useQuery, useQueryClient } from 'react-query';
// import { toast } from 'react-toastify';
// import {
//   PlusIcon,
//   ServerIcon,
//   KeyIcon,
//   ClipboardDocumentListIcon,
//   ChartBarIcon,
//   Cog6ToothIcon,
//   BuildingOfficeIcon,
//   ShieldCheckIcon,
//   ExclamationTriangleIcon
// } from '@heroicons/react/24/outline';
// import { getCurrentUser } from '../../utils/auth';
// import api from '../../services/api';

// const AdminForms = () => {
//   const [activeForm, setActiveForm] = useState('resource-type');
//   const [accessVerified, setAccessVerified] = useState(false);
//   const queryClient = useQueryClient();
//   const user = getCurrentUser();

//   // Verify admin access
//   useEffect(() => {
//     const verifyAccess = () => {
//       if (!user) {
//         setAccessVerified(false);
//         return;
//       }
      
//       const userRole = user.role?.toLowerCase();
//       const hasAccess = userRole === 'admin' || 
//                        userRole === 'hr_manager' || 
//                        userRole === 'hr_admin' ||
//                        userRole === 'super_admin';
      
//       setAccessVerified(hasAccess);
      
//       if (!hasAccess) {
//         toast.error('Access denied: Admin privileges required');
//       }
//     };

//     verifyAccess();
//   }, [user]);

//   // If user doesn't have access, show access denied message
//   if (!accessVerified) {
//     return (
//       <div className="p-6">
//         <div className="max-w-2xl mx-auto">
//           <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
//             <ShieldCheckIcon className="mx-auto h-16 w-16 text-red-400 mb-4" />
//             <h2 className="text-xl font-semibold text-red-900 mb-2">Access Denied</h2>
//             <p className="text-red-700 mb-4">
//               You don't have permission to access the Admin Forms. This section is restricted to administrators and HR managers.
//             </p>
//             <div className="bg-red-100 rounded-lg p-4 mb-4">
//               <p className="text-sm text-red-800">
//                 <strong>Current Role:</strong> {user?.role || 'Unknown'}
//               </p>
//               <p className="text-sm text-red-800 mt-1">
//                 <strong>Required Roles:</strong> Admin, HR Manager, or HR Admin
//               </p>
//             </div>
//             <p className="text-sm text-red-600">
//               Please contact your system administrator if you believe you should have access to this section.
//             </p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Resource Type Form
//   const ResourceTypeForm = () => {
//     const [formData, setFormData] = useState({
//       name: '',
//       description: '',
//       is_active: true
//     });

//     const createMutation = useMutation(
//       (data) => api.post('/resource-management/resource-types/', data),
//       {
//         onSuccess: () => {
//           toast.success('Resource type created successfully!');
//           setFormData({ name: '', description: '', is_active: true });
//           queryClient.invalidateQueries('resource-types');
//         },
//         onError: (error) => {
//           console.error('Error creating resource type:', error);
//           const errorMessage = error?.response?.data?.detail || 
//                              error?.response?.data?.message || 
//                              'Failed to create resource type';
//           toast.error(errorMessage);
//         }
//       }
//     );

//     const handleSubmit = (e) => {
//       e.preventDefault();
//       createMutation.mutate(formData);
//     };

//     return (
//       <div className="bg-white rounded-lg border border-gray-200 p-6">
//         <div className="flex items-center justify-between mb-4">
//           <h3 className="text-lg font-semibold text-gray-900">Add Resource Type</h3>
//           <div className="flex items-center space-x-2 text-sm text-gray-500">
//             <ShieldCheckIcon className="h-4 w-4" />
//             <span>Admin Only</span>
//           </div>
//         </div>
        
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Name *
//             </label>
//             <input
//               type="text"
//               value={formData.name}
//               onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//               required
//               className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//               placeholder="e.g., Database, Application, Server"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Description
//             </label>
//             <textarea
//               value={formData.description}
//               onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//               rows={4}
//               className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//               placeholder="Describe this resource type..."
//             />
//           </div>

//           <div className="flex items-center">
//             <input
//               type="checkbox"
//               id="is_active_rt"
//               checked={formData.is_active}
//               onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
//               className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
//             />
//             <label htmlFor="is_active_rt" className="ml-2 block text-sm text-gray-900">
//               Is active
//             </label>
//           </div>

//           <div className="flex space-x-3 pt-4 border-t">
//             <button
//               type="submit"
//               disabled={createMutation.isLoading}
//               className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 font-medium"
//             >
//               {createMutation.isLoading ? 'Saving...' : 'SAVE'}
//             </button>
//             <button
//               type="button"
//               onClick={() => {
//                 handleSubmit({ preventDefault: () => {} });
//                 setFormData({ name: '', description: '', is_active: true });
//               }}
//               disabled={createMutation.isLoading}
//               className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 font-medium"
//             >
//               Save and add another
//             </button>
//           </div>
//         </form>
//       </div>
//     );
//   };

//   // Access Level Form
//   const AccessLevelForm = () => {
//     const [formData, setFormData] = useState({
//       name: '',
//       description: ''
//     });

//     const createMutation = useMutation(
//       (data) => api.post('/resource-management/access-levels/', data),
//       {
//         onSuccess: () => {
//           toast.success('Access level created successfully!');
//           setFormData({ name: '', description: '' });
//           queryClient.invalidateQueries('access-levels');
//         },
//         onError: (error) => {
//           console.error('Error creating access level:', error);
//           const errorMessage = error?.response?.data?.detail || 
//                              error?.response?.data?.message || 
//                              'Failed to create access level';
//           toast.error(errorMessage);
//         }
//       }
//     );

//     const handleSubmit = (e) => {
//       e.preventDefault();
//       createMutation.mutate(formData);
//     };

//     return (
//       <div className="bg-white rounded-lg border border-gray-200 p-6">
//         <div className="flex items-center justify-between mb-4">
//           <h3 className="text-lg font-semibold text-gray-900">Add Access Level</h3>
//           <div className="flex items-center space-x-2 text-sm text-gray-500">
//             <ShieldCheckIcon className="h-4 w-4" />
//             <span>Admin Only</span>
//           </div>
//         </div>
        
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Name *
//             </label>
//             <input
//               type="text"
//               value={formData.name}
//               onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//               required
//               className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//               placeholder="e.g., Read, Write, Admin"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Description
//             </label>
//             <textarea
//               value={formData.description}
//               onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//               rows={4}
//               className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//               placeholder="Describe the permissions for this access level..."
//             />
//           </div>

//           <div className="flex space-x-3 pt-4 border-t">
//             <button
//               type="submit"
//               disabled={createMutation.isLoading}
//               className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 font-medium"
//             >
//               {createMutation.isLoading ? 'Saving...' : 'SAVE'}
//             </button>
//             <button
//               type="button"
//               onClick={() => {
//                 handleSubmit({ preventDefault: () => {} });
//                 setFormData({ name: '', description: '' });
//               }}
//               disabled={createMutation.isLoading}
//               className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 font-medium"
//             >
//               Save and add another
//             </button>
//           </div>
//         </form>
//       </div>
//     );
//   };

//   // Resource Form
//   const ResourceForm = () => {
//     const [formData, setFormData] = useState({
//       name: '',
//       resource_type: '',
//       description: '',
//       endpoint: '',
//       environment: '',
//       resource_team_email: 'resource-team@example.com',
//       requires_approval: false,
//       is_active: true
//     });

//     const { data: resourceTypesResponse } = useQuery(
//       'resource-types',
//       () => api.get('/resource-management/resource-types/')
//     );

//     const resourceTypes = resourceTypesResponse?.data?.results || resourceTypesResponse?.data || [];

//     const createMutation = useMutation(
//       (data) => api.post('/resource-management/resources/', data),
//       {
//         onSuccess: () => {
//           toast.success('Resource created successfully!');
//           setFormData({
//             name: '',
//             resource_type: '',
//             description: '',
//             endpoint: '',
//             environment: '',
//             resource_team_email: 'resource-team@example.com',
//             requires_approval: false,
//             is_active: true
//           });
//           queryClient.invalidateQueries(['resources']);
//         },
//         onError: (error) => {
//           console.error('Error creating resource:', error);
//           const errorMessage = error?.response?.data?.detail || 
//                              error?.response?.data?.message || 
//                              'Failed to create resource';
//           toast.error(errorMessage);
//         }
//       }
//     );

//     const handleSubmit = (e) => {
//       e.preventDefault();
//       createMutation.mutate(formData);
//     };

//     const environments = [
//       { value: '', label: '--------' },
//       { value: 'DEV', label: 'Development' },
//       { value: 'QA', label: 'Quality Assurance' },
//       { value: 'UAT', label: 'User Acceptance Testing' },
//       { value: 'PROD', label: 'Production' }
//     ];

//     return (
//       <div className="bg-white rounded-lg border border-gray-200 p-6">
//         <div className="flex items-center justify-between mb-4">
//           <h3 className="text-lg font-semibold text-gray-900">Add Resource</h3>
//           <div className="flex items-center space-x-2 text-sm text-gray-500">
//             <ShieldCheckIcon className="h-4 w-4" />
//             <span>Admin Only</span>
//           </div>
//         </div>
        
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Name *
//               </label>
//               <input
//                 type="text"
//                 value={formData.name}
//                 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//                 required
//                 className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                 placeholder="Resource name"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Resource Type *
//               </label>
//               <div className="flex items-center space-x-2">
//                 <select
//                   value={formData.resource_type}
//                   onChange={(e) => setFormData({ ...formData, resource_type: e.target.value })}
//                   required
//                   className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                 >
//                   <option value="">--------</option>
//                   {resourceTypes.map(type => (
//                     <option key={type.id} value={type.id}>{type.name}</option>
//                   ))}
//                 </select>
//                 <button 
//                   type="button" 
//                   onClick={() => setActiveForm('resource-type')}
//                   className="text-green-600 hover:text-green-700"
//                   title="Add new resource type"
//                 >
//                   <PlusIcon className="h-5 w-5" />
//                 </button>
//               </div>
//             </div>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Description
//             </label>
//             <textarea
//               value={formData.description}
//               onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//               rows={3}
//               className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//               placeholder="Resource description..."
//             />
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Endpoint
//               </label>
//               <input
//                 type="url"
//                 value={formData.endpoint}
//                 onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
//                 className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                 placeholder="https://example.com/api"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Environment
//               </label>
//               <select
//                 value={formData.environment}
//                 onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
//                 className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//               >
//                 {environments.map(env => (
//                   <option key={env.value} value={env.value}>{env.label}</option>
//                 ))}
//               </select>
//             </div>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Resource Team Email
//             </label>
//             <input
//               type="email"
//               value={formData.resource_team_email}
//               onChange={(e) => setFormData({ ...formData, resource_team_email: e.target.value })}
//               className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//               placeholder="team@example.com"
//             />
//           </div>

//           <div className="flex items-center space-x-6">
//             <div className="flex items-center">
//               <input
//                 type="checkbox"
//                 id="requires_approval"
//                 checked={formData.requires_approval}
//                 onChange={(e) => setFormData({ ...formData, requires_approval: e.target.checked })}
//                 className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
//               />
//               <label htmlFor="requires_approval" className="ml-2 block text-sm text-gray-900">
//                 Requires approval
//               </label>
//             </div>

//             <div className="flex items-center">
//               <input
//                 type="checkbox"
//                 id="is_active_resource"
//                 checked={formData.is_active}
//                 onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
//                 className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
//               />
//               <label htmlFor="is_active_resource" className="ml-2 block text-sm text-gray-900">
//                 Is active
//               </label>
//             </div>
//           </div>

//           <div className="flex space-x-3 pt-4 border-t">
//             <button
//               type="submit"
//               disabled={createMutation.isLoading}
//               className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 font-medium"
//             >
//               {createMutation.isLoading ? 'Saving...' : 'SAVE'}
//             </button>
//             <button
//               type="button"
//               onClick={() => {
//                 handleSubmit({ preventDefault: () => {} });
//                 setFormData({
//                   name: '',
//                   resource_type: '',
//                   description: '',
//                   endpoint: '',
//                   environment: '',
//                   resource_team_email: 'resource-team@example.com',
//                   requires_approval: false,
//                   is_active: true
//                 });
//               }}
//               disabled={createMutation.isLoading}
//               className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 font-medium"
//             >
//               Save and add another
//             </button>
//           </div>
//         </form>
//       </div>
//     );
//   };

//   const adminForms = [
//     { id: 'resource-type', name: 'Resource Type', icon: ServerIcon, component: ResourceTypeForm },
//     { id: 'access-level', name: 'Access Level', icon: KeyIcon, component: AccessLevelForm },
//     { id: 'resource', name: 'Resource', icon: BuildingOfficeIcon, component: ResourceForm }
//   ];

//   const ActiveFormComponent = adminForms.find(f => f.id === activeForm)?.component || ResourceTypeForm;

//   return (
//     <div className="p-6 space-y-6">
//       {/* Admin Header */}
//       <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
//         <div className="flex items-center justify-between">
//           <div>
//             <h2 className="text-2xl font-bold mb-2">Administration Panel</h2>
//             <p className="text-purple-100">
//               Manage resource types, access levels, and system resources
//             </p>
//           </div>
//           <div className="flex items-center space-x-2">
//             <ShieldCheckIcon className="h-8 w-8" />
//             <div className="text-right">
//               <div className="font-medium">{user?.name || user?.username}</div>
//               <div className="text-sm text-purple-200">
//                 {user?.role || 'Admin'}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Form Selector */}
//       <div className="bg-white rounded-lg border border-gray-200 p-4">
//         <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Forms</h3>
//         <div className="flex flex-wrap gap-2">
//           {adminForms.map((form) => {
//             const Icon = form.icon;
//             return (
//               <button
//                 key={form.id}
//                 onClick={() => setActiveForm(form.id)}
//                 className={`flex items-center px-4 py-2 rounded text-sm font-medium transition-colors ${
//                   activeForm === form.id
//                     ? 'bg-blue-600 text-white shadow-md'
//                     : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//                 }`}
//               >
//                 <Icon className="h-4 w-4 mr-2" />
//                 {form.name}
//               </button>
//             );
//           })}
//         </div>
//       </div>

//       {/* Active Form */}
//       <ActiveFormComponent />
//     </div>
//   );
// };

// export default AdminForms;




import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import {
  PlusIcon,
  ServerIcon,
  KeyIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { getCurrentUser, hasAdminPrivileges } from '../../utils/auth';
import api from '../../services/api';

const AdminForms = () => {
  const [activeForm, setActiveForm] = useState('resource-type');
  const [accessVerified, setAccessVerified] = useState(false);
  const queryClient = useQueryClient();
  const user = getCurrentUser();

  // Verify admin access
  useEffect(() => {
    const verifyAccess = () => {
      if (!user) {
        setAccessVerified(false);
        return;
      }
      
      // Check for Admin, HR Manager, or IT Supporter roles
      const userRole = user.role?.toLowerCase() || user.profile?.role?.toLowerCase();
      const hasAccess = userRole === 'admin' || 
                       userRole === 'hr_manager' || 
                       userRole === 'hr_admin' ||
                       userRole === 'it_supporter';
      
      // Alternative using utility function
      const hasAccessAlt = hasAdminPrivileges();
      
      const finalAccess = hasAccess || hasAccessAlt;
      setAccessVerified(finalAccess);
      
      if (!finalAccess) {
        toast.error('Access denied: Admin, HR Manager, or IT Supporter privileges required');
      }
    };

    verifyAccess();
  }, [user]);

  // Get user role display name
  const getUserRoleDisplay = () => {
    const userRole = user?.role || user?.profile?.role;
    switch (userRole) {
      case 'IT_SUPPORTER':
        return 'IT Supporter';
      case 'HR_MANAGER':
        return 'HR Manager';
      case 'ADMIN':
        return 'Administrator';
      default:
        return userRole?.replace('_', ' ') || 'User';
    }
  };

  // If user doesn't have access, show access denied message
  if (!accessVerified) {
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <ShieldCheckIcon className="mx-auto h-16 w-16 text-red-400 mb-4" />
            <h2 className="text-xl font-semibold text-red-900 mb-2">Access Denied</h2>
            <p className="text-red-700 mb-4">
              You don't have permission to access the Admin Forms. This section is restricted to administrators, HR managers, and IT supporters.
            </p>
            <div className="bg-red-100 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800">
                <strong>Current Role:</strong> {getUserRoleDisplay()}
              </p>
              <p className="text-sm text-red-800 mt-1">
                <strong>Required Roles:</strong> Administrator, HR Manager, or IT Supporter
              </p>
            </div>
            <p className="text-sm text-red-600">
              Please contact your system administrator if you believe you should have access to this section.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Resource Type Form
  const ResourceTypeForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      is_active: true
    });

    const createMutation = useMutation(
      (data) => api.post('/resource-management/resource-types/', data),
      {
        onSuccess: () => {
          toast.success('Resource type created successfully!');
          setFormData({ name: '', description: '', is_active: true });
          queryClient.invalidateQueries('resource-types');
        },
        onError: (error) => {
          console.error('Error creating resource type:', error);
          const errorMessage = error?.response?.data?.detail || 
                             error?.response?.data?.message || 
                             'Failed to create resource type';
          toast.error(errorMessage);
        }
      }
    );

    const handleSubmit = (e) => {
      e.preventDefault();
      createMutation.mutate(formData);
    };

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Add Resource Type</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <ShieldCheckIcon className="h-4 w-4" />
            <span>Admin Access Required</span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="e.g., Database, Application, Server"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Describe this resource type..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active_rt"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active_rt" className="ml-2 block text-sm text-gray-900">
              Is active
            </label>
          </div>

          <div className="flex space-x-3 pt-4 border-t">
            <button
              type="submit"
              disabled={createMutation.isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
            >
              {createMutation.isLoading ? 'Saving...' : 'SAVE'}
            </button>
            <button
              type="button"
              onClick={() => {
                handleSubmit({ preventDefault: () => {} });
                setFormData({ name: '', description: '', is_active: true });
              }}
              disabled={createMutation.isLoading}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 font-medium transition-colors"
            >
              Save and add another
            </button>
          </div>
        </form>
      </div>
    );
  };

  // Access Level Form
  const AccessLevelForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      description: ''
    });

    const createMutation = useMutation(
      (data) => api.post('/resource-management/access-levels/', data),
      {
        onSuccess: () => {
          toast.success('Access level created successfully!');
          setFormData({ name: '', description: '' });
          queryClient.invalidateQueries('access-levels');
        },
        onError: (error) => {
          console.error('Error creating access level:', error);
          const errorMessage = error?.response?.data?.detail || 
                             error?.response?.data?.message || 
                             'Failed to create access level';
          toast.error(errorMessage);
        }
      }
    );

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!formData.name?.trim()) {
        toast.error('Please enter a name');
        return;
      }
      createMutation.mutate(formData);
    };

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Add Access Level</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <ShieldCheckIcon className="h-4 w-4" />
            <span>Admin Access Required</span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="e.g., Read, Write, Admin"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Describe the permissions for this access level..."
            />
          </div>

          <div className="flex space-x-3 pt-4 border-t">
            <button
              type="submit"
              disabled={createMutation.isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
            >
              {createMutation.isLoading ? 'Saving...' : 'SAVE'}
            </button>
            <button
              type="button"
              onClick={() => {
                handleSubmit({ preventDefault: () => {} });
                setFormData({ name: '', description: '' });
              }}
              disabled={createMutation.isLoading}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 font-medium transition-colors"
            >
              Save and add another
            </button>
          </div>
        </form>
      </div>
    );
  };

  // Resource Form
  const ResourceForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      resource_type: '',
      description: '',
      endpoint: '',
      environment: '',
      resource_team_email: 'resource-team@example.com',
      requires_approval: false,
      is_active: true
    });

    const { data: resourceTypesResponse } = useQuery(
      'resource-types',
      () => api.get('/resource-management/resource-types/')
    );

    const resourceTypes = resourceTypesResponse?.data?.results || resourceTypesResponse?.data || [];

    const createMutation = useMutation(
      (data) => api.post('/resource-management/resources/', data),
      {
        onSuccess: () => {
          toast.success('Resource created successfully!');
          setFormData({
            name: '',
            resource_type: '',
            description: '',
            endpoint: '',
            environment: '',
            resource_team_email: 'resource-team@example.com',
            requires_approval: false,
            is_active: true
          });
          queryClient.invalidateQueries(['resources']);
        },
        onError: (error) => {
          console.error('Error creating resource:', error);
          let errorMessage = error?.response?.data?.detail || error?.response?.data?.message;
          if (!errorMessage) {
            const data = error?.response?.data;
            if (data && typeof data === 'object') {
              const parts = Object.entries(data).map(([field, errs]) => {
                if (Array.isArray(errs)) return `${field}: ${errs.join(', ')}`;
                if (typeof errs === 'string') return `${field}: ${errs}`;
                try { return `${field}: ${JSON.stringify(errs)}`; } catch { return `${field}`; }
              });
              if (parts.length) errorMessage = parts.join(' | ');
            }
          }
          toast.error(errorMessage || 'Failed to create resource');
        }
      }
    );

    const handleSubmit = (e) => {
      e.preventDefault();
      createMutation.mutate(formData);
    };

    const environments = [
      { value: '', label: '--------' },
      { value: 'DEV', label: 'Development' },
      { value: 'QA', label: 'Quality Assurance' },
      { value: 'UAT', label: 'User Acceptance Testing' },
      { value: 'PROD', label: 'Production' }
    ];

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Add Resource</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <ShieldCheckIcon className="h-4 w-4" />
            <span>Admin Access Required</span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Resource name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resource Type *
              </label>
              <div className="flex items-center space-x-2">
                <select
                  value={formData.resource_type}
                  onChange={(e) => setFormData({ ...formData, resource_type: e.target.value })}
                  required
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">--------</option>
                  {resourceTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
                <button 
                  type="button" 
                  onClick={() => setActiveForm('resource-type')}
                  className="text-green-600 hover:text-green-700 p-1 rounded transition-colors"
                  title="Add new resource type"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Resource description..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Endpoint
              </label>
              <input
                type="url"
                value={formData.endpoint}
                onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="https://example.com/api"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Environment
              </label>
              <select
                value={formData.environment}
                onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              >
                {environments.map(env => (
                  <option key={env.value} value={env.value}>{env.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resource Team Email
            </label>
            <input
              type="email"
              value={formData.resource_team_email}
              onChange={(e) => setFormData({ ...formData, resource_team_email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="team@example.com"
            />
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="requires_approval"
                checked={formData.requires_approval}
                onChange={(e) => setFormData({ ...formData, requires_approval: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="requires_approval" className="ml-2 block text-sm text-gray-900">
                Requires approval
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active_resource"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active_resource" className="ml-2 block text-sm text-gray-900">
                Is active
              </label>
            </div>
          </div>

          <div className="flex space-x-3 pt-4 border-t">
            <button
              type="submit"
              disabled={createMutation.isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
            >
              {createMutation.isLoading ? 'Saving...' : 'SAVE'}
            </button>
            <button
              type="button"
              onClick={() => {
                handleSubmit({ preventDefault: () => {} });
                setFormData({
                  name: '',
                  resource_type: '',
                  description: '',
                  endpoint: '',
                  environment: '',
                  resource_team_email: 'resource-team@example.com',
                  requires_approval: false,
                  is_active: true
                });
              }}
              disabled={createMutation.isLoading}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 font-medium transition-colors"
            >
              Save and add another
            </button>
          </div>
        </form>
      </div>
    );
  };

  const adminForms = [
    { id: 'resource-type', name: 'Resource Type', icon: ServerIcon, component: ResourceTypeForm },
    { id: 'access-level', name: 'Access Level', icon: KeyIcon, component: AccessLevelForm },
    { id: 'resource', name: 'Resource', icon: BuildingOfficeIcon, component: ResourceForm }
  ];

  const ActiveFormComponent = adminForms.find(f => f.id === activeForm)?.component || ResourceTypeForm;

  return (
    <div className="p-6 space-y-6">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Administration Panel</h2>
            <p className="text-purple-100">
              Manage resource types, access levels, and system resources
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <ShieldCheckIcon className="h-8 w-8" />
            <div className="text-right">
              <div className="font-medium">{user?.name || user?.username}</div>
              <div className="text-sm text-purple-200">
                {getUserRoleDisplay()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Forms</h3>
        <div className="flex flex-wrap gap-2">
          {adminForms.map((form) => {
            const Icon = form.icon;
            return (
              <button
                key={form.id}
                onClick={() => setActiveForm(form.id)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeForm === form.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {form.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Form */}
      <ActiveFormComponent />
    </div>
  );
};

export default AdminForms;