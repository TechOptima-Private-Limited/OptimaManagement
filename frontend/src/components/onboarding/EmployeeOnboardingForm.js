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

const EmployeeOnboardingForm = ({ encodedData }) => {
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
    <div className="min-h-screen bg-[#070B14] dark:bg-slate-900">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-700">
        <div className="absolute inset-0 bg-black opacity-10"></div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-[#070B14] dark:bg-slate-900/50/5 rounded-full -translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#070B14] dark:bg-slate-900/50/5 rounded-full translate-x-48 translate-y-48"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="p-3 bg-[#070B14] dark:bg-slate-900/50/20 rounded-xl backdrop-blur-sm">
                <Building className="h-12 w-12 text-white" />
              </div>
              <Sparkles className="h-8 w-8 text-yellow-300 animate-pulse" />
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3">
              Techoptima Pvt Ltd
            </h1>
            <h2 className="text-2xl text-blue-100 mb-6">
              Employee Onboarding Portal
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Welcome! Please fill out your personal information and upload required documents below.
              HR will complete your employment details once your submission is reviewed.
            </p>

            {remainingTime && (
              <div className="mt-8 inline-flex items-center px-4 py-2 bg-[#070B14] dark:bg-slate-900/50/20 rounded-xl backdrop-blur-sm">
                <Clock className="w-5 h-5 text-white mr-2" />
                <span className="text-white font-medium">
                  Link expires in: {remainingTime.text}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white/5/5 dark:bg-slate-800/50 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden">
          <div className="p-8 lg:p-12 space-y-8">

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
                  <label className="block text-sm font-semibold text-slate-400 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-xl bg-white/5/5 backdrop-blur-sm focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 outline-none ${errors.first_name ? 'border-red-500' : 'border-white/10 focus:border-indigo-500'
                      }`}
                    placeholder="Enter your first name"
                  />
                  {errors.first_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-xl bg-white/5/5 backdrop-blur-sm focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 outline-none ${errors.last_name ? 'border-red-500' : 'border-white/10 focus:border-indigo-500'
                      }`}
                    placeholder="Enter your last name"
                  />
                  {errors.last_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-4 py-3 border rounded-xl bg-white/5/5 backdrop-blur-sm focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 outline-none ${errors.email ? 'border-red-500' : 'border-white/10 focus:border-indigo-500'
                        }`}
                      placeholder="your.email@company.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <input
                      type="tel"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-4 py-3 border rounded-xl bg-white/5/5 backdrop-blur-sm focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 outline-none ${errors.phone_number ? 'border-red-500' : 'border-white/10 focus:border-indigo-500'
                        }`}
                      placeholder="+91 9876543210"
                    />
                  </div>
                  {errors.phone_number && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone_number}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2">
                    Current Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <textarea
                      name="current_address"
                      value={formData.current_address}
                      onChange={handleInputChange}
                      rows={3}
                      className={`w-full pl-12 pr-4 py-3 border rounded-xl bg-white/5/5 backdrop-blur-sm focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 outline-none ${errors.current_address ? 'border-red-500' : 'border-white/10 focus:border-indigo-500'
                        }`}
                      placeholder="Enter your current address including city, state, PIN code"
                    />
                  </div>
                  {errors.current_address && (
                    <p className="text-red-500 text-sm mt-1">{errors.current_address}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2">
                    Permanent Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-600 dark:text-gray-400" />
                    <textarea
                      name="permanent_address"
                      value={formData.permanent_address}
                      onChange={handleInputChange}
                      rows={3}
                      className={`w-full pl-12 pr-4 py-3 border rounded-xl bg-white/5/5 backdrop-blur-sm focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 outline-none ${errors.permanent_address ? 'border-red-500' : 'border-white/10 focus:border-indigo-500'
                        }`}
                      placeholder="Enter your permanent address including city, state, PIN code"
                    />
                  </div>
                  {errors.permanent_address && (
                    <p className="text-red-500 text-sm mt-1">{errors.permanent_address}</p>
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

              <div className="bg-indigo-500/10 rounded-2xl p-6 border border-white/10">
                <div className="flex items-start space-x-3 mb-4">
                  <AlertCircle className="h-6 w-6 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-white mb-2">Important Guidelines</h4>
                    <ul className="text-sm text-slate-400 space-y-1">
                      <li>• Accepted formats: PDF, JPG, PNG</li>
                      <li>• Maximum file size: 10MB per document</li>
                      <li>• All documents are required for processing</li>
                      <li>• Ensure documents are clear and readable</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {documentTypes.map((doc) => (
                  <div key={doc.key} className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-400">
                      <span className="text-2xl mr-2">{doc.icon}</span>
                      {doc.label}
                      {doc.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        name={doc.key}
                        onChange={handleFileChange}
                        accept=".pdf,.jpg,.jpeg,.png"
                        className={`w-full px-4 py-3 border rounded-xl bg-white/5/5 backdrop-blur-sm focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20 ${errors[doc.key] ? 'border-red-500' : 'border-white/10 focus:border-indigo-500'
                          }`}
                      />
                      {formData[doc.key] && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Check className="h-5 w-5 text-green-500" />
                        </div>
                      )}
                    </div>
                    {errors[doc.key] && (
                      <p className="text-red-500 text-sm">{errors[doc.key]}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="text-center space-y-4">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`inline-flex items-center px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl transition-all duration-300 transform ${loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:scale-105'
                  } text-white`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="w-6 h-6 mr-3" />
                    Submit Onboarding Information
                  </>
                )}
              </button>

              <div className="flex items-center justify-center space-x-2 text-sm text-slate-400">
                <Shield className="w-4 h-4" />
                <span>Your information is secure and will only be used for employment purposes</span>
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
  const getStatusInfo = () => {
    switch (status) {
      case 'expired':
        return {
          icon: <Clock className="h-20 w-20 text-red-500" />,
          title: 'Onboarding Link Expired',
          subtitle: 'This link has expired and is no longer valid',
          color: 'red'
        };
      case 'already_submitted':
        return {
          icon: <CheckCircle className="h-20 w-20 text-green-500" />,
          title: 'Onboarding Already Completed',
          subtitle: 'You have already completed your onboarding',
          color: 'green'
        };
      default:
        return {
          icon: <AlertCircle className="h-20 w-20 text-red-500" />,
          title: 'Invalid Onboarding Link',
          subtitle: 'This link is not valid or has been deactivated',
          color: 'red'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="min-h-screen bg-[#070B14] dark:bg-slate-900 flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white/5/5 dark:bg-slate-800/50 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-700/50 p-8 lg:p-12 text-center">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            {statusInfo.icon}
          </div>

          {/* Company Header */}
          <div className="mb-8">
            <div className="flex justify-center items-center space-x-3 mb-4">
              <Building className="h-12 w-12 text-indigo-600" />
              <Star className="h-8 w-8 text-yellow-400" />
            </div>
            <h1 className="text-3xl font-bold text-indigo-600 mb-2">Techoptima Pvt Ltd</h1>
          </div>

          {/* Status Message */}
          <h2 className={`text-2xl font-bold mb-4 ${statusInfo.color === 'green' ? 'text-green-600' : 'text-red-600'
            }`}>
            {statusInfo.title}
          </h2>

          <p className="text-lg text-slate-400 mb-6">
            {statusInfo.subtitle}
          </p>

          {/* Employee Info */}
          {employee && (
            <div className="bg-white/5/5 rounded-2xl p-6 mb-6">
              <h3 className="font-bold text-white mb-3">Employee Information</h3>
              <div className="space-y-2 text-sm text-slate-400">
                <div><strong>Name:</strong> {employee.first_name} {employee.last_name}</div>
                <div><strong>Email:</strong> {employee.email}</div>
                {employee.submitted_at && (
                  <div><strong>Submitted:</strong> {new Date(employee.submitted_at).toLocaleString()}</div>
                )}
              </div>
            </div>
          )}

          {/* What to do next */}
          <div className="bg-indigo-500/10 rounded-2xl p-6 mb-6">
            <h3 className="font-bold text-white mb-4">What should you do?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="flex items-start space-x-3">
                <Mail className="h-6 w-6 text-indigo-400 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-white">Contact HR via Email</h4>
                  <p className="text-sm text-slate-300">Request a new onboarding link</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Phone className="h-6 w-6 text-indigo-400 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-white">Call HR Department</h4>
                  <p className="text-sm text-slate-300">Get immediate assistance</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white/5/5 rounded-2xl p-6 border border-white/10">
            <h3 className="font-bold text-white mb-3 flex items-center justify-center">
              <Phone className="h-5 w-5 mr-2" />
              HR Department Contact
            </h3>
            <div className="space-y-2 text-slate-300">
              <p><strong>Email:</strong> hr@techoptima.com</p>
              <p><strong>Phone:</strong> +91 XXX XXX XXXX</p>
              <p className="text-sm text-slate-400">Office Hours: Monday - Friday, 9:00 AM - 6:00 PM</p>
            </div>
          </div>

          {/* Security Note */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center text-sm text-slate-400">
              <Shield className="w-4 h-4 mr-2" />
              <span>Onboarding links expire for security reasons. HR can generate a new link for you.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeOnboardingForm;
