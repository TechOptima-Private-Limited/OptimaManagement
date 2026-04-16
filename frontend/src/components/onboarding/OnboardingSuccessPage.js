import React from 'react';
import { 
  CheckCircle,
  Building,
  Shield,
  Clock,
  Star,
  Sparkles,
  CheckSquare,
  FileText,
  Users,
  Calendar
} from 'lucide-react';

const OnboardingSuccessPage = () => {
  return (
    <div className="min-h-screen bg-[#070B14] flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white/5 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
          
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 px-8 py-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-black opacity-10"></div>
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/5/10 rounded-full -translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5/10 rounded-full translate-x-24 translate-y-24"></div>
            
            <div className="relative">
              {/* Success Icon with Animation */}
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-white/5/20 rounded-full backdrop-blur-sm animate-pulse">
                  <CheckCircle className="h-16 w-16 text-white animate-bounce" />
                </div>
              </div>
              
              {/* Company Header */}
              <div className="flex items-center justify-center space-x-3 mb-4">
                <Building className="h-10 w-10 text-white" />
                <Sparkles className="h-8 w-8 text-yellow-300 animate-pulse" />
              </div>
              
              <h1 className="text-3xl font-bold text-white mb-2">
                Techoptima Pvt Ltd
              </h1>
              
              <h2 className="text-xl text-green-100 mb-4">
                Onboarding Information Submitted Successfully!
              </h2>
              
              <p className="text-lg text-green-100 leading-relaxed">
                Thank you for completing your onboarding information. Your details have been received and will be reviewed by our HR team.
              </p>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-8 lg:p-12 space-y-8">
            
            {/* What Happens Next Section */}
            <div className="bg-indigo-500/10 rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Clock className="h-6 w-6 mr-2" />
                What Happens Next?
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">HR Review</h4>
                    <p className="text-slate-400 text-sm">
                      Our HR team will review your submitted information and documents within 1-2 business days.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Employment Details</h4>
                    <p className="text-slate-400 text-sm">
                      HR will complete your employment details including department, position, and other job-specific information.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">IT Setup & Assets</h4>
                    <p className="text-slate-400 text-sm">
                      Our IT team will be notified to prepare your laptop, access cards, and other required assets.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">4</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">Welcome Communication</h4>
                    <p className="text-slate-400 text-sm">
                      You'll receive a welcome email with further instructions and your joining date confirmation.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submitted Information Summary */}
            <div className="bg-emerald-500/10 rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <CheckSquare className="h-6 w-6 mr-2" />
                Successfully Submitted
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                  <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Personal Information</h4>
                    <p className="text-slate-400 text-sm">Name, contact details, and addresses</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                  <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Required Documents</h4>
                    <p className="text-slate-400 text-sm">All 6 required documents uploaded</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-emerald-500/20 rounded-lg">
                <div className="flex items-center text-emerald-400">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span className="font-medium">Submission Complete - No further action required from you</span>
                </div>
              </div>
            </div>

            {/* Important Notes */}
            <div className="bg-amber-500/10 rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Star className="h-6 w-6 mr-2" />
                Important Notes
              </h3>
              
              <div className="space-y-3 text-slate-400">
                <div className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                  <p className="text-sm">
                    You will receive a confirmation email shortly with your submission details
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                  <p className="text-sm">
                    Our HR team will contact you within 1-2 business days regarding next steps
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                  <p className="text-sm">
                    Please keep your phone and email accessible for any follow-up communication
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                  <p className="text-sm">
                    If you have any urgent questions, contact HR at hr@techoptima.com
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Building className="h-6 w-6 mr-2" />
                Contact Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-white">HR Department</h4>
                  <p className="text-slate-400 text-sm">
                    <strong>Email:</strong> hr@techoptima.com
                  </p>
                  <p className="text-slate-400 text-sm">
                    <strong>Phone:</strong> +91 XXX XXX XXXX
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-white">Office Hours</h4>
                  <p className="text-slate-400 text-sm">
                    Monday - Friday: 9:00 AM - 6:00 PM
                  </p>
                  <p className="text-slate-400 text-sm">
                    Saturday: 9:00 AM - 1:00 PM
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline Expectations */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Calendar className="h-6 w-6 mr-2" />
                Expected Timeline
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="font-medium text-white">Document Review</span>
                  <span className="text-sm text-slate-400 bg-white/5/10 px-3 py-1 rounded-full">1-2 days</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="font-medium text-white">Employment Setup</span>
                  <span className="text-sm text-slate-400 bg-white/5/10 px-3 py-1 rounded-full">2-3 days</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="font-medium text-white">Asset Preparation</span>
                  <span className="text-sm text-slate-400 bg-white/5/10 px-3 py-1 rounded-full">3-5 days</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="font-medium text-white">Joining Confirmation</span>
                  <span className="text-sm text-slate-400 bg-white/5/10 px-3 py-1 rounded-full">5-7 days</span>
                </div>
              </div>
            </div>

            {/* Security Note */}
            <div className="text-center pt-6 border-t border-white/10">
              <div className="inline-flex items-center text-sm text-slate-500">
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

export default OnboardingSuccessPage;
