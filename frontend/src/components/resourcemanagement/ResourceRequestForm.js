import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { useTheme } from '../../context/ThemeContext';
import {
  ServerIcon,
  KeyIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PaperClipIcon,
  Cog6ToothIcon,
  PhotoIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import { getCurrentUser } from '../../utils/auth';
import api from '../../services/api';

const ResourceRequestForm = () => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    request_type: 'NEW',
    resource_type: '',
    resource: '',
    access_level: '',
    asset: '', // For Asset Repair
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

  // Fetch my assets for repair requests
  const {
    data: myAssetsData,
    isLoading: myAssetsLoading
  } = useQuery(
    'my-assets',
    () => api.get('/assets/assets/?mine=true').then(res => res.data),
    {
      enabled: formData.request_type === 'REPAIR',
      onError: (error) => {
        console.error('Error fetching my assets:', error);
        toast.error('Failed to load your assigned assets');
      }
    }
  );

  // Safely extract my assets array
  const myAssets = React.useMemo(() => {
    if (!myAssetsData) return [];
    if (Array.isArray(myAssetsData)) return myAssetsData;
    if (myAssetsData.results && Array.isArray(myAssetsData.results)) return myAssetsData.results;
    return [];
  }, [myAssetsData]);

  // Safely extract access levels with fallback
  const accessLevels = React.useMemo(() => {
    let rawData = [];
    if (accessLevelsData) {
      if (Array.isArray(accessLevelsData)) {
        rawData = accessLevelsData;
      } else if (accessLevelsData.results && Array.isArray(accessLevelsData.results)) {
        rawData = accessLevelsData.results;
      } else if (accessLevelsData.data && Array.isArray(accessLevelsData.data)) {
        rawData = accessLevelsData.data;
      }
    }

    if (rawData && rawData.length > 0) {
      return rawData;
    }

    // Fallback data
    return [
      { id: 1, name: 'read only', description: 'Read-only access' },
      { id: 2, name: 'write only', description: 'Write-only access' },
      { id: 3, name: 'read and write', description: 'Read and write access' }
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
      ...(name === 'request_type' && value === 'IT' ? { resource_type: '', resource: '', access_level: '', asset: '' } : {}),
      ...(name === 'request_type' && value === 'REPAIR' ? { resource_type: '', resource: '', access_level: '', asset: '' } : {}),
      ...(name === 'request_type' && value === 'NEW' ? { asset: '' } : {}),
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

      // Handle submission based on request type
      if (formData.request_type === 'REPAIR') {
        const repairPayload = {
          asset: parseInt(formData.asset),
          issue_description: finalJustification,
          status: 'PENDING'
        };
        await api.post('/assets/asset-repairs/', repairPayload);
        toast.success('Asset repair request submitted successfully!');
        queryClient.invalidateQueries('asset-repairs');
      } else {
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
      }

      // Common reset
      setFormData({
        request_type: 'NEW',
        resource_type: '',
        resource: '',
        access_level: '',
        asset: '',
        priority: 'MEDIUM',
        justification: '',
        duration: 365
      });
      setJustificationImages([]);
    } catch (error) {
      console.error('Error submitting request:', error);
    } finally {
      setLoading(false);
    }
  };

  const priorityColors = {
    LOW: `${theme.success.bg.replace('/20', '/10')} ${theme.success.text} ${theme.success.border.replace('/30', '/20')}`,
    MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    URGENT: `${theme.danger.bg.replace('/20', '/10')} ${theme.danger.text} ${theme.danger.border.replace('/30', '/20')}`
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
            <div className="h-8 bg-black/10 dark:bg-white/10 rounded w-1/3"></div>
            <div className="h-4 bg-black/10 dark:bg-white/10 rounded w-2/3"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl"></div>
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
          <div className={`${theme.danger.bg.replace('/20', '/10')} border ${theme.danger.border.replace('/30', '/20')} rounded-xl p-6 text-center backdrop-blur-sm`}>
            <ExclamationTriangleIcon className={`mx-auto h-12 w-12 ${theme.danger.text} mb-4`} />
            <h3 className={`text-lg font-bold ${theme.danger.text} mb-2`}>Failed to Load Form Data</h3>
            <p className={`${theme.danger.text.replace('400', '300')} mb-4`}>
              Unable to load resource types. Please check your connection and try again.
            </p>
            <button
              onClick={() => queryClient.invalidateQueries('resource-types')}
              className={`${theme.danger.bg.replace('/20', '/10')} ${theme.danger.text} border ${theme.danger.border.replace('/30', '/20')} px-6 py-2 rounded-lg hover:bg-rose-600/30 transition-colors`}
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
      <div className={`max-w-4xl mx-auto bg-white/5 backdrop-blur-md border ${theme.cardBorder} rounded-2xl shadow-xl p-8`}>
        <div className="mb-8 border-b border-white/10 dark:border-white/10 pb-6">
          <h2 className={`text-2xl font-bold bg-gradient-to-r ${theme.primaryGradient} bg-clip-text text-transparent mb-2`}>New Access Request</h2>
          <p className="text-gray-600 dark:text-gray-400">Submit a request for resource access, asset repair or IT support</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Request Type */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10 dark:border-white/10">
            <label className="block text-sm font-bold text-gray-300 mb-4 tracking-wide uppercase">
              Request Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className={`
                relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300
                ${formData.request_type === 'NEW'
                  ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                  : 'border-white/10 dark:border-white/10 bg-white/5 hover:border-black/20 dark:border-white/20'
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
                <ServerIcon className={`h-6 w-6 mr-3 ${formData.request_type === 'NEW' ? 'text-indigo-400' : 'text-gray-600 dark:text-gray-400'}`} />
                <div>
                  <div className={`font-bold ${formData.request_type === 'NEW' ? 'text-white' : 'text-gray-300'}`}>New Access</div>
                  <div className="text-xs text-slate-400 mt-1">Request access to a resource</div>
                </div>
              </label>

              <label className={`
                relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300
                ${formData.request_type === 'IT'
                  ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                  : 'border-white/10 dark:border-white/10 bg-white/5 hover:border-black/20 dark:border-white/20'
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
                <Cog6ToothIcon className={`h-6 w-6 mr-3 ${formData.request_type === 'IT' ? 'text-purple-400' : 'text-gray-600 dark:text-gray-400'}`} />
                <div>
                  <div className={`font-bold ${formData.request_type === 'IT' ? 'text-white' : 'text-gray-300'}`}>IT Support</div>
                  <div className="text-xs text-slate-400 mt-1">Request IT assistance</div>
                </div>
              </label>

              <label className={`
                relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300
                ${formData.request_type === 'REPAIR'
                  ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.2)]'
                  : 'border-white/10 dark:border-white/10 bg-white/5 hover:border-black/20 dark:border-white/20'
                }
              `}>
                <input
                  type="radio"
                  name="request_type"
                  value="REPAIR"
                  checked={formData.request_type === 'REPAIR'}
                  onChange={handleInputChange}
                  className="sr-only"
                />
                <WrenchScrewdriverIcon className={`h-6 w-6 mr-3 ${formData.request_type === 'REPAIR' ? 'text-orange-400' : 'text-gray-600 dark:text-gray-400'}`} />
                <div>
                  <div className={`font-bold ${formData.request_type === 'REPAIR' ? 'text-white' : 'text-gray-300'}`}>Asset Repair</div>
                  <div className="text-xs text-slate-400 mt-1">Report issue with your equipment</div>
                </div>
              </label>
            </div>
          </div>

          {/* Resource Selection (only for NEW requests) */}
          {
            formData.request_type === 'NEW' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">
                      Resource Type <span className={theme.info.text}>*</span>
                    </label>
                    <select
                      name="resource_type"
                      value={formData.resource_type}
                      onChange={handleInputChange}
                      required
                      disabled={resourceTypesLoading}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:opacity-50 appearance-none"
                    >
                      <option value="" className="bg-white/5 dark:bg-slate-800 text-white">
                        {resourceTypesLoading ? 'Loading...' : 'Select a resource type'}
                      </option>
                      {resourceTypes.map(type => (
                        <option key={type.id} value={type.id} className="bg-white/5 dark:bg-slate-800 text-white">
                          {type.name}
                        </option>
                      ))}
                    </select>
                    {resourceTypes.length === 0 && !resourceTypesLoading && (
                      <p className={`mt-1 text-sm ${theme.danger.text}`}>
                        No resource types available. Please contact your administrator.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-300 mb-2">
                      Resource <span className={theme.info.text}>*</span>
                    </label>
                    <select
                      name="resource"
                      value={formData.resource}
                      onChange={handleInputChange}
                      required
                      disabled={!formData.resource_type || resourcesLoading}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:opacity-50 appearance-none"
                    >
                      <option value="" className="bg-white/5 dark:bg-slate-800 text-white">
                        {resourcesLoading ? 'Loading...' : 'Select a resource'}
                      </option>
                      {resources.map(resource => (
                        <option key={resource.id} value={resource.id} className="bg-white/5 dark:bg-slate-800 text-white">
                          {resource.name} ({resource.environment})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">
                    Access Level <span className={theme.info.text}>*</span>
                  </label>
                  <select
                    name="access_level"
                    value={formData.access_level}
                    onChange={handleInputChange}
                    required
                    disabled={accessLevelsLoading}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:opacity-50 appearance-none"
                  >
                    <option value="" className="bg-white/5 dark:bg-slate-800 text-white">
                      {accessLevelsLoading ? 'Loading...' : 'Select access level'}
                    </option>
                    {accessLevels.map(level => (
                      <option key={level.id} value={level.id} className="bg-white/5 dark:bg-slate-800 text-white">
                        {level.name} - {level.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )
          }

          {/* Asset Selection (only for REPAIR requests) */}
          {
            formData.request_type === 'REPAIR' && (
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  Select Asset <span className="text-orange-400">*</span>
                </label>
                <select
                  name="asset"
                  value={formData.asset}
                  onChange={handleInputChange}
                  required
                  disabled={myAssetsLoading}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 text-white rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors disabled:opacity-50 appearance-none"
                >
                  <option value="" className="bg-white/5 dark:bg-slate-800 text-white">
                    {myAssetsLoading ? 'Loading assets...' : 'Select an asset'}
                  </option>
                  {myAssets.map(asset => (
                    <option key={asset.id} value={asset.id} disabled={asset.is_under_repair} className="bg-white/5 dark:bg-slate-800 text-white">
                      {asset.asset_tag} - {asset.name} {asset.is_under_repair ? '(Under Repair)' : ''}
                    </option>
                  ))}
                </select>
                {myAssets.length === 0 && !myAssetsLoading && (
                  <p className={`mt-1 text-sm ${theme.danger.text}`}>
                    No assigned assets found.
                  </p>
                )}
              </div>
            )
          }

          {/* Priority and Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-6 rounded-xl border border-white/10 dark:border-white/10">
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors appearance-none"
              >
                <option value="LOW" className="bg-white/5 dark:bg-slate-800 text-white">Low</option>
                <option value="MEDIUM" className="bg-white/5 dark:bg-slate-800 text-white">Medium</option>
                <option value="HIGH" className="bg-white/5 dark:bg-slate-800 text-white">High</option>
                <option value="URGENT" className="bg-white/5 dark:bg-slate-800 text-white">Urgent</option>
              </select>
              <div className={`mt-3 px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center border ${formData.priority === 'LOW' ? `${theme.success.bg.replace('/20', '/10')} ${theme.success.text} ${theme.success.border.replace('/30', '/20')}` :
                formData.priority === 'MEDIUM' ? `${theme.warning.bg.replace('/20', '/10')} ${theme.warning.text} ${theme.warning.border.replace('/30', '/20')}` :
                  formData.priority === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                    `${theme.danger.bg.replace('/20', '/10')} ${theme.danger.text} ${theme.danger.border.replace('/30', '/20')}`
                }`}>
                <ExclamationTriangleIcon className="h-4 w-4 mr-1.5" />
                {formData.priority} Priority
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">
                Duration (days)
              </label>
              <div className="relative">
                <ClockIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  min="1"
                  max="3650"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="365"
                />
              </div>
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                How long do you need access? (1-3650 days)
              </p>
            </div>
          </div>

          {/* Justification */}
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">
              Justification / Details <span className={theme.info.text}>*</span>
            </label>
            <textarea
              name="justification"
              value={formData.justification}
              onChange={handleInputChange}
              onPaste={(e) => e.preventDefault()}
              onCopy={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              onContextMenu={(e) => e.preventDefault()}
              required
              rows={6}
              className="w-full px-4 py-3 bg-white/5 text-white border border-white/10 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder-gray-600"
              placeholder="Please provide detailed justification for this request..."
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">
              Supporting Images (optional)
            </label>
            <div className={`border-2 border-dashed ${theme.cardBorder} rounded-xl p-8 text-center hover:bg-white/5 transition-all cursor-pointer group`}>
              <PhotoIcon className="mx-auto h-12 w-12 text-slate-400 group-hover:text-indigo-400 transition-colors" />
              <div className="mt-4">
                <label htmlFor="image-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                    Upload images to support your request
                  </span>
                  <span className="text-xs text-slate-400 mt-1 block">PNG, JPG, GIF up to 5MB each</span>
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
                      className="w-full h-24 object-cover rounded-xl border border-white/10 dark:border-white/10"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      className={`absolute -top-2 -right-2 ${theme.danger.bg} text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg`}
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
          <div className="flex justify-end pt-8 border-t border-white/10 dark:border-white/10">
            <button
              type="submit"
              disabled={loading || createRequestMutation.isLoading}
              className={`px-8 py-3 bg-gradient-to-r ${theme.primaryGradient} text-white font-bold rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading || createRequestMutation.isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting Request...
                </span>
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
