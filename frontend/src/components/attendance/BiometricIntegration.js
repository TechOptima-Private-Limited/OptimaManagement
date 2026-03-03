import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  SignalIcon, 
  ComputerDesktopIcon, 
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { attendanceAPI } from '../../services/api';
import { isHRManager, isAdmin } from '../../utils/auth';
import { formatDate, formatDateTime } from '../../utils/formatters';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';

const BiometricIntegration = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [newDevice, setNewDevice] = useState({
    device_name: '',
    device_id: '',
    location: '',
    ip_address: ''
  });
  const [syncData, setSyncData] = useState({
    device_id: '',
    attendance_data: []
  });

  useEffect(() => {
    if (isHRManager() || isAdmin()) {
      fetchBiometricDevices();
    }
  }, []);

  const fetchBiometricDevices = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.getBiometricDevices();
      setDevices(response.data.results || response.data);
    } catch (error) {
      toast.error('Failed to fetch biometric devices');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDevice = async (e) => {
    e.preventDefault();
    try {
      await attendanceAPI.createBiometricDevice(newDevice);
      toast.success('Device added successfully!');
      setShowAddDevice(false);
      setNewDevice({ device_name: '', device_id: '', location: '', ip_address: '' });
      fetchBiometricDevices();
    } catch (error) {
      toast.error('Failed to add device');
    }
  };

  const handleSync = async () => {
    if (!syncData.device_id || syncData.attendance_data.length === 0) {
      toast.error('Please select a device and provide attendance data');
      return;
    }

    setSyncLoading(true);
    try {
      const response = await attendanceAPI.syncBiometricData(syncData);
      toast.success(response.data.message || 'Data synced successfully!');
      setSyncData({ device_id: '', attendance_data: [] });
      setShowSyncModal(false);
    } catch (error) {
      toast.error('Failed to sync biometric data');
    } finally {
      setSyncLoading(false);
    }
  };

  const addSampleData = () => {
    const sampleData = [
      {
        employee_id: 'EMP001',
        date: new Date().toISOString().split('T')[0],
        check_in_time: '09:00:00',
        check_out_time: '17:30:00',
        status: 'PRESENT'
      },
      {
        employee_id: 'EMP002',
        date: new Date().toISOString().split('T')[0],
        check_in_time: '09:15:00',
        check_out_time: '17:45:00',
        status: 'LATE'
      },
      {
        employee_id: 'EMP003',
        date: new Date().toISOString().split('T')[0],
        check_in_time: '09:30:00',
        check_out_time: '13:30:00',
        status: 'HALF_DAY'
      }
    ];
    
    setSyncData(prev => ({
      ...prev,
      attendance_data: [...prev.attendance_data, ...sampleData]
    }));
  };

  const getDeviceStatusIcon = (device) => {
    if (!device.is_active) {
      return <XCircleIcon className="h-5 w-5 text-red-500" />;
    }
    
    const lastSync = device.last_sync ? new Date(device.last_sync) : null;
    const hoursSinceSync = lastSync ? (Date.now() - lastSync.getTime()) / (1000 * 60 * 60) : null;
    
    if (!lastSync || hoursSinceSync > 24) {
      return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
    }
    
    return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
  };

  const getDeviceStatusText = (device) => {
    if (!device.is_active) return 'Inactive';
    
    const lastSync = device.last_sync ? new Date(device.last_sync) : null;
    const hoursSinceSync = lastSync ? (Date.now() - lastSync.getTime()) / (1000 * 60 * 60) : null;
    
    if (!lastSync) return 'Never synced';
    if (hoursSinceSync > 24) return 'Sync overdue';
    
    return 'Active';
  };

  if (!(isHRManager() || isAdmin())) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            Only HR Managers or Admins can access biometric integration.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner text="Loading biometric devices..." />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Biometric Integration</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage biometric devices and sync attendance data
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowSyncModal(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <CloudArrowUpIcon className="h-4 w-4 mr-2" />
              Sync Data
            </button>
            <button
              onClick={() => setShowAddDevice(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ComputerDesktopIcon className="h-4 w-4 mr-2" />
              Add Device
            </button>
          </div>
        </div>
      </div>

      {/* Device Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <ComputerDesktopIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Devices</p>
              <p className="text-2xl font-semibold text-gray-900">{devices.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Devices</p>
              <p className="text-2xl font-semibold text-gray-900">
                {devices.filter(d => d.is_active).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Recent Syncs</p>
              <p className="text-2xl font-semibold text-gray-900">
                {devices.filter(d => {
                  const lastSync = d.last_sync ? new Date(d.last_sync) : null;
                  const hoursSinceSync = lastSync ? (Date.now() - lastSync.getTime()) / (1000 * 60 * 60) : null;
                  return lastSync && hoursSinceSync <= 24;
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Registered Devices */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Registered Devices</h3>
        </div>
        
        {devices.length === 0 ? (
          <div className="text-center py-12">
            <ComputerDesktopIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No devices registered</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding your first biometric device.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowAddDevice(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <ComputerDesktopIcon className="h-4 w-4 mr-2" />
                Add Device
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {devices.map((device) => (
              <div key={device.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getDeviceStatusIcon(device)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-medium text-gray-900">{device.device_name}</h4>
                      <div className="mt-1 grid grid-cols-2 gap-4 text-sm text-gray-500">
                        <div>
                          <span className="font-medium">Device ID:</span> {device.device_id}
                        </div>
                        <div>
                          <span className="font-medium">Location:</span> {device.location}
                        </div>
                        <div>
                          <span className="font-medium">IP Address:</span> {device.ip_address}
                        </div>
                        <div>
                          <span className="font-medium">Status:</span> {getDeviceStatusText(device)}
                        </div>
                      </div>
                      {device.last_sync && (
                        <p className="mt-2 text-sm text-gray-500">
                          Last synced: {formatDateTime(device.last_sync)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedDevice(device);
                        setShowSyncModal(true);
                        setSyncData(prev => ({ ...prev, device_id: device.device_id }));
                      }}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <CloudArrowUpIcon className="h-4 w-4 mr-1" />
                      Sync
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API Integration Guide */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <SignalIcon className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">API Integration Guide</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>To integrate your biometric devices, send a POST request to the sync endpoint:</p>
              <div className="mt-3 bg-blue-100 p-3 rounded font-mono text-xs overflow-x-auto">
                <div className="text-blue-900">POST /api/attendance/biometric-sync/</div>
                <div className="mt-2 text-blue-800">
                  Content-Type: application/json<br/>
                  Authorization: Bearer YOUR_API_TOKEN
                </div>
                <div className="mt-2 text-blue-900">
                  {JSON.stringify({
                    device_id: "DEVICE_001",
                    attendance_data: [
                      {
                        employee_id: "EMP001",
                        date: "2024-01-15",
                        check_in_time: "09:00:00",
                        check_out_time: "17:30:00",
                        status: "PRESENT"
                      }
                    ]
                  }, null, 2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Device Modal */}
      <Modal
        isOpen={showAddDevice}
        onClose={() => setShowAddDevice(false)}
        title="Add Biometric Device"
      >
        <form onSubmit={handleAddDevice} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Device Name</label>
            <input
              type="text"
              required
              value={newDevice.device_name}
              onChange={(e) => setNewDevice(prev => ({ ...prev, device_name: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. Main Entrance Scanner"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Device ID</label>
            <input
              type="text"
              required
              value={newDevice.device_id}
              onChange={(e) => setNewDevice(prev => ({ ...prev, device_id: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. BIOMETRIC_001"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input
              type="text"
              required
              value={newDevice.location}
              onChange={(e) => setNewDevice(prev => ({ ...prev, location: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. Building A - Main Entrance"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">IP Address</label>
            <input
              type="text"
              required
              value={newDevice.ip_address}
              onChange={(e) => setNewDevice(prev => ({ ...prev, ip_address: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. 192.168.1.100"
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add Device
            </button>
            <button
              type="button"
              onClick={() => setShowAddDevice(false)}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Sync Data Modal */}
      <Modal
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        title="Sync Biometric Data"
        size="large"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Select Device</label>
            <select
              value={syncData.device_id}
              onChange={(e) => setSyncData(prev => ({ ...prev, device_id: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a device</option>
              {devices.filter(d => d.is_active).map((device) => (
                <option key={device.id} value={device.device_id}>
                  {device.device_name} - {device.location}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Attendance Data (JSON)</label>
            <textarea
              value={JSON.stringify(syncData.attendance_data, null, 2)}
              onChange={(e) => {
                try {
                  const data = JSON.parse(e.target.value);
                  setSyncData(prev => ({ ...prev, attendance_data: data }));
                } catch (error) {
                  // Invalid JSON, don't update
                }
              }}
              rows={10}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              placeholder="Enter attendance data in JSON format..."
            />
            <p className="mt-1 text-sm text-gray-500">
              Format: {`[{"employee_id": "EMP001", "date": "${new Date().toISOString().split('T')[0]}", "check_in_time": "09:00:00", "check_out_time": "17:30:00", "status": "PRESENT"}]`}
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={addSampleData}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Add Sample Data
            </button>
            <button
              onClick={handleSync}
              disabled={syncLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {syncLoading ? (
                <div className="flex items-center">
                  <LoadingSpinner size="small" />
                  <span className="ml-2">Syncing...</span>
                </div>
              ) : (
                'Sync Data'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BiometricIntegration;