import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  SignalIcon,
  ComputerDesktopIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  PlayIcon,
  StopIcon,
  CalendarDaysIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { attendanceAPI } from '../../services/api';
import { isHRManager, isAdmin } from '../../utils/auth';
import { formatDateTime } from '../../utils/formatters';
import LoadingSpinner from '../common/LoadingSpinner';

// Auto-sync interval options (in minutes)
const SYNC_INTERVALS = [
  { label: '30 seconds', value: 0.5 },
  { label: '1 minute', value: 1 },
  { label: '5 minutes', value: 5 },
  { label: '10 minutes', value: 10 },
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
];

const BiometricIntegration = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);

  // Per-device sync state
  const [syncingDevice, setSyncingDevice] = useState(null); // device id being synced
  const [syncResults, setSyncResults] = useState({}); // keyed by device.id

  // Manual sync date picker
  const [syncDate, setSyncDate] = useState(new Date().toISOString().split('T')[0]);

  const [newDevice, setNewDevice] = useState({
    device_name: '',
    device_id: '',
    location: '',
    ip_address: '',
  });

  useEffect(() => {
    if (isHRManager() || isAdmin()) {
      fetchBiometricDevices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      if (editingDevice) {
        await attendanceAPI.updateBiometricDevice(editingDevice.id, newDevice);
        toast.success('Device updated successfully!');
      } else {
        await attendanceAPI.createBiometricDevice(newDevice);
        toast.success('Device added successfully!');
      }
      setShowAddDevice(false);
      setEditingDevice(null);
      setNewDevice({ device_name: '', device_id: '', location: '', ip_address: '' });
      fetchBiometricDevices();
    } catch (error) {
      toast.error(editingDevice ? 'Failed to update device' : 'Failed to add device');
    }
  };

  const handleEditDevice = (device) => {
    setEditingDevice(device);
    setNewDevice({
      device_name: device.device_name,
      device_id: device.device_id,
      location: device.location,
      ip_address: device.ip_address,
    });
    setShowAddDevice(true);
  };

  const handleDeleteDevice = async (id) => {
    if (window.confirm('Are you sure you want to delete this device? This action cannot be undone.')) {
      try {
        await attendanceAPI.deleteBiometricDevice(id);
        toast.success('Device deleted successfully!');
        fetchBiometricDevices();
      } catch (error) {
        toast.error('Failed to delete device');
      }
    }
  };

  // Core sync function — called manually OR by the auto-sync timer
  const syncDevice = useCallback(async (device, date = null) => {
    const syncDateToUse = date || new Date().toISOString().split('T')[0];
    setSyncingDevice(device.id);
    try {
      const response = await attendanceAPI.syncBiometricLogs(device.ip_address, syncDateToUse);
      const data = response.data;

      try {
        localStorage.setItem('attendance_last_biometric_sync', String(Date.now()));
        window.dispatchEvent(new Event('storage'));
      } catch (_) {
        // ignore
      }

      setSyncResults(prev => ({
        ...prev,
        [device.id]: {
          success: true,
          synced_count: data.synced_count,
          total_logs: data.total_logs,
          sync_date: data.sync_date,
          attendance_records_created: data.attendance_records_created,
          lastSyncAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
      }));
      toast.success(
        `✅ Synced ${data.synced_count}/${data.total_logs} records for ${data.sync_date}`
      );
      // Refresh device list (updates last_sync on device)
      fetchBiometricDevices();
    } catch (error) {
      const errMsg =
        error.response?.data?.error ||
        (error.response?.status === 503 ? 'Cannot reach biometric device' : 'Sync failed');
      setSyncResults(prev => ({
        ...prev,
        [device.id]: {
          success: false,
          error: errMsg,
          lastSyncAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
      }));
      toast.error(`❌ ${device.device_name}: ${errMsg}`);
    } finally {
      setSyncingDevice(null);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Toggle auto-sync for a device
  const toggleAutoSync = async (device) => {
    try {
      const isEnabling = !device.auto_sync_enabled;

      // Call API to patch
      await attendanceAPI.updateBiometricDevice(device.id, {
        auto_sync_enabled: isEnabling,
        sync_interval_minutes: device.sync_interval_minutes || 15
      });

      // Refresh local list
      await fetchBiometricDevices();

      if (isEnabling) {
        toast.success(`▶ Auto-sync started for ${device.device_name} (every ${device.sync_interval_minutes || 15} min)`);
      } else {
        toast.info(`⏹ Auto-sync stopped for ${device.device_name}`);
      }
    } catch (error) {
      toast.error(`❌ Failed to ${!device.auto_sync_enabled ? 'enable' : 'disable'} auto sync for ${device.device_name}`);
    }
  };

  const setAutoSyncInterval = async (device, minutes) => {
    try {
      await attendanceAPI.updateBiometricDevice(device.id, {
        sync_interval_minutes: minutes
      });
      fetchBiometricDevices();
      toast.success(`Interval set to ${minutes} mins for ${device.device_name}`);
    } catch (error) {
      toast.error('Failed to update sync interval');
    }
  };

  const getDeviceStatusIcon = (device) => {
    if (!device.is_active) return <XCircleIcon className="h-5 w-5 text-red-500" />;
    const lastSync = device.last_sync ? new Date(device.last_sync) : null;
    const hoursSinceSync = lastSync ? (Date.now() - lastSync.getTime()) / (1000 * 60 * 60) : null;
    if (!lastSync || hoursSinceSync > 24) return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
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
      <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-900 to-black text-slate-300 flex items-center justify-center -mt-16">
        <div className="text-center py-12 px-6 bg-white/5 dark:bg-slate-900/60 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl max-w-md w-full">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-rose-500/20 border border-rose-500/30 rounded-full mb-6 shadow-inner">
            <ExclamationTriangleIcon className="h-10 w-10 text-rose-500" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Access Denied</h3>
          <p className="text-sm text-slate-400">Only HR Managers or Admins can access biometric integration.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 from-indigo-900/20 via-slate-900 to-black flex items-center justify-center">
        <LoadingSpinner text="Loading biometric devices..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-900 to-black text-slate-300 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Biometric Integration</h1>
            <p className="mt-1 text-sm text-slate-400">Sync attendance from ZK biometric devices directly</p>
          </div>
          <button
            onClick={() => {
              setEditingDevice(null);
              setNewDevice({ device_name: '', device_id: '', location: '', ip_address: '' });
              setShowAddDevice(true);
            }}
            className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 border border-indigo-500/50 rounded-xl shadow-lg text-sm font-bold text-white hover:from-indigo-400 hover:to-purple-500 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <ComputerDesktopIcon className="h-5 w-5 mr-2" />
            Add Device
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: 'Total Devices', value: devices.length, icon: ComputerDesktopIcon, color: 'indigo' },
            { label: 'Active Devices', value: devices.filter(d => d.is_active).length, icon: CheckCircleIcon, color: 'emerald' },
            {
              label: 'Auto-Syncing',
              value: devices.filter(d => d.auto_sync_enabled).length,
              icon: ArrowPathIcon,
              color: 'violet',
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white/5 dark:bg-slate-900/60 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-2xl p-6 hover:bg-white/5 dark:bg-slate-900/80 transition-all group">
              <div className="flex items-center">
                <div className={`flex-shrink-0 p-3 rounded-xl bg-${color}-500/20 border border-${color}-500/30 text-${color}-400 group-hover:scale-110 transition-transform`}>
                  <Icon className="h-8 w-8" />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
                  <p className="text-3xl font-bold text-white mt-1">{value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Global sync date picker */}
        <div className="mb-6 flex items-center space-x-4 bg-white/5 dark:bg-slate-900/50 border border-black/10 dark:border-white/10 rounded-xl px-5 py-3">
          <CalendarDaysIcon className="h-5 w-5 text-indigo-400 flex-shrink-0" />
          <label className="text-sm font-semibold text-slate-300">Sync Date:</label>
          <input
            type="date"
            value={syncDate}
            onChange={e => setSyncDate(e.target.value)}
            className="bg-black/30 border border-black/10 dark:border-white/10 rounded-lg text-white px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500/50 [color-scheme:dark]"
          />
          <span className="text-xs text-slate-500 italic">Used for manual sync. Auto-sync always uses today.</span>
        </div>

        {/* Devices List */}
        <div className="bg-white/5 dark:bg-slate-900/60 backdrop-blur-xl shadow-xl overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 mb-8">
          <div className="px-6 py-5 border-b border-black/10 dark:border-white/10 bg-white/5/5">
            <h3 className="text-xl font-bold text-white">Registered Devices</h3>
          </div>

          {devices.length === 0 ? (
            <div className="text-center py-16">
              <ComputerDesktopIcon className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300">No devices registered</h3>
              <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">Add your first ZK biometric device to start syncing attendance data.</p>
              <button
                onClick={() => {
                  setEditingDevice(null);
                  setNewDevice({ device_name: '', device_id: '', location: '', ip_address: '' });
                  setShowAddDevice(true);
                }}
                className="mt-6 inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 transition-all"
              >
                <ComputerDesktopIcon className="h-5 w-5 mr-2" />
                Add Device
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {devices.map(device => {
                const isSyncing = syncingDevice === device.id;
                const result = syncResults[device.id];

                return (
                  <div key={device.id} className="p-6 hover:bg-white/5/5 transition-colors group">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors uppercase tracking-tight">{device.device_name}</h4>
                          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <button
                              onClick={() => handleEditDevice(device)}
                              className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors"
                              title="Edit Device"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDevice(device.id)}
                              className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors"
                              title="Delete Device"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-slate-400">
                          <div><span className="font-semibold text-slate-500 mr-1">ID:</span><span className="font-mono text-slate-300 text-xs bg-black/20 px-1.5 py-0.5 rounded">{device.device_id}</span></div>
                          <div><span className="font-semibold text-slate-500 mr-1">Status:</span><span className="text-slate-300">{getDeviceStatusText(device)}</span></div>
                          <div><span className="font-semibold text-slate-500 mr-1">IP:</span><span className="font-mono text-slate-300 text-xs bg-black/20 px-1.5 py-0.5 rounded">{device.ip_address}</span></div>
                          <div><span className="font-semibold text-slate-500 mr-1">Location:</span>{device.location}</div>
                        </div>
                        {device.last_sync && (
                          <p className="mt-2 text-xs text-slate-500 flex items-center">
                            <ClockIcon className="w-3.5 h-3.5 mr-1" />
                            Last synced: {formatDateTime(device.last_sync)}
                          </p>
                        )}

                        {/* Last sync result */}
                        {result && (
                          <div className={`mt-3 text-xs px-3 py-2 rounded-lg border ${result.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
                            {result.success ? (
                              <>✅ Synced <strong>{result.synced_count}/{result.total_logs}</strong> logs for <strong>{result.sync_date}</strong> — <strong>{result.attendance_records_created}</strong> new records created &nbsp;·&nbsp; {result.lastSyncAt}</>
                            ) : (
                              <>❌ {result.error} &nbsp;·&nbsp; {result.lastSyncAt}</>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Sync Controls */}
                      <div className="flex flex-col gap-3 min-w-[230px]">
                        <button
                          onClick={() => syncDevice(device, syncDate)}
                          disabled={isSyncing}
                          className="inline-flex items-center justify-center px-4 py-2 border border-black/10 dark:border-white/10 text-sm font-semibold rounded-xl text-slate-300 bg-black/20 hover:bg-black/10 dark:bg-white/5/10 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSyncing ? (
                            <><ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" /> Syncing...</>
                          ) : (
                            <><CloudArrowUpIcon className="h-4 w-4 mr-2" /> Sync Now ({syncDate})</>
                          )}
                        </button>

                        <div className="flex items-center gap-2">
                          <select
                            value={device.sync_interval_minutes || 15}
                            disabled={device.auto_sync_enabled}
                            onChange={e => setAutoSyncInterval(device, Number(e.target.value))}
                            className="flex-1 bg-black/30 border border-black/10 dark:border-white/10 rounded-lg text-slate-300 text-xs px-2 py-1.5 focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
                          >
                            {SYNC_INTERVALS.map(opt => (
                              <option key={opt.value} value={opt.value} className="bg-white/5 dark:bg-slate-900">{opt.label}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => toggleAutoSync(device)}
                            className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${device.auto_sync_enabled
                              ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                              : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                              }`}
                          >
                            {device.auto_sync_enabled ? (
                              <><StopIcon className="h-3.5 w-3.5 mr-1" /> Stop</>
                            ) : (
                              <><PlayIcon className="h-3.5 w-3.5 mr-1" /> Auto</>
                            )}
                          </button>
                        </div>

                        {device.auto_sync_enabled && (
                          <div className="flex items-center text-xs text-emerald-400 animate-pulse">
                            <ArrowPathIcon className="h-3.5 w-3.5 mr-1 animate-spin" />
                            Auto-syncing every {device.sync_interval_minutes || 15} min (bg)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info box */}
        <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-2xl p-6">
          <div className="flex">
            <SignalIcon className="h-6 w-6 text-indigo-400 flex-shrink-0" />
            <div className="ml-4">
              <h3 className="text-base font-bold text-indigo-300">How it works</h3>
              <ul className="mt-2 text-sm text-indigo-200/80 space-y-1 list-disc list-inside">
                <li><strong>Sync Now</strong> — pulls logs for the selected date from the ZK device IP and creates/updates attendance records instantly.</li>
                <li><strong>Auto Sync</strong> — runs on a background timer. Always syncs <em>today's</em> data so checkout times stay updated automatically.</li>
                <li>Times are stored in <strong>IST</strong>. Punch times from the device are converted to the correct local time before saving.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Add/Edit Device Modal */}
        {showAddDevice && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
              <div className="fixed inset-0 bg-white/5 dark:bg-slate-900/90 backdrop-blur-sm" onClick={() => {
                setShowAddDevice(false);
                setEditingDevice(null);
                setNewDevice({ device_name: '', device_id: '', location: '', ip_address: '' });
              }} />
              <div className="inline-block align-bottom bg-[#0A0F1A] border border-black/10 dark:border-white/10 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full relative z-10">
                <div className="px-8 pt-8 pb-6">
                  <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                    <h3 className="text-xl font-bold text-white">{editingDevice ? 'Edit' : 'Add'} Biometric Device</h3>
                    <button onClick={() => {
                      setShowAddDevice(false);
                      setEditingDevice(null);
                      setNewDevice({ device_name: '', device_id: '', location: '', ip_address: '' });
                    }} className="text-slate-400 hover:text-white transition-colors">
                      <XCircleIcon className="h-6 w-6" />
                    </button>
                  </div>
                  <form onSubmit={handleAddDevice} className="space-y-5" id="addDeviceForm">
                    {[
                      { label: 'Device Name', key: 'device_name', placeholder: 'e.g. Main Entrance Scanner' },
                      { label: 'Device ID', key: 'device_id', placeholder: 'e.g. BIOMETRIC_001' },
                      { label: 'Location', key: 'location', placeholder: 'e.g. Building A - Main Entrance' },
                      { label: 'IP Address', key: 'ip_address', placeholder: 'e.g. 192.168.1.100' },
                    ].map(({ label, key, placeholder }) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
                        <input
                          type="text"
                          required
                          value={newDevice[key]}
                          onChange={e => setNewDevice(prev => ({ ...prev, [key]: e.target.value }))}
                          className="block w-full bg-black/20 border border-black/10 dark:border-white/10 rounded-xl py-2.5 px-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                          placeholder={placeholder}
                        />
                      </div>
                    ))}
                  </form>
                </div>
                <div className="bg-white/5/5 border-t border-black/10 dark:border-white/10 px-6 py-4 flex flex-row-reverse gap-3">
                  <button type="submit" form="addDeviceForm" className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-sm font-bold text-white hover:from-indigo-400 hover:to-purple-500 transition-all">
                    {editingDevice ? 'Save Changes' : 'Add Device'}
                  </button>
                  <button type="button" onClick={() => {
                    setShowAddDevice(false);
                    setEditingDevice(null);
                    setNewDevice({ device_name: '', device_id: '', location: '', ip_address: '' });
                  }} className="px-6 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/5/5 text-sm font-medium text-slate-300 hover:bg-black/10 dark:bg-white/5/10 transition-all">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BiometricIntegration;
