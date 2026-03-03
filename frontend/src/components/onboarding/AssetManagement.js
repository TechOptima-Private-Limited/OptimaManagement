// import React, { useState, useEffect } from 'react';
// import { toast } from 'react-toastify';
// import { 
//   PlusIcon,
//   ComputerDesktopIcon,
//   DevicePhoneMobileIcon,
//   IdentificationIcon,
//   CreditCardIcon,
//   WrenchScrewdriverIcon,
//   MagnifyingGlassIcon,
//   PencilIcon,
//   TrashIcon
// } from '@heroicons/react/24/outline';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  PlusIcon,
  ComputerDesktopIcon,
  IdentificationIcon,
  CursorArrowRaysIcon,
  RectangleStackIcon,
  WrenchScrewdriverIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { getCurrentUser } from '../../utils/auth';
import api from '../../services/api';

const AssetManagement = () => {
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [newAsset, setNewAsset] = useState({
    employee: '',
    asset_type: 'laptop',
    description: '',
    serial_number: '',
    issued_date: ''
  });
  const { id: repairIdParam } = useParams();
  const location = useLocation();
  const repairRefs = useRef({});

  const openAssetDetails = async (asset) => {
    try {
      const id = asset?.id;
      if (!id) return;
      const resp = await requestWithRetry(() => api.get(`/assets/assets/${id}/`));
      setDetailsAsset(resp?.data || null);
      setShowDetailsModal(true);
    } catch (e) {
      console.error('Failed to load asset details:', e);
      toast.error('Failed to load asset details');
    }
  };

  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [typeForm, setTypeForm] = useState({ name: '', category: 'Hardware', tag_prefix: '', description: '', asset_team_email: '', is_active: true });
  const [showAddSoftwareModal, setShowAddSoftwareModal] = useState(false);
  const [softwareForm, setSoftwareForm] = useState({ asset_type: 'Keka', name: '', asset_tag: '', serial_number: '', status: 'available', is_active: true, custom_attributes: '{}' });
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    employee: '',
    asset_type: '',
    asset: null,
    assets: [],
    isSoftware: false,
    manager_email: '',
    notes: ''
  });
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnForm, setReturnForm] = useState({ user: '', returned_assets: [], damaged_file: null, remarks: '', is_offboarded: false });
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusForm, setStatusForm] = useState({ employee: '', status: '', notes: '' });
  const [assetTypes, setAssetTypes] = useState([]);
  const [softwareAssets, setSoftwareAssets] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [returnsList, setReturnsList] = useState([]);
  const [offboardings, setOffboardings] = useState([]);
  const [employeeStatuses, setEmployeeStatuses] = useState([]);
  const [repairsList, setRepairsList] = useState([]);
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [repairForm, setRepairForm] = useState({
    asset: null,
    issue_description: '',
    status: 'PENDING',
    repair_vendor: '',
    repair_cost: '',
    estimated_completion: '',
    repair_notes: ''
  });
  const [showAddHardwareModal, setShowAddHardwareModal] = useState(false);
  const [hardwareForm, setHardwareForm] = useState({ asset_type: 'laptop', name: '', asset_tag: '', serial_number: '', status: 'available', is_active: true, custom_attributes: '{}', purchased_date: '', image_before: null, image_after: null });
  const currentUser = getCurrentUser();
  // Asset admin: strictly users whose profile.role is 'ADMIN'. HR_MANAGER should be read-only.
  const isAssetAdmin =
    currentUser?.profile?.role === 'ADMIN' ||
    currentUser?.profile?.role === 'IT_SUPPORTER';
  const [activeSection, setActiveSection] = useState(isAssetAdmin ? 'types' : 'hardware');
  // Effective Django permissions for current user
  const [permissions, setPermissions] = useState([]);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsAsset, setDetailsAsset] = useState(null);

  // Lightweight retry wrapper for API calls in this component
  const requestWithRetry = async (fn, retries = 2, delayMs = 300) => {
    try {
      return await fn();
    } catch (err) {
      if (retries <= 0) throw err;
      await new Promise(res => setTimeout(res, delayMs));
      return requestWithRetry(fn, retries - 1, delayMs * 2);
    }
  };

  // Export to Excel functionality
  const [exportingExcel, setExportingExcel] = useState(false);

  const handleExportToExcel = async () => {
    try {
      setExportingExcel(true);
      const token = localStorage.getItem('access_token');

      const apiBase = process.env.REACT_APP_API_URL || `${window.location.protocol}//${window.location.hostname}:8080/api`;
      const response = await fetch(`${apiBase}/assets/export/excel/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'asset_management_export.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Excel file downloaded successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data to Excel');
    } finally {
      setExportingExcel(false);
    }
  };


  const ensureAssetType = async (name, category = 'HARDWARE') => {
    const lower = String(name || '').toLowerCase();
    const tagPrefix = String(name || '').slice(0, 3).toUpperCase();
    const existingByName = (assetTypes || []).find(t => String(t.name).toLowerCase() === lower);
    if (existingByName) return existingByName;
    const existingByPrefix = (assetTypes || []).find(t => String(t.tag_prefix).toUpperCase() === tagPrefix);
    if (existingByPrefix) return existingByPrefix;

    const user = getCurrentUser?.() || null;
    const email = user?.email || user?.profile?.email || '';
    const payload = {
      name,
      tag_prefix: tagPrefix,
      description: name,
      asset_team_email: email,
      is_active: true,
      category: String(category || 'HARDWARE').toUpperCase(),
    };
    try {
      const resp = await requestWithRetry(() => api.post('/assets/asset-types/', payload));
      const created = resp.data;
      setAssetTypes(prev => [...(prev || []), created]);
      return created;
    } catch (error) {
      const msg = error?.response?.data;
      // If backend says tag_prefix already exists, return the matching existing type by prefix if present
      if (msg && (msg.tag_prefix || JSON.stringify(msg).includes('tag_prefix'))) {
        const fallback = (assetTypes || []).find(t => String(t.tag_prefix).toUpperCase() === tagPrefix);
        if (fallback) return fallback;
      }
      throw error;
    }
  };

  const genAssetTag = (prefix = 'AST') => `${prefix}-${Date.now().toString().slice(-8)}`;

  useEffect(() => {
    // Load effective permissions for UI gating
    (async () => {
      try {
        const resp = await api.get('/auth/me/permissions/');
        const perms = Array.isArray(resp?.data?.permissions) ? resp.data.permissions : [];
        setPermissions(perms);
      } catch (e) {
        // ignore; UI will fall back to role-only
      }
    })();
    fetchAssets();
    fetchEmployees();
    fetchAssignments();
    fetchOffboardings();
    fetchOffboardingReturns();
    fetchEmployeeStatuses();
    fetchRepairs();
  }, []);

  // Handle URL-based section switching (e.g., from notifications)
  useEffect(() => {
    if (location.pathname.includes('/assets/repairs') || location.search.includes('section=repairs')) {
      setActiveSection('repairs');

      // If we have a specific repair ID, open it for editing
      if (repairIdParam && repairsList.length > 0) {
        const repair = repairsList.find(r => r.id === Number(repairIdParam));
        if (repair) {
          handleEditRepair(repair);
          // Also scroll to it after modal closes or just for visibility
          setTimeout(() => {
            const element = document.getElementById(`repair-${repairIdParam}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 500);
        }
      }
    }
  }, [location, repairsList, repairIdParam]);

  const fetchAssets = async () => {
    try {
      // Load Asset Types then Assets from new assets API
      const typesResp = await requestWithRetry(() => api.get('/assets/asset-types/'));
      const resourcesResp = await requestWithRetry(() => api.get('/assets/assets/'));
      const types = Array.isArray(typesResp?.data?.results) ? typesResp.data.results : (typesResp?.data || []);
      setAssetTypes(types);

      const resourcesRaw = Array.isArray(resourcesResp?.data?.results) ? resourcesResp.data.results : (resourcesResp?.data || []);
      // Map DB assets to UI shape (resolve type name via loaded assetTypes)
      const typeById = new Map((types || []).map(t => [t.id, t]));
      const mappedAssets = (resourcesRaw || []).map(a => {
        const typeId = a.asset_type || a.asset_type_id;
        const typeName = typeById.get(typeId)?.name || 'other';
        const normType = String(typeName).toLowerCase().replace(/\s+/g, '_');
        return {
          id: a.id,
          asset_type: normType,
          asset_tag: a.asset_tag || '',
          serial_number: a.serial_number || '',
          description: a.name || a.asset_tag || '',
          // Store purchased_date separately; issued date will be derived from assignments
          purchased_date: a.purchased_date || '',
          employee_name: a.current_employee?.name || '',
          _employeeId: a.current_employee?.id || null,
          previous_employee_name: a.previously_used_by_info?.name || '',
          _assetTypeId: typeId || null,
          _assetTypeCategory: ((typeById.get(typeId)?.category || '') + '').toUpperCase() || null,
          status: (a.status || '').toUpperCase(),
        };
      });
      setAssets(mappedAssets);
    } catch (e) {
      console.error('Failed to load assets/types from API:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const resp = await requestWithRetry(() => api.get('/assets/asset-assignments/'));
      const data = Array.isArray(resp?.data?.results) ? resp.data.results : (resp?.data || []);
      setAssignments(data);
    } catch (e) {
      console.error('Failed to load assignments:', e);
    }
  };

  const fetchOffboardingReturns = async () => {
    try {
      const resp = await requestWithRetry(() => api.get('/assets/offboarding-returns/'));
      const data = Array.isArray(resp?.data?.results) ? resp.data.results : (resp?.data || []);
      setReturnsList(data);
    } catch (e) {
      console.error('Failed to load offboarding returns:', e);
    }
  };

  const fetchOffboardings = async () => {
    try {
      const resp = await requestWithRetry(() => api.get('/onboarding/offboarding/'));
      const data = Array.isArray(resp?.data?.results) ? resp.data.results : (resp?.data || []);
      setOffboardings(data);
    } catch (e) {
      console.error('Failed to load offboardings:', e);
    }
  };

  const fetchEmployeeStatuses = async () => {
    try {
      const resp = await requestWithRetry(() => api.get('/assets/employee-statuses/'));
      const data = Array.isArray(resp?.data?.results) ? resp.data.results : (resp?.data || []);
      setEmployeeStatuses(data);
    } catch (e) {
      console.error('Failed to load employee statuses:', e);
    }
  };

  const fetchRepairs = async () => {
    try {
      const resp = await requestWithRetry(() => api.get('/assets/asset-repairs/'));
      const data = Array.isArray(resp?.data?.results) ? resp.data.results : (resp?.data || []);
      setRepairsList(data);
    } catch (e) {
      console.error('Failed to load asset repairs:', e);
    }
  };

  const handleReportRepair = (assetData) => {
    // Resolve full asset object if it's just a UI proxy
    const fullAsset = assets.find(a => a.id === assetData.id) || assetData;
    setRepairForm({
      asset: fullAsset,
      issue_description: '',
      status: 'PENDING',
      repair_vendor: '',
      repair_cost: '',
      estimated_completion: '',
      repair_notes: ''
    });
    setShowRepairModal(true);
  };

  const handleEditRepair = (repair) => {
    setRepairForm({
      id: repair.id,
      asset: repair.asset_info || { id: repair.asset, asset_tag: 'Unknown', description: '' },
      issue_description: repair.issue_description,
      status: repair.status,
      repair_vendor: repair.repair_vendor || '',
      repair_cost: repair.repair_cost || '',
      estimated_completion: repair.estimated_completion || '',
      repair_notes: repair.repair_notes || ''
    });
    setShowRepairModal(true);
  };

  const handleRepairSubmit = async () => {
    try {
      if (!repairForm.asset || !repairForm.issue_description) {
        toast.error('Please select an asset and describe the issue');
        return;
      }

      const payload = {
        asset: repairForm.asset.id,
        issue_description: repairForm.issue_description,
        status: repairForm.status || 'PENDING',
        repair_vendor: repairForm.repair_vendor,
        repair_cost: repairForm.repair_cost || null,
        estimated_completion: repairForm.estimated_completion || null,
        repair_notes: repairForm.repair_notes
      };

      if (repairForm.id) {
        await requestWithRetry(() => api.patch(`/assets/asset-repairs/${repairForm.id}/`, payload));
        toast.success('Repair updated successfully');
      } else {
        await requestWithRetry(() => api.post('/assets/asset-repairs/', payload));
        toast.success('Repair reported successfully');
      }
      setShowRepairModal(false);
      fetchRepairs();
      fetchAssets(); // Refresh assets to see "Under Repair" status
    } catch (e) {
      console.error('Failed to process repair:', e);
      toast.error(repairForm.id ? 'Failed to update repair' : 'Failed to report repair');
    }
  };

  const handleRepairUpdate = async (repairId, newStatus) => {
    try {
      await requestWithRetry(() => api.patch(`/assets/asset-repairs/${repairId}/`, { status: newStatus }));
      toast.success(`Repair marked as ${newStatus.toLowerCase()}`);
      fetchRepairs();
      fetchAssets();
    } catch (e) {
      console.error('Failed to update repair:', e);
      toast.error('Failed to update repair status');
    }
  };

  const openEditModal = (asset) => {
    const normalized = {
      ...asset,
      employee: asset._employeeId || '',
      purchased_date: asset.purchased_date
        ? new Date(asset.purchased_date).toISOString().slice(0, 10)
        : '',
      status: (asset.status || 'AVAILABLE').toUpperCase(),
    };
    setSelectedAsset(normalized);
    setShowEditModal(true);
  };

  const handleAdminTileAdd = (route) => {
    if (route === 'hardware') {
      setActiveSection('hardware');
      // Default to first available Hardware type from list
      const hwTypes = (assetTypes || []).filter(t => (t.category === 'HARDWARE' || t.category === 'Hardware'));
      const defaultTypeName = hwTypes.length ? (hwTypes[0].name || '') : '';
      setHardwareForm(prev => ({
        ...prev,
        asset_type: defaultTypeName,
      }));
      setShowAddHardwareModal(true);
      return;
    }
    if (route === 'types') {
      // Reset to a fresh form for creating a new Asset Type
      setActiveSection('types');
      setTypeForm({ name: '', category: 'Hardware', tag_prefix: '', description: '', asset_team_email: '', is_active: true });
      setShowAddTypeModal(true);
      return;
    }
    if (route === 'software') {
      setActiveSection('software');
      const swTypes = (assetTypes || []).filter(t => (t.category === 'SOFTWARE' || t.category === 'Software'));
      const defaultTypeName = swTypes.length ? (swTypes[0].name || '') : '';
      setSoftwareForm(prev => ({
        ...prev,
        asset_type: defaultTypeName,
      }));
      setShowAddSoftwareModal(true);
      return;
    }
    if (route === 'assignments') { setShowAssignmentModal(true); return; }
    if (route === 'returns') { setShowReturnModal(true); return; }
    if (route === 'statuses') { setShowStatusModal(true); return; }
  };

  const submitHardware = async (mode = 'save') => {
    const typeRecord = await ensureAssetType(hardwareForm.asset_type || 'Other', 'HARDWARE');
    const asset_tag = hardwareForm.asset_tag || genAssetTag(typeRecord.tag_prefix || 'AST');
    const fd = new FormData();
    fd.append('asset_type', typeRecord.id);
    fd.append('name', hardwareForm.name || asset_tag);
    fd.append('asset_tag', asset_tag);
    fd.append('serial_number', hardwareForm.serial_number || '');
    fd.append('status', 'AVAILABLE');
    fd.append('is_active', hardwareForm.is_active ? 'true' : 'false');
    try {
      const attrs = (() => { try { return JSON.parse(hardwareForm.custom_attributes || '{}'); } catch (_) { return {}; } })();
      fd.append('custom_attributes', JSON.stringify(attrs));
    } catch (_) {
      fd.append('custom_attributes', '{}');
    }
    if (hardwareForm.purchased_date) fd.append('purchased_date', hardwareForm.purchased_date);
    if (hardwareForm.image_before) fd.append('image_before', hardwareForm.image_before);
    if (hardwareForm.image_after) fd.append('image_after', hardwareForm.image_after);

    try {
      const resp = await requestWithRetry(() => api.post('/assets/assets/', fd, { headers: { 'Content-Type': 'multipart/form-data' } }));
      const r = resp.data;
      const mapped = {
        id: r.id,
        asset_type: String(typeRecord.name).toLowerCase().replace(/\s+/g, '_'),
        asset_tag: r.asset_tag || asset_tag,
        serial_number: r.serial_number || '',
        description: r.name || r.asset_tag || '',
        purchased_date: r.purchased_date || '',
        employee_name: '',
        _employeeId: null,
        previous_employee_name: '',
        _assetTypeId: r.asset_type || typeRecord.id,
        _assetTypeCategory: 'HARDWARE',
        status: (r.status || 'AVAILABLE').toUpperCase(),
      };
      setAssets(prev => [...(prev || []), mapped]);
      toast.success('Hardware asset saved to database');
    } catch (error) {
      console.error('Failed to save hardware asset:', error?.response?.data || error);
      const resp = error?.response?.data;
      let message = 'Failed to save hardware asset';
      if (typeof resp === 'string') {
        message = resp;
      } else if (resp && typeof resp === 'object') {
        if (resp.detail) {
          message = resp.detail;
        } else {
          const parts = Object.entries(resp).map(([field, val]) => {
            const text = Array.isArray(val) ? val.join(', ') : String(val);
            return `${field}: ${text}`;
          });
          if (parts.length) message = parts.join(' | ');
        }
      }
      toast.error(message);
      throw error;
    }
    if (mode === 'add_another') {
      setHardwareForm({ asset_type: hardwareForm.asset_type, name: '', asset_tag: '', serial_number: '', status: 'available', is_active: true, custom_attributes: '{}', purchased_date: '', image_before: null, image_after: null });
      return;
    }
    if (mode === 'continue') {
      return;
    }
    setShowAddHardwareModal(false);
    setHardwareForm({ asset_type: 'laptop', name: '', asset_tag: '', serial_number: '', status: 'available', is_active: true, custom_attributes: '{}', purchased_date: '', image_before: null, image_after: null });
  };

  const submitType = async (mode = 'save') => {
    try {
      const user = getCurrentUser?.() || null;
      const email = user?.email || user?.profile?.email || '';
      const payload = {
        name: typeForm.name,
        tag_prefix: typeForm.tag_prefix || String(typeForm.name || '').slice(0, 3).toUpperCase(),
        description: typeForm.description || typeForm.name,
        asset_team_email: typeForm.asset_team_email || email,
        is_active: typeForm.is_active,
        category: String(typeForm.category || 'Hardware').toUpperCase(),
      };
      let created;
      if (typeForm?.id) {
        const resp = await requestWithRetry(() => api.patch(`/assets/asset-types/${typeForm.id}/`, payload));
        created = resp.data;
        setAssetTypes(prev => (prev || []).map(t => (t.id === created.id ? created : t)));
        toast.success('Asset Type updated');
      } else {
        const resp = await requestWithRetry(() => api.post('/assets/asset-types/', payload));
        created = resp.data;
        setAssetTypes(prev => [...(prev || []), created]);
        toast.success('Asset Type saved');
      }
      if (mode === 'add_another') {
        setTypeForm({ name: '', category: typeForm.category || 'Hardware', tag_prefix: '', description: '', asset_team_email: '', is_active: true });
        return;
      }
      if (mode === 'continue') {
        return;
      }
      setShowAddTypeModal(false);
      setTypeForm({ name: '', category: 'Hardware', tag_prefix: '', description: '', asset_team_email: '', is_active: true });
    } catch (error) {
      console.error('Failed to create asset type:', error);
      toast.error('Failed to create asset type');
    }
  };
  const submitSoftware = async (mode = 'save') => {
    try {
      const typeRecord = await ensureAssetType(softwareForm.asset_type || 'Software', 'SOFTWARE');
      const asset_tag = softwareForm.asset_tag || genAssetTag(typeRecord.tag_prefix || 'SFT');
      const payload = {
        asset_type: typeRecord.id,
        name: softwareForm.name || asset_tag,
        asset_tag,
        serial_number: softwareForm.serial_number || '',
        status: 'AVAILABLE',
        is_active: softwareForm.is_active,
        custom_attributes: (() => { try { return JSON.parse(softwareForm.custom_attributes || '{}'); } catch (_) { return {}; } })(),
        purchased_date: null,
      };
      const resp = await requestWithRetry(() => api.post('/assets/assets/', payload));
      const r = resp.data;
      const mapped = {
        id: r.id,
        asset_type: String(typeRecord.name).toLowerCase().replace(/\s+/g, '_'),
        asset_tag: r.asset_tag || asset_tag,
        serial_number: r.serial_number || '',
        description: r.name || r.asset_tag || '',
        issued_date: r.purchased_date || '',
        employee_name: '',
        _employeeId: null,
        _assetTypeId: r.asset_type || typeRecord.id,
        _assetTypeCategory: 'SOFTWARE',
        status: (r.status || 'AVAILABLE').toUpperCase(),
      };
      setAssets(prev => [...(prev || []), mapped]);
      toast.success('Software asset saved to database');
      if (mode === 'add_another') {
        setSoftwareForm({ asset_type: softwareForm.asset_type || 'Keka', name: '', asset_tag: '', serial_number: '', status: 'available', is_active: true, custom_attributes: '{}' });
        return;
      }
      if (mode === 'continue') {
        return;
      }
      setShowAddSoftwareModal(false);
      setSoftwareForm({ asset_type: 'Keka', name: '', asset_tag: '', serial_number: '', status: 'available', is_active: true, custom_attributes: '{}' });
    } catch (error) {
      console.error('Failed to create software asset:', error);
      toast.error('Failed to create software asset');
    }
  };

  const submitAssignment = async (action = 'save') => {
    try {
      // Basic client-side validation before hitting the API
      if (!assignmentForm.employee) {
        toast.error('Please select an employee before assigning assets');
        return;
      }

      const hasSoftwareAssets = assignmentForm.isSoftware && Array.isArray(assignmentForm.assets) && assignmentForm.assets.length > 0;
      const hasHardwareAsset = !assignmentForm.isSoftware && !!assignmentForm.asset;
      const hasAssetType = !assignmentForm.isSoftware && !!assignmentForm.asset_type;

      if (!hasSoftwareAssets && !hasHardwareAsset && !hasAssetType) {
        toast.error('Please select at least one asset or asset type to assign');
        return;
      }

      // For software, we'll create a single assignment with multiple assets
      // For hardware, we'll create a single assignment with a single asset
      const payloads = assignmentForm.isSoftware
        ? assignmentForm.assets.map(assetId => ({
          employee: assignmentForm.employee,
          asset_types: [],
          assets: [assetId],
          manager_email: assignmentForm.manager_email,
          notes: assignmentForm.notes
        }))
        : [{
          employee: assignmentForm.employee,
          asset_types: assignmentForm.asset_type ? [assignmentForm.asset_type] : [],
          assets: hasHardwareAsset ? [assignmentForm.asset] : [],
          manager_email: assignmentForm.manager_email,
          notes: assignmentForm.notes
        }];

      // Submit all assignments
      await Promise.all(payloads.map(payload => api.post('/assets/asset-assignments/', payload)));

      toast.success(`Successfully assigned ${assignmentForm.isSoftware ? assignmentForm.assets.length : 1} asset(s)`);

      // Reset form based on action
      if (action === 'add_another') {
        setAssignmentForm(prev => ({
          ...prev,
          employee: '',
          asset: null,
          assets: [],
          notes: ''
        }));
      } else if (action === 'continue') {
        // Keep the current form data but clear selections
        setAssignmentForm(prev => ({
          ...prev,
          asset: null,
          assets: []
        }));
      } else {
        setShowAssignmentModal(false);
        setAssignmentForm({
          employee: '',
          asset_type: '',
          asset: null,
          assets: [],
          isSoftware: false,
          manager_email: '',
          notes: ''
        });
      }

      // Refresh data
      fetchAssets();
      fetchAssignments();
    } catch (error) {
      console.error('Error creating assignment:', error);
      const resp = error?.response?.data;
      let message = 'Failed to create assignment';
      if (typeof resp === 'string') {
        message = resp;
      } else if (resp && typeof resp === 'object') {
        if (resp.detail) {
          message = resp.detail;
        } else {
          // Flatten DRF validation errors
          const parts = Object.entries(resp).map(([field, val]) => {
            const text = Array.isArray(val) ? val.join(', ') : String(val);
            return `${field}: ${text}`;
          });
          if (parts.length) message = parts.join(' | ');
        }
      }
      toast.error(message);
    }
  };

  const submitReturn = async (mode = 'save') => {
    try {
      const fd = new FormData();
      fd.append('user', returnForm.user);
      (returnForm.returned_assets || []).forEach(id => fd.append('returned_assets', id));
      if (returnForm.damaged_file) fd.append('damaged_assets_file', returnForm.damaged_file);
      fd.append('remarks', returnForm.remarks || '');
      fd.append('is_offboarded', !!returnForm.is_offboarded);
      fd.append('laptop_status', 'AVAILABLE');
      const resp = await requestWithRetry(() => api.post('/assets/offboarding-returns/', fd, { headers: { 'Content-Type': 'multipart/form-data' } }));
      const created = resp.data;
      setReturnsList(prev => [...(prev || []), created]);
      toast.success('Offboarding return saved');
      fetchAssets();
      fetchAssignments();
      if (mode === 'add_another') {
        setReturnForm({ user: returnForm.user, returned_assets: [], damaged_file: null, remarks: '', is_offboarded: false });
        return;
      }
      if (mode === 'continue') {
        return;
      }
      setShowReturnModal(false);
      setReturnForm({ user: '', returned_assets: [], damaged_file: null, remarks: '', is_offboarded: false });
    } catch (error) {
      console.error('Failed to save offboarding return:', error);
      const msg = error?.response?.data ? JSON.stringify(error.response.data) : 'Failed to save return';
      toast.error(msg);
    }
  };
  const submitStatus = async () => {
    try {
      const isActive = String(statusForm.status || '').toLowerCase().includes('active');
      const payload = { employee: statusForm.employee, is_active: isActive };
      const resp = await requestWithRetry(() => api.post('/assets/employee-statuses/', payload));
      const created = resp.data;
      setEmployeeStatuses(prev => [...(prev || []), created]);
      toast.success('Employee status saved');
      setShowStatusModal(false);
      setStatusForm({ employee: '', status: '', notes: '' });
    } catch (error) {
      console.error('Failed to save employee status:', error);
      toast.error('Failed to save employee status');
    }
  };

  const fetchEmployees = async () => {
    try {
      const apiBase = process.env.REACT_APP_API_URL || `${window.location.protocol}//${window.location.hostname}:8080/api`;
      const response = await fetch(`${apiBase}/employees/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const rawCandidates = Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
            ? data.results
            : Array.isArray(data?.employees)
              ? data.employees
              : [];
        const normalized = (rawCandidates || []).map(e => {
          const fullName = e?.name || e?.user_info?.full_name || [e?.user?.first_name, e?.user?.last_name].filter(Boolean).join(' ') || e?.user?.email || `Employee ${e?.id}`;
          return { ...e, name: fullName };
        });
        if (normalized.length > 0) {
          setEmployees(normalized);
          return;
        }
      }
      const uniqueNames = Array.from(new Set((assets || []).map(a => a.employee_name).filter(Boolean)));
      if (uniqueNames.length > 0) {
        setEmployees(uniqueNames.map(n => ({ id: n, name: n })));
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      const uniqueNames = Array.from(new Set((assets || []).map(a => a.employee_name).filter(Boolean)));
      if (uniqueNames.length > 0) {
        setEmployees(uniqueNames.map(n => ({ id: n, name: n })));
      }
    }
  };

  const createAsset = async () => {
    try {
      const typeRecord = await ensureAssetType(newAsset.asset_type || 'Other', 'HARDWARE');
      const asset_tag = genAssetTag(typeRecord.tag_prefix || 'AST');
      const payload = {
        asset_type: typeRecord.id,
        name: newAsset.description || asset_tag,
        asset_tag,
        serial_number: newAsset.serial_number || '',
        status: 'AVAILABLE',
        is_active: true,
        custom_attributes: {},
        purchased_date: newAsset.issued_date || null,
      };
      const resp = await requestWithRetry(() => api.post('/assets/assets/', payload));
      const r = resp.data;
      const mapped = {
        id: r.id,
        asset_type: String(typeRecord.name).toLowerCase().replace(/\s+/g, '_'),
        asset_tag: r.asset_tag || asset_tag,
        serial_number: r.serial_number || '',
        description: r.name || r.asset_tag || '',
        issued_date: r.purchased_date || '',
        employee_name: '',
        _assetTypeId: r.asset_type || typeRecord.id || null,
        _employeeId: null,
        _assetTypeCategory: 'HARDWARE',
        status: (r.status || 'AVAILABLE').toUpperCase(),
      };
      setAssets(prev => [...(prev || []), mapped]);
      toast.success('Asset created successfully!');
      setShowCreateModal(false);
      setNewAsset({
        employee: '',
        asset_type: 'laptop',
        description: '',
        serial_number: '',
        issued_date: ''
      });
      fetchAssets();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to create asset');
    }
  };

  const updateAsset = async () => {
    try {
      const payload = {
        asset_type: selectedAsset._assetTypeId,
        name: selectedAsset.description || 'Hardware',
        serial_number: selectedAsset.serial_number || '',
        status: selectedAsset.status || 'AVAILABLE',
        // Purchased date is edited directly in the modal
        purchased_date: selectedAsset.purchased_date || null,
        // If an employee is selected in the edit modal, send it so backend can
        // update the current assignment/owner where supported
        employee: selectedAsset.employee || null,
      };
      // Use PATCH so we don't need to send every required field on the model
      await requestWithRetry(() => api.patch(`/assets/assets/${selectedAsset.id}/`, payload));
      toast.success('Asset updated');
      setShowEditModal(false);
      setSelectedAsset(null);
      fetchAssets();
    } catch (error) {
      console.error('Failed to update asset:', error?.response?.data || error);
      const resp = error?.response?.data;
      let message = 'Failed to update asset';
      if (typeof resp === 'string') {
        message = resp;
      } else if (resp && typeof resp === 'object') {
        if (resp.detail) {
          message = resp.detail;
        } else {
          const parts = Object.entries(resp).map(([field, val]) => {
            const text = Array.isArray(val) ? val.join(', ') : String(val);
            return `${field}: ${text}`;
          });
          if (parts.length) message = parts.join(' | ');
        }
      }
      toast.error(message);
    }
  };

  const disposeAsset = async (assetId) => {
    if (!window.confirm('Are you sure you want to dispose of this asset? It will be moved to the Disposed section.')) {
      return;
    }
    try {
      await requestWithRetry(() => api.patch(`/assets/assets/${assetId}/`, { status: 'DISPOSED' }));
      toast.success('Asset moved to Disposed section');
      fetchAssets();
    } catch (error) {
      console.error('Error disposing asset:', error);
      toast.error('Failed to dispose of asset');
    }
  };

  const restoreAsset = async (assetId) => {
    try {
      await requestWithRetry(() => api.patch(`/assets/assets/${assetId}/`, { status: 'AVAILABLE' }));
      toast.success('Asset restored to Available');
      fetchAssets();
    } catch (error) {
      console.error('Error restoring asset:', error);
      toast.error('Failed to restore asset');
    }
  };

  const getAssetIcon = (type) => {
    switch (type) {
      case 'laptop':
        return <ComputerDesktopIcon className="h-6 w-6" />;
      case 'mouse':
        return <CursorArrowRaysIcon className="h-6 w-6" />;
      case 'id_card':
        return <IdentificationIcon className="h-6 w-6" />;
      case 'keyboard':
        return <RectangleStackIcon className="h-6 w-6" />;
      default:
        return <WrenchScrewdriverIcon className="h-6 w-6" />;
    }
  };

  const getAssetTypeColor = (type) => {
    switch (type) {
      case 'laptop':
        return 'bg-blue-100 text-blue-800';
      case 'mouse':
        return 'bg-green-100 text-green-800';
      case 'id_card':
        return 'bg-purple-100 text-purple-800';
      case 'keyboard':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAssetStatusColor = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'AVAILABLE') return 'bg-green-100 text-green-800';
    if (s === 'ASSIGNED') return 'bg-blue-100 text-blue-800';
    if (s === 'DAMAGED') return 'bg-red-100 text-red-800';
    if (s === 'LOST') return 'bg-gray-200 text-gray-700';
    if (s === 'DISPOSED') return 'bg-gray-400 text-white';
    return 'bg-gray-100 text-gray-800';
  };

  const getCategoryFor = (asset) => {
    if (asset?._assetTypeCategory) return asset._assetTypeCategory;
    const rec = (assetTypes || []).find(t => t.id === asset?._assetTypeId);
    return ((rec?.category || '') + '').toUpperCase() || null;
  };

  const filteredAssets = (assets || []).filter(asset => {
    const cat = getCategoryFor(asset);
    const isHardwareCategory = cat ? cat === 'HARDWARE' : true;
    const status = String(asset.status || '').toUpperCase();

    // Exclude disposed assets from regular hardware/software lists
    if (activeSection !== 'disposed' && status === 'DISPOSED') return false;
    // Exclude other assets when in disposed section
    if (activeSection === 'disposed' && status !== 'DISPOSED') return false;

    if (activeSection === 'hardware' && !isHardwareCategory) return false;
    const matchesSearch = asset.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serial_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.description?.toLowerCase().includes(searchTerm.toLowerCase());
    // Filter by status instead of type for the dropdown
    const matchesStatus =
      filterType === 'all' ||
      status === String(filterType || '').toUpperCase();

    return matchesSearch && matchesStatus;
  });

  const hardwareOnly = (assets || []).filter(a => {
    const cat = getCategoryFor(a);
    return cat ? cat === 'HARDWARE' : true;
  });
  const assetTypeCounts = {
    all: hardwareOnly.length,
    laptop: hardwareOnly.filter(a => a.asset_type === 'laptop').length,
    mouse: hardwareOnly.filter(a => a.asset_type === 'mouse').length,
    id_card: hardwareOnly.filter(a => a.asset_type === 'id_card').length,
    keyboard: hardwareOnly.filter(a => a.asset_type === 'keyboard').length,
    other: hardwareOnly.filter(a => a.asset_type === 'other').length,
  };

  // Derive issued/assignment date for display from assignments rather than purchased_date
  const getIssuedDateFor = (asset) => {
    if (!asset || !Array.isArray(assignments)) return null;
    // Find an assignment that includes this asset. Prefer one where employee matches _employeeId.
    const related = assignments.filter(a => Array.isArray(a.assets) && a.assets.includes(asset.id));
    if (!related.length) return null;
    const byEmployee = asset._employeeId
      ? related.find(a => a.employee === asset._employeeId)
      : null;
    const record = byEmployee || related[0];
    return record?.assigned_at || null;
  };

  // Compute laptop/asset age in years from purchased_date
  const getAssetAgeYears = (asset) => {
    const pd = asset?.purchased_date;
    if (!pd) return null;
    const purchased = new Date(pd);
    if (Number.isNaN(purchased.getTime())) return null;
    const now = new Date();
    const diffMs = now.getTime() - purchased.getTime();
    if (diffMs <= 0) return 0;
    const years = diffMs / (1000 * 60 * 60 * 24 * 365.25);
    return Number(years.toFixed(1));
  };

  // Get list of previous employees who have used this asset (excluding current employee)
  const getPreviousEmployeesFor = (asset) => {
    // Prefer backend-provided field if available
    if (asset?.previous_employee_name) {
      return [asset.previous_employee_name];
    }

    if (!asset || !Array.isArray(assignments)) return [];
    const related = assignments.filter(a => Array.isArray(a.assets) && a.assets.includes(asset.id));
    if (!related.length) return [];

    const currentId = asset._employeeId;
    const names = [];

    related.forEach(a => {
      const empId = a.employee;
      if (!empId || (currentId && empId === currentId)) return;
      const emp = (employees || []).find(e => e.id == empId) || a.employee_info;
      const name = emp?.name;
      if (name && !names.includes(name)) names.push(name);
    });

    return names;
  };

  // Resolve current employee display name for a given asset, preferring ID-based lookup
  const getCurrentEmployeeNameFor = (asset) => {
    if (!asset) return '';
    const id = asset._employeeId;
    if (id && Array.isArray(employees)) {
      const emp = employees.find(e => e.id == id);
      if (emp?.name) return emp.name;
    }
    return asset.employee_name || '';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Permission helpers (must be after state declarations and before JSX usage)
  const hasPerm = (code) => (permissions || []).includes(code);
  const canViewAssets = hasPerm('assets.view_asset') || isAssetAdmin;
  const canAddAssets = hasPerm('assets.add_asset') || isAssetAdmin;
  const canChangeAssets = hasPerm('assets.change_asset') || isAssetAdmin;
  const canDeleteAssets = hasPerm('assets.delete_asset') || isAssetAdmin;
  const canManageTypes = (
    hasPerm('assets.view_assettype') ||
    hasPerm('assets.add_assettype') ||
    hasPerm('assets.change_assettype') ||
    hasPerm('assets.delete_assettype') ||
    isAssetAdmin
  );
  const canManageAssignments = (
    hasPerm('assets.view_assetassignment') ||
    hasPerm('assets.add_assetassignment') ||
    hasPerm('assets.change_assetassignment') ||
    hasPerm('assets.delete_assetassignment') ||
    isAssetAdmin
  );
  const canManageReturns = (
    hasPerm('assets.view_assetreturn') ||
    hasPerm('assets.add_assetreturn') ||
    hasPerm('assets.change_assetreturn') ||
    hasPerm('assets.delete_assetreturn') ||
    isAssetAdmin
  );
  const canManageStatuses = (
    hasPerm('assets.view_employeestatus') ||
    hasPerm('assets.add_employeestatus') ||
    hasPerm('assets.change_employeestatus') ||
    hasPerm('assets.delete_employeestatus') ||
    isAssetAdmin
  );
  const isAssetManager = (
    isAssetAdmin || canAddAssets || canChangeAssets || canDeleteAssets ||
    canManageTypes || canManageAssignments || canManageReturns || canManageStatuses
  );

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const apiBase = (process.env.REACT_APP_API_URL || `${window.location.protocol}//${window.location.hostname}:8080/api`).replace(/\/api$/, '');
    return `${apiBase}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asset Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage and track company assets assigned to employees
          </p>
        </div>
        <button
          onClick={handleExportToExcel}
          disabled={exportingExcel}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exportingExcel ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Exporting...
            </>
          ) : (
            <>
              <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export to Excel
            </>
          )}
        </button>
      </div>


      {isAssetManager && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {[
            { key: 'asset_types', label: 'Asset Types', route: 'types' },
            { key: 'hardware_assets', label: 'Hardware Assets', route: 'hardware' },
            { key: 'software_assets', label: 'Software Assets', route: 'software' },
            { key: 'asset_assignments', label: 'Asset Assignments', route: 'assignments' },
            { key: 'offboarding_returns', label: 'Offboarding Asset Returns', route: 'returns' },
            { key: 'employee_statuses', label: 'Employee Statuses', route: 'statuses' },
            { key: 'asset_repairs', label: 'Asset Repairs', route: 'repairs' },
            { key: 'asset_disposed', label: 'Asset Disposed', route: 'disposed' },
          ].map((item) => {
            const selected = activeSection === item.route;
            return (
              <div
                role="button"
                tabIndex={0}
                key={item.key}
                onClick={() => setActiveSection(item.route)}
                className={`text-left bg-white rounded-lg shadow p-4 border transition flex items-center justify-between ${selected ? 'border-blue-500 ring-1 ring-blue-200' : 'border-gray-200 hover:shadow-md'}`}
              >
                <div className="font-semibold text-gray-800">{item.label}</div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleAdminTileAdd(item.route); }}
                    className="text-xs px-2 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                  >
                    Add
                  </button>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${selected ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>Manage</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isAssetManager && activeSection === 'types' && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
          {assetTypes.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">No asset types yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tag Prefix</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset Team Email</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Is Active</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assetTypes.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm font-medium">
                        <button
                          type="button"
                          className="text-blue-700 hover:underline"
                          onClick={() => {
                            const cat = (t.category === 'HARDWARE' || t.category === 'Hardware')
                              ? 'Hardware'
                              : (t.category === 'SOFTWARE' || t.category === 'Software')
                                ? 'Software'
                                : (t.category || 'Hardware');
                            setTypeForm({
                              id: t.id,
                              name: t.name || '',
                              category: cat,
                              tag_prefix: t.tag_prefix || '',
                              description: t.description || '',
                              asset_team_email: t.asset_team_email || '',
                              is_active: !!t.is_active,
                            });
                            setShowAddTypeModal(true);
                          }}
                        >
                          {t.name}
                        </button>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">{(t.category === 'HARDWARE' && 'Hardware') || (t.category === 'SOFTWARE' && 'Software') || t.category}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{t.tag_prefix}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{t.description || '(None)'}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{t.asset_team_email || ''}</td>
                      <td className="px-4 py-2 text-sm">{t.is_active ? '✅' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {isAssetManager && activeSection === 'software' && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
          {(() => {
            const sw = (assets || []).filter(a => a._assetTypeCategory === 'SOFTWARE');
            if (sw.length === 0) return <div className="text-center py-8 text-sm text-gray-500">No software assets yet</div>;
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sw.map(s => (
                  <div key={s.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="text-gray-900 font-medium">{s.description || s.asset_type}</div>
                    {s.asset_tag && <div className="text-xs text-gray-600 mt-1">Tag: {s.asset_tag}</div>}
                    {s.serial_number && <div className="text-xs text-gray-600 mt-1">Serial: {s.serial_number}</div>}
                    <div className="text-xs text-gray-600 mt-1 capitalize">Category: Software</div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {isAssetManager && activeSection === 'assignments' && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
          {(() => {
            const typeNameById = new Map((assetTypes || []).map(t => [t.id, t.name]));
            const grouped = (() => {
              const map = new Map();
              (assignments || []).forEach(a => {
                const key = String(a.employee);
                if (!map.has(key)) map.set(key, { employee: a.employee, employee_info: a.employee_info, assets: new Set(), asset_types: new Set(), manager_email: a.manager_email || null, notes: [] });
                const g = map.get(key);
                (a.assets || []).forEach(id => g.assets.add(id));
                (a.asset_types || []).forEach(id => g.asset_types.add(id));
                if (a.notes) g.notes.push(a.notes);
                if (a.manager_email) g.manager_email = a.manager_email;
                if (a.employee_info && !g.employee_info) g.employee_info = a.employee_info;
              });
              return Array.from(map.values()).map(g => ({
                employee: g.employee,
                employee_info: g.employee_info,
                assets: Array.from(g.assets),
                asset_types: Array.from(g.asset_types),
                manager_email: g.manager_email,
                notes: g.notes.join(' | '),
              }));
            })();

            if (grouped.length === 0) return <div className="text-center py-8 text-sm text-gray-500">No assignments yet</div>;
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {grouped.map(g => {
                  const emp = (employees || []).find(e => e.id == g.employee) || g.employee_info;
                  const assetLabels = (g.assets || []).map(id => {
                    const as = (assets || []).find(x => x.id == id);
                    return as ? `${as.asset_type} • ${as.serial_number || as.description || as.id}` : `Asset ${id}`;
                  });
                  const typesLabel = (g.asset_types || []).map(id => typeNameById.get(id) || id).join(', ');
                  return (
                    <div key={g.employee} className="border border-gray-200 rounded-lg p-4">
                      <div className="text-gray-900 font-medium">{emp?.name || emp?.username || 'Employee'}</div>
                      {typesLabel && <div className="text-xs text-gray-600 mt-1">Types: {typesLabel}</div>}
                      {assetLabels.length > 0 && <div className="text-xs text-gray-600 mt-1">Assets: {assetLabels.join(', ')}</div>}
                      {g.manager_email && <div className="text-xs text-gray-600 mt-1">Manager: {g.manager_email}</div>}
                      {g.notes && <div className="text-xs text-gray-500 mt-1">{g.notes}</div>}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {isAssetManager && activeSection === 'returns' && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
          {returnsList.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">No returns recorded</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {returnsList.map(r => {
                const emp = (employees || []).find(e => e.id == r.user);
                const labels = (r.returned_assets || []).map(id => {
                  const a = (assets || []).find(x => x.id == id);
                  return a ? `${a.asset_type} • ${a.serial_number || a.description || a.id}` : `Asset ${id}`;
                });
                return (
                  <div key={r.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="text-gray-900 font-medium">{emp?.name || 'User'}</div>
                    {labels.length > 0 && <div className="text-xs text-gray-600 mt-1">Returned: {labels.join(', ')}</div>}
                    {r.remarks && <div className="text-xs text-gray-500 mt-1">{r.remarks}</div>}
                    <div className={`text-xs mt-1 ${r.is_offboarded ? 'text-green-600' : 'text-gray-500'}`}>{r.is_offboarded ? 'Offboarded' : 'In progress'}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {isAssetManager && activeSection === 'statuses' && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
          {employeeStatuses.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">No statuses added</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employeeStatuses.map(s => {
                const emp = (employees || []).find(e => e.id == s.employee);
                return (
                  <div key={s.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="text-gray-900 font-medium">{emp?.name || 'Employee'}</div>
                    <div className="text-xs text-gray-600 mt-1">{s.status}</div>
                    {s.notes && <div className="text-xs text-gray-500 mt-1">{s.notes}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {isAssetManager && activeSection === 'repairs' && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
          {repairsList.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">No repairs reported yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported By</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor/Cost</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estimated</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {repairsList.map(r => (
                    <tr
                      key={r.id}
                      id={`repair-${r.id}`}
                      className={`hover:bg-gray-50 transition-colors duration-500 ${Number(repairIdParam) === r.id ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-4 py-2 text-sm">
                        <div className="font-medium text-gray-900">{r.asset_info?.asset_tag}</div>
                        <div className="text-xs text-gray-500">{r.asset_info?.name}</div>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700 max-w-xs truncate" title={r.issue_description}>
                        {r.issue_description}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          (r.status === 'PENDING' || r.status === 'REPORTED') ? 'bg-blue-100 text-blue-800' :
                            r.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                          }`}>
                          {r.status_display || r.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {r.reported_by_info?.name || 'Unknown'}
                        <div className="text-xs text-gray-500">{new Date(r.reported_at).toLocaleDateString()}</div>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        <div>{r.repair_vendor || 'N/A'}</div>
                        {r.repair_cost && <div className="text-xs text-gray-500">₹{r.repair_cost}</div>}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {r.estimated_completion ? new Date(r.estimated_completion).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-2 text-sm space-x-2">
                        <select
                          className="text-xs border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          value={r.status}
                          onChange={(e) => handleRepairUpdate(r.id, e.target.value)}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="PICKED_UP">Picked Up</option>
                          <option value="AT_VENDOR">At Vendor</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="FAILED">Failed</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                        <button
                          onClick={() => handleEditRepair(r)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit Details"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}



      {
        showAddHardwareModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowAddHardwareModal(false)}></div>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Add Hardware Asset</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Asset type *</label>
                      <select value={hardwareForm.asset_type} onChange={(e) => setHardwareForm({ ...hardwareForm, asset_type: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                        {(assetTypes || [])
                          .filter(t => (t.category === 'HARDWARE' || t.category === 'Hardware'))
                          .map(t => (
                            <option key={t.id} value={t.name}>{t.name}</option>
                          ))}
                        {(!(assetTypes || []).some(t => (t.category === 'HARDWARE' || t.category === 'Hardware'))) && (
                          <option value="">No hardware types defined</option>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name *</label>
                      <input type="text" value={hardwareForm.name} onChange={(e) => setHardwareForm({ ...hardwareForm, name: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Asset tag</label>
                      <input type="text" value={hardwareForm.asset_tag} onChange={(e) => setHardwareForm({ ...hardwareForm, asset_tag: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Serial number</label>
                      <input type="text" value={hardwareForm.serial_number} onChange={(e) => setHardwareForm({ ...hardwareForm, serial_number: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select value={hardwareForm.status} onChange={(e) => setHardwareForm({ ...hardwareForm, status: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                        <option value="available">Available</option>
                        <option value="assigned">Assigned</option>
                        <option value="repair">Repair</option>
                      </select>
                    </div>
                    <div className="flex items-center">
                      <input id="hw_is_active" type="checkbox" checked={hardwareForm.is_active} onChange={(e) => setHardwareForm({ ...hardwareForm, is_active: e.target.checked })} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                      <label htmlFor="hw_is_active" className="ml-2 block text-sm text-gray-700">Is active</label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Custom attributes</label>
                      <textarea rows={4} value={hardwareForm.custom_attributes} onChange={(e) => setHardwareForm({ ...hardwareForm, custom_attributes: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Purchased date</label>
                      <input type="date" value={hardwareForm.purchased_date} onChange={(e) => setHardwareForm({ ...hardwareForm, purchased_date: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Upload image (before)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setHardwareForm({ ...hardwareForm, image_before: e.target.files && e.target.files[0] ? e.target.files[0] : null })}
                        className="mt-1 block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Upload image (after)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setHardwareForm({ ...hardwareForm, image_after: e.target.files && e.target.files[0] ? e.target.files[0] : null })}
                        className="mt-1 block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse sm:space-x-reverse sm:space-x-3">
                  <button onClick={() => submitHardware('save')} disabled={!hardwareForm.asset_type || !hardwareForm.name} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm disabled:opacity-50">Save</button>
                  <button onClick={() => submitHardware('add_another')} disabled={!hardwareForm.asset_type || !hardwareForm.name} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm">Save and add another</button>
                  <button onClick={() => submitHardware('continue')} disabled={!hardwareForm.asset_type || !hardwareForm.name} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm">Save and continue editing</button>
                  <button onClick={() => setShowAddHardwareModal(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {
        showAddTypeModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowAddTypeModal(false)}></div>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">{typeForm?.id ? 'Edit Asset Type' : 'Add Asset Type'}</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name *</label>
                      <input type="text" value={typeForm.name} onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <select value={typeForm.category} onChange={(e) => setTypeForm({ ...typeForm, category: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                        <option value="Hardware">Hardware</option>
                        <option value="Software">Software</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tag prefix</label>
                      <input type="text" value={typeForm.tag_prefix} onChange={(e) => setTypeForm({ ...typeForm, tag_prefix: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea rows={3} value={typeForm.description} onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Asset team email</label>
                      <input type="email" value={typeForm.asset_team_email} onChange={(e) => setTypeForm({ ...typeForm, asset_team_email: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div className="flex items-center">
                      <input id="type_is_active" type="checkbox" checked={typeForm.is_active} onChange={(e) => setTypeForm({ ...typeForm, is_active: e.target.checked })} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                      <label htmlFor="type_is_active" className="ml-2 block text-sm text-gray-700">Is active</label>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse sm:space-x-reverse sm:space-x-3">
                  <button onClick={() => submitType('save')} disabled={!typeForm.name} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm disabled:opacity-50">Save</button>
                  <button onClick={() => submitType('add_another')} disabled={!typeForm.name} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm">Save and add another</button>
                  <button onClick={() => submitType('continue')} disabled={!typeForm.name} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm">Save and continue editing</button>
                  <button onClick={() => setShowAddTypeModal(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {
        showAddSoftwareModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowAddSoftwareModal(false)}></div>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Add Software Asset</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Asset type *</label>
                      <select value={softwareForm.asset_type} onChange={(e) => setSoftwareForm({ ...softwareForm, asset_type: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                        {(assetTypes || [])
                          .filter(t => (t.category === 'SOFTWARE' || t.category === 'Software'))
                          .map(t => (
                            <option key={t.id} value={t.name}>{t.name}</option>
                          ))}
                        {(!(assetTypes || []).some(t => (t.category === 'SOFTWARE' || t.category === 'Software'))) && (
                          <option value="">No software types defined</option>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name *</label>
                      <input type="text" value={softwareForm.name} onChange={(e) => setSoftwareForm({ ...softwareForm, name: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Asset tag</label>
                      <input type="text" value={softwareForm.asset_tag} onChange={(e) => setSoftwareForm({ ...softwareForm, asset_tag: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Serial number</label>
                      <input type="text" value={softwareForm.serial_number} onChange={(e) => setSoftwareForm({ ...softwareForm, serial_number: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select value={softwareForm.status} onChange={(e) => setSoftwareForm({ ...softwareForm, status: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                        <option value="available">Available</option>
                        <option value="assigned">Assigned</option>
                        <option value="disabled">Disabled</option>
                      </select>
                    </div>
                    <div className="flex items-center">
                      <input id="sw_is_active" type="checkbox" checked={softwareForm.is_active} onChange={(e) => setSoftwareForm({ ...softwareForm, is_active: e.target.checked })} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                      <label htmlFor="sw_is_active" className="ml-2 block text-sm text-gray-700">Is active</label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Custom attributes</label>
                      <textarea rows={4} value={softwareForm.custom_attributes} onChange={(e) => setSoftwareForm({ ...softwareForm, custom_attributes: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse sm:space-x-reverse sm:space-x-3">
                  <button onClick={() => submitSoftware('save')} disabled={!softwareForm.asset_type || !softwareForm.name} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm disabled:opacity-50">Save</button>
                  <button onClick={() => submitSoftware('add_another')} disabled={!softwareForm.asset_type || !softwareForm.name} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm">Save and add another</button>
                  <button onClick={() => submitSoftware('continue')} disabled={!softwareForm.asset_type || !softwareForm.name} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm">Save and continue editing</button>
                  <button onClick={() => setShowAddSoftwareModal(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {
        showAssignmentModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowAssignmentModal(false)}></div>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Create Assignment</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Employee *</label>
                      <select value={assignmentForm.employee} onChange={(e) => setAssignmentForm({ ...assignmentForm, employee: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Select Employee</option>
                        {(employees || []).map(emp => (<option key={emp.id} value={emp.id}>{emp.name}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Asset Type</label>
                      <select
                        value={assignmentForm.asset_type || ''}
                        onChange={(e) => {
                          const selectedId = e.target.value ? Number(e.target.value) : null;
                          const selectedTypeData = assetTypes.find(t => t.id === selectedId);
                          const isSoftware = selectedTypeData ? selectedTypeData.category === 'SOFTWARE' : false;

                          setAssignmentForm(prev => ({
                            ...prev,
                            asset_type: selectedId,
                            asset: isSoftware ? null : (prev.asset || null),
                            assets: isSoftware ? (prev.assets || []) : [],
                            isSoftware: isSoftware
                          }));
                        }}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Asset Type</option>
                        {(assetTypes.length ? assetTypes : []).map(type => (
                          <option key={type.id} value={type.id}>
                            {type.name} ({type.category})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Available Asset</label>
                      {assignmentForm.isSoftware ? (
                        <div className="mt-1">
                          <div className="text-sm font-medium text-gray-700 mb-1">Available Software Assets (Select multiple)</div>
                          <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                            {!assignmentForm.asset_type ? (
                              <div className="text-sm text-gray-500 p-2">Select an asset type first</div>
                            ) : (
                              (assets || [])
                                .filter(asset => {
                                  return (
                                    !!assignmentForm.asset_type &&
                                    asset._assetTypeId === assignmentForm.asset_type &&
                                    asset._assetTypeCategory === 'SOFTWARE'
                                  );
                                })
                                .map(a => {
                                  // Get all assignments for this asset
                                  const assetAssignments = assignments.filter(aa =>
                                    aa.assets && aa.assets.includes(a.id)
                                  );
                                  const assignedTo = assetAssignments.map(aa => {
                                    const emp = employees.find(e => e.id == aa.employee) || aa.employee_info;
                                    return emp ? emp.name : 'Unknown';
                                  });

                                  return (
                                    <div key={a.id} className="flex items-start p-1 hover:bg-gray-50 rounded">
                                      <input
                                        id={`asset-${a.id}`}
                                        type="checkbox"
                                        checked={assignmentForm.assets.includes(a.id)}
                                        onChange={(e) => {
                                          const isChecked = e.target.checked;
                                          setAssignmentForm(prev => ({
                                            ...prev,
                                            assets: isChecked
                                              ? [...prev.assets, a.id]
                                              : prev.assets.filter(id => id !== a.id)
                                          }));
                                        }}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                                      />
                                      <div className="ml-2">
                                        <label htmlFor={`asset-${a.id}`} className="block text-sm text-gray-700">
                                          {a.asset_type} • {a.serial_number || a.description || a.id}
                                        </label>
                                        {assignedTo.length > 0 && (
                                          <div className="text-xs text-gray-500 mt-0.5">
                                            Currently assigned to: {assignedTo.join(', ')}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                            )}
                          </div>
                        </div>
                      ) : (
                        <select
                          value={assignmentForm.asset || ''}
                          onChange={(e) => setAssignmentForm(prev => ({
                            ...prev,
                            asset: e.target.value ? Number(e.target.value) : null
                          }))}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          disabled={!assignmentForm.asset_type}
                        >
                          <option value="">
                            {!assignmentForm.asset_type
                              ? 'Select an asset type first'
                              : 'Select Asset'}
                          </option>
                          {(assets || [])
                            .filter(asset => {
                              return (
                                !!assignmentForm.asset_type &&
                                asset._assetTypeId === assignmentForm.asset_type &&
                                asset._assetTypeCategory === 'HARDWARE'
                              );
                            })
                            // For hardware, only show unassigned assets
                            .filter(asset => !asset.employee_name)
                            .map(a => (
                              <option key={a.id} value={a.id}>
                                {a.asset_type} • {a.serial_number || a.description || a.id}
                                {a.employee_name ? ` (Assigned to ${a.employee_name})` : ''}
                              </option>
                            ))}
                        </select>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Manager email</label>
                      <input type="email" value={assignmentForm.manager_email} onChange={(e) => setAssignmentForm({ ...assignmentForm, manager_email: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <textarea rows={4} value={assignmentForm.notes} onChange={(e) => setAssignmentForm({ ...assignmentForm, notes: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse sm:space-x-reverse sm:space-x-3">
                  <button
                    onClick={() => submitAssignment('save')}
                    disabled={!assignmentForm.employee || (assignmentForm.isSoftware ? !assignmentForm.assets.length : !assignmentForm.asset)}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => submitAssignment('add_another')}
                    disabled={!assignmentForm.employee || (assignmentForm.isSoftware ? !assignmentForm.assets.length : !assignmentForm.asset)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    Save and add another
                  </button>
                  <button
                    onClick={() => submitAssignment('continue')}
                    disabled={!assignmentForm.employee || (assignmentForm.isSoftware ? !assignmentForm.assets.length : !assignmentForm.asset)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    Save and continue editing
                  </button>
                  <button onClick={() => setShowAssignmentModal(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {
        showReturnModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowReturnModal(false)}></div>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Record Offboarding Return</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">User *</label>
                      {(() => {
                        // Eligible only when HR created an Offboarding record
                        // Map to the IDs used by employees state (to keep submission compatible)
                        const employeesArr = (employees || []);
                        const eligibleUsers = (offboardings || []).map(o => {
                          const byEmail = employeesArr.find(e => (e.email || e.user?.email) && (e.email === o.employee_email || e.user?.email === o.employee_email));
                          const byName = byEmail || employeesArr.find(e => (e.name || '').toLowerCase() === String(o.employee_name || '').toLowerCase());
                          const match = byName;
                          if (!match) return null;
                          const id = String(match.id ?? match.user_id ?? match.user?.id ?? '');
                          const name = match.name || o.employee_name || `User ${id}`;
                          if (!id) return null;
                          return { id, name };
                        }).filter(Boolean);
                        const hasEligible = eligibleUsers.length > 0;
                        return (
                          <>
                            <select
                              value={returnForm.user}
                              onChange={(e) => setReturnForm({ ...returnForm, user: e.target.value, returned_assets: [] })}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              disabled={!hasEligible}
                            >
                              <option value="">{hasEligible ? 'Select User' : 'No users pending offboarding'}</option>
                              {eligibleUsers.map(u => (<option key={u.id} value={u.id}>{u.name}</option>))}
                            </select>
                            {!hasEligible && (
                              <p className="mt-1 text-xs text-gray-500">Ask HR Manager to add the employee to Offboarding to enable returns.</p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Returned Assets</label>
                      <select multiple value={(returnForm.returned_assets || []).map(String)} onChange={(e) => setReturnForm({ ...returnForm, returned_assets: Array.from(e.target.selectedOptions).map(o => Number(o.value)) })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 min-h-[120px]">
                        {(() => {
                          // Match selected user against the display list computed above
                          const employeesArr = (employees || []);
                          const eligibleUsers = (offboardings || []).map(o => {
                            const byEmail = employeesArr.find(e => (e.email || e.user?.email) && (e.email === o.employee_email || e.user?.email === o.employee_email));
                            const byName = byEmail || employeesArr.find(e => (e.name || '').toLowerCase() === String(o.employee_name || '').toLowerCase());
                            const match = byName;
                            if (!match) return null;
                            const id = String(match.id ?? match.user_id ?? match.user?.id ?? '');
                            const name = match.name || o.employee_name || `User ${id}`;
                            if (!id) return null;
                            return { id, name };
                          }).filter(Boolean);
                          const selected = eligibleUsers.find(u => u.id == returnForm.user);
                          const list = (assets || []).filter(a => selected && a.employee_name === selected.name);
                          if (!selected) return [<option key="hint" value="" disabled>Select a user to load assigned assets</option>];
                          if (list.length === 0) return [<option key="none" value="" disabled>No assigned assets</option>];
                          return list.map(a => (
                            <option key={a.id} value={a.id}>{a.asset_type} • {a.serial_number || a.description || a.id}</option>
                          ));
                        })()}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Damaged Assets File</label>
                      <input type="file" onChange={(e) => setReturnForm({ ...returnForm, damaged_file: (e.target.files && e.target.files[0]) || null })} className="mt-1 block w-full text-sm text-gray-700" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Remarks</label>
                      <textarea rows={4} value={returnForm.remarks} onChange={(e) => setReturnForm({ ...returnForm, remarks: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div className="flex items-center">
                      <input id="ret_is_offboarded" type="checkbox" checked={returnForm.is_offboarded} onChange={(e) => setReturnForm({ ...returnForm, is_offboarded: e.target.checked })} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                      <label htmlFor="ret_is_offboarded" className="ml-2 block text-sm text-gray-700">Is offboarded</label>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse sm:space-x-reverse sm:space-x-3">
                  <button onClick={() => submitReturn('save')} disabled={!returnForm.user || !(returnForm.returned_assets && returnForm.returned_assets.length)} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm disabled:opacity-50">Save</button>
                  <button onClick={() => submitReturn('add_another')} disabled={!returnForm.user || !(returnForm.returned_assets && returnForm.returned_assets.length)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm">Save and add another</button>
                  <button onClick={() => submitReturn('continue')} disabled={!returnForm.user || !(returnForm.returned_assets && returnForm.returned_assets.length)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm">Save and continue editing</button>
                  <button onClick={() => setShowReturnModal(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {
        showStatusModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowStatusModal(false)}></div>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Add Employee Status</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Employee *</label>
                      <select value={statusForm.employee} onChange={(e) => setStatusForm({ ...statusForm, employee: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Select Employee</option>
                        {(employees || []).map(emp => (<option key={emp.id} value={emp.id}>{emp.name}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status *</label>
                      <input type="text" value={statusForm.status} onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <textarea rows={3} value={statusForm.notes} onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button onClick={submitStatus} disabled={!statusForm.employee || !statusForm.status} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">Add</button>
                  <button onClick={() => setShowStatusModal(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )
      }


      {
        activeSection === 'hardware' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
              {[
                { key: 'all', label: 'Total', count: assetTypeCounts.all, icon: WrenchScrewdriverIcon },
                { key: 'laptop', label: 'Laptops', count: assetTypeCounts.laptop, icon: ComputerDesktopIcon },
                { key: 'mouse', label: 'Mouse', count: assetTypeCounts.mouse, icon: CursorArrowRaysIcon },
                { key: 'id_card', label: 'ID Cards', count: assetTypeCounts.id_card, icon: IdentificationIcon },
                { key: 'keyboard', label: 'Keyboards', count: assetTypeCounts.keyboard, icon: RectangleStackIcon },
                { key: 'other', label: 'Other', count: assetTypeCounts.other, icon: WrenchScrewdriverIcon },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.key} className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 p-2 rounded-md bg-blue-500 text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-bold text-gray-900">{stat.count}</h3>
                        <p className="text-xs text-gray-500">{stat.label}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search assets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="ASSIGNED">Assigned</option>
                  {/* "Repair" and "Damaged" both map to the DAMAGED backend status */}
                  <option value="DAMAGED">Repair</option>
                  <option value="DAMAGED">Damaged</option>
                  <option value="LOST">Lost</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              {filteredAssets.length === 0 ? (
                <div className="text-center py-12">
                  <WrenchScrewdriverIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No assets found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No assets match your current search and filter criteria.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset Tag</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Previously Used Employee</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchased Date</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age (years)</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issued Date</th>
                        {isAssetAdmin && (
                          <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAssets.map((asset) => (
                        <tr
                          key={asset.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => openAssetDetails(asset)}
                        >
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              <div className="flex-shrink-0 p-1.5 bg-blue-100 rounded-lg text-blue-600">
                                {getAssetIcon(asset.asset_type)}
                              </div>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAssetTypeColor(asset.asset_type)}`}>
                                {asset.asset_type.replace('_', ' ')}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {asset.asset_tag || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {asset.status && (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAssetStatusColor(asset.status)}`}>
                                {String(asset.status).toUpperCase()}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {getCurrentEmployeeNameFor(asset) || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {(() => {
                              const prev = getPreviousEmployeesFor(asset);
                              return prev.length ? prev.join(', ') : '-';
                            })()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {asset.serial_number || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {asset.description || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {asset.purchased_date ? new Date(asset.purchased_date).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {(() => {
                              const age = getAssetAgeYears(asset);
                              return age !== null && age !== undefined ? age : '-';
                            })()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {(() => {
                              const issued = getIssuedDateFor(asset);
                              return issued ? new Date(issued).toLocaleDateString() : '-';
                            })()}
                          </td>
                          {isAssetAdmin && (
                            <td
                              className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); openEditModal(asset); }}
                                  className="p-1 px-2 text-blue-600 hover:bg-blue-50 rounded"
                                  title="Edit"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleReportRepair(asset); }}
                                  className="p-1 px-2 text-orange-600 hover:bg-orange-50 rounded"
                                  title="Report Repair"
                                >
                                  Repair
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); disposeAsset(asset.id); }}
                                  className="p-1 px-2 text-red-600 hover:bg-red-50 rounded"
                                  title="Dispose"
                                >
                                  Trash
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )
      }

      {
        activeSection === 'disposed' && (
          <>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search disposed assets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              {filteredAssets.length === 0 ? (
                <div className="text-center py-12">
                  <TrashIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No disposed assets</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Assets you dispose of will appear here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset Tag</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchased Date</th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAssets.map((asset) => (
                        <tr
                          key={asset.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => openAssetDetails(asset)}
                        >
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              <div className="flex-shrink-0 p-1.5 bg-gray-100 rounded-lg text-gray-600">
                                {getAssetIcon(asset.asset_type)}
                              </div>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAssetTypeColor(asset.asset_type)}`}>
                                {asset.asset_type.replace('_', ' ')}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {asset.asset_tag || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {asset.serial_number || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {asset.description || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {asset.purchased_date ? new Date(asset.purchased_date).toLocaleDateString() : '-'}
                          </td>
                          <td
                            className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => restoreAsset(asset.id)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Restore
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )
      }

      {
        showDetailsModal && detailsAsset && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowDetailsModal(false)}></div>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Asset Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {detailsAsset.status && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAssetStatusColor(detailsAsset.status)}`}>{String(detailsAsset.status || '').toUpperCase()}</span>
                      )}
                      {(() => {
                        const typeRec = (assetTypes || []).find(t => t.id === (detailsAsset.asset_type || detailsAsset.asset_type_id));
                        const tname = typeRec?.name ? String(typeRec.name).toLowerCase().replace(/\s+/g, '_') : '';
                        return (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAssetTypeColor(tname)}`}>{typeRec?.name || 'Asset'}</span>
                        );
                      })()}
                    </div>

                    {detailsAsset.name && (
                      <div>
                        <p className="text-sm font-medium text-gray-900">{detailsAsset.name}</p>
                        <p className="text-xs text-gray-500">Name</p>
                      </div>
                    )}

                    {detailsAsset.asset_tag && (
                      <div>
                        <p className="text-sm font-medium text-gray-900">{detailsAsset.asset_tag}</p>
                        <p className="text-xs text-gray-500">Asset Tag</p>
                      </div>
                    )}

                    {detailsAsset.serial_number && (
                      <div>
                        <p className="text-sm font-medium text-gray-900">{detailsAsset.serial_number}</p>
                        <p className="text-xs text-gray-500">Serial Number</p>
                      </div>
                    )}

                    {detailsAsset.purchased_date && (
                      <div>
                        <p className="text-sm font-medium text-gray-900">{new Date(detailsAsset.purchased_date).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-500">Purchased Date</p>
                      </div>
                    )}

                    {detailsAsset.laptop_age_pretty && (
                      <div>
                        <p className="text-sm font-medium text-gray-900">{detailsAsset.laptop_age_pretty}</p>
                        <p className="text-xs text-gray-500">Laptop Age</p>
                      </div>
                    )}

                    {detailsAsset.current_employee?.name && (
                      <div>
                        <p className="text-sm font-medium text-gray-900">{detailsAsset.current_employee.name}</p>
                        <p className="text-xs text-gray-500">Current Employee</p>
                      </div>
                    )}

                    {detailsAsset.previously_used_by_info?.name && (
                      <div>
                        <p className="text-sm font-medium text-gray-900">{detailsAsset.previously_used_by_info.name}</p>
                        <p className="text-xs text-gray-500">Previously Used By</p>
                      </div>
                    )}

                    {(detailsAsset.image_before || detailsAsset.image_after) && (
                      <div className="grid grid-cols-2 gap-3">
                        {detailsAsset.image_before && (
                          <div>
                            <img src={getImageUrl(detailsAsset.image_before)} alt="Before" className="w-full h-32 object-cover rounded" />
                            <p className="text-xs text-gray-500 mt-1">Before</p>
                          </div>
                        )}
                        {detailsAsset.image_after && (
                          <div>
                            <img src={getImageUrl(detailsAsset.image_after)} alt="After" className="w-full h-32 object-cover rounded" />
                            <p className="text-xs text-gray-500 mt-1">After</p>
                          </div>
                        )}
                      </div>
                    )}

                    {detailsAsset.custom_attributes && (
                      <div>
                        <pre className="text-xs bg-gray-50 p-2 rounded border border-gray-200 overflow-auto max-h-40">{(() => { try { return JSON.stringify(detailsAsset.custom_attributes, null, 2); } catch (_) { return String(detailsAsset.custom_attributes); } })()}</pre>
                        <p className="text-xs text-gray-500 mt-1">Custom Attributes</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                  <button onClick={() => setShowDetailsModal(false)} className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-auto sm:text-sm">Close</button>
                  <button
                    onClick={() => { setShowDetailsModal(false); handleReportRepair(detailsAsset); }}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-orange-600 text-base font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:w-auto sm:text-sm"
                  >
                    Report Repair
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Create Asset Modal */}
      {
        showCreateModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowCreateModal(false)}></div>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Add New Asset
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Employee *</label>
                      <select
                        value={newAsset.employee}
                        onChange={(e) => setNewAsset({ ...newAsset, employee: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Employee</option>
                        {(employees || []).map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Asset Type *</label>
                      <select
                        value={newAsset.asset_type}
                        onChange={(e) => setNewAsset({ ...newAsset, asset_type: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="laptop">Laptop</option>
                        <option value="phone">Phone</option>
                        <option value="id_card">ID Card</option>
                        <option value="access_card">Access Card</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Serial Number</label>
                      <input
                        type="text"
                        value={newAsset.serial_number}
                        onChange={(e) => setNewAsset({ ...newAsset, serial_number: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        value={newAsset.description}
                        onChange={(e) => setNewAsset({ ...newAsset, description: e.target.value })}
                        rows={3}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Issued Date</label>
                      <input
                        type="date"
                        value={newAsset.issued_date}
                        onChange={(e) => setNewAsset({ ...newAsset, issued_date: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    onClick={createAsset}
                    disabled={!newAsset.employee || !newAsset.asset_type}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    Create Asset
                  </button>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Edit Asset Modal */}
      {
        showEditModal && selectedAsset && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowEditModal(false)}></div>
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Edit Asset
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Employee *</label>
                      <select
                        value={selectedAsset.employee}
                        onChange={(e) => setSelectedAsset({ ...selectedAsset, employee: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Employee</option>
                        {(employees || []).map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Asset Type *</label>
                      <select
                        value={selectedAsset.asset_type}
                        onChange={(e) => setSelectedAsset({ ...selectedAsset, asset_type: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="laptop">Laptop</option>
                        <option value="phone">Phone</option>
                        <option value="id_card">ID Card</option>
                        <option value="access_card">Access Card</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Serial Number</label>
                      <input
                        type="text"
                        value={selectedAsset.serial_number || ''}
                        onChange={(e) => setSelectedAsset({ ...selectedAsset, serial_number: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        value={selectedAsset.description || ''}
                        onChange={(e) => setSelectedAsset({ ...selectedAsset, description: e.target.value })}
                        rows={3}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Laptop Condition</label>
                      <select
                        value={selectedAsset.status || 'AVAILABLE'}
                        onChange={(e) => setSelectedAsset({ ...selectedAsset, status: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="AVAILABLE">Available</option>
                        <option value="ASSIGNED">Assigned</option>
                        <option value="DAMAGED">Repair</option>
                        <option value="DAMAGED">Damaged</option>
                        <option value="LOST">Lost</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Purchased Date</label>
                      <input
                        type="date"
                        value={selectedAsset.purchased_date || ''}
                        onChange={(e) => setSelectedAsset({ ...selectedAsset, purchased_date: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    onClick={updateAsset}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Update Asset
                  </button>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Repair Modal */}
      {showRepairModal && repairForm.asset && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowRepairModal(false)}></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">{repairForm.id ? 'Edit Asset Repair' : 'Report Asset Repair'}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Asset</label>
                    <div className="mt-1 p-2 bg-gray-50 rounded-md text-sm text-gray-700">
                      <strong>{repairForm.asset.asset_tag}</strong> - {repairForm.asset.description || repairForm.asset.name}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Issue Description *</label>
                    <textarea
                      rows={3}
                      value={repairForm.issue_description}
                      onChange={(e) => setRepairForm({ ...repairForm, issue_description: e.target.value })}
                      placeholder="Describe the issue with the asset..."
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        value={repairForm.status}
                        onChange={(e) => setRepairForm({ ...repairForm, status: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="PICKED_UP">Picked Up</option>
                        <option value="AT_VENDOR">At Vendor</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="FAILED">Failed</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Estimated Completion</label>
                      <input
                        type="date"
                        value={repairForm.estimated_completion}
                        onChange={(e) => setRepairForm({ ...repairForm, estimated_completion: e.target.value })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Vendor</label>
                      <input
                        type="text"
                        value={repairForm.repair_vendor}
                        onChange={(e) => setRepairForm({ ...repairForm, repair_vendor: e.target.value })}
                        placeholder="Repair shop or company name"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Repair Cost (₹)</label>
                      <input
                        type="number"
                        value={repairForm.repair_cost}
                        onChange={(e) => setRepairForm({ ...repairForm, repair_cost: e.target.value })}
                        placeholder="0.00"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Repair Notes</label>
                    <textarea
                      rows={2}
                      value={repairForm.repair_notes}
                      onChange={(e) => setRepairForm({ ...repairForm, repair_notes: e.target.value })}
                      placeholder="Additional notes for IT/Finance..."
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse space-x-reverse space-x-3">
                <button onClick={handleRepairSubmit} disabled={!repairForm.issue_description} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-orange-600 text-base font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
                  {repairForm.id ? 'Update Repair' : 'Report Repair'}
                </button>
                <button onClick={() => setShowRepairModal(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div >
  );
};

export default AssetManagement;