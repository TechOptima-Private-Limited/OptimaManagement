import { useState } from 'react';
import { toast } from 'react-toastify';
import { workFromHomeAPI } from '../../services/api'; // Add this import

const WorkFromHomePopup = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }

    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    }

    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (start < today) {
        newErrors.start_date = 'Start date cannot be in the past';
      }

      if (end < start) {
        newErrors.end_date = 'End date cannot be before start date';
      }

      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 30);
      if (start > maxDate) {
        newErrors.start_date = 'Cannot apply more than 30 days in advance';
      }

      // Limit range to 30 days
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 30) {
        newErrors.end_date = 'WFH request cannot exceed 30 days';
      }
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required';
    } else if (formData.reason.trim().length < 10) {
      newErrors.reason = 'Reason must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  // ... in the component

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Use the workFromHomeAPI service - it returns response.data directly
      await workFromHomeAPI.applyWFH(formData);

      // Since your API service likely returns response.data directly
      toast.success('Work from home request submitted successfully! HR has been notified.');
      setFormData({ start_date: '', end_date: '', reason: '' });
      setErrors({});
      onSuccess && onSuccess();
      onClose();

    } catch (error) {
      console.error('WFH application error:', error);

      // Handle different types of errors
      if (error.response) {
        // The request was made and the server responded with a status code
        const errorData = error.response.data;

        if (errorData.error) {
          toast.error(errorData.error);
        } else if (typeof errorData === 'object') {
          // Handle field-specific errors
          const newErrors = {};
          Object.keys(errorData).forEach(field => {
            newErrors[field] = Array.isArray(errorData[field]) ? errorData[field][0] : errorData[field];
          });
          setErrors(newErrors);

          // Show a general error message
          const firstErrorMessage = Object.values(newErrors)[0];
          toast.error(firstErrorMessage || 'Please fix the form errors');
        } else {
          toast.error('Failed to submit work from home request');
        }
      } else {
        // Network error or other issues
        toast.error('Failed to submit work from home request. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Get today's date for min attribute
  const today = new Date().toISOString().split('T')[0];

  // Get max date (30 days from today)
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-900/75 backdrop-blur-sm"
          onClick={onClose}
        ></div>

        <div className="inline-block align-bottom bg-[#0A0F1A] border border-black/10 dark:border-white/10 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-slate-900/40 px-6 pt-6 pb-4">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Apply for Work From Home</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Submit your request to work remotely</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Start Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    min={today}
                    className={`w-full px-3 py-2 bg-white/5/5 text-white backdrop-blur-sm border ${errors.start_date ? 'border-red-500' : 'border-black/20 dark:border-white/20'
                      } rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 [color-scheme:dark]`}
                    required
                  />
                  {errors.start_date && (
                    <p className="text-red-400 text-xs mt-1">{errors.start_date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    End Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    min={formData.start_date || today}
                    className={`w-full px-3 py-2 bg-white/5/5 text-white backdrop-blur-sm border ${errors.end_date ? 'border-red-500' : 'border-black/20 dark:border-white/20'
                      } rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 [color-scheme:dark]`}
                    required
                  />
                  {errors.end_date && (
                    <p className="text-red-400 text-xs mt-1">{errors.end_date}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Reason <span className="text-red-400">*</span>
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  rows="4"
                  className={`w-full px-3 py-2 bg-white/5/5 text-white backdrop-blur-sm border ${errors.reason ? 'border-red-500' : 'border-black/20 dark:border-white/20'
                    } rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-500 resize-none`}
                  placeholder="Please provide a reason for working from home (e.g., medical appointment, family emergency, etc.)"
                  required
                />
                {errors.reason && (
                  <p className="text-red-400 text-xs mt-1">{errors.reason}</p>
                )}
                <p className="text-xs text-slate-400 mt-1">
                  Minimum 10 characters required
                </p>
              </div>

              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-indigo-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-gray-300">
                    <p className="font-medium text-white">Important Notes:</p>
                    <ul className="mt-2 list-disc list-inside text-xs space-y-1 text-gray-600 dark:text-gray-400">
                      <li>Your request will be sent to HR for approval</li>
                      <li>You'll receive an email notification once approved/rejected</li>
                      <li>Only approved requests allow work from home check-in</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#05080f] px-6 py-4 border-t border-white/10 sm:flex sm:flex-row-reverse rounded-b-2xl">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-base font-medium text-white hover:shadow-lg hover:shadow-indigo-500/25 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto sm:text-sm transform hover:scale-105 transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </div>
              ) : (
                'Submit Request'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-xl border border-black/10 dark:border-white/10 shadow-sm px-6 py-3 bg-black/10 dark:bg-white/5/10 text-base font-medium text-white hover:bg-black/20 dark:bg-white/5/20 focus:outline-none focus:ring-4 focus:ring-white/20 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transform hover:scale-105 transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkFromHomePopup;
