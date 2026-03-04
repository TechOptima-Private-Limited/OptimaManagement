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
          phone_number: profileData.profile?.phone_number || '',
          address: profileData.profile?.address || '',
          date_of_birth: profileData.profile?.date_of_birth || '',
          emergency_contact: profileData.profile?.emergency_contact || '',
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

      const apiBase = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8080/api');
      const response = await fetch(`${apiBase}/auth/profile/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editData)
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
      phone_number: profile?.profile?.phone_number || '',
      address: profile?.profile?.address || '',
      date_of_birth: profile?.profile?.date_of_birth || '',
      emergency_contact: profile?.profile?.emergency_contact || '',
      gender: profile?.profile?.gender || '',
      blood_group: profile?.profile?.blood_group || '',
      aadhaar_number: profile?.profile?.aadhaar_number || '',
      pan_number: profile?.profile?.pan_number || '',
    });
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      'ADMIN': { color: 'from-red-500 to-pink-600', icon: '👑', label: 'Administrator' },
      'HR_MANAGER': { color: 'from-blue-500 to-indigo-600', icon: '🏢', label: 'HR Manager' },
      'EMPLOYEE': { color: 'from-green-500 to-emerald-600', icon: '👤', label: 'Employee' }
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
    <div className={`min-h-screen bg-gradient-to-br ${theme.surfaceGradient} py-8`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold bg-gradient-to-r ${theme.primaryGradient} bg-clip-text text-transparent`}>
            My Profile
          </h1>
          <p className="text-gray-600 mt-2">
            {isHRManager ? 'Manage your personal information and view all managers' : 'Manage your personal information and view your team'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Profile Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 overflow-hidden">
              {/* Header with Edit Button */}
              <div className={`bg-gradient-to-r ${theme.headerGradient} px-6 py-4`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Personal Information</h2>
                  {!editMode ? (
                    <button
                      onClick={() => setEditMode(true)}
                      className="flex items-center px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white font-medium transition-all duration-300 backdrop-blur-sm border border-white/30"
                    >
                      <PencilIcon className="w-4 h-4 mr-2" />
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-white font-medium transition-all duration-300 disabled:opacity-50"
                      >
                        {saving ? (
                          <LoadingSpinner size="small" />
                        ) : (
                          <CheckIcon className="w-4 h-4 mr-2" />
                        )}
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white font-medium transition-all duration-300"
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
                <div className="flex items-center space-x-6 mb-8">
                  <div className="relative">
                    <div className={`w-24 h-24 bg-gradient-to-r ${theme.avatarGradient} rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-xl border-4 border-white`}>
                      {getInitials(profile?.first_name, profile?.last_name)}
                    </div>
                    <button className="absolute -bottom-2 -right-2 p-2 bg-red-600 rounded-full text-white hover:bg-red-700 transition-colors shadow-lg">
                      <CameraIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {profile?.first_name} {profile?.last_name}
                    </h3>
                    <p className="text-gray-600 text-lg">{employee?.position || 'Position not specified'}</p>
                    <div className="mt-2">
                      {getRoleBadge(profile?.profile?.role)}
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      First Name
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={editData.first_name}
                        onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
                      />
                    ) : (
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <UserIcon className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="text-gray-900">{profile?.first_name || 'Not specified'}</span>
                      </div>
                    )}
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Last Name
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={editData.last_name}
                        onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
                      />
                    ) : (
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <UserIcon className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="text-gray-900">{profile?.last_name || 'Not specified'}</span>
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <EnvelopeIcon className="w-5 h-5 text-gray-400 mr-3" />
                      <span className="text-gray-900">{profile?.email}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    {editMode ? (
                      <input
                        type="tel"
                        value={editData.phone_number}
                        onChange={(e) => setEditData({ ...editData, phone_number: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
                        placeholder="Enter phone number"
                      />
                    ) : (
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <PhoneIcon className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="text-gray-900">{profile?.profile?.phone_number || 'Not specified'}</span>
                      </div>
                    )}
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    {editMode ? (
                      <input
                        type="date"
                        value={editData.date_of_birth}
                        onChange={(e) => setEditData({ ...editData, date_of_birth: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
                      />
                    ) : (
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <CalendarDaysIcon className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="text-gray-900">{formatDate(profile?.profile?.date_of_birth)}</span>
                      </div>
                    )}
                  </div>

                  {/* Emergency Contact */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Emergency Contact
                    </label>
                    {editMode ? (
                      <input
                        type="tel"
                        value={editData.emergency_contact}
                        onChange={(e) => setEditData({ ...editData, emergency_contact: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
                        placeholder="Enter emergency contact"
                      />
                    ) : (
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <ExclamationTriangleIcon className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="text-gray-900">{profile?.profile?.emergency_contact || 'Not specified'}</span>
                      </div>
                    )}
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Address
                    </label>
                    {editMode ? (
                      <textarea
                        value={editData.address}
                        onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                        rows="3"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
                        placeholder="Enter your address"
                      />
                    ) : (
                      <div className="flex items-start p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <MapPinIcon className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                        <span className="text-gray-900">{profile?.profile?.address || 'Not specified'}</span>
                      </div>
                    )}
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Gender
                    </label>
                    {editMode ? (
                      <select
                        value={editData.gender}
                        onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 bg-white"
                      >
                        <option value="">Select gender</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                        <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                      </select>
                    ) : (
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <UserIcon className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="text-gray-900">
                          {profile?.profile?.gender
                            ? { MALE: 'Male', FEMALE: 'Female', OTHER: 'Other', PREFER_NOT_TO_SAY: 'Prefer not to say' }[profile.profile.gender] || profile.profile.gender
                            : 'Not specified'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Blood Group */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Blood Group
                    </label>
                    {editMode ? (
                      <select
                        value={editData.blood_group}
                        onChange={(e) => setEditData({ ...editData, blood_group: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 bg-white"
                      >
                        <option value="">Select blood group</option>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <ShieldCheckIcon className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="text-gray-900">{profile?.profile?.blood_group || 'Not specified'}</span>
                      </div>
                    )}
                  </div>

                  {/* Aadhaar Number */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
                        placeholder="Enter 12-digit Aadhaar number"
                      />
                    ) : (
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <ShieldCheckIcon className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="text-gray-900 font-mono">
                          {profile?.profile?.aadhaar_number
                            ? `****-****-${String(profile.profile.aadhaar_number).slice(-4)}`
                            : 'Not specified'}
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Stored securely — encrypted at rest</p>
                  </div>

                  {/* PAN Number */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      PAN Number
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={editData.pan_number}
                        onChange={(e) => setEditData({ ...editData, pan_number: e.target.value.toUpperCase().slice(0, 10) })}
                        maxLength={10}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
                        placeholder="E.g. ABCDE1234F"
                      />
                    ) : (
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <ShieldCheckIcon className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="text-gray-900 font-mono">
                          {profile?.profile?.pan_number
                            ? `${String(profile.profile.pan_number).slice(0, 5)}*****`
                            : 'Not specified'}
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Stored securely — encrypted at rest</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Employment Details */}
            {employee && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-white/20">
                <div className={`bg-gradient-to-r ${theme.primaryGradient} px-6 py-4`}>
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <BriefcaseIcon className="w-6 h-6 mr-3" />
                    Employment Details
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Employee ID */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <ShieldCheckIcon className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="text-gray-900 font-mono">{employee.user?.username || employee.user_info?.username || employee.employee_id}</span>
                      </div>
                    </div>
                    {/* Department */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <BuildingOfficeIcon className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="text-gray-900">{employee.department?.name || 'Not assigned'}</span>
                      </div>
                    </div>
                    {/* Position */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Position</label>
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <StarIcon className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="text-gray-900">{employee.position || 'Not specified'}</span>
                      </div>
                    </div>
                    {/* Hire Date */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Hire Date</label>
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <ClockIcon className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="text-gray-900">{formatDate(employee.hire_date)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Documents - read only */}
            {employee && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-white/20">
                <div className={`bg-gradient-to-r ${theme.primaryGradient} px-6 py-4`}>
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <ShieldCheckIcon className="w-6 h-6 mr-3" />
                    Documents
                  </h2>
                </div>
                <div className="p-6">
                  {documentsLoading ? (
                    <div className="flex items-center justify-center h-24">
                      <LoadingSpinner text="Loading documents..." />
                    </div>
                  ) : documents && documents.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {documents.map((doc) => (
                            <tr key={`${doc.field}-${doc.doc_type}`}>
                              <td className="px-4 py-2 whitespace-nowrap text-gray-900">
                                {doc.doc_type}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap">
                                {doc.url ? (
                                  <a
                                    href={doc.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                  >
                                    View
                                  </a>
                                ) : (
                                  <span className="text-gray-500 text-xs">
                                    Not available
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p className="mt-3 text-xs text-gray-500">
                        Documents shown here are read-only. Contact HR if any updates are needed.
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No documents have been uploaded for your profile yet.
                    </p>
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
              <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-white/20">
                <div className={`bg-gradient-to-r ${theme.primaryGradient} px-6 py-4`}>
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <UserIcon className="w-6 h-6 mr-3" />
                    My Manager
                  </h2>
                </div>
                <div className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className={`w-16 h-16 bg-gradient-to-r ${theme.avatarGradient} rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg`}>
                      {getInitials(manager.user_info?.first_name, manager.user_info?.last_name)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {manager.user_info?.full_name}
                      </h3>
                      <p className="text-sm text-gray-500">Username: {manager.user?.username || manager.user_info?.username || manager.employee_id}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Team Members OR All Managers */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-white/20">
              <div className={`bg-gradient-to-r ${theme.headerGradient} px-6 py-4`}>
                <h2 className="text-xl font-bold text-white flex items-center">
                  <UserGroupIcon className="w-6 h-6 mr-3" />
                  {isHRManager ? `All Managers (${managers.length})` : `My Team (${team.length})`}
                </h2>
              </div>
              <div className="p-6">
                {isHRManager ? (
                  // Show all managers for HR
                  managers.length > 0 ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {managers.map((managerItem) => (
                        <div key={managerItem.id} className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100 hover:shadow-md transition-all duration-300">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-rose-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                              {getInitials(managerItem.user_info?.first_name, managerItem.user_info?.last_name)}
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-gray-900">
                                {managerItem.user_info?.full_name}
                              </h4>
                              <p className="text-xs text-gray-600">{managerItem.position}</p>
                              <p className="text-xs text-gray-500">Username: {managerItem.user?.username || managerItem.user_info?.username || managerItem.employee_id}</p>
                              <p className="text-xs text-gray-500">Dept: {managerItem.department?.name || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {managerItem.team_count} team{managerItem.team_count !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No managers found</p>
                      <p className="text-sm text-gray-400">No managers with teams available</p>
                    </div>
                  )
                ) : (
                  // Show team members for regular employees
                  team.length > 0 ? (
                    <div className="space-y-4">
                      {team.map((member) => (
                        <div key={member.id} className="flex items-center space-x-4 p-4 bg-red-50 rounded-lg border border-red-100 hover:shadow-md transition-all duration-300">
                          <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-rose-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                            {getInitials(member.user_info?.first_name, member.user_info?.last_name)}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-gray-900">
                              {member.user_info?.full_name}
                            </h4>
                            <p className="text-xs text-gray-600">{member.position}</p>
                            <p className="text-xs text-gray-500">Username: {member.user?.username || member.user_info?.username || member.employee_id}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No team members found</p>
                      <p className="text-sm text-gray-400">You don't have any direct reports</p>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-white/20">
              <div className="bg-gradient-to-r from-yellow-600 via-orange-600 to-red-700 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Quick Stats</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">
                    {isHRManager ? 'Total Managers' : 'Team Size'}
                  </span>
                  <span className="font-bold text-red-600">
                    {isHRManager ? managers.length : team.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Department</span>
                  <span className="font-bold text-gray-700">{employee?.department?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                    Active
                  </span>
                </div>
                {isHRManager && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Team Members</span>
                    <span className="font-bold text-rose-600">
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