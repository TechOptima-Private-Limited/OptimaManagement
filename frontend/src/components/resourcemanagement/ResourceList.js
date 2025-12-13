// import React, { useState } from 'react';
// import { useQuery } from 'react-query';
// import {
//   ServerIcon,
//   MagnifyingGlassIcon,
//   FunnelIcon,
//   EyeIcon,
//   ShieldCheckIcon,
//   GlobeAltIcon,
//   CircleStackIcon,
//   ComputerDesktopIcon
// } from '@heroicons/react/24/outline';
// import api from '../../services/api';

// const ResourceList = () => {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [typeFilter, setTypeFilter] = useState('ALL');
//   const [environmentFilter, setEnvironmentFilter] = useState('ALL');
//   const [selectedResource, setSelectedResource] = useState(null);

//   // Fetch resources
//   const { data: resources = [], isLoading } = useQuery(
//     'resources',
//     () => api.get('/api/resource-management/resources/').then(res => res.data.results || res.data)
//   );

//   // Fetch resource types
//   const { data: resourceTypes = [] } = useQuery(
//     'resource-types',
//     () => api.get('/api/resource-management/resource-types/').then(res => res.data.results || res.data)
//   );

//   const environments = [
//     { value: 'ALL', label: 'All Environments' },
//     { value: 'DEV', label: 'Development' },
//     { value: 'QA', label: 'Quality Assurance' },
//     { value: 'UAT', label: 'User Acceptance Testing' },
//     { value: 'PROD', label: 'Production' }
//   ];

//   const filteredResources = resources.filter(resource => {
//     const matchesSearch = searchTerm === '' || 
//       resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       resource.endpoint?.toLowerCase().includes(searchTerm.toLowerCase());
    
//     const matchesType = typeFilter === 'ALL' || resource.resource_type === parseInt(typeFilter);
//     const matchesEnvironment = environmentFilter === 'ALL' || resource.environment === environmentFilter;
    
//     return matchesSearch && matchesType && matchesEnvironment && resource.is_active;
//   });

//   const getResourceIcon = (resourceTypeName) => {
//     switch (resourceTypeName?.toLowerCase()) {
//       case 'database':
//         return CircleStackIcon;
//       case 'server':
//         return ServerIcon;
//       case 'application':
//         return ComputerDesktopIcon;
//       case 'api':
//         return GlobeAltIcon;
//       default:
//         return ServerIcon;
//     }
//   };

//   const getEnvironmentBadge = (environment) => {
//     const badges = {
//       'DEV': 'bg-blue-100 text-blue-800 border-blue-200',
//       'QA': 'bg-yellow-100 text-yellow-800 border-yellow-200',
//       'UAT': 'bg-purple-100 text-purple-800 border-purple-200',
//       'PROD': 'bg-red-100 text-red-800 border-red-200'
//     };
//     return badges[environment] || 'bg-gray-100 text-gray-800 border-gray-200';
//   };

//   const ResourceDetailModal = ({ resource, onClose }) => {
//     if (!resource) return null;

//     const Icon = getResourceIcon(resource.resource_type_name);

//     return (
//       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//         <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
//           <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center space-x-3">
//                 <div className="p-2 bg-blue-100 rounded-lg">
//                   <Icon className="h-6 w-6 text-blue-600" />
//                 </div>
//                 <div>
//                   <h3 className="text-lg font-semibold text-gray-900">{resource.name}</h3>
//                   <p className="text-sm text-gray-500">{resource.resource_type_name}</p>
//                 </div>
//               </div>
//               <button
//                 onClick={onClose}
//                 className="p-2 hover:bg-gray-100 rounded-full transition-colors"
//               >
//                 <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                 </svg>
//               </button>
//             </div>
//           </div>
          
//           <div className="p-6 space-y-6">
//             {/* Basic Info */}
//             <div>
//               <h4 className="text-lg font-medium text-gray-900 mb-4">Resource Information</h4>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Environment</label>
//                   <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getEnvironmentBadge(resource.environment)}`}>
//                     {resource.environment}
//                   </span>
//                 </div>
                
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">Requires Approval</label>
//                   <div className="flex items-center">
//                     {resource.requires_approval ? (
//                       <ShieldCheckIcon className="h-5 w-5 text-orange-500 mr-2" />
//                     ) : (
//                       <ShieldCheckIcon className="h-5 w-5 text-green-500 mr-2" />
//                     )}
//                     <span className={resource.requires_approval ? 'text-orange-700' : 'text-green-700'}>
//                       {resource.requires_approval ? 'Yes' : 'No'}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Description */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
//               <p className="text-gray-900 bg-gray-50 rounded-lg p-4">{resource.description}</p>
//             </div>

//             {/* Endpoint */}
//             {resource.endpoint && (
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">Endpoint</label>
//                 <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-4">
//                   <GlobeAltIcon className="h-5 w-5 text-gray-400" />
//                   <code className="text-sm text-gray-900 font-mono">{resource.endpoint}</code>
//                 </div>
//               </div>
//             )}

//             {/* Team Contact */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Resource Team</label>
//               <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-4">
//                 <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
//                 </svg>
//                 <span className="text-gray-900">{resource.resource_team_email}</span>
//               </div>
//             </div>

//             {/* Timestamps */}
//             <div className="border-t pt-4">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
//                 <div>
//                   <span className="text-gray-500">Created:</span>
//                   <span className="ml-2 text-gray-900">
//                     {new Date(resource.created_at).toLocaleDateString('en-US', {
//                       year: 'numeric',
//                       month: 'short',
//                       day: 'numeric'
//                     })}
//                   </span>
//                 </div>
//                 <div>
//                   <span className="text-gray-500">Updated:</span>
//                   <span className="ml-2 text-gray-900">
//                     {new Date(resource.updated_at).toLocaleDateString('en-US', {
//                       year: 'numeric',
//                       month: 'short',
//                       day: 'numeric'
//                     })}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   if (isLoading) {
//     return (
//       <div className="p-6">
//         <div className="animate-pulse space-y-4">
//           {[...Array(5)].map((_, i) => (
//             <div key={i} className="bg-gray-200 rounded-xl h-24"></div>
//           ))}
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="p-6">
//       <div className="mb-6">
//         <h2 className="text-2xl font-bold text-gray-900 mb-2">Available Resources</h2>
//         <p className="text-gray-600">Browse and explore available resources you can request access to</p>
//       </div>

//       {/* Filters */}
//       <div className="mb-6 space-y-4">
//         {/* Search */}
//         <div className="relative max-w-md">
//           <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//           <input
//             type="text"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             placeholder="Search resources..."
//             className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//           />
//         </div>

//         {/* Filter Dropdowns */}
//         <div className="flex flex-wrap gap-4">
//           <div className="flex items-center space-x-2">
//             <FunnelIcon className="h-5 w-5 text-gray-400" />
//             <select
//               value={typeFilter}
//               onChange={(e) => setTypeFilter(e.target.value)}
//               className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//             >
//               <option value="ALL">All Types</option>
//               {resourceTypes.map(type => (
//                 <option key={type.id} value={type.id}>{type.name}</option>
//               ))}
//             </select>
//           </div>

//           <select
//             value={environmentFilter}
//             onChange={(e) => setEnvironmentFilter(e.target.value)}
//             className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//           >
//             {environments.map(env => (
//               <option key={env.value} value={env.value}>{env.label}</option>
//             ))}
//           </select>
//         </div>
//       </div>

//       {/* Resources Grid */}
//       {filteredResources.length === 0 ? (
//         <div className="text-center py-12 bg-gray-50 rounded-xl">
//           <ServerIcon className="mx-auto h-12 w-12 text-gray-400" />
//           <h3 className="mt-2 text-sm font-medium text-gray-900">No resources found</h3>
//           <p className="mt-1 text-sm text-gray-500">
//             Try adjusting your search or filters.
//           </p>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {filteredResources.map((resource) => {
//             const Icon = getResourceIcon(resource.resource_type_name);
            
//             return (
//               <div
//                 key={resource.id}
//                 className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group"
//                 onClick={() => setSelectedResource(resource)}
//               >
//                 <div className="flex items-start justify-between mb-4">
//                   <div className="flex items-center space-x-3">
//                     <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
//                       <Icon className="h-6 w-6 text-blue-600" />
//                     </div>
//                     <div>
//                       <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
//                         {resource.name}
//                       </h3>
//                       <p className="text-sm text-gray-500">{resource.resource_type_name}</p>
//                     </div>
//                   </div>
                  
//                   <div className="flex items-center space-x-2">
//                     <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getEnvironmentBadge(resource.environment)}`}>
//                       {resource.environment}
//                     </span>
//                     <EyeIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
//                   </div>
//                 </div>

//                 <p className="text-sm text-gray-600 mb-4 line-clamp-2">
//                   {resource.description}
//                 </p>

//                 <div className="flex items-center justify-between text-sm">
//                   <div className="flex items-center space-x-2">
//                     {resource.requires_approval ? (
//                       <>
//                         <ShieldCheckIcon className="h-4 w-4 text-orange-500" />
//                         <span className="text-orange-700">Approval Required</span>
//                       </>
//                     ) : (
//                       <>
//                         <ShieldCheckIcon className="h-4 w-4 text-green-500" />
//                         <span className="text-green-700">Direct Access</span>
//                       </>
//                     )}
//                   </div>
                  
//                   {resource.endpoint && (
//                     <div className="flex items-center space-x-1 text-gray-500">
//                       <GlobeAltIcon className="h-4 w-4" />
//                       <span>Endpoint Available</span>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       )}

//       {/* Resource Detail Modal */}
//       <ResourceDetailModal 
//         resource={selectedResource} 
//         onClose={() => setSelectedResource(null)} 
//       />
//     </div>
//   );
// };

// export default ResourceList;




import React, { useState } from 'react';
import { useQuery } from 'react-query';
import {
  ServerIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  CircleStackIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';

const ResourceList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [environmentFilter, setEnvironmentFilter] = useState('ALL');
  const [selectedResource, setSelectedResource] = useState(null);

  // Fetch resources
  const { data: resources = [], isLoading } = useQuery(
    'resources',
    () => api.get('/resource-management/resources/').then(res => res.data.results || res.data),
    {
      onError: (error) => {
        console.error('Error fetching resources:', error);
      }
    }
  );

  // Fetch resource types - Fixed to handle different response structures
  const { data: resourceTypes = [], isLoading: isLoadingTypes } = useQuery(
    'resource-types',
    () => api.get('/resource-management/resource-types/')
      .then(res => {
        const data = res.data.results || res.data;
        // Ensure we always return an array
        return Array.isArray(data) ? data : [];
      })
      .catch(error => {
        console.error('Error fetching resource types:', error);
        return []; // Return empty array on error
      }),
    {
      onError: (error) => {
        console.error('Error fetching resource types:', error);
      }
    }
  );

  const environments = [
    { value: 'ALL', label: 'All Environments' },
    { value: 'DEV', label: 'Development' },
    { value: 'QA', label: 'Quality Assurance' },
    { value: 'UAT', label: 'User Acceptance Testing' },
    { value: 'PROD', label: 'Production' }
  ];

  const filteredResources = resources.filter(resource => {
    const matchesSearch = searchTerm === '' || 
      resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.endpoint?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'ALL' || resource.resource_type === parseInt(typeFilter);
    const matchesEnvironment = environmentFilter === 'ALL' || resource.environment === environmentFilter;
    
    return matchesSearch && matchesType && matchesEnvironment && resource.is_active;
  });

  const getResourceIcon = (resourceTypeName) => {
    switch (resourceTypeName?.toLowerCase()) {
      case 'database':
        return CircleStackIcon;
      case 'server':
        return ServerIcon;
      case 'application':
        return ComputerDesktopIcon;
      case 'api':
        return GlobeAltIcon;
      default:
        return ServerIcon;
    }
  };

  const getEnvironmentBadge = (environment) => {
    const badges = {
      'DEV': 'bg-blue-100 text-blue-800 border-blue-200',
      'QA': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'UAT': 'bg-purple-100 text-purple-800 border-purple-200',
      'PROD': 'bg-red-100 text-red-800 border-red-200'
    };
    return badges[environment] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const ResourceDetailModal = ({ resource, onClose }) => {
    if (!resource) return null;

    const Icon = getResourceIcon(resource.resource_type_name);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{resource.name}</h3>
                  <p className="text-sm text-gray-500">{resource.resource_type_name}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Resource Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Environment</label>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getEnvironmentBadge(resource.environment)}`}>
                    {resource.environment}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Requires Approval</label>
                  <div className="flex items-center">
                    {resource.requires_approval ? (
                      <ShieldCheckIcon className="h-5 w-5 text-orange-500 mr-2" />
                    ) : (
                      <ShieldCheckIcon className="h-5 w-5 text-green-500 mr-2" />
                    )}
                    <span className={resource.requires_approval ? 'text-orange-700' : 'text-green-700'}>
                      {resource.requires_approval ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <p className="text-gray-900 bg-gray-50 rounded-lg p-4">{resource.description}</p>
            </div>

            {/* Endpoint */}
            {resource.endpoint && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Endpoint</label>
                <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-4">
                  <GlobeAltIcon className="h-5 w-5 text-gray-400" />
                  <code className="text-sm text-gray-900 font-mono">{resource.endpoint}</code>
                </div>
              </div>
            )}

            {/* Team Contact */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Resource Team</label>
              <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-4">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
                <span className="text-gray-900">{resource.resource_team_email}</span>
              </div>
            </div>

            {/* Timestamps */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Created:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(resource.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Updated:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(resource.updated_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading || isLoadingTypes) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-xl h-24"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Available Resources</h2>
        <p className="text-gray-600">Browse and explore available resources you can request access to</p>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search resources..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Types</option>
              {Array.isArray(resourceTypes) && resourceTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>

          <select
            value={environmentFilter}
            onChange={(e) => setEnvironmentFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {environments.map(env => (
              <option key={env.value} value={env.value}>{env.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Resources Grid */}
      {filteredResources.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <ServerIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No resources found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => {
            const Icon = getResourceIcon(resource.resource_type_name);
            
            return (
              <div
                key={resource.id}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                onClick={() => setSelectedResource(resource)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {resource.name}
                      </h3>
                      <p className="text-sm text-gray-500">{resource.resource_type_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getEnvironmentBadge(resource.environment)}`}>
                      {resource.environment}
                    </span>
                    <EyeIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {resource.description}
                </p>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    {resource.requires_approval ? (
                      <>
                        <ShieldCheckIcon className="h-4 w-4 text-orange-500" />
                        <span className="text-orange-700">Approval Required</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheckIcon className="h-4 w-4 text-green-500" />
                        <span className="text-green-700">Direct Access</span>
                      </>
                    )}
                  </div>
                  
                  {resource.endpoint && (
                    <div className="flex items-center space-x-1 text-gray-500">
                      <GlobeAltIcon className="h-4 w-4" />
                      <span>Endpoint Available</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Resource Detail Modal */}
      <ResourceDetailModal 
        resource={selectedResource} 
        onClose={() => setSelectedResource(null)} 
      />
    </div>
  );
};

export default ResourceList;