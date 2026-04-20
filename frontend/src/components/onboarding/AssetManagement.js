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
  TrashIcon,
  CommandLineIcon,
  ChevronRightIcon,
  UserGroupIcon,
  XMarkIcon,
  DevicePhoneMobileIcon,
  CreditCardIcon,
  ArrowPathIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { getCurrentUser } from '../../utils/auth';
import api from '../../services/api';
import { formatDateTime } from '../../utils/formatters';


const theme = {
  primaryGradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  surfaceGradient: 'rgba(255, 255, 255, 0.05)',
  headerGradient: 'rgba(255, 255, 255, 0.02)'
};

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

      const API_BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8080/api";

      const response = await fetch(`${API_BASE_URL}/assets/export/excel/`, {
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
      const API_BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8080/api";

      const response = await fetch(`${API_BASE_URL}/employees/`, {
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
        return 'bg-white/50/10 text-blue-400 border border-blue-500/20';
      case 'mouse':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'id_card':
        return 'bg-violet-500/10 text-violet-400 border border-violet-500/20';
      case 'keyboard':
        return 'bg-amber-500/100/10 text-amber-400 border border-amber-500/20';
      default:
        return 'bg-[#070B14]0/10 text-slate-400 border border-slate-500/20';
    }
  };

  const getAssetStatusColor = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'AVAILABLE') return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    if (s === 'ASSIGNED') return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
    if (s === 'DAMAGED' || s === 'REPAIR') return 'bg-amber-500/100/10 text-amber-400 border border-amber-500/20';
    if (s === 'LOST') return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    if (s === 'DISPOSED') return 'bg-[#070B14]0/10 text-slate-400 border border-slate-500/20';
    return 'bg-[#070B14]0/10 text-slate-400 border border-slate-500/20';
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
      const emp = (employees || []).find(e => e.id === Number(empId)) || a.employee_info;
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
      const emp = employees.find(e => e.id === Number(id));
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
    const baseUrl = 'http://127.0.0.1:8080';
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  return (
    <div className="min-h-screen bg-[#070B14] dark:bg-[#070B14] text-slate-200 dark:text-slate-100 p-4 lg:p-8 transition-colors duration-500">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-slate-800 dark:from-white dark:to-slate-400">
            Asset Management
          </h1>
          <p className="text-lg text-slate-400 font-medium">
            Manage and track company assets assigned to employees
          </p>
        </div>
        <button
          onClick={handleExportToExcel}
          disabled={exportingExcel}
          style={{ background: theme.primaryGradient }}
          className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl shadow-lg text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
        >
          {exportingExcel ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Exporting...
            </>
          ) : (
            <>
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export to Excel
            </>
          )}
        </button>
      </div>


      {isAssetManager && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
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
                className={`text-left rounded-2xl p-6 transition-all duration-300 border flex flex-col justify-between group h-full ${
                  selected 
                    ? 'bg-indigo-500/10 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]' 
                    : 'bg-white/5 dark:bg-slate-800/10 border-slate-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-white/10'
                }`}
              >
                <div className={`font-bold text-lg mb-4 group-hover:text-indigo-500 transition-colors uppercase tracking-wider text-slate-900 dark:text-white`}>{item.label}</div>
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleAdminTileAdd(item.route); }}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/40 transition-all"
                  >
                    Add
                  </button>
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                    selected 
                      ? 'bg-indigo-600 text-white border-indigo-500' 
                      : 'bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10 group-hover:border-indigo-300 dark:group-hover:border-indigo-500/50'
                  }`}>
                    Manage
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isAssetManager && activeSection === 'types' && (
        <div className="max-w-7xl mx-auto bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 dark:border-white/10 overflow-hidden shadow-2xl p-6">
          {assetTypes.length === 0 ? (
            <div className="text-center py-12 text-slate-500">No asset types yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead style={{ background: theme.headerGradient }}>
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-widest">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-widest">Category</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-widest">Tag Prefix</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-widest">Description</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-widest">Team Email</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {assetTypes.map(t => (
                    <tr key={t.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium">
                        <button
                          type="button"
                          className="text-indigo-400 hover:text-indigo-300 hover:underline transition-colors"
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
                      <td className="px-6 py-4 text-sm text-slate-400">{(t.category === 'HARDWARE' && 'Hardware') || (t.category === 'SOFTWARE' && 'Software') || t.category}</td>
                      <td className="px-6 py-4 text-sm font-mono text-slate-500">{t.tag_prefix}</td>
                      <td className="px-6 py-4 text-sm text-slate-400">{t.description || '(None)'}</td>
                      <td className="px-6 py-4 text-sm text-slate-400">{t.asset_team_email || ''}</td>
                      <td className="px-6 py-4 text-sm">{t.is_active ? '✅' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {isAssetManager && activeSection === 'software' && (
        <div className="max-w-7xl mx-auto">
          {(() => {
            const sw = (assets || []).filter(a => a._assetTypeCategory === 'SOFTWARE');
            if (sw.length === 0) return (
              <div className="text-center py-20 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 dark:border-white/10">
                <RectangleStackIcon className="mx-auto h-16 w-16 text-slate-600 mb-4" />
                <h3 className="text-xl font-bold text-white">No software assets yet</h3>
              </div>
            );
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sw.map(s => (
                  <div key={s.id} className="bg-white/5 border border-white/10 dark:border-white/10 backdrop-blur-xl rounded-2xl p-6 hover:bg-black/10 dark:bg-white/5/10 transition-all group border-l-4 border-l-indigo-500 shadow-xl">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
                        <CommandLineIcon className="h-6 w-6" />
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-wider border border-indigo-500/20">Software</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">{s.description || s.asset_type}</h3>
                    <div className="space-y-2">
                      {s.asset_tag && (
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="font-semibold text-slate-500">TAG:</span>
                          <span className="font-mono">{s.asset_tag}</span>
                        </div>
                      )}
                      {s.serial_number && (
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="font-semibold text-slate-500">LICENSE:</span>
                          <span className="font-mono text-indigo-400/80 truncate">{s.serial_number}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
                      <button onClick={() => openAssetDetails(s)} className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                        View Details <ChevronRightIcon className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {isAssetManager && activeSection === 'assignments' && (
        <div className="max-w-7xl mx-auto">
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

            if (grouped.length === 0) return (
              <div className="text-center py-20 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 dark:border-white/10">
                <UserGroupIcon className="mx-auto h-16 w-16 text-slate-600 mb-4" />
                <h3 className="text-xl font-bold text-white">No active assignments</h3>
              </div>
            );
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {grouped.map(g => {
                  const emp = (employees || []).find(e => e.id === Number(g.employee)) || g.employee_info;
                  const assetsFiltered = (g.assets || []).map(id => (assets || []).find(x => x.id === Number(id))).filter(Boolean);
                  const typesLabel = (g.asset_types || []).map(id => typeNameById.get(id) || id);

                  return (
                    <div key={g.employee} className="bg-white/5 border border-white/10 dark:border-white/10 backdrop-blur-xl rounded-2xl p-6 hover:bg-black/10 dark:bg-white/5/10 transition-all shadow-xl group">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-indigo-500/20">
                          {emp?.name?.charAt(0) || emp?.username?.charAt(0) || 'E'}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">{emp?.name || emp?.username || 'Employee'}</h3>
                          <p className="text-xs text-slate-400">{g.manager_email || 'General Assignment'}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {typesLabel.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Requested Types</p>
                            <div className="flex flex-wrap gap-2">
                              {typesLabel.map((t, idx) => (
                                <span key={idx} className="px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 text-[10px] font-bold border border-white/10">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {assetsFiltered.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Assigned Assets</p>
                            <div className="space-y-2">
                              {assetsFiltered.map((as, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/10">
                                  <div className="text-indigo-400 bg-indigo-500/10 p-1.5 rounded-lg">
                                    {getAssetIcon(as.asset_type)}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-white truncate">{as.asset_type}</p>
                                    <p className="text-[10px] text-slate-500 font-mono truncate">{as.asset_tag || as.serial_number || as.id}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {g.notes && (
                          <div className="mt-4 p-3 rounded-xl bg-amber-500/100/5 border border-amber-500/10">
                            <p className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest mb-1 italic">Notes</p>
                            <p className="text-xs text-slate-400 leading-relaxed italic line-clamp-2">{g.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {isAssetManager && activeSection === 'returns' && (
        <div className="max-w-7xl mx-auto">
          {returnsList.length === 0 ? (
            <div className="text-center py-20 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 dark:border-white/10">
              <ArrowPathIcon className="mx-auto h-16 w-16 text-slate-600 mb-4" />
              <h3 className="text-xl font-bold text-white">No returns recorded</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {returnsList.map(r => {
                const emp = (employees || []).find(e => e.id == r.user);
                const labels = (r.returned_assets || []).map(id => {
                  const a = (assets || []).find(x => x.id == id);
                  return a ? { type: a.asset_type, info: a.serial_number || a.description || a.id } : { type: 'Unknown', info: `Asset ${id}` };
                });
                return (
                  <div key={r.id} className="bg-white/5 border border-white/10 dark:border-white/10 backdrop-blur-xl rounded-2xl p-6 hover:bg-black/10 dark:bg-white/5/10 transition-all shadow-xl group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-orange-500/100/10 text-orange-400 flex items-center justify-center text-sm font-bold border border-orange-500/20">
                          {emp?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">{emp?.name || 'User'}</h3>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest">{new Date(r.created_at || Date.now()).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${r.is_offboarded ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/100/10 text-amber-400 border-amber-500/20'}`}>
                        {r.is_offboarded ? 'OFFBOARDED' : 'IN PROGRESS'}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Returned Assets</p>
                      {labels.map((l, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/10">
                          <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
                            {getAssetIcon(l.type)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate">{l.type}</p>
                            <p className="text-[10px] text-slate-500 font-mono truncate">{l.info}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {r.remarks && (
                      <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 italic">Remarks</p>
                        <p className="text-xs text-slate-400 italic line-clamp-2">{r.remarks}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}





      {showAddHardwareModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto px-4 py-6 sm:px-0">
          <div className="flex items-center justify-center min-h-screen">
            <div className="fixed inset-0 transition-opacity bg-[#070B14] dark:bg-[#070B14]/80 backdrop-blur-sm" onClick={() => setShowAddHardwareModal(false)}></div>
            <div className="relative inline-block align-bottom bg-[#0B1120] rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full border border-white/10 dark:border-white/10">
              <div className="px-8 pt-8 pb-6">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-bold text-white tracking-tight">Add Hardware Asset</h3>
                  <button onClick={() => setShowAddHardwareModal(false)} className="p-2 text-slate-400 hover:text-white transition-colors">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Asset Type *</label>
                      <select
                        value={hardwareForm.asset_type}
                        onChange={(e) => setHardwareForm({ ...hardwareForm, asset_type: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none"
                      >
                        <option value="" className="bg-[#070B14] dark:bg-[#1a1c2e]">Select Type</option>
                        {(assetTypes || [])
                          .filter(t => (t.category === 'HARDWARE' || t.category === 'Hardware'))
                          .map(t => (
                            <option key={t.id} value={t.name} className="bg-[#070B14] dark:bg-[#1a1c2e]">{t.name}</option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Name / Model *</label>
                      <input
                        type="text"
                        placeholder="e.g. MacBook Pro M3"
                        value={hardwareForm.name}
                        onChange={(e) => setHardwareForm({ ...hardwareForm, name: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Asset Tag</label>
                      <input
                        type="text"
                        placeholder="OPT-HW-001"
                        value={hardwareForm.asset_tag}
                        onChange={(e) => setHardwareForm({ ...hardwareForm, asset_tag: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Serial Number</label>
                      <input
                        type="text"
                        placeholder="S/N: XXXXXXXX"
                        value={hardwareForm.serial_number}
                        onChange={(e) => setHardwareForm({ ...hardwareForm, serial_number: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Status</label>
                      <select
                        value={hardwareForm.status}
                        onChange={(e) => setHardwareForm({ ...hardwareForm, status: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none"
                      >
                        <option value="available" className="bg-[#070B14] dark:bg-[#1a1c2e]">Available</option>
                        <option value="assigned" className="bg-[#070B14] dark:bg-[#1a1c2e]">Assigned</option>
                        <option value="repair" className="bg-[#070B14] dark:bg-[#1a1c2e]">Repair</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Purchased Date</label>
                      <input
                        type="date"
                        value={hardwareForm.purchased_date}
                        onChange={(e) => setHardwareForm({ ...hardwareForm, purchased_date: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all [color-scheme:dark]"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Custom Attributes / Description</label>
                  <textarea
                    rows={3}
                    placeholder="Technical specifications, damage reports, etc."
                    value={hardwareForm.custom_attributes}
                    onChange={(e) => setHardwareForm({ ...hardwareForm, custom_attributes: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                  />
                </div>

                <div className="mt-6 flex items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2">
                    <input
                      type="checkbox"
                      className="peer absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                      checked={hardwareForm.is_active}
                      onChange={(e) => setHardwareForm({ ...hardwareForm, is_active: e.target.checked })}
                    />
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#070B14] shadow ring-0 transition duration-200 ease-in-out ${hardwareForm.is_active ? 'translate-x-5' : 'translate-x-0'}`}></span>
                    <span className={`pointer-events-none absolute inset-0 rounded-full transition-colors duration-200 ease-in-out ${hardwareForm.is_active ? 'bg-indigo-600' : 'bg-white/5/10 dark:bg-slate-700'}`}></span>
                  </div>
                  <label className="ml-3 block text-sm font-medium text-slate-300">Active Asset</label>
                </div>
              </div>

              <div className="px-8 py-6 bg-white/5 border-t border-white/10 flex flex-col sm:flex-row-reverse gap-3">
                <button
                  onClick={() => submitHardware('save')}
                  disabled={!hardwareForm.asset_type || !hardwareForm.name}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                >
                  Save Asset
                </button>
                <button
                  onClick={() => setShowAddHardwareModal(false)}
                  className="flex-1 px-6 py-3 bg-white/5 text-slate-300 hover:text-white rounded-xl font-bold border border-white/10 dark:border-white/10 hover:bg-black/10 dark:bg-white/5/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddTypeModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto px-4 py-6 sm:px-0">
          <div className="flex items-center justify-center min-h-screen">
            <div className="fixed inset-0 transition-opacity bg-[#070B14] dark:bg-[#070B14]/80 backdrop-blur-sm" onClick={() => setShowAddTypeModal(false)}></div>
            <div className="relative inline-block align-bottom bg-[#0B1120] rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full border border-white/10 dark:border-white/10">
              <div className="px-8 pt-8 pb-6">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-bold text-white tracking-tight">{typeForm?.id ? 'Edit Asset Type' : 'Add Asset Type'}</h3>
                  <button onClick={() => setShowAddTypeModal(false)} className="p-2 text-slate-400 hover:text-white transition-colors">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Type Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Workstation, Cloud Subscription"
                      value={typeForm.name}
                      onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Category</label>
                    <select
                      value={typeForm.category}
                      onChange={(e) => setTypeForm({ ...typeForm, category: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none"
                    >
                      <option value="Hardware" className="bg-[#070B14] dark:bg-[#1a1c2e]">Hardware</option>
                      <option value="Software" className="bg-[#070B14] dark:bg-[#1a1c2e]">Software</option>
                      <option value="Other" className="bg-[#070B14] dark:bg-[#1a1c2e]">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Tag Prefix</label>
                    <input
                      type="text"
                      placeholder="e.g. HW-, SW-"
                      value={typeForm.tag_prefix}
                      onChange={(e) => setTypeForm({ ...typeForm, tag_prefix: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Description</label>
                    <textarea
                      rows={2}
                      placeholder="Briefly describe this asset category"
                      value={typeForm.description}
                      onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Asset Team Email</label>
                    <input
                      type="email"
                      placeholder="it-support@company.com"
                      value={typeForm.asset_team_email}
                      onChange={(e) => setTypeForm({ ...typeForm, asset_team_email: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                    />
                  </div>

                  <div className="flex items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out">
                      <input
                        type="checkbox"
                        className="peer absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                        checked={typeForm.is_active}
                        onChange={(e) => setTypeForm({ ...typeForm, is_active: e.target.checked })}
                      />
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#070B14] shadow ring-0 transition duration-200 ease-in-out ${typeForm.is_active ? 'translate-x-5' : 'translate-x-0'}`}></span>
                      <span className={`pointer-events-none absolute inset-0 rounded-full transition-colors duration-200 ease-in-out ${typeForm.is_active ? 'bg-indigo-600' : 'bg-white/5/10 dark:bg-slate-700'}`}></span>
                    </div>
                    <label className="ml-3 block text-sm font-medium text-slate-300">Active Type</label>
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 bg-white/5 border-t border-white/10 flex flex-col sm:flex-row-reverse gap-3">
                <button
                  onClick={() => submitType('save')}
                  disabled={!typeForm.name}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                >
                  {typeForm?.id ? 'Update Type' : 'Create Type'}
                </button>
                <button
                  onClick={() => setShowAddTypeModal(false)}
                  className="flex-1 px-6 py-3 bg-white/5 text-slate-300 hover:text-white rounded-xl font-bold border border-white/10 dark:border-white/10 hover:bg-black/10 dark:bg-white/5/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddSoftwareModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto px-4 py-6 sm:px-0">
          <div className="flex items-center justify-center min-h-screen">
            <div className="fixed inset-0 transition-opacity bg-[#070B14] dark:bg-[#070B14]/80 backdrop-blur-sm" onClick={() => setShowAddSoftwareModal(false)}></div>
            <div className="relative inline-block align-bottom bg-[#0B1120] rounded-3xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full border border-white/10 dark:border-white/10">
              <div className="px-8 pt-8 pb-6">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-bold text-white tracking-tight">Add Software Asset</h3>
                  <button onClick={() => setShowAddSoftwareModal(false)} className="p-2 text-slate-400 hover:text-white transition-colors">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Software Type *</label>
                    <select
                      value={softwareForm.asset_type}
                      onChange={(e) => setSoftwareForm({ ...softwareForm, asset_type: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none"
                    >
                      <option value="" className="bg-[#070B14] dark:bg-[#1a1c2e]">Select Type</option>
                      {(assetTypes || [])
                        .filter(t => (t.category === 'SOFTWARE' || t.category === 'Software'))
                        .map(t => (
                          <option key={t.id} value={t.name} className="bg-[#070B14] dark:bg-[#1a1c2e]">{t.name}</option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Product Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Adobe Creative Cloud"
                      value={softwareForm.name}
                      onChange={(e) => setSoftwareForm({ ...softwareForm, name: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Asset Tag</label>
                      <input
                        type="text"
                        placeholder="OPT-SW-001"
                        value={softwareForm.asset_tag}
                        onChange={(e) => setSoftwareForm({ ...softwareForm, asset_tag: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">License Key</label>
                      <input
                        type="text"
                        placeholder="XXXX-XXXX-XXXX"
                        value={softwareForm.serial_number}
                        onChange={(e) => setSoftwareForm({ ...softwareForm, serial_number: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Status</label>
                    <select
                      value={softwareForm.status}
                      onChange={(e) => setSoftwareForm({ ...softwareForm, status: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none"
                    >
                      <option value="available" className="bg-[#070B14] dark:bg-[#1a1c2e]">Available</option>
                      <option value="assigned" className="bg-[#070B14] dark:bg-[#1a1c2e]">Assigned</option>
                      <option value="disabled" className="bg-[#070B14] dark:bg-[#1a1c2e]">Disabled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Notes / Terms</label>
                    <textarea
                      rows={3}
                      placeholder="Renewal dates, user limits, etc."
                      value={softwareForm.custom_attributes}
                      onChange={(e) => setSoftwareForm({ ...softwareForm, custom_attributes: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                    />
                  </div>

                  <div className="flex items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out">
                      <input
                        type="checkbox"
                        className="peer absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                        checked={softwareForm.is_active}
                        onChange={(e) => setSoftwareForm({ ...softwareForm, is_active: e.target.checked })}
                      />
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#070B14] shadow ring-0 transition duration-200 ease-in-out ${softwareForm.is_active ? 'translate-x-5' : 'translate-x-0'}`}></span>
                      <span className={`pointer-events-none absolute inset-0 rounded-full transition-colors duration-200 ease-in-out ${softwareForm.is_active ? 'bg-indigo-600' : 'bg-white/5/10 dark:bg-slate-700'}`}></span>
                    </div>
                    <label className="ml-3 block text-sm font-medium text-slate-300">Active License</label>
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 bg-white/5 border-t border-white/10 flex flex-col sm:flex-row-reverse gap-3">
                <button
                  onClick={() => submitSoftware('save')}
                  disabled={!softwareForm.asset_type || !softwareForm.name}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                >
                  Save License
                </button>
                <button
                  onClick={() => setShowAddSoftwareModal(false)}
                  className="flex-1 px-6 py-3 bg-white/5 text-slate-300 hover:text-white rounded-xl font-bold border border-white/10 dark:border-white/10 hover:bg-black/10 dark:bg-white/5/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAssignmentModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto px-4 py-6 sm:px-0">
          <div className="flex items-center justify-center min-h-screen">
            <div className="fixed inset-0 transition-opacity bg-[#070B14] dark:bg-[#070B14]/80 backdrop-blur-sm" onClick={() => setShowAssignmentModal(false)}></div>
            <div className="relative inline-block align-bottom bg-[#0B1120] rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-white/10 dark:border-white/10">
              <div className="px-8 pt-8 pb-6">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-bold text-white tracking-tight">Create Assignment</h3>
                  <button onClick={() => setShowAssignmentModal(false)} className="p-2 text-slate-400 hover:text-white transition-colors">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Employee *</label>
                    <select
                      value={assignmentForm.employee}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, employee: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none"
                    >
                      <option value="" className="bg-[#070B14] dark:bg-[#1a1c2e]">Select Employee</option>
                      {(employees || []).map(emp => (<option key={emp.id} value={emp.id} className="bg-[#070B14] dark:bg-[#1a1c2e]">{emp.name}</option>))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Asset Type</label>
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
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none"
                    >
                      <option value="" className="bg-[#070B14] dark:bg-[#1a1c2e]">Select Asset Type</option>
                      {(assetTypes.length ? assetTypes : []).map(type => (
                        <option key={type.id} value={type.id} className="bg-[#070B14] dark:bg-[#1a1c2e]">
                          {type.name} ({type.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Available Asset</label>
                    {assignmentForm.isSoftware ? (
                      <div className="mt-1 space-y-2">
                        <div className="max-h-48 overflow-y-auto bg-white/5 border border-white/10 dark:border-white/10 rounded-xl p-3 scrollbar-none">
                          {!assignmentForm.asset_type ? (
                            <div className="text-sm text-slate-500 italic p-2">Select an asset type first</div>
                          ) : (
                            <div className="space-y-1">
                              {(assets || [])
                                .filter(asset => {
                                  return (
                                    !!assignmentForm.asset_type &&
                                    asset._assetTypeId === assignmentForm.asset_type &&
                                    asset._assetTypeCategory === 'SOFTWARE'
                                  );
                                })
                                .map(a => {
                                  const assetAssignments = assignments.filter(aa =>
                                    aa.assets && aa.assets.includes(a.id)
                                  );
                                  const assignedTo = assetAssignments.map(aa => {
                                    const emp = employees.find(e => e.id === Number(aa.employee)) || aa.employee_info;
                                    return emp ? emp.name : 'Unknown';
                                  });

                                  return (
                                    <label key={a.id} className="flex items-start gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer group">
                                      <div className="relative flex items-center h-5">
                                        <input
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
                                          className="h-4 w-4 rounded border-black/20 dark:border-white/20 bg-white/5 text-indigo-600 focus:ring-indigo-500/50 transition-all"
                                        />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-sm text-slate-200 font-medium group-hover:text-white transition-colors">
                                          {a.asset_type} • {a.serial_number || a.description || a.id}
                                        </p>
                                        {assignedTo.length > 0 && (
                                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                            Currently with: {assignedTo.join(', ')}
                                          </p>
                                        )}
                                      </div>
                                    </label>
                                  );
                                })
                              }
                            </div>
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
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none"
                        disabled={!assignmentForm.asset_type}
                      >
                        <option value="" className="bg-[#070B14] dark:bg-[#1a1c2e]">
                          {!assignmentForm.asset_type
                            ? 'Select an asset type first'
                            : 'Select Asset Instance'}
                        </option>
                        {(assets || [])
                          .filter(asset => {
                            return (
                              !!assignmentForm.asset_type &&
                              asset._assetTypeId === assignmentForm.asset_type &&
                              asset._assetTypeCategory === 'HARDWARE'
                            );
                          })
                          .filter(asset => !asset.employee_name)
                          .map(a => (
                            <option key={a.id} value={a.id} className="bg-[#070B14] dark:bg-[#1a1c2e]">
                              {a.asset_type} • {a.serial_number || a.description || a.id}
                            </option>
                          ))}
                      </select>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Manager Email</label>
                      <input
                        type="email"
                        placeholder="reporting@company.com"
                        value={assignmentForm.manager_email}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, manager_email: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Assignment Notes</label>
                    <textarea
                      rows={3}
                      placeholder="Special instructions or delivery notes..."
                      value={assignmentForm.notes}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, notes: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 bg-white/5 border-t border-white/10 flex flex-col sm:flex-row-reverse gap-3">
                <button
                  onClick={() => submitAssignment('save')}
                  disabled={!assignmentForm.employee || (assignmentForm.isSoftware ? !assignmentForm.assets.length : !assignmentForm.asset)}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                >
                  Create Assignment
                </button>
                <button
                  onClick={() => setShowAssignmentModal(false)}
                  className="flex-1 px-6 py-3 bg-white/5 text-slate-300 hover:text-white rounded-xl font-bold border border-white/10 dark:border-white/10 hover:bg-black/10 dark:bg-white/5/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReturnModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto px-4 py-6 sm:px-0">
          <div className="flex items-center justify-center min-h-screen">
            <div className="fixed inset-0 transition-opacity bg-[#070B14] dark:bg-[#070B14]/80 backdrop-blur-sm" onClick={() => setShowReturnModal(false)}></div>
            <div className="relative inline-block align-bottom bg-[#0B1120] rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full border border-white/10 dark:border-white/10">
              <div className="px-8 pt-8 pb-6">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-bold text-white tracking-tight">Return Asset</h3>
                  <button onClick={() => setShowReturnModal(false)} className="p-2 text-slate-400 hover:text-white transition-colors">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Asset *</label>
                    <select
                      value={returnForm.asset}
                      onChange={(e) => setReturnForm({ ...returnForm, asset: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none"
                    >
                      <option value="" className="bg-[#070B14] dark:bg-[#1a1c2e]">Select Assigned Asset</option>
                      {(assets || [])
                        .filter(a => !!a.employee_name)
                        .map(a => (
                          <option key={a.id} value={a.id} className="bg-[#070B14] dark:bg-[#1a1c2e]">
                            {a.asset_type} • {a.serial_number || a.id} (Assigned to {a.employee_name})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Return Status</label>
                    <select
                      value={returnForm.status}
                      onChange={(e) => setReturnForm({ ...returnForm, status: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none"
                    >
                      <option value="available" className="bg-[#070B14] dark:bg-[#1a1c2e]">Available (Good Condition)</option>
                      <option value="damaged" className="bg-[#070B14] dark:bg-[#1a1c2e]">Damaged / Need Repair</option>
                      <option value="lost" className="bg-[#070B14] dark:bg-[#1a1c2e]">Lost / Stolen</option>
                      <option value="retired" className="bg-[#070B14] dark:bg-[#1a1c2e]">Retired / End of Life</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Return Remarks</label>
                    <textarea
                      rows={3}
                      placeholder="Condition upon return, missing cables, etc."
                      value={returnForm.remarks}
                      onChange={(e) => setReturnForm({ ...returnForm, remarks: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 bg-white/5 border-t border-white/10 flex flex-col sm:flex-row-reverse gap-3">
                <button
                  onClick={() => submitReturn()}
                  disabled={!returnForm.asset}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-bold shadow-lg shadow-red-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                >
                  Process Return
                </button>
                <button
                  onClick={() => setShowReturnModal(false)}
                  className="flex-1 px-6 py-3 bg-white/5 text-slate-300 hover:text-white rounded-xl font-bold border border-white/10 dark:border-white/10 hover:bg-black/10 dark:bg-white/5/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {
        showStatusModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto px-4 py-6 sm:px-0">
            <div className="flex items-center justify-center min-h-screen">
              <div className="fixed inset-0 transition-opacity bg-[#070B14] dark:bg-[#070B14]/80 backdrop-blur-sm" onClick={() => setShowStatusModal(false)}></div>
              <div className="relative inline-block align-bottom bg-[#0B1120] rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full border border-white/10 dark:border-white/10">
                <div className="px-8 pt-8 pb-6">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-bold text-white tracking-tight">Add Employee Status</h3>
                    <button onClick={() => setShowStatusModal(false)} className="p-2 text-slate-400 hover:text-white transition-colors">
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Employee *</label>
                      <select
                        value={statusForm.employee}
                        onChange={(e) => setStatusForm({ ...statusForm, employee: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none"
                      >
                        <option value="" className="bg-[#070B14] dark:bg-[#1a1c2e]">Select Employee</option>
                        {(employees || []).map(emp => (<option key={emp.id} value={emp.id} className="bg-[#070B14] dark:bg-[#1a1c2e]">{emp.name}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Status *</label>
                      <input
                        type="text"
                        value={statusForm.status}
                        onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Notes</label>
                      <textarea
                        rows={3}
                        value={statusForm.notes}
                        onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                      />
                    </div>
                  </div>
                </div>
                <div className="px-8 py-6 bg-white/5 border-t border-white/10 flex flex-col sm:flex-row-reverse gap-3">
                  <button onClick={submitStatus} disabled={!statusForm.employee || !statusForm.status} className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100">Add</button>
                  <button onClick={() => setShowStatusModal(false)} className="flex-1 px-6 py-3 bg-white/5 text-slate-300 hover:text-white rounded-xl font-bold border border-white/10 dark:border-white/10 hover:bg-black/10 dark:bg-white/5/10 transition-all">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )
      }


      {
        activeSection === 'hardware' && (
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-6 mb-10">
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
                  <div key={stat.key} className="bg-white/5 dark:bg-slate-800/10 border border-slate-200 dark:border-white/10 backdrop-blur-xl rounded-2xl p-6 transition-all duration-300 hover:border-indigo-300 dark:hover:border-indigo-500/50 group">
                    <div className="flex flex-col items-center text-center">
                      <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 mb-3 group-hover:scale-110 transition-transform">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold mb-1 text-slate-900 dark:text-white">{stat.count}</h3>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-6 mb-8 items-end">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Search Assets</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search serial, tag, description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl leading-5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all backdrop-blur-md"
                  />
                </div>
              </div>
              <div className="w-full sm:w-64">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Status Filter</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="block w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all backdrop-blur-md appearance-none"
                >
                  <option value="all" className="bg-[#070B14] dark:bg-[#1a1c2e]">All Statuses</option>
                  <option value="AVAILABLE" className="bg-[#070B14] dark:bg-[#1a1c2e]">Available</option>
                  <option value="ASSIGNED" className="bg-[#070B14] dark:bg-[#1a1c2e]">Assigned</option>
                  <option value="DAMAGED" className="bg-[#070B14] dark:bg-[#1a1c2e]">Repair</option>
                  <option value="DAMAGED" className="bg-[#070B14] dark:bg-[#1a1c2e]">Damaged</option>
                  <option value="LOST" className="bg-[#070B14] dark:bg-[#1a1c2e]">Lost</option>
                </select>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 dark:border-white/10 overflow-hidden shadow-2xl">
              {filteredAssets.length === 0 ? (
                <div className="text-center py-20">
                  <WrenchScrewdriverIcon className="mx-auto h-16 w-16 text-slate-600 mb-4" />
                  <h3 className="text-xl font-bold text-white">No assets found</h3>
                  <p className="mt-2 text-slate-400 max-w-xs mx-auto">
                    No assets match your current search and filter criteria.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/10">
                    <thead style={{ background: theme.headerGradient }}>
                      <tr>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-widest">Type</th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-widest">Asset Tag</th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-widest">Status</th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-widest">Employee</th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-widest">History</th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-widest">Serial #</th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-widest">Description</th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-widest">Purchased</th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-widest">Age</th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-widest">Issued</th>
                        {isAssetAdmin && (
                          <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-slate-300 uppercase tracking-widest">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredAssets.map((asset) => (
                        <tr
                          key={asset.id}
                          className="hover:bg-white/5 cursor-pointer transition-colors group/row border-b border-white/10 last:border-0"
                          onClick={() => openAssetDetails(asset)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 p-2 bg-indigo-500/10 rounded-xl text-indigo-400 group-hover/row:bg-indigo-500/20 transition-all">
                                {getAssetIcon(asset.asset_type)}
                              </div>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getAssetTypeColor(asset.asset_type)} border border-white/10 dark:border-white/10 shadow-sm`}>
                                {asset.asset_type.replace('_', ' ')}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-400">
                            {asset.asset_tag || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {asset.status && (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getAssetStatusColor(asset.status)} border border-white/10 dark:border-white/10 shadow-sm`}>
                                {String(asset.status).toUpperCase()}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                            {getCurrentEmployeeNameFor(asset) || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                            {(() => {
                              const prev = getPreviousEmployeesFor(asset);
                              return prev.length ? (
                                <div className="flex -space-x-2">
                                  {prev.map((p, i) => (
                                    <div key={i} className="h-6 w-6 rounded-full bg-indigo-600 border-2 border-[#070B14] flex items-center justify-center text-[8px] font-bold text-white shadow-lg" title={p}>
                                      {p.charAt(0)}
                                    </div>
                                  ))}
                                </div>
                              ) : '-';
                            })()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-400">
                            {asset.serial_number || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-400 max-w-xs truncate">
                            {asset.description || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                            {asset.purchased_date ? new Date(asset.purchased_date).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                            {(() => {
                              const age = getAssetAgeYears(asset);
                              return age !== null && age !== undefined ? (
                                <span className={`px-2 py-0.5 rounded-lg border border-white/10 dark:border-white/10 bg-white/5 text-xs font-bold ${age > 3 ? 'text-orange-400' : 'text-emerald-400'}`}>
                                  {age}y
                                </span>
                              ) : '-';
                            })()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                            {(() => {
                              const issued = getIssuedDateFor(asset);
                              return issued ? new Date(issued).toLocaleDateString() : '-';
                            })()}
                          </td>
                          {isAssetAdmin && (
                            <td
                              className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex justify-end gap-3">
                                <button
                                  onClick={(e) => { e.stopPropagation(); openEditModal(asset); }}
                                  className="p-2 text-indigo-400 hover:bg-indigo-500/20 rounded-xl transition-all"
                                  title="Edit"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleReportRepair(asset); }}
                                  className="p-2 text-orange-400 hover:bg-orange-500/100/20 rounded-xl transition-all"
                                  title="Report Repair"
                                >
                                  <WrenchScrewdriverIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); disposeAsset(asset.id); }}
                                  className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-xl transition-all"
                                  title="Dispose"
                                >
                                  <TrashIcon className="h-4 w-4" />
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
          </div>
        )
      }

      {
        activeSection === 'disposed' && (
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search disposed assets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all backdrop-blur-xl"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 dark:border-white/10 overflow-hidden shadow-2xl">
              {filteredAssets.length === 0 ? (
                <div className="text-center py-24">
                  <div className="h-20 w-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/10 dark:border-white/10">
                    <TrashIcon className="h-10 w-10 text-slate-600" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No disposed assets</h3>
                  <p className="text-slate-500 max-w-xs mx-auto">
                    Assets you dispose of will appear here for archival or restoration.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/10">
                    <thead style={{ background: theme.headerGradient }}>
                      <tr>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-widest">Type</th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-widest">Asset Tag</th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-widest">Serial Number</th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-widest">Description</th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-widest">Purchased</th>
                        <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-slate-300 uppercase tracking-widest">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredAssets.map((asset) => (
                        <tr
                          key={asset.id}
                          className="hover:bg-white/5 cursor-pointer transition-colors group"
                          onClick={() => openAssetDetails(asset)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-white/5 rounded-xl text-slate-400 group-hover:text-indigo-400 transition-colors">
                                {getAssetIcon(asset.asset_type)}
                              </div>
                              <span className="text-sm font-bold text-white">{asset.asset_type.replace('_', ' ')}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-indigo-400">
                            {asset.asset_tag || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-400">
                            {asset.serial_number || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-400 max-w-xs truncate">
                            {asset.description || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {asset.purchased_date ? new Date(asset.purchased_date).toLocaleDateString() : '-'}
                          </td>
                          <td
                            className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => restoreAsset(asset.id)}
                              className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
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
          </div>
        )
      }

      {
        showDetailsModal && detailsAsset && (
          <div className="fixed inset-0 z-50 overflow-y-auto px-4 py-6 sm:px-0">
            <div className="flex items-center justify-center min-h-screen">
              <div className="fixed inset-0 transition-opacity bg-[#070B14] dark:bg-[#070B14]/90 backdrop-blur-md" onClick={() => setShowDetailsModal(false)}></div>
              <div className="relative inline-block align-bottom bg-[#0B1120] rounded-[2.5rem] text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-white/10 dark:border-white/10">
                {/* Header Gradient */}
                <div className="h-32 bg-gradient-to-br from-indigo-600/20 via-violet-600/20 to-transparent relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent)]"></div>
                  <div className="absolute top-8 right-8">
                    <button onClick={() => setShowDetailsModal(false)} className="p-3 bg-white/5 hover:bg-black/10 dark:bg-white/5/10 rounded-2xl text-slate-400 hover:text-white transition-all backdrop-blur-xl border border-white/10 dark:border-white/10">
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                  <div className="absolute bottom-6 left-10">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 dark:border-white/10">
                        {getAssetIcon(detailsAsset.asset_type, 'h-8 w-8 text-indigo-400')}
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">{detailsAsset.asset_type}</h2>
                        <p className="text-indigo-400 font-mono text-sm uppercase tracking-wider mt-1">{detailsAsset.asset_tag || 'No Asset Tag'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-10 py-10">
                  <div className="grid grid-cols-2 gap-10">
                    {/* Primary Details */}
                    <div className="space-y-8">
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Core Specifications</h4>
                        <div className="space-y-5">
                          <div className="flex justify-between items-center group">
                            <span className="text-slate-400 text-sm">Serial Number</span>
                            <span className="text-white font-mono text-sm bg-white/5 px-2 py-0.5 rounded border border-white/10">{detailsAsset.serial_number || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm">Model/Description</span>
                            <span className="text-white text-sm font-semibold">{detailsAsset.description || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm">Category</span>
                            <span className="px-2.5 py-1 bg-white/5 rounded-lg text-xs font-bold text-indigo-300 border border-white/10 dark:border-white/10">{detailsAsset.category}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Lifecycle Status</h4>
                        <div className="space-y-3">
                          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-2.5 h-2.5 rounded-full ${detailsAsset.status === 'AVAILABLE' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' :
                                detailsAsset.status === 'ASSIGNED' ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' :
                                  'bg-amber-500/100 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                                }`}></div>
                              <span className="text-slate-200 font-bold uppercase text-xs tracking-widest">{detailsAsset.status}</span>
                            </div>
                            {detailsAsset.is_active ? (
                              <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-md border border-emerald-500/20">ACTIVE</span>
                            ) : (
                              <span className="px-2 py-1 bg-red-500/10 text-red-400 text-[10px] font-bold rounded-md border border-red-500/20">INACTIVE</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Assignment Info */}
                    <div className="space-y-8">
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Current Custody</h4>
                        <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 dark:border-white/10 relative group overflow-hidden">
                          <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors"></div>
                          {detailsAsset.employee_name ? (
                            <div className="relative">
                              <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20">
                                  {detailsAsset.employee_name.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-white font-bold text-lg">{detailsAsset.employee_name}</p>
                                  <p className="text-indigo-400 text-xs font-medium">Assigned Personnel</p>
                                </div>
                              </div>
                              <div className="space-y-2 pt-4 border-t border-white/10">
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-500 font-medium tracking-wide">ASSIGNED ON</span>
                                  <span className="text-slate-300 font-mono italic">{formatDateTime(detailsAsset.assigned_date)}</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-4 text-center">
                              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                                <UserIcon className="h-8 w-8 text-slate-600" />
                              </div>
                              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Unassigned</p>
                              <p className="text-slate-600 text-xs mt-1 italic">Available in inventory</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {detailsAsset.custom_attributes && (
                        <div>
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Notes & Metadata</h4>
                          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-slate-300 text-sm leading-relaxed italic">
                            "{detailsAsset.custom_attributes}"
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-12 pt-8 border-t border-white/10 flex justify-between items-center">
                    <div className="text-[10px] text-slate-600 font-mono flex flex-col gap-1">
                      <span>CREATED: {formatDateTime(detailsAsset.created_at)}</span>
                      <span>LAST UPDATED: {formatDateTime(detailsAsset.updated_at)}</span>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowDetailsModal(false);
                          openEditModal(detailsAsset);
                        }}
                        className="px-6 py-2.5 bg-white/5 hover:bg-black/10 dark:bg-white/5/10 rounded-xl text-white font-bold border border-white/10 dark:border-white/10 transition-all flex items-center gap-2"
                      >
                        <PencilIcon className="h-4 w-4 text-indigo-400" />
                        Edit Details
                      </button>
                      <button
                        onClick={() => setShowDetailsModal(false)}
                        className="px-8 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl text-white font-bold shadow-lg shadow-indigo-500/20 hover:scale-[1.02] transition-all"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Create Asset Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto px-4 py-6 sm:px-0">
          <div className="flex items-center justify-center min-h-screen">
            <div className="fixed inset-0 transition-opacity bg-[#070B14] dark:bg-[#070B14]/80 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}></div>
            <div className="relative inline-block align-bottom bg-[#0B1120] rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-white/10 dark:border-white/10">
              <div className="px-8 pt-8 pb-6">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-bold text-white tracking-tight">Add New Asset</h3>
                  <button onClick={() => setShowCreateModal(false)} className="p-2 text-slate-400 hover:text-white transition-colors">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Employee *</label>
                    <select
                      value={newAsset.employee}
                      onChange={(e) => setNewAsset({ ...newAsset, employee: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none"
                    >
                      <option value="" className="bg-[#070B14] dark:bg-[#1a1c2e]">Select Employee</option>
                      {(employees || []).map((employee) => (
                        <option key={employee.id} value={employee.id} className="bg-[#070B14] dark:bg-[#1a1c2e]">
                          {employee.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Asset Type *</label>
                    <select
                      value={newAsset.asset_type}
                      onChange={(e) => setNewAsset({ ...newAsset, asset_type: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none"
                    >
                      <option value="laptop" className="bg-[#070B14] dark:bg-[#1a1c2e]">Laptop</option>
                      <option value="phone" className="bg-[#070B14] dark:bg-[#1a1c2e]">Phone</option>
                      <option value="id_card" className="bg-[#070B14] dark:bg-[#1a1c2e]">ID Card</option>
                      <option value="access_card" className="bg-[#070B14] dark:bg-[#1a1c2e]">Access Card</option>
                      <option value="other" className="bg-[#070B14] dark:bg-[#1a1c2e]">Other</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Serial Number</label>
                      <input
                        type="text"
                        value={newAsset.serial_number}
                        placeholder="S/N: XXXXX"
                        onChange={(e) => setNewAsset({ ...newAsset, serial_number: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Issued Date</label>
                      <input
                        type="date"
                        value={newAsset.issued_date}
                        onChange={(e) => setNewAsset({ ...newAsset, issued_date: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all [color-scheme:dark]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Description</label>
                    <textarea
                      value={newAsset.description}
                      onChange={(e) => setNewAsset({ ...newAsset, description: e.target.value })}
                      rows={3}
                      placeholder="Notes or technical details..."
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>
              <div className="px-8 py-6 bg-white/5 border-t border-white/10 flex flex-col sm:flex-row-reverse gap-3">
                <button
                  onClick={createAsset}
                  disabled={!newAsset.employee || !newAsset.asset_type}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold hover:scale-[1.02] transition-all disabled:opacity-50"
                >
                  Create Asset
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 bg-white/5 text-slate-300 hover:text-white rounded-xl font-bold border border-white/10 dark:border-white/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Asset Modal */}
      {showEditModal && selectedAsset && (
        <div className="fixed inset-0 z-50 overflow-y-auto px-4 py-6 sm:px-0">
          <div className="flex items-center justify-center min-h-screen">
            <div className="fixed inset-0 transition-opacity bg-[#070B14] dark:bg-[#070B14]/80 backdrop-blur-sm" onClick={() => setShowEditModal(false)}></div>
            <div className="relative inline-block align-bottom bg-[#0B1120] rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-white/10 dark:border-white/10">
              <div className="px-8 pt-8 pb-6">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-bold text-white tracking-tight">Edit Asset</h3>
                  <button onClick={() => setShowEditModal(false)} className="p-2 text-slate-400 hover:text-white transition-colors">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Employee *</label>
                    <select
                      value={selectedAsset.employee}
                      onChange={(e) => setSelectedAsset({ ...selectedAsset, employee: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none"
                    >
                      <option value="" className="bg-[#070B14] dark:bg-[#1a1c2e]">Select Employee</option>
                      {(employees || []).map((employee) => (
                        <option key={employee.id} value={employee.id} className="bg-[#070B14] dark:bg-[#1a1c2e]">
                          {employee.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Asset Type *</label>
                    <select
                      value={selectedAsset.asset_type}
                      onChange={(e) => setSelectedAsset({ ...selectedAsset, asset_type: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none"
                    >
                      <option value="laptop" className="bg-[#070B14] dark:bg-[#1a1c2e]">Laptop</option>
                      <option value="phone" className="bg-[#070B14] dark:bg-[#1a1c2e]">Phone</option>
                      <option value="id_card" className="bg-[#070B14] dark:bg-[#1a1c2e]">ID Card</option>
                      <option value="access_card" className="bg-[#070B14] dark:bg-[#1a1c2e]">Access Card</option>
                      <option value="other" className="bg-[#070B14] dark:bg-[#1a1c2e]">Other</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Serial Number</label>
                      <input
                        type="text"
                        value={selectedAsset.serial_number || ''}
                        onChange={(e) => setSelectedAsset({ ...selectedAsset, serial_number: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Status</label>
                      <select
                        value={selectedAsset.status || 'AVAILABLE'}
                        onChange={(e) => setSelectedAsset({ ...selectedAsset, status: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none"
                      >
                        <option value="AVAILABLE" className="bg-[#070B14] dark:bg-[#1a1c2e]">Available</option>
                        <option value="ASSIGNED" className="bg-[#070B14] dark:bg-[#1a1c2e]">Assigned</option>
                        <option value="DAMAGED" className="bg-[#070B14] dark:bg-[#1a1c2e]">Repair / Damaged</option>
                        <option value="LOST" className="bg-[#070B14] dark:bg-[#1a1c2e]">Lost</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Purchased Date</label>
                    <input
                      type="date"
                      value={selectedAsset.purchased_date || ''}
                      onChange={(e) => setSelectedAsset({ ...selectedAsset, purchased_date: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Description</label>
                    <textarea
                      value={selectedAsset.description || ''}
                      onChange={(e) => setSelectedAsset({ ...selectedAsset, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>
              <div className="px-8 py-6 bg-white/5 border-t border-white/10 flex flex-col sm:flex-row-reverse gap-3">
                <button
                  onClick={updateAsset}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold hover:scale-[1.02] transition-all"
                >
                  Update Asset
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-6 py-3 bg-white/5 text-slate-300 hover:text-white rounded-xl font-bold border border-white/10 dark:border-white/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Repair Modal */}
      {showRepairModal && repairForm.asset && (
        <div className="fixed inset-0 z-50 overflow-y-auto px-4 py-6 sm:px-0">
          <div className="flex items-center justify-center min-h-screen">
            <div className="fixed inset-0 transition-opacity bg-[#070B14] dark:bg-[#070B14]/80 backdrop-blur-sm" onClick={() => setShowRepairModal(false)}></div>
            <div className="relative inline-block align-bottom bg-[#0B1120] rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-white/10 dark:border-white/10">
              <div className="px-8 pt-8 pb-6">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-bold text-white tracking-tight">{repairForm.id ? 'Edit Asset Repair' : 'Report Asset Repair'}</h3>
                  <button onClick={() => setShowRepairModal(false)} className="p-2 text-slate-400 hover:text-white transition-colors">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Asset</label>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-sm">
                      <div className="text-indigo-400 font-mono font-bold mb-1">{repairForm.asset.asset_tag}</div>
                      <div className="text-slate-300">{repairForm.asset.description || repairForm.asset.name}</div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Issue Description *</label>
                    <textarea
                      rows={3}
                      value={repairForm.issue_description}
                      onChange={(e) => setRepairForm({ ...repairForm, issue_description: e.target.value })}
                      placeholder="Describe the issue with the asset..."
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Status</label>
                      <select
                        value={repairForm.status}
                        onChange={(e) => setRepairForm({ ...repairForm, status: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none"
                      >
                        <option value="PENDING" className="bg-[#070B14] dark:bg-[#1a1c2e]">Pending</option>
                        <option value="PICKED_UP" className="bg-[#070B14] dark:bg-[#1a1c2e]">Picked Up</option>
                        <option value="AT_VENDOR" className="bg-[#070B14] dark:bg-[#1a1c2e]">At Vendor</option>
                        <option value="IN_PROGRESS" className="bg-[#070B14] dark:bg-[#1a1c2e]">In Progress</option>
                        <option value="COMPLETED" className="bg-[#070B14] dark:bg-[#1a1c2e]">Completed</option>
                        <option value="FAILED" className="bg-[#070B14] dark:bg-[#1a1c2e]">Failed</option>
                        <option value="CANCELLED" className="bg-[#070B14] dark:bg-[#1a1c2e]">Cancelled</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Estimated Completion</label>
                      <input
                        type="date"
                        value={repairForm.estimated_completion}
                        onChange={(e) => setRepairForm({ ...repairForm, estimated_completion: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all [color-scheme:dark]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Vendor</label>
                      <input
                        type="text"
                        value={repairForm.repair_vendor}
                        onChange={(e) => setRepairForm({ ...repairForm, repair_vendor: e.target.value })}
                        placeholder="Repair shop name"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Repair Cost (₹)</label>
                      <input
                        type="number"
                        value={repairForm.repair_cost}
                        onChange={(e) => setRepairForm({ ...repairForm, repair_cost: e.target.value })}
                        placeholder="0.00"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Repair Notes</label>
                    <textarea
                      rows={2}
                      value={repairForm.repair_notes}
                      onChange={(e) => setRepairForm({ ...repairForm, repair_notes: e.target.value })}
                      placeholder="Additional notes for IT/Finance..."
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 dark:border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 bg-white/5 border-t border-white/10 flex flex-col sm:flex-row-reverse gap-3">
                <button
                  onClick={handleRepairSubmit}
                  disabled={!repairForm.issue_description}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl font-bold shadow-lg shadow-orange-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                >
                  {repairForm.id ? 'Update Repair' : 'Report Repair'}
                </button>
                <button
                  onClick={() => setShowRepairModal(false)}
                  className="flex-1 px-6 py-3 bg-white/5 text-slate-300 hover:text-white rounded-xl font-bold border border-white/10 dark:border-white/10 hover:bg-black/10 dark:bg-white/5/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div >
  );
};

export default AssetManagement;
