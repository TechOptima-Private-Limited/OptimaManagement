// import React, { useState, useEffect } from 'react';
// import { useMutation, useQuery, useQueryClient } from 'react-query';
// import { toast } from 'react-toastify';
// import {
//   ServerIcon,
//   KeyIcon,
//   ClockIcon,
//   ExclamationTriangleIcon,
//   PaperClipIcon,
//   Cog6ToothIcon,
//   PhotoIcon
// } from '@heroicons/react/24/outline';
// import { getCurrentUser } from '../../utils/auth';
// import api from '../../services/api';

// const ResourceRequestForm = () => {
//   const [formData, setFormData] = useState({
//     request_type: 'NEW',
//     resource_type: '',
//     resource: '',
//     access_level: '',
//     priority: 'MEDIUM',
//     justification: '',
//     duration: 365
//   });
//   const [loading, setLoading] = useState(false);
//   const [justificationImages, setJustificationImages] = useState([]);
//   const queryClient = useQueryClient();
//   const user = getCurrentUser();

//   // Fetch resource types
//   const { data: resourceTypes = [] } = useQuery(
//     'resource-types',
//     () => api.get('http://127.0.0.1:8000/api/resource-management/resource-types/').then(res => res.data.results || res.data)
//   );

//   // Fetch resources based on selected resource type
//   const { data: resources = [] } = useQuery(
//     ['resources', formData.resource_type],
//     () => formData.resource_type 
//       ? api.get(`http://127.0.0.1:8000/api/resource-management/resources/?resource_type=${formData.resource_type}`).then(res => res.data.results || res.data)
//       : Promise.resolve([]),
//     {
//       enabled: !!formData.resource_type
//     }
//   );

//   // Fetch access levels
//   const { data: accessLevels = [] } = useQuery(
//     'access-levels',
//     () => api.get('http://127.0.0.1:8000/api/resource-management/access-levels/').then(res => res.data)
//       .catch(() => [
//         { id: 1, name: 'Read', description: 'Read-only access' },
//         { id: 2, name: 'Write', description: 'Read and write access' },
//         { id: 3, name: 'Admin', description: 'Full administrative access' }
//       ])
//   );

//   const createRequestMutation = useMutation(
//     (requestData) => api.post('http://127.0.0.1:8000/api/resource-management/access-requests/', requestData),
//     {
//       onSuccess: () => {
//         toast.success('Access request submitted successfully!');
//         queryClient.invalidateQueries('access-requests');
//         setFormData({
//           request_type: 'NEW',
//           resource_type: '',
//           resource: '',
//           access_level: '',
//           priority: 'MEDIUM',
//           justification: '',
//           duration: 365
//         });
//         setJustificationImages([]);
//       },
//       onError: (error) => {
//         console.error('Error creating request:', error);
//         toast.error('Failed to submit request. Please try again.');
//       }
//     }
//   );

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value,
//       // Reset dependent fields
//       ...(name === 'request_type' && value === 'IT' ? { resource_type: '', resource: '', access_level: '' } : {}),
//       ...(name === 'resource_type' ? { resource: '' } : {})
//     }));
//   };

//   const handleImageUpload = async (e) => {
//     const files = Array.from(e.target.files);
    
//     for (const file of files) {
//       if (file.size > 5 * 1024 * 1024) { // 5MB limit
//         toast.error('Image size should be less than 5MB');
//         continue;
//       }

//       const reader = new FileReader();
//       reader.onload = (event) => {
//         const imageData = event.target.result;
//         const newImage = {
//           id: Date.now() + Math.random(),
//           file,
//           preview: imageData,
//           uploaded: false
//         };
//         setJustificationImages(prev => [...prev, newImage]);
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const removeImage = (imageId) => {
//     setJustificationImages(prev => prev.filter(img => img.id !== imageId));
//   };

//   const uploadImage = async (image) => {
//     try {
//       const uploadData = {
//         image: image.preview,
//         filename: image.file.name
//       };
      
//       const response = await api.post('http://127.0.0.1:8000/api/resource-management/access-requests/upload_image/', uploadData);
//       return response.data.url;
//     } catch (error) {
//       console.error('Error uploading image:', error);
//       throw error;
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       let finalJustification = formData.justification;

//       // Upload images and update justification with image URLs
//       if (justificationImages.length > 0) {
//         let imageHtml = '';
//         for (const image of justificationImages) {
//           try {
//             const imageUrl = await uploadImage(image);
//             imageHtml += `<p><img src="${imageUrl}" alt="Uploaded image" style="max-width: 100%; height: auto; margin: 10px 0;" /></p>`;
//           } catch (error) {
//             console.error('Failed to upload image:', error);
//             toast.error(`Failed to upload image: ${image.file.name}`);
//           }
//         }
//         finalJustification = formData.justification + imageHtml;
//       }

//       const requestData = {
//         ...formData,
//         justification: finalJustification,
//         user: user?.id
//       };

//       // Remove empty fields for IT requests
//       if (formData.request_type === 'IT') {
//         delete requestData.resource_type;
//         delete requestData.resource;
//         delete requestData.access_level;
//       }

//       await createRequestMutation.mutateAsync(requestData);
//     } catch (error) {
//       console.error('Error submitting request:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const priorityColors = {
//     LOW: 'bg-green-100 text-green-800 border-green-200',
//     MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
//     HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
//     URGENT: 'bg-red-100 text-red-800 border-red-200'
//   };

//   return (
//     <div className="p-6">
//       <div className="max-w-4xl mx-auto">
//         <div className="mb-6">
//           <h2 className="text-2xl font-bold text-gray-900 mb-2">New Access Request</h2>
//           <p className="text-gray-600">Submit a request for resource access or IT support</p>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-6">
//           {/* Request Type */}
//           <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
//             <label className="block text-sm font-semibold text-gray-700 mb-3">
//               Request Type
//             </label>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <label className={`
//                 relative flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
//                 ${formData.request_type === 'NEW' 
//                   ? 'border-blue-500 bg-blue-50 shadow-md' 
//                   : 'border-gray-200 bg-white hover:border-gray-300'
//                 }
//               `}>
//                 <input
//                   type="radio"
//                   name="request_type"
//                   value="NEW"
//                   checked={formData.request_type === 'NEW'}
//                   onChange={handleInputChange}
//                   className="sr-only"
//                 />
//                 <ServerIcon className="h-6 w-6 text-blue-600 mr-3" />
//                 <div>
//                   <div className="font-medium text-gray-900">New Access</div>
//                   <div className="text-sm text-gray-500">Request access to a resource</div>
//                 </div>
//               </label>

//               <label className={`
//                 relative flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
//                 ${formData.request_type === 'IT' 
//                   ? 'border-purple-500 bg-purple-50 shadow-md' 
//                   : 'border-gray-200 bg-white hover:border-gray-300'
//                 }
//               `}>
//                 <input
//                   type="radio"
//                   name="request_type"
//                   value="IT"
//                   checked={formData.request_type === 'IT'}
//                   onChange={handleInputChange}
//                   className="sr-only"
//                 />
//                 <Cog6ToothIcon className="h-6 w-6 text-purple-600 mr-3" />
//                 <div>
//                   <div className="font-medium text-gray-900">IT Support</div>
//                   <div className="text-sm text-gray-500">Request IT assistance</div>
//                 </div>
//               </label>
//             </div>
//           </div>

//           {/* Resource Selection (only for NEW requests) */}
//           {formData.request_type === 'NEW' && (
//             <>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                   <label className="block text-sm font-semibold text-gray-700 mb-2">
//                     Resource Type *
//                   </label>
//                   <select
//                     name="resource_type"
//                     value={formData.resource_type}
//                     onChange={handleInputChange}
//                     required
//                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
//                   >
//                     <option value="">Select a resource type</option>
//                     {resourceTypes.map(type => (
//                       <option key={type.id} value={type.id}>
//                         {type.name}
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-semibold text-gray-700 mb-2">
//                     Resource *
//                   </label>
//                   <select
//                     name="resource"
//                     value={formData.resource}
//                     onChange={handleInputChange}
//                     required
//                     disabled={!formData.resource_type}
//                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100"
//                   >
//                     <option value="">Select a resource</option>
//                     {resources.map(resource => (
//                       <option key={resource.id} value={resource.id}>
//                         {resource.name} ({resource.environment})
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-semibold text-gray-700 mb-2">
//                   Access Level *
//                 </label>
//                 <select
//                   name="access_level"
//                   value={formData.access_level}
//                   onChange={handleInputChange}
//                   required
//                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
//                 >
//                   <option value="">Select access level</option>
//                   {accessLevels.map(level => (
//                     <option key={level.id} value={level.id}>
//                       {level.name} - {level.description}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             </>
//           )}

//           {/* Priority and Duration */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div>
//               <label className="block text-sm font-semibold text-gray-700 mb-2">
//                 Priority *
//               </label>
//               <select
//                 name="priority"
//                 value={formData.priority}
//                 onChange={handleInputChange}
//                 required
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
//               >
//                 <option value="LOW">Low</option>
//                 <option value="MEDIUM">Medium</option>
//                 <option value="HIGH">High</option>
//                 <option value="URGENT">Urgent</option>
//               </select>
//               <div className={`mt-2 px-3 py-1 rounded-full text-xs font-medium inline-flex items-center border ${priorityColors[formData.priority]}`}>
//                 <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
//                 {formData.priority} Priority
//               </div>
//             </div>

//             <div>
//               <label className="block text-sm font-semibold text-gray-700 mb-2">
//                 Duration (days) *
//               </label>
//               <div className="relative">
//                 <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//                 <input
//                   type="number"
//                   name="duration"
//                   value={formData.duration}
//                   onChange={handleInputChange}
//                   min="1"
//                   max="3650"
//                   required
//                   className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
//                   placeholder="365"
//                 />
//               </div>
//               <p className="mt-1 text-sm text-gray-500">
//                 How long do you need access? (1-3650 days)
//               </p>
//             </div>
//           </div>

//           {/* Justification */}
//           <div>
//             <label className="block text-sm font-semibold text-gray-700 mb-2">
//               Justification *
//             </label>
//             <textarea
//               name="justification"
//               value={formData.justification}
//               onChange={handleInputChange}
//               required
//               rows={6}
//               className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
//               placeholder="Please provide a detailed justification for this access request..."
//             />
//           </div>

//           {/* Image Upload */}
//           <div>
//             <label className="block text-sm font-semibold text-gray-700 mb-2">
//               Supporting Images (optional)
//             </label>
//             <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
//               <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
//               <div className="mt-4">
//                 <label htmlFor="image-upload" className="cursor-pointer">
//                   <span className="mt-2 block text-sm font-medium text-gray-900">
//                     Upload images to support your request
//                   </span>
//                   <span className="text-sm text-gray-500">PNG, JPG, GIF up to 5MB each</span>
//                 </label>
//                 <input
//                   id="image-upload"
//                   type="file"
//                   multiple
//                   accept="image/*"
//                   onChange={handleImageUpload}
//                   className="sr-only"
//                 />
//               </div>
//             </div>

//             {/* Image Preview */}
//             {justificationImages.length > 0 && (
//               <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
//                 {justificationImages.map((image) => (
//                   <div key={image.id} className="relative group">
//                     <img
//                       src={image.preview}
//                       alt="Preview"
//                       className="w-full h-24 object-cover rounded-lg border border-gray-200"
//                     />
//                     <button
//                       type="button"
//                       onClick={() => removeImage(image.id)}
//                       className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
//                     >
//                       <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                       </svg>
//                     </button>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Submit Button */}
//           <div className="flex justify-end pt-6 border-t border-gray-200">
//             <button
//               type="submit"
//               disabled={loading || createRequestMutation.isLoading}
//               className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
//             >
//               {loading || createRequestMutation.isLoading ? (
//                 <>
//                   <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                   </svg>
//                   Submitting...
//                 </>
//               ) : (
//                 'Submit Request'
//               )}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default ResourceRequestForm;





import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import {
  ServerIcon,
  KeyIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PaperClipIcon,
  Cog6ToothIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { getCurrentUser } from '../../utils/auth';
import api from '../../services/api';

const ResourceRequestForm = () => {
  const [formData, setFormData] = useState({
    request_type: 'NEW',
    resource_type: '',
    resource: '',
    access_level: '',
    priority: 'MEDIUM',
    justification: '',
    duration: 365
  });
  const [loading, setLoading] = useState(false);
  const [justificationImages, setJustificationImages] = useState([]);
  const queryClient = useQueryClient();
  const user = getCurrentUser();

  // Fetch resource types with better error handling
  const { 
    data: resourceTypesData, 
    isLoading: resourceTypesLoading, 
    error: resourceTypesError 
  } = useQuery(
    'resource-types',
    () => api.get('/resource-management/resource-types/').then(res => res.data),
    {
      onError: (error) => {
        console.error('Error fetching resource types:', error);
        toast.error('Failed to load resource types');
      }
    }
  );

  // Safely extract resourceTypes array
  const resourceTypes = React.useMemo(() => {
    if (!resourceTypesData) return [];
    
    // Handle different response formats
    if (Array.isArray(resourceTypesData)) {
      return resourceTypesData;
    }
    
    if (resourceTypesData.results && Array.isArray(resourceTypesData.results)) {
      return resourceTypesData.results;
    }
    
    if (resourceTypesData.data && Array.isArray(resourceTypesData.data)) {
      return resourceTypesData.data;
    }
    
    console.warn('Unexpected resourceTypes data format:', resourceTypesData);
    return [];
  }, [resourceTypesData]);

  // Fetch resources based on selected resource type
  const { 
    data: resourcesData, 
    isLoading: resourcesLoading 
  } = useQuery(
    ['resources', formData.resource_type],
    () => formData.resource_type 
      ? api.get(`/resource-management/resources/?resource_type=${formData.resource_type}`).then(res => res.data)
      : Promise.resolve([]),
    {
      enabled: !!formData.resource_type,
      onError: (error) => {
        console.error('Error fetching resources:', error);
        toast.error('Failed to load resources');
      }
    }
  );

  // Safely extract resources array
  const resources = React.useMemo(() => {
    if (!resourcesData) return [];
    
    if (Array.isArray(resourcesData)) {
      return resourcesData;
    }
    
    if (resourcesData.results && Array.isArray(resourcesData.results)) {
      return resourcesData.results;
    }
    
    if (resourcesData.data && Array.isArray(resourcesData.data)) {
      return resourcesData.data;
    }
    
    return [];
  }, [resourcesData]);

  // Fetch access levels
  const { 
    data: accessLevelsData, 
    isLoading: accessLevelsLoading 
  } = useQuery(
    'access-levels',
    () => api.get('/resource-management/access-levels/').then(res => res.data),
    {
      retry: 1,
      onError: (error) => {
        console.error('Error fetching access levels:', error);
        // Don't show error toast for access levels as we have fallback data
      }
    }
  );

  // Safely extract access levels with fallback
  const accessLevels = React.useMemo(() => {
    if (accessLevelsData) {
      if (Array.isArray(accessLevelsData)) {
        return accessLevelsData;
      }
      
      if (accessLevelsData.results && Array.isArray(accessLevelsData.results)) {
        return accessLevelsData.results;
      }
      
      if (accessLevelsData.data && Array.isArray(accessLevelsData.data)) {
        return accessLevelsData.data;
      }
    }
    
    // Fallback data
    return [
      { id: 1, name: 'Read', description: 'Read-only access' },
      { id: 2, name: 'Write', description: 'Read and write access' },
      { id: 3, name: 'Admin', description: 'Full administrative access' }
    ];
  }, [accessLevelsData]);

  // Whether access levels actually came from API (vs fallback)
  const accessLevelsFromApi = !!accessLevelsData;

  const createRequestMutation = useMutation(
    (requestData) => api.post('/resource-management/access-requests/', requestData),
    {
      onSuccess: () => {
        toast.success('Access request submitted successfully!');
        queryClient.invalidateQueries('access-requests');
        setFormData({
          request_type: 'NEW',
          resource_type: '',
          resource: '',
          access_level: '',
          priority: 'MEDIUM',
          justification: '',
          duration: 365
        });
        setJustificationImages([]);
      },
      onError: (error) => {
        console.error('Error creating request:', error);
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
        toast.error(errorMessage || 'Failed to submit request. Please try again.');
      }
    }
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset dependent fields
      ...(name === 'request_type' && value === 'IT' ? { resource_type: '', resource: '', access_level: '' } : {}),
      ...(name === 'resource_type' ? { resource: '' } : {})
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        continue;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target.result;
        const newImage = {
          id: Date.now() + Math.random(),
          file,
          preview: imageData,
          uploaded: false
        };
        setJustificationImages(prev => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (imageId) => {
    setJustificationImages(prev => prev.filter(img => img.id !== imageId));
  };

  const uploadImage = async (image) => {
    try {
      const uploadData = {
        image: image.preview,
        filename: image.file.name
      };
      
      const response = await api.post('/resource-management/access-requests/upload_image/', uploadData);
      return response.data.url;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalJustification = formData.justification;

      // Upload images and update justification with image URLs
      if (justificationImages.length > 0) {
        let imageHtml = '';
        for (const image of justificationImages) {
          try {
            const imageUrl = await uploadImage(image);
            imageHtml += `<p><img src="${imageUrl}" alt="Uploaded image" style="max-width: 100%; height: auto; margin: 10px 0;" /></p>`;
          } catch (error) {
            console.error('Failed to upload image:', error);
            toast.error(`Failed to upload image: ${image.file.name}`);
          }
        }
        finalJustification = formData.justification + imageHtml;
      }

      // Validate required fields for NEW requests
      if (formData.request_type === 'NEW') {
        if (!formData.resource_type) {
          toast.error('Please select a resource type');
          setLoading(false);
          return;
        }
        if (!formData.resource) {
          toast.error('Please select a resource');
          setLoading(false);
          return;
        }
        // Only require access_level if we actually loaded them from API
        if (accessLevelsFromApi && !formData.access_level) {
          toast.error('Please select an access level');
          setLoading(false);
          return;
        }
      }

      // General validations
      if (!formData.justification?.trim()) {
        toast.error('Please provide justification');
        setLoading(false);
        return;
      }
      if (!formData.duration || Number(formData.duration) < 1) {
        toast.error('Duration must be at least 1 day');
        setLoading(false);
        return;
      }

      // Build payload only with fields accepted by backend serializer
      let requestData = {
        request_type: formData.request_type,
        priority: formData.priority,
        justification: finalJustification,
        duration: Number(formData.duration),
      };

      if (formData.request_type === 'NEW') {
        requestData = {
          ...requestData,
          resource: Number(formData.resource),
          ...(accessLevelsFromApi && formData.access_level
            ? { access_level: Number(formData.access_level) }
            : {}),
        };
      }

      await createRequestMutation.mutateAsync(requestData);
    } catch (error) {
      console.error('Error submitting request:', error);
    } finally {
      setLoading(false);
    }
  };

  const priorityColors = {
    LOW: 'bg-green-100 text-green-800 border-green-200',
    MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
    URGENT: 'bg-red-100 text-red-800 border-red-200'
  };

  // Debug logging
  useEffect(() => {
    console.log('ResourceRequestForm Debug:', {
      resourceTypesData,
      resourceTypes,
      resourceTypesLoading,
      resourceTypesError
    });
  }, [resourceTypesData, resourceTypes, resourceTypesLoading, resourceTypesError]);

  // Show loading state
  if (resourceTypesLoading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (resourceTypesError) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">Failed to Load Form Data</h3>
            <p className="text-red-700 mb-4">
              Unable to load resource types. Please check your connection and try again.
            </p>
            <button
              onClick={() => queryClient.invalidateQueries('resource-types')}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">New Access Request</h2>
          <p className="text-gray-600">Submit a request for resource access or IT support</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Request Type */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Request Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className={`
                relative flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                ${formData.request_type === 'NEW' 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }
              `}>
                <input
                  type="radio"
                  name="request_type"
                  value="NEW"
                  checked={formData.request_type === 'NEW'}
                  onChange={handleInputChange}
                  className="sr-only"
                />
                <ServerIcon className="h-6 w-6 text-blue-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">New Access</div>
                  <div className="text-sm text-gray-500">Request access to a resource</div>
                </div>
              </label>

              <label className={`
                relative flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                ${formData.request_type === 'IT' 
                  ? 'border-purple-500 bg-purple-50 shadow-md' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }
              `}>
                <input
                  type="radio"
                  name="request_type"
                  value="IT"
                  checked={formData.request_type === 'IT'}
                  onChange={handleInputChange}
                  className="sr-only"
                />
                <Cog6ToothIcon className="h-6 w-6 text-purple-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">IT Support</div>
                  <div className="text-sm text-gray-500">Request IT assistance</div>
                </div>
              </label>
            </div>
          </div>

          {/* Resource Selection (only for NEW requests) */}
          {formData.request_type === 'NEW' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Resource Type *
                  </label>
                  <select
                    name="resource_type"
                    value={formData.resource_type}
                    onChange={handleInputChange}
                    required
                    disabled={resourceTypesLoading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100"
                  >
                    <option value="">
                      {resourceTypesLoading ? 'Loading...' : 'Select a resource type'}
                    </option>
                    {resourceTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                  {resourceTypes.length === 0 && !resourceTypesLoading && (
                    <p className="mt-1 text-sm text-red-500">
                      No resource types available. Please contact your administrator.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Resource *
                  </label>
                  <select
                    name="resource"
                    value={formData.resource}
                    onChange={handleInputChange}
                    required
                    disabled={!formData.resource_type || resourcesLoading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100"
                  >
                    <option value="">
                      {resourcesLoading ? 'Loading...' : 'Select a resource'}
                    </option>
                    {resources.map(resource => (
                      <option key={resource.id} value={resource.id}>
                        {resource.name} ({resource.environment})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Access Level *
                </label>
                <select
                  name="access_level"
                  value={formData.access_level}
                  onChange={handleInputChange}
                  required
                  disabled={accessLevelsLoading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100"
                >
                  <option value="">
                    {accessLevelsLoading ? 'Loading...' : 'Select access level'}
                  </option>
                  {accessLevels.map(level => (
                    <option key={level.id} value={level.id}>
                      {level.name} - {level.description}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Priority and Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Priority *
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
              <div className={`mt-2 px-3 py-1 rounded-full text-xs font-medium inline-flex items-center border ${priorityColors[formData.priority]}`}>
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                {formData.priority} Priority
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Duration (days) *
              </label>
              <div className="relative">
                <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  min="1"
                  max="3650"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="365"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                How long do you need access? (1-3650 days)
              </p>
            </div>
          </div>

          {/* Justification */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Justification *
            </label>
            <textarea
              name="justification"
              value={formData.justification}
              onChange={handleInputChange}
              required
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Please provide a detailed justification for this access request..."
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Supporting Images (optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label htmlFor="image-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Upload images to support your request
                  </span>
                  <span className="text-sm text-gray-500">PNG, JPG, GIF up to 5MB each</span>
                </label>
                <input
                  id="image-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="sr-only"
                />
              </div>
            </div>

            {/* Image Preview */}
            {justificationImages.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {justificationImages.map((image) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.preview}
                      alt="Preview"
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading || createRequestMutation.isLoading}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading || createRequestMutation.isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResourceRequestForm;