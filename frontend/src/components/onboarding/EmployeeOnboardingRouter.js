import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Sparkles,
  CheckCircle,
  CheckSquare,
  Users
} from 'lucide-react';

// Main Router Component
const EmployeeOnboardingRouter = () => {
  const { encodedData } = useParams();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('form'); // 'form', 'success', 'invalid'
  const [linkValidation, setLinkValidation] = useState(null);

  useEffect(() => {
    if (encodedData) {
      validateLink(encodedData);
    }
  }, [encodedData]);

  const validateLink = async (encoded) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/onboarding/validate-link/${encoded}/`);
      if (response.ok) {
        const data = await response.json();
        setLinkValidation(data);
        if (data.status !== 'valid') {
          setCurrentView('invalid');
        }
      } else {
        setCurrentView('invalid');
      }
    } catch (error) {
      console.error('Error validating link:', error);
      setCurrentView('invalid');
    }
  };

  const handleNavigate = (view) => {
    setCurrentView(view);
    if (view === 'success') {
      navigate('/onboarding/success');
    }
  };

  switch (currentView) {
    case 'success':
      return <OnboardingSuccessPage />;
    case 'invalid':
      return <LinkInvalidComponent validation={linkValidation} />;
    default:
      return <EmployeeOnboardingForm encodedData={encodedData} onNavigate={handleNavigate} validation={linkValidation} />;
  }
};

// Employee Onboarding Form Component
const EmployeeOnboardingForm = ({ encodedData, onNavigate, validation }) => {
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

  const documentTypes = [
    { key: 'aadhar_pan_file', label: 'Aadhar & PAN Card', icon: '🆔', required: true },
    { key: 'payslips_file', label: 'Last 6 Months Payslips', icon: '💰', required: true },
    { key: 'educational_certificates_file', label: 'Educational Certificates', icon: '🎓', required: true },
    { key: 'previous_offer_letter_file', label: 'Previous Offer Letter', icon: '📄', required: true },
    { key: 'relieving_experience_letters_file', label: 'Relieving & Experience Letters', icon: '📜', required: true },
    { key: 'appraisal_hike_letters_file', label: 'Appraisal/Hike Letters', icon: '📈', required: true },
  ];

  useEffect(() => {
    // Pre-fill form if employee data exists
    if (validation?.employee) {
      const employee = validation.employee;
      setFormData(prev => ({
        ...prev,
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        email: employee.email || '',
        phone_number: employee.phone_number || '',
        current_address: employee.current_address || '',
        permanent_address: employee.permanent_address || '',
      }));
    }
  }, [validation]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrors({ ...errors, [name]: 'File size should be less than 10MB' });
        e.target.value = '';
        return;
      }
      
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setErrors({ ...errors, [name]: 'Please upload PDF, JPG, or PNG files only' });
        e.target.value = '';
        return;
      }
      
      setFormData({ ...formData, [name]: file });
      if (errors[name]) {
        setErrors({ ...errors, [name]: null });
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    const requiredFields = ['first_name', 'last_name', 'email', 'phone_number', 'current_address', 'permanent_address'];
    requiredFields.forEach(field => {
      if (!formData[field]?.trim()) {
        newErrors[field] = 'This field is required';
      }
    });

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

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
      
      Object.keys(formData).forEach(key => {
        if (typeof formData[key] === 'string') {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      documentTypes.forEach(doc => {
        if (formData[doc.key]) {
          formDataToSend.append(doc.key, formData[doc.key]);
        }
      });

      const submitUrl = encodedData 
        ? `http://127.0.0.1:8000/api/onboarding/submit/${encodedData}/`
        : 'http://127.0.0.1:8000/api/onboarding/submit/';

      const response = await fetch(submitUrl, {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        onNavigate('success');
      } else {
        const errorData = await response.json();
        if (errorData.error) {
          alert(errorData.error);
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
    if (!validation?.link_info?.expires_at) return null;
    
    const now = new Date();
    const expires = new Date(validation.link_info.expires_at);
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

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-700">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        
        <div className="absolute top-0 left-0 w-64 h-64 bg-slate-900/50/5 rounded-full -translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-slate-900/50/5 rounded-full translate-x-48 translate-y-48"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="p-3 bg-slate-900/50/20 rounded-xl backdrop-blur-sm">
                <Building className="h-12 w-12 text-white" />
              </div>
              <Sparkles className="h-8 w-8 text-yellow-300 animate-pulse" />
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3">
              Techoptima Pvt Ltd
            </h1>
            <h2 className="text-2xl text-blue-200 mb-6">
              Employee Onboarding Portal
            </h2>
            <p className="text-xl text-blue-200 max-w-3xl mx-auto leading-relaxed">
              Welcome! Please fill out your personal information and upload required documents below. 
              HR will complete your employment details once your submission is reviewed.
            </p>
            
            {remainingTime && (
              <div className="mt-8 inline-flex items-center px-4 py-2 bg-slate-900/50/20 rounded-xl backdrop-blur-sm">
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
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden">
          <div className="p-8 lg:p-12 space-y-8">
            
            {/* Personal Information Section */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 pb-4 border-b border-slate-700">
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
                    className={`w-full px-4 py-3 border-2 rounded-xl bg-slate-900/50 backdrop-blur-sm focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none ${
                      errors.first_name ? 'border-red-500' : 'border-slate-700/50 focus:border-indigo-500'
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
                    className={`w-full px-4 py-3 border-2 rounded-xl bg-slate-900/50 backdrop-blur-sm focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none ${
                      errors.last_name ? 'border-red-500' : 'border-slate-700/50 focus:border-indigo-500'
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
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl bg-slate-900/50 backdrop-blur-sm focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none ${
                        errors.email ? 'border-red-500' : 'border-slate-700/50 focus:border-indigo-500'
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
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl bg-slate-900/50 backdrop-blur-sm focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none ${
                        errors.phone_number ? 'border-red-500' : 'border-slate-700/50 focus:border-indigo-500'
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
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <textarea
                      name="current_address"
                      value={formData.current_address}
                      onChange={handleInputChange}
                      rows={3}
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl bg-slate-900/50 backdrop-blur-sm focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none ${
                        errors.current_address ? 'border-red-500' : 'border-slate-700/50 focus:border-indigo-500'
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
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <textarea
                      name="permanent_address"
                      value={formData.permanent_address}
                      onChange={handleInputChange}
                      rows={3}
                      className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl bg-slate-900/50 backdrop-blur-sm focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none ${
                        errors.permanent_address ? 'border-red-500' : 'border-slate-700/50 focus:border-indigo-500'
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
              <div className="flex items-center space-x-3 pb-4 border-b border-slate-700">
                <div className="p-2 bg-purple-600 rounded-lg">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">Document Upload</h3>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-slate-700/50">
                <div className="flex items-start space-x-3 mb-4">
                  <AlertCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
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
                        className={`w-full px-4 py-3 border-2 rounded-xl bg-slate-900/50 backdrop-blur-sm focus:ring-4 focus:ring-indigo-100 transition-all duration-200 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 ${
                          errors[doc.key] ? 'border-red-500' : 'border-slate-700/50 focus:border-indigo-500'
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
                className={`inline-flex items-center px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl transition-all duration-300 transform ${
                  loading
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

// Success Page Component
const OnboardingSuccessPage = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden">
          
          <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 px-8 py-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-black opacity-10"></div>
            <div className="absolute top-0 left-0 w-32 h-32 bg-slate-800/20 rounded-full -translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-slate-800/20 rounded-full translate-x-24 translate-y-24"></div>
            
            <div className="relative">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-slate-900/50/20 rounded-full backdrop-blur-sm animate-pulse">
                  <CheckCircle className="h-16 w-16 text-white animate-bounce" />
                </div>
              </div>
              
              <div className="flex items-center justify-center space-x-3 mb-4">
                <Building className="h-10 w-10 text-white" />
                <Sparkles className="h-8 w-8 text-yellow-300 animate-pulse" />
              </div>
              
              <h1 className="text-3xl font-bold text-white mb-2">
                Techoptima Pvt Ltd
              </h1>
              
              <h2 className="text-xl text-green-400 mb-4">
                Onboarding Information Submitted Successfully!
              </h2>
              
              <p className="text-lg text-green-400 leading-relaxed">
                Thank you for completing your onboarding information. Your details have been received and will be reviewed by our HR team.
              </p>
            </div>
          </div>

          <div className="p-8 lg:p-12 space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-slate-700/50">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Clock className="h-6 w-6 mr-2" />
                What Happens Next?
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">HR Review</h4>
                    <p className="text-slate-400 text-sm">
                      Our HR team will review your information within 1-2 business days.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Employment Setup</h4>
                    <p className="text-slate-400 text-sm">
                      HR will complete your employment details and department assignment.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Asset Preparation</h4>
                    <p className="text-slate-400 text-sm">
                      IT team will prepare your laptop and access credentials.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center pt-6 border-t border-slate-700/50">
              <div className="inline-flex items-center text-sm text-slate-400">
                <Shield className="w-4 h-4 mr-2" />
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
const LinkInvalidComponent = ({ validation }) => {
  const getStatusInfo = () => {
    switch (validation?.status) {
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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-700/50 p-8 lg:p-12 text-center">
          <div className="mb-6">
            {statusInfo.icon}
          </div>

          <div className="mb-8">
            <div className="flex justify-center items-center space-x-3 mb-4">
              <Building className="h-12 w-12 text-indigo-600" />
              <Star className="h-8 w-8 text-yellow-400" />
            </div>
            <h1 className="text-3xl font-bold text-indigo-600 mb-2">Techoptima Pvt Ltd</h1>
          </div>

          <h2 className={`text-2xl font-bold mb-4 ${
            statusInfo.color === 'green' ? 'text-green-600' : 'text-red-600'
          }`}>
            {statusInfo.title}
          </h2>
          
          <p className="text-lg text-slate-400 mb-6">
            {statusInfo.subtitle}
          </p>

          {validation?.employee && (
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 mb-6">
              <h3 className="font-bold text-gray-800 mb-3">Employee Information</h3>
              <div className="space-y-2 text-sm text-slate-400">
                <div><strong>Name:</strong> {validation.employee.first_name} {validation.employee.last_name}</div>
                <div><strong>Email:</strong> {validation.employee.email}</div>
                {validation.employee.submitted_at && (
                  <div><strong>Submitted:</strong> {new Date(validation.employee.submitted_at).toLocaleString()}</div>
                )}
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-slate-700">
            <h3 className="font-bold text-indigo-800 mb-3 flex items-center justify-center">
              <Phone className="h-5 w-5 mr-2" />
              HR Department Contact
            </h3>
            <div className="space-y-2 text-indigo-700">
              <p><strong>Email:</strong> hr@techoptima.com</p>
              <p><strong>Phone:</strong> +91 XXX XXX XXXX</p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <div className="inline-flex items-center text-sm text-slate-400">
              <Shield className="w-4 h-4 mr-2" />
              <span>Contact HR for a new onboarding link</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeOnboardingRouter;
