import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Upload,
  Check,
  AlertCircle,
  Building,
  Shield,
  Clock,
  Calendar,
  Star,
  Sparkles
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const EmployeeOnboardingForm = ({ encodedData }) => {
  const { theme, isDark } = useTheme();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    current_address: '',
    permanent_address: '',
    aadhar_pan_file: null,
    payslips_file: null,
    educational_certificates_file: null,
    previous_offer_letter_file: null,
    relieving_experience_letters_file: null,
    appraisal_hike_letters_file: null,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [linkInfo, setLinkInfo] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [linkStatus, setLinkStatus] = useState('valid'); // 'valid', 'expired', 'invalid', 'already_submitted'

  const documentTypes = [
    { key: 'aadhar_pan_file', label: 'Aadhar & PAN Card', icon: '🆔', required: true },
    { key: 'payslips_file', label: 'Last 6 Months Payslips', icon: '💰', required: true },
    { key: 'educational_certificates_file', label: 'Educational Certificates', icon: '🎓', required: true },
    { key: 'previous_offer_letter_file', label: 'Previous Offer Letter', icon: '📄', required: true },
    { key: 'relieving_experience_letters_file', label: 'Relieving & Experience Letters', icon: '📜', required: true },
    { key: 'appraisal_hike_letters_file', label: 'Appraisal/Hike Letters', icon: '📈', required: true },
  ];

  useEffect(() => {
    if (encodedData) {
      validateLink();
    }
  }, [encodedData]);

  const validateLink = async () => {
    try {
      const apiBase = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8080/api');
      const response = await fetch(`${apiBase}/onboarding/validate-link/${encodedData}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLinkInfo(data.link_info);
        setEmployee(data.employee);
        setLinkStatus(data.status);

        // Pre-fill form if employee exists
        if (data.employee && data.status === 'valid') {
          setFormData({
            ...formData,
            first_name: data.employee.first_name || '',
            last_name: data.employee.last_name || '',
            email: data.employee.email || '',
            phone_number: data.employee.phone_number || '',
            current_address: data.employee.current_address || '',
            permanent_address: data.employee.permanent_address || '',
          });
        }
      } else {
        setLinkStatus('invalid');
      }
    } catch (error) {
      console.error('Error validating link:', error);
      setLinkStatus('invalid');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];

    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setErrors({ ...errors, [name]: 'File size should be less than 10MB' });
        e.target.value = '';
        return;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setErrors({ ...errors, [name]: 'Please upload PDF, JPG, or PNG files only' });
        e.target.value = '';
        return;
      }

      setFormData({ ...formData, [name]: file });
      // Clear error when file is selected
      if (errors[name]) {
        setErrors({ ...errors, [name]: null });
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required text fields
    const requiredFields = ['first_name', 'last_name', 'email', 'phone_number', 'current_address', 'permanent_address'];
    requiredFields.forEach(field => {
      if (!formData[field]?.trim()) {
        newErrors[field] = 'This field is required';
      }
    });

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Required file fields
    documentTypes.forEach(doc => {
      if (doc.required && !formData[doc.key]) {
        newErrors[doc.key] = 'This document is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();

      // Append text fields
      Object.keys(formData).forEach(key => {
        if (typeof formData[key] === 'string') {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Append files
      documentTypes.forEach(doc => {
        if (formData[doc.key]) {
          formDataToSend.append(doc.key, formData[doc.key]);
        }
      });

      const apiBase = (process.env.REACT_APP_API_URL || 'http://127.0.0.1:8080/api');
      const submitUrl = encodedData
        ? `${apiBase}/onboarding/submit/${encodedData}/`
        : `${apiBase}/onboarding/submit/`;

      const response = await fetch(submitUrl, {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        // Redirect to success page
        window.location.href = '/onboarding/success/';
      } else {
        const errorData = await response.json();
        if (errorData.errors) {
          setErrors(errorData.errors);
        } else {
          alert('Submission failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRemainingTime = () => {
    if (!linkInfo?.expires_at) return null;

    const now = new Date();
    const expires = new Date(linkInfo.expires_at);
    const remaining = expires - now;

    if (remaining <= 0) return { text: 'Expired', color: 'text-red-600' };

    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 1) {
      return { text: `${days} days, ${hours} hours`, color: 'text-green-600' };
    } else if (days === 1) {
      return { text: `1 day, ${hours} hours`, color: 'text-amber-600' };
    } else {
      return { text: `${hours} hours`, color: 'text-red-600' };
    }
  };

  const remainingTime = getRemainingTime();

  if (linkStatus !== 'valid') {
    return <LinkInvalidComponent status={linkStatus} employee={employee} linkInfo={linkInfo} />;
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.surfaceGradient}`}>
      {/* Header */}
      <div className={`relative overflow-hidden bg-gradient-to-r ${theme.primaryGradient}`}>
        <div className="absolute inset-0 bg-black opacity-10"></div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-48 translate-y-48"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center space-x-4 mb-8">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 shadow-2xl">
                <Building className="h-14 w-14 text-white" />
              </div>
              <Sparkles className="h-10 w-10 text-yellow-300 animate-pulse" />
            </div>

            <h1 className="text-5xl lg:text-7xl font-black text-white mb-4 tracking-tighter uppercase">
              Techoptima <span className="text-blue-200">Pvt Ltd</span>
            </h1>
            <h2 className="text-2xl font-bold text-white/90 mb-8 tracking-widest uppercase">
              Employee Portal
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed font-medium">
              Welcome! Please fill out your personal information and upload required documents below.
              Our HR team will review your submission to complete your employment profile.
            </p>

            {remainingTime && (
              <div className="mt-12 inline-flex items-center px-6 py-3 bg-white/10 rounded-full border border-white/20 backdrop-blur-md shadow-xl animate-bounce-slow">
                <Clock className="w-5 h-5 text-white mr-3 animate-spin-slow" />
                <span className="text-white font-black text-xs uppercase tracking-[0.2em]">
                  Link expires in: {remainingTime.text}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-10 mb-20 relative z-10">
        <div className={`${theme.cardBg} ${theme.cardBorder} border backdrop-blur-2xl rounded-[3rem] shadow-2xl overflow-hidden transition-all duration-500`}>
          <div className="p-8 lg:p-16 space-y-12">

            {/* Personal Information Section */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 pb-4 border-b border-slate-700/50">
                <div className="p-2 bg-indigo-600 rounded-lg">
                  <User className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">Personal Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-xs font-black uppercase tracking-widest ${theme.muted.text} mb-3`}>
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative group/input">
                    <User className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${theme.muted.text} group-focus-within/input:text-indigo-500 transition-colors`} />
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-6 py-4 border rounded-2xl bg-black/5 hover:bg-black/10 focus:bg-transparent ${theme.text} focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 outline-none ${errors.first_name ? 'border-rose-500' : `${theme.muted.border} focus:border-indigo-500`
                        }`}
                      placeholder="Enter your first name"
                    />
                  </div>
                  {errors.first_name && (
                    <p className="text-rose-500 text-[10px] font-bold uppercase tracking-widest mt-2 ml-1">{errors.first_name}</p>
                  )}
                </div>

                <div>
                  <label className={`block text-xs font-black uppercase tracking-widest ${theme.muted.text} mb-3`}>
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative group/input">
                    <User className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${theme.muted.text} group-focus-within/input:text-indigo-500 transition-colors`} />
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-6 py-4 border rounded-2xl bg-black/5 hover:bg-black/10 focus:bg-transparent ${theme.text} focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 outline-none ${errors.last_name ? 'border-rose-500' : `${theme.muted.border} focus:border-indigo-500`
                        }`}
                      placeholder="Enter your last name"
                    />
                  </div>
                  {errors.last_name && (
                    <p className="text-rose-500 text-[10px] font-bold uppercase tracking-widest mt-2 ml-1">{errors.last_name}</p>
                  )}
                </div>

                <div>
                  <label className={`block text-xs font-black uppercase tracking-widest ${theme.muted.text} mb-3`}>
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative group/input">
                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${theme.muted.text} group-focus-within/input:text-indigo-500 transition-colors`} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-6 py-4 border rounded-2xl bg-black/5 hover:bg-black/10 focus:bg-transparent ${theme.text} focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 outline-none ${errors.email ? 'border-rose-500' : `${theme.muted.border} focus:border-indigo-500`
                        }`}
                      placeholder="your.email@company.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-rose-500 text-[10px] font-bold uppercase tracking-widest mt-2 ml-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className={`block text-xs font-black uppercase tracking-widest ${theme.muted.text} mb-3`}>
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative group/input">
                    <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${theme.muted.text} group-focus-within/input:text-indigo-500 transition-colors`} />
                    <input
                      type="tel"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-6 py-4 border rounded-2xl bg-black/5 hover:bg-black/10 focus:bg-transparent ${theme.text} focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 outline-none ${errors.phone_number ? 'border-rose-500' : `${theme.muted.border} focus:border-indigo-500`
                        }`}
                      placeholder="+91 9876543210"
                    />
                  </div>
                  {errors.phone_number && (
                    <p className="text-rose-500 text-[10px] font-bold uppercase tracking-widest mt-2 ml-1">{errors.phone_number}</p>
                  )}
                </div>

                <div>
                  <label className={`block text-xs font-black uppercase tracking-widest ${theme.muted.text} mb-3`}>
                    Current Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative group/input">
                    <MapPin className={`absolute left-4 top-4 h-5 w-5 ${theme.muted.text} group-focus-within/input:text-indigo-500 transition-colors`} />
                    <textarea
                      name="current_address"
                      value={formData.current_address}
                      onChange={handleInputChange}
                      rows={3}
                      className={`w-full pl-12 pr-6 py-4 border rounded-2xl bg-black/5 hover:bg-black/10 focus:bg-transparent ${theme.text} focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 outline-none ${errors.current_address ? 'border-rose-500' : `${theme.muted.border} focus:border-indigo-500`
                        }`}
                      placeholder="Enter your current address"
                    />
                  </div>
                  {errors.current_address && (
                    <p className="text-rose-500 text-[10px] font-bold uppercase tracking-widest mt-2 ml-1">{errors.current_address}</p>
                  )}
                </div>

                <div>
                  <label className={`block text-xs font-black uppercase tracking-widest ${theme.muted.text} mb-3`}>
                    Permanent Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative group/input">
                    <MapPin className={`absolute left-4 top-4 h-5 w-5 ${theme.muted.text} group-focus-within/input:text-indigo-500 transition-colors`} />
                    <textarea
                      name="permanent_address"
                      value={formData.permanent_address}
                      onChange={handleInputChange}
                      rows={3}
                      className={`w-full pl-12 pr-6 py-4 border rounded-2xl bg-black/5 hover:bg-black/10 focus:bg-transparent ${theme.text} focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 outline-none ${errors.permanent_address ? 'border-rose-500' : `${theme.muted.border} focus:border-indigo-500`
                        }`}
                      placeholder="Enter your permanent address"
                    />
                  </div>
                  {errors.permanent_address && (
                    <p className="text-rose-500 text-[10px] font-bold uppercase tracking-widest mt-2 ml-1">{errors.permanent_address}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Document Upload Section */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 pb-4 border-b border-slate-700/50">
                <div className="p-2 bg-purple-600 rounded-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">Document Upload</h3>
              </div>

              <div className={`${isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'} rounded-3xl p-8 border ${theme.muted.border}`}>
                <div className="flex items-start space-x-4 mb-4">
                  <div className="p-2 bg-indigo-500/20 rounded-xl">
                    <AlertCircle className="h-6 w-6 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className={`font-black ${isDark ? 'text-white' : 'text-slate-900'} uppercase tracking-tight mb-3`}>Important Guidelines</h4>
                    <ul className={`text-xs ${theme.muted.text} space-y-2 font-bold uppercase tracking-widest`}>
                      <li className="flex items-center"><span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-3"></span>Accepted formats: PDF, JPG, PNG</li>
                      <li className="flex items-center"><span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-3"></span>Maximum size: 10MB per document</li>
                      <li className="flex items-center"><span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-3"></span>Ensure documents are clear & readable</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {documentTypes.map((doc) => (
                  <div key={doc.key} className="space-y-4 group/doc">
                    <label className={`block text-xs font-black uppercase tracking-widest ${theme.muted.text} mb-2`}>
                      <span className="text-2xl mr-3 filter drop-shadow-md group-hover/doc:scale-110 transition-transform inline-block">{doc.icon}</span>
                      {doc.label}
                      {doc.required && <span className="text-rose-500 ml-1">*</span>}
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        name={doc.key}
                        onChange={handleFileChange}
                        accept=".pdf,.jpg,.jpeg,.png"
                        className={`w-full px-5 py-4 border rounded-2xl bg-black/5 hover:bg-black/10 focus:bg-transparent ${theme.text} focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 outline-none file:mr-6 file:py-2 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-indigo-500 file:text-white hover:file:bg-indigo-400 file:transition-all ${errors[doc.key] ? 'border-rose-500' : `${theme.muted.border} focus:border-indigo-500`
                          }`}
                      />
                      {formData[doc.key] && (
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          <Check className="h-6 w-6 text-emerald-500 animate-bounce-slow" />
                        </div>
                      )}
                    </div>
                    {errors[doc.key] && (
                      <p className="text-rose-500 text-[10px] font-bold uppercase tracking-widest mt-2 ml-1">{errors[doc.key]}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="text-center pt-8 space-y-6">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`relative group inline-flex items-center px-12 py-5 rounded-[2rem] font-black uppercase tracking-[0.3em] text-sm shadow-2xl transition-all duration-500 transform ${loading
                  ? 'bg-slate-700 cursor-not-allowed opacity-50'
                  : `bg-gradient-to-r ${theme.primaryGradient} hover:shadow-indigo-500/40 hover:-translate-y-2 hover:scale-105 active:scale-95`
                  } text-white`}
              >
                <div className="absolute inset-0 bg-white/20 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-4 border-white/20 border-t-white mr-4"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-6 h-6 mr-4 group-hover:animate-bounce" />
                    Submit Application
                  </>
                )}
              </button>

              <div className={`flex items-center justify-center space-x-3 text-[10px] font-black uppercase tracking-[0.2em] ${theme.muted.text}`}>
                <Shield className="w-5 h-5 text-emerald-500" />
                <span>Encrypted & Secured by Techoptima HRMS</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Link Invalid Component
const LinkInvalidComponent = ({ status, employee, linkInfo }) => {
  const { theme, isDark } = useTheme();
  const getStatusInfo = () => {
    switch (status) {
      case 'expired':
        return {
          icon: <Clock className="h-24 w-24 text-rose-500 animate-pulse" />,
          title: 'Link Expired',
          subtitle: 'This onboarding link has expired and is no longer valid.',
          color: 'rose'
        };
      case 'already_submitted':
        return {
          icon: <CheckCircle className="h-24 w-24 text-emerald-500 animate-bounce-slow" />,
          title: 'Already Completed',
          subtitle: 'You have already successfully completed your onboarding.',
          color: 'emerald'
        };
      default:
        return {
          icon: <AlertCircle className="h-24 w-24 text-rose-500" />,
          title: 'Invalid Link',
          subtitle: 'This link is not valid or has been deactivated by HR.',
          color: 'rose'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.surfaceGradient} flex items-center justify-center p-4`}>
      <div className="max-w-2xl w-full">
        <div className={`${theme.cardBg} ${theme.cardBorder} border backdrop-blur-2xl rounded-[3rem] shadow-2xl p-8 lg:p-16 text-center transform transition-all duration-500`}>
          {/* Icon */}
          <div className="mb-10 flex justify-center">
            <div className={`p-8 ${isDark ? 'bg-white/5' : 'bg-black/5'} rounded-full border ${theme.muted.border} shadow-inner`}>
              {statusInfo.icon}
            </div>
          </div>

          {/* Company Header */}
          <div className="mb-10">
            <div className="flex justify-center items-center space-x-4 mb-4">
              <div className={`p-3 ${isDark ? 'bg-white/10' : 'bg-black/10'} rounded-xl`}>
                <Building className="h-10 w-10 text-indigo-500" />
              </div>
              <Sparkles className="h-8 w-8 text-yellow-400 animate-pulse" />
            </div>
            <h1 className={`text-4xl font-black ${isDark ? 'text-white' : 'text-slate-900'} uppercase tracking-tighter`}>Techoptima <span className="text-indigo-500">Pvt Ltd</span></h1>
          </div>

          {/* Status Message */}
          <h2 className={`text-3xl font-black mb-4 uppercase tracking-tight ${statusInfo.color === 'emerald' ? 'text-emerald-500' : 'text-rose-500'
            }`}>
            {statusInfo.title}
          </h2>

          <p className={`text-lg ${theme.muted.text} mb-10 font-medium leading-relaxed max-w-md mx-auto`}>
            {statusInfo.subtitle}
          </p>

          {/* Employee Info */}
          {employee && (
            <div className={`${isDark ? 'bg-white/5' : 'bg-black/5'} rounded-3xl p-8 mb-10 border ${theme.muted.border} text-left`}>
              <h3 className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'} mb-4 uppercase tracking-widest flex items-center`}>
                <User className="h-4 w-4 mr-2 text-indigo-500" />
                Candidate Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                   <span className={`text-[10px] font-black uppercase tracking-widest ${theme.muted.text}`}>Name</span>
                   <span className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{employee.first_name} {employee.last_name}</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className={`text-[10px] font-black uppercase tracking-widest ${theme.muted.text}`}>Email</span>
                   <span className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{employee.email}</span>
                </div>
                {employee.submitted_at && (
                  <div className="flex justify-between items-center pt-2 border-t border-white/5">
                     <span className={`text-[10px] font-black uppercase tracking-widest ${theme.muted.text}`}>Submitted On</span>
                     <span className="text-sm font-bold text-emerald-500">{new Date(employee.submitted_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* What to do next */}
          <div className={`${isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'} rounded-3xl p-8 mb-10 border ${theme.muted.border}`}>
            <h3 className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'} mb-6 uppercase tracking-widest`}>Next Steps</h3>
            <div className="grid grid-cols-1 gap-6 text-left">
              <div className="flex items-start space-x-4 group/item">
                <div className="p-3 bg-indigo-500/20 rounded-xl group-hover/item:scale-110 transition-transform">
                  <Mail className="h-6 w-6 text-indigo-400" />
                </div>
                <div>
                  <h4 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'} uppercase tracking-tight`}>Email HR</h4>
                  <p className={`text-xs ${theme.muted.text} mt-1 font-medium`}>hr@techoptima.com</p>
                </div>
              </div>
              <div className="flex items-start space-x-4 group/item">
                <div className="p-3 bg-indigo-500/20 rounded-xl group-hover/item:scale-110 transition-transform">
                  <Phone className="h-6 w-6 text-indigo-400" />
                </div>
                <div>
                  <h4 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'} uppercase tracking-tight`}>Call Support</h4>
                  <p className={`text-xs ${theme.muted.text} mt-1 font-medium`}>+91 XXX XXX XXXX</p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Note */}
          <div className="text-center pt-6">
            <div className={`inline-flex items-center text-[10px] font-black uppercase tracking-[0.2em] ${theme.muted.text} opacity-60`}>
              <Shield className="w-4 h-4 mr-2 text-emerald-500" />
              <span>Secure Onboarding Portal • Techoptima HRMS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeOnboardingForm;
