import React, { useState, useEffect } from 'react';
import {
  UserIcon,
  PencilIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarDaysIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  BriefcaseIcon,
  CameraIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  StarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';
import { useTheme } from '../../context/ThemeContext';

/** Allow only 0–9 for phone-style fields (strips spaces, +, dashes, etc.). */
const digitsOnly = (value) => String(value ?? '').replace(/\D/g, '');

const UserProfile = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [profile, setProfile] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [team, setTeam] = useState([]);
  const [managers, setManagers] = useState([]); // For HR Manager view
  const [manager, setManager] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({});
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState(null);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchEmployeeDocuments = async (employeeId) => {
    if (!employeeId) return;
    try {
      setDocumentsLoading(true);
      setDocumentsError(null);
      const apiBase = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8080/api');
      const response = await fetch(`${apiBase}/onboarding/employees/${employeeId}/list_documents/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Failed to load employee documents', await response.text());
        return;
      }

      const data = await response.json();
      setDocuments(Array.isArray(data.documents) ? data.documents : []);
    } catch (error) {
      console.error('Error fetching employee documents:', error);
      setDocumentsError('Failed to load documents');
    } finally {
      setDocumentsLoading(false);
    }
  };

  // const fetchProfileData = async () => {
  //   try {
  //     setLoading(true);

  //     // Fetch user profile
  //     const profileResponse = await fetch('http://127.0.0.1:8080/api/auth/profile/', {
  //       headers: {
  //         'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
  //         'Content-Type': 'application/json'
  //       }
  //     });

  //     if (profileResponse.ok) {
  //       const profileData = await profileResponse.json();
  //       setProfile(profileData);
  //       setEditData({
  //         first_name: profileData.first_name || '',
  //         last_name: profileData.last_name || '',
  //         email: profileData.email || '',
  //         phone_number: profileData.profile?.phone_number || '',
  //         address: profileData.profile?.address || '',
  //         date_of_birth: profileData.profile?.date_of_birth || '',
  //         emergency_contact: profileData.profile?.emergency_contact || ''
  //       });

  //       // Check if user is HR Manager and fetch appropriate data
  //       const isHRManager = profileData.profile?.role === 'HR_MANAGER';

  //       if (isHRManager) {
  //         // Fetch all managers with teams for HR Manager
  //         await fetchAllManagersWithTeams();
  //       } else {
  //         // Fetch regular employee profile data
  //         await fetchEmployeeProfileData();
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Error fetching profile data:', error);
  //     toast.error('Failed to load profile data');
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const fetchProfileData = async () => {
    try {
      setLoading(true);

      // Fetch user profile
      const apiBase = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8080/api');
      const profileResponse = await fetch(`${apiBase}/auth/profile/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile(profileData);
        setEditData({
          first_name: profileData.first_name || '',
          last_name: profileData.last_name || '',
          email: profileData.email || '',
          phone_number: digitsOnly(profileData.profile?.phone_number),
          address: profileData.profile?.address || '',
          date_of_birth: profileData.profile?.date_of_birth || '',
          emergency_contact: digitsOnly(profileData.profile?.emergency_contact),
          gender: profileData.profile?.gender || '',
          blood_group: profileData.profile?.blood_group || '',
          aadhaar_number: profileData.profile?.aadhaar_number || '',
          pan_number: profileData.profile?.pan_number || '',
        });

        // Check user role and fetch appropriate data
        const userRole = profileData.profile?.role;

        switch (userRole) {
          case 'HR_MANAGER':
            await fetchAllManagersWithTeams();
            break;
          case 'MANAGER':
            await fetchManagerData();
            break;
          case 'EMPLOYEE':
          case 'IT_SUPPORTER':
          case 'ADMIN':
          default:
            if (!['EMPLOYEE', 'IT_SUPPORTER', 'ADMIN'].includes(userRole)) {
              console.warn('Unknown user role:', userRole);
            }
            await fetchEmployeeProfileData();
        }
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeProfileData = async () => {
    try {
      const apiBase = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8080/api');
      const employeeProfileResponse = await fetch(`${apiBase}/employees/profile-data/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (employeeProfileResponse.ok) {
        const employeeProfileData = await employeeProfileResponse.json();
        console.log('Employee Profile Data:', employeeProfileData);
        const employeeRecord = employeeProfileData.employee;
        setEmployee(employeeRecord);
        setTeam(employeeProfileData.peers || []);
        setManager(employeeProfileData.manager);
        if (employeeRecord?.id) {
          await fetchEmployeeDocuments(employeeRecord.id);
        }
      }
    } catch (error) {
      console.error('Error fetching employee profile data:', error);
      toast.error('Failed to load employee data');
    }
  };
  // For Manager role
  const [directReports, setDirectReports] = useState([]);
  const [subManagers, setSubManagers] = useState([]);
  const [teamEmployees, setTeamEmployees] = useState([]);
  const [peerManagers, setPeerManagers] = useState([]);
  const [managerOfManager, setManagerOfManager] = useState(null);
  const [managerStats, setManagerStats] = useState({});

  const fetchManagerData = async () => {
    try {
      const apiBase = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8080/api');
      const response = await fetch(`${apiBase}/employees/managers/profile-data/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Manager Data:', data);
        const employeeRecord = data.employee;
        setEmployee(employeeRecord);
        setTeam(data.peers || []);
        setManager(data.manager);
        if (employeeRecord?.id) {
          await fetchEmployeeDocuments(employeeRecord.id);
        }
      }
    } catch (error) {
      console.error('Error fetching manager data:', error);
      toast.error('Failed to load manager data');
    }
  };
  const fetchAllManagersWithTeams = async () => {
    try {
      // First get employee data for HR manager
      await fetchEmployeeProfileData();

      // Then get all managers with teams
      const apiBase = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8080/api');
      const managersResponse = await fetch(`${apiBase}/employees/managers-with-teams/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (managersResponse.ok) {
        const managersData = await managersResponse.json();
        console.log('Managers with teams:', managersData);
        setManagers(managersData.managers || []);
      }
    } catch (error) {
      console.error('Error fetching managers data:', error);
      toast.error('Failed to load managers data');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const payload = {
        ...editData,
        phone_number: digitsOnly(editData.phone_number),
        emergency_contact: digitsOnly(editData.emergency_contact),
      };

      const apiBase = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8080/api');
      const response = await fetch(`${apiBase}/auth/profile/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success('Profile updated successfully!');
        setEditMode(false);
        fetchProfileData();
      } else {
        const errorData = await response.json();
        toast.error('Failed to update profile');
        console.error('Update error:', errorData);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setEditData({
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      email: profile?.email || '',
      phone_number: digitsOnly(profile?.profile?.phone_number),
      address: profile?.profile?.address || '',
      date_of_birth: profile?.profile?.date_of_birth || '',
      emergency_contact: digitsOnly(profile?.profile?.emergency_contact),
      gender: profile?.profile?.gender || '',
      blood_group: profile?.profile?.blood_group || '',
      aadhaar_number: profile?.profile?.aadhaar_number || '',
      pan_number: profile?.profile?.pan_number || '',
    });
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      'ADMIN': { color: 'from-rose-600 to-indigo-700', icon: '👑', label: 'Administrator' },
      'HR_MANAGER': { color: 'from-indigo-600 to-purple-700', icon: '🏢', label: 'HR Manager' },
      'EMPLOYEE': { color: 'from-emerald-600 to-teal-700', icon: '👤', label: 'Employee' }
    };

    const config = roleConfig[role] || roleConfig['EMPLOYEE'];
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${config.color} shadow-lg`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const isHRManager = profile?.profile?.role === 'HR_MANAGER';

  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${theme.surfaceGradient} flex items-center justify-center`}>
        <LoadingSpinner text="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070B14] py-8 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 pl-1">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            My Profile
          </h1>
          <p className="text-lg text-slate-400 font-medium">
            {isHRManager ? 'Manage your personal information and view all managers' : 'Manage your personal information and view your team'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Profile Card */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden transition-all duration-300">
              {/* Header with Edit Button */}
              <div className="bg-white/5 px-8 py-6 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white tracking-tight">Personal Information</h2>
                  {!editMode ? (
                    <button
                      onClick={() => setEditMode(true)}
                      className="flex items-center px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white font-bold transition-all duration-300 backdrop-blur-md border border-white/10 hover:scale-105 active:scale-95 shadow-lg"
                    >
                      <PencilIcon className="w-5 h-5 mr-2 text-indigo-400" />
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex space-x-3">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-xl text-emerald-400 font-bold transition-all duration-300 disabled:opacity-50 active:scale-95 shadow-lg"
                      >
                        {saving ? (
                          <LoadingSpinner size="small" />
                        ) : (
                          <CheckIcon className="w-4 h-4 mr-2" />
                        )}
                        Save Changes
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex items-center px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 rounded-xl text-rose-400 font-bold transition-all duration-300 active:scale-95 shadow-lg"
                      >
                        <XMarkIcon className="w-4 h-4 mr-2" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Content */}
              <div className="p-6">
                {/* Avatar Section */}
                <div className="flex items-start space-x-8 mb-10">
                  <div className="relative group">
                    <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-white text-4xl font-black shadow-2xl border-4 border-white/10 transform transition-transform group-hover:scale-105 group-hover:rotate-3">
                      {getInitials(profile?.first_name, profile?.last_name)}
                    </div>
                    <button className="absolute -bottom-3 -right-3 p-3 bg-indigo-600 rounded-2xl text-white hover:bg-indigo-700 transition-all shadow-xl hover:scale-110 active:scale-90 border-4 border-[#070B14]">
                      <CameraIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="pt-2">
                    <h3 className="text-3xl font-black text-white tracking-tight leading-tight">
                      {profile?.first_name} {profile?.last_name}
                    </h3>
                    <p className="text-indigo-400 text-xl font-bold mt-1">{employee?.position || 'Position not specified'}</p>
                    <div className="mt-4">
                      {getRoleBadge(profile?.profile?.role)}
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                      First Name
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={editData.first_name}
                        onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-medium"
                      />
                    ) : (
                      <div className="flex items-center p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-white/20 transition-all">
                        <UserIcon className="w-5 h-5 text-indigo-400 mr-3 group-hover:scale-110 transition-transform" />
                        <span className="text-slate-200 font-semibold">{profile?.first_name || 'Not specified'}</span>
                      </div>
                    )}
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                      Last Name
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={editData.last_name}
                        onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-medium"
                      />
                    ) : (
                      <div className="flex items-center p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-white/20 transition-all">
                        <UserIcon className="w-5 h-5 text-indigo-400 mr-3 group-hover:scale-110 transition-transform" />
                        <span className="text-slate-200 font-semibold">{profile?.last_name || 'Not specified'}</span>
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                      Email Address
                    </label>
                    <div className="flex items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                      <EnvelopeIcon className="w-5 h-5 text-indigo-400 mr-3" />
                      <span className="text-slate-200 font-semibold">{profile?.email}</span>
                    </div>
                    <p className="text-xs text-slate-500 font-bold mt-2 ml-1 italic opacity-60">Email cannot be changed</p>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                      Phone Number
                    </label>
                    {editMode ? (
                      <input
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        pattern="[0-9]*"
                        value={editData.phone_number}
                        onChange={(e) =>
                          setEditData({ ...editData, phone_number: digitsOnly(e.target.value) })
                        }
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-medium"
                        placeholder="Digits only (e.g. 9876543210)"
                      />
                    ) : (
                      <div className="flex items-center p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-white/20 transition-all">
                        <PhoneIcon className="w-5 h-5 text-indigo-400 mr-3 group-hover:scale-110 transition-transform" />
                        <span className="text-slate-200 font-semibold">{profile?.profile?.phone_number || 'Not specified'}</span>
                      </div>
                    )}
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                      Date of Birth
                    </label>
                    {editMode ? (
                      <input
                        type="date"
                        value={editData.date_of_birth}
                        onChange={(e) => setEditData({ ...editData, date_of_birth: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-medium [color-scheme:dark]"
                      />
                    ) : (
                      <div className="flex items-center p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-white/20 transition-all">
                        <CalendarDaysIcon className="w-5 h-5 text-indigo-400 mr-3 group-hover:scale-110 transition-transform" />
                        <span className="text-slate-200 font-semibold">{formatDate(profile?.profile?.date_of_birth)}</span>
                      </div>
                    )}
                  </div>

                  {/* Emergency Contact */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                      Emergency Contact
                    </label>
                    {editMode ? (
                      <input
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel"
                        pattern="[0-9]*"
                        value={editData.emergency_contact}
                        onChange={(e) =>
                          setEditData({ ...editData, emergency_contact: digitsOnly(e.target.value) })
                        }
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-medium"
                        placeholder="Digits only (e.g. 9876543210)"
                      />
                    ) : (
                      <div className="flex items-center p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-white/20 transition-all">
                        <ExclamationTriangleIcon className="w-5 h-5 text-indigo-400 mr-3 group-hover:scale-110 transition-transform" />
                        <span className="text-slate-200 font-semibold">{profile?.profile?.emergency_contact || 'Not specified'}</span>
                      </div>
                    )}
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                      Address
                    </label>
                    {editMode ? (
                      <textarea
                        value={editData.address}
                        onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                        rows="3"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-medium"
                        placeholder="Enter your address"
                      />
                    ) : (
                      <div className="flex items-start p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-white/20 transition-all">
                        <MapPinIcon className="w-5 h-5 text-indigo-400 mr-3 mt-1 group-hover:scale-110 transition-transform" />
                        <span className="text-slate-200 font-semibold leading-relaxed">{profile?.profile?.address || 'Not specified'}</span>
                      </div>
                    )}
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                      Gender
                    </label>
                    {editMode ? (
                      <select
                        value={editData.gender}
                        onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none"
                      >
                        <option value="" className="bg-[#1a1c2e]">Select gender</option>
                        <option value="MALE" className="bg-[#1a1c2e]">Male</option>
                        <option value="FEMALE" className="bg-[#1a1c2e]">Female</option>
                        <option value="OTHER" className="bg-[#1a1c2e]">Other</option>
                        <option value="PREFER_NOT_TO_SAY" className="bg-[#1a1c2e]">Prefer not to say</option>
                      </select>
                    ) : (
                      <div className="flex items-center p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-white/20 transition-all">
                        <UserIcon className="w-5 h-5 text-indigo-400 mr-3 group-hover:scale-110 transition-transform" />
                        <span className="text-slate-200 font-semibold">
                          {profile?.profile?.gender
                            ? { MALE: 'Male', FEMALE: 'Female', OTHER: 'Other', PREFER_NOT_TO_SAY: 'Prefer not to say' }[profile.profile.gender] || profile.profile.gender
                            : 'Not specified'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Blood Group */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                      Blood Group
                    </label>
                    {editMode ? (
                      <select
                        value={editData.blood_group}
                        onChange={(e) => setEditData({ ...editData, blood_group: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all appearance-none"
                      >
                        <option value="" className="bg-[#0b121e]">Select blood group</option>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                          <option key={bg} value={bg} className="bg-[#0b121e]">{bg}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-white/20 transition-all">
                        <ShieldCheckIcon className="w-5 h-5 text-indigo-400 mr-3 group-hover:scale-110 transition-transform" />
                        <span className="text-slate-200 font-semibold">{profile?.profile?.blood_group || 'Not specified'}</span>
                      </div>
                    )}
                  </div>

                  {/* Aadhaar Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                      Aadhaar Number
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={editData.aadhaar_number}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                          setEditData({ ...editData, aadhaar_number: val });
                        }}
                        maxLength={12}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-mono"
                        placeholder="Enter 12-digit Aadhaar number"
                      />
                    ) : (
                      <div className="flex items-center p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-white/20 transition-all">
                        <ShieldCheckIcon className="w-5 h-5 text-indigo-400 mr-3 group-hover:scale-110 transition-transform" />
                        <span className="text-slate-200 font-mono font-bold">
                          {profile?.profile?.aadhaar_number
                            ? `****-****-${String(profile.profile.aadhaar_number).slice(-4)}`
                            : 'Not specified'}
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-slate-500 font-bold mt-2 ml-1 italic opacity-60">Stored securely — encrypted at rest</p>
                  </div>

                  {/* PAN Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                      PAN Number
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={editData.pan_number}
                        onChange={(e) => setEditData({ ...editData, pan_number: e.target.value.toUpperCase().slice(0, 10) })}
                        maxLength={10}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-mono uppercase"
                        placeholder="E.g. ABCDE1234F"
                      />
                    ) : (
                      <div className="flex items-center p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-white/20 transition-all">
                        <ShieldCheckIcon className="w-5 h-5 text-indigo-400 mr-3 group-hover:scale-110 transition-transform" />
                        <span className="text-slate-200 font-mono font-bold uppercase">
                          {profile?.profile?.pan_number
                            ? `${String(profile.profile.pan_number).slice(0, 5)}*****`
                            : 'Not specified'}
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-slate-500 font-bold mt-2 ml-1 italic opacity-60">Stored securely — encrypted at rest</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Employment Details */}
            {employee && (
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 transition-all duration-300 overflow-hidden">
                <div className="bg-white/5 px-8 py-5 border-b border-white/5">
                  <h2 className="text-xl font-bold text-white flex items-center tracking-tight">
                    <BriefcaseIcon className="w-6 h-6 mr-3 text-indigo-400" />
                    Employment Details
                  </h2>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Employee ID */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Username</label>
                      <div className="flex items-center p-4 bg-white/5 rounded-2xl border border-white/5 transition-all">
                        <ShieldCheckIcon className="w-5 h-5 text-indigo-400 mr-3" />
                        <span className="text-slate-200 font-mono font-bold">{employee.user?.username || employee.user_info?.username || employee.employee_id}</span>
                      </div>
                    </div>
                    {/* Department */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Department</label>
                      <div className="flex items-center p-4 bg-white/5 rounded-2xl border border-white/5 transition-all">
                        <BuildingOfficeIcon className="w-5 h-5 text-indigo-400 mr-3" />
                        <span className="text-slate-200 font-bold">{employee.department?.name || 'Not assigned'}</span>
                      </div>
                    </div>
                    {/* Position */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Position</label>
                      <div className="flex items-center p-4 bg-white/5 rounded-2xl border border-white/5 transition-all">
                        <StarIcon className="w-5 h-5 text-indigo-400 mr-3" />
                        <span className="text-slate-200 font-bold">{employee.position || 'Not specified'}</span>
                      </div>
                    </div>
                    {/* Hire Date */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Hire Date</label>
                      <div className="flex items-center p-4 bg-white/5 rounded-2xl border border-white/5 transition-all">
                        <ClockIcon className="w-5 h-5 text-indigo-400 mr-3" />
                        <span className="text-slate-200 font-bold">{formatDate(employee.hire_date)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Documents - read only */}
            {employee && (
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 transition-all duration-300 overflow-hidden">
                <div className="bg-white/5 px-8 py-5 border-b border-white/5">
                  <h2 className="text-xl font-bold text-white flex items-center tracking-tight">
                    <ShieldCheckIcon className="w-6 h-6 mr-3 text-indigo-400" />
                    Documents
                  </h2>
                </div>
                <div className="p-8">
                  {documentsLoading ? (
                    <div className="flex items-center justify-center h-24">
                      <LoadingSpinner text="Loading documents..." />
                    </div>
                  ) : documents && documents.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-white/10">
                      <table className="min-w-full divide-y divide-white/10 text-sm">
                        <thead className="bg-white/5">
                          <tr>
                            <th className="px-6 py-4 text-left font-bold text-slate-400 uppercase tracking-widest text-xs">
                              Type
                            </th>
                            <th className="px-6 py-4 text-left font-bold text-slate-400 uppercase tracking-widest text-xs">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-transparent divide-y divide-white/5">
                          {documents.map((doc) => (
                            <tr key={`${doc.field}-${doc.doc_type}`} className="hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-slate-200 font-bold">
                                {doc.doc_type}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {doc.url ? (
                                  <a
                                    href={doc.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-lg text-indigo-400 font-bold transition-all text-xs"
                                  >
                                    View
                                  </a>
                                ) : (
                                  <span className="text-slate-500 font-black uppercase text-[10px] tracking-widest opacity-60">
                                    Not available
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p className="mt-4 text-xs text-slate-500 font-bold italic opacity-60 px-2 leading-relaxed">
                        Documents shown here are read-only. Contact HR if any updates are needed.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-white/5 rounded-2xl border border-dashed border-white/10">
                      <p className="text-sm text-slate-400 font-bold">
                        No documents have been uploaded for your profile yet.
                      </p>
                    </div>
                  )}
                  {documentsError && (
                    <p className="mt-2 text-sm text-red-500">{documentsError}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Team & Manager OR All Managers */}
          <div className="space-y-6">
            {/* Manager Card - Show for non-HR users */}
            {!isHRManager && manager && (
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 transition-all duration-300 overflow-hidden">
                <div className="bg-white/5 px-6 py-4 border-b border-white/5">
                  <h2 className="text-lg font-bold text-white flex items-center tracking-tight">
                    <UserIcon className="w-5 h-5 mr-2 text-indigo-400" />
                    My Manager
                  </h2>
                </div>
                <div className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-lg font-black shadow-lg border-2 border-white/10">
                      {getInitials(manager.user_info?.first_name, manager.user_info?.last_name)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-tight">
                        {manager.user_info?.full_name}
                      </h3>
                      <p className="text-xs text-slate-400 font-bold mt-1">Username: {manager.user?.username || manager.user_info?.username || manager.employee_id}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Team Members OR All Managers */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 transition-all duration-300 overflow-hidden">
              <div className="bg-white/5 px-6 py-4 border-b border-white/5">
                <h2 className="text-lg font-bold text-white flex items-center tracking-tight">
                  <UserGroupIcon className="w-5 h-5 mr-3 text-indigo-400" />
                  {isHRManager ? `All Managers (${managers.length})` : `My Team (${team.length})`}
                </h2>
              </div>
              <div className="p-6">
                {isHRManager ? (
                  // Show all managers for HR
                  managers.length > 0 ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                      {managers.map((managerItem) => (
                        <div key={managerItem.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center text-white font-black shadow-lg">
                              {getInitials(managerItem.user_info?.first_name, managerItem.user_info?.last_name)}
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-bold text-white tracking-tight">
                                {managerItem.user_info?.full_name}
                              </h4>
                              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">{managerItem.position}</p>
                              <p className="text-[10px] text-slate-500 font-bold">Username: {managerItem.user?.username || managerItem.user_info?.username || managerItem.employee_id}</p>
                              <p className="text-[10px] text-slate-500 font-bold">Dept: {managerItem.department?.name || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              {managerItem.team_count} TEAM{managerItem.team_count !== 1 ? 'S' : ''}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white/5 rounded-2xl border border-dashed border-white/10">
                      <UserGroupIcon className="w-16 h-16 text-white/5 mx-auto mb-4" />
                      <p className="text-slate-400 font-bold">No managers found</p>
                      <p className="text-xs text-slate-500 font-bold italic mt-1">No managers with teams available</p>
                    </div>
                  )
                ) : (
                  // Show team members for regular employees
                  team.length > 0 ? (
                    <div className="space-y-4">
                      {team.map((member) => (
                        <div key={member.id} className="flex items-center space-x-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center text-white font-black shadow-lg">
                            {getInitials(member.user_info?.first_name, member.user_info?.last_name)}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-bold text-white tracking-tight">
                              {member.user_info?.full_name}
                            </h4>
                            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">{member.position}</p>
                            <p className="text-[10px] text-slate-500 font-bold">Username: {member.user?.username || member.user_info?.username || member.employee_id}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white/5 rounded-2xl border border-dashed border-white/10">
                      <UserGroupIcon className="w-16 h-16 text-white/5 mx-auto mb-4" />
                      <p className="text-slate-400 font-bold">No team members found</p>
                      <p className="text-xs text-slate-500 font-bold italic mt-1">You don't have any direct reports</p>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 transition-all duration-300 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 px-6 py-4">
                <h2 className="text-lg font-bold text-white tracking-tight">Quick Stats</h2>
              </div>
              <div className="p-6 space-y-5">
                <div className="flex justify-between items-center group">
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                    {isHRManager ? 'Total Managers' : 'Team Size'}
                  </span>
                  <span className="text-2xl font-black text-indigo-400 transition-transform group-hover:scale-110">
                    {isHRManager ? managers.length : team.length}
                  </span>
                </div>
                <div className="flex justify-between items-center group">
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Department</span>
                  <span className="text-sm font-black text-slate-200">{employee?.department?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center group">
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Status</span>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest">
                    Active
                  </span>
                </div>
                {isHRManager && (
                  <div className="flex justify-between items-center group pt-2 border-t border-white/5">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total Members</span>
                    <span className="text-2xl font-black text-purple-400">
                      {managers.reduce((total, manager) => total + manager.team_count, 0)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;