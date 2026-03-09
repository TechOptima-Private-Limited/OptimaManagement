import React from 'react';
import {
  CheckCircleIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  ClockIcon,
  StarIcon,
  SparklesIcon,
  CheckBadgeIcon,
  DocumentTextIcon,
  UsersIcon,
  CalendarIcon,
  ArrowRightIcon,
  EnvelopeIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const OnboardingSuccessPage = () => {
  return (
    <div className="min-h-screen bg-[#070B14] overflow-hidden relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">

      {/* ── Ambient glow orbs ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-3xl w-full relative z-10">
        <div className="bg-slate-900/60 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden">

          {/* Header Section */}
          <div className="bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-transparent px-8 py-14 text-center border-b border-white/5 relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <SparklesIcon className="h-24 w-24 text-white" />
            </div>

            <div className="relative">
              {/* Animated Success Mark */}
              <div className="mb-8 relative inline-block">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-pulse" />
                <div className="relative flex items-center justify-center w-24 h-24 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                  <CheckCircleIcon className="h-14 w-14 text-emerald-400" />
                </div>
              </div>

              <div className="flex items-center justify-center space-x-3 mb-4">
                <BuildingOfficeIcon className="h-6 w-6 text-emerald-400/70" />
                <span className="text-sm font-bold text-emerald-400/80 uppercase tracking-[0.2em]">Techoptima Pvt Ltd</span>
              </div>

              <h1 className="text-4xl font-black text-white tracking-tight mb-4">
                Submission Received!
              </h1>

              <p className="text-lg text-emerald-100/60 max-w-lg mx-auto leading-relaxed">
                Thank you for completing your onboarding profile. Our team will now review your records and prepare your workstation.
              </p>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-8 lg:p-12 space-y-10">

            {/* Steps Timeline */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center">
                <ClockIcon className="h-4 w-4 mr-2 text-indigo-400" />
                What Happens Next?
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    step: '01',
                    title: 'HR Review',
                    desc: 'Our HR team will verify your submitted documents within 48 hours.',
                    icon: ShieldCheckIcon,
                    color: 'indigo'
                  },
                  {
                    step: '02',
                    title: 'System Setup',
                    desc: 'Your profile, department access, and mail will be configured.',
                    icon: UsersIcon,
                    color: 'violet'
                  },
                  {
                    step: '03',
                    title: 'Asset Prep',
                    desc: 'IT will prepare your laptop and hardware resources.',
                    icon: SparklesIcon,
                    color: 'emerald'
                  },
                  {
                    step: '04',
                    title: 'Welcome Kit',
                    desc: "You'll receive joining instructions and portal access via email.",
                    icon: EnvelopeIcon,
                    color: 'blue'
                  }
                ].map((item, idx) => (
                  <div key={idx} className="group relative p-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/[0.08] hover:border-white/10 transition-all duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 rounded-xl bg-${item.color}-500/20 text-${item.color}-400 group-hover:scale-110 transition-transform`}>
                        <item.icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-black text-gray-600 group-hover:text-gray-400 transition-colors tracking-tighter">{item.step}</span>
                    </div>
                    <h4 className="font-bold text-white mb-1">{item.title}</h4>
                    <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Summary Box */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center">
                  <CheckBadgeIcon className="h-4 w-4 mr-2 text-emerald-400" />
                  Submission Summary
                </h3>
                <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <UsersIcon className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Profile Data</p>
                      <p className="text-xs text-emerald-400/60 font-medium">Personal & Contact Info</p>
                    </div>
                    <CheckCircleIcon className="h-5 w-5 text-emerald-400 ml-auto" />
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <DocumentTextIcon className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Documents</p>
                      <p className="text-xs text-emerald-400/60 font-medium">All 6 files uploaded</p>
                    </div>
                    <CheckCircleIcon className="h-5 w-5 text-emerald-400 ml-auto" />
                  </div>
                </div>
              </div>

              {/* Stats/Timeline Box */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-2 text-indigo-400" />
                  Standard Timeline
                </h3>
                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3">
                  {[
                    { label: 'Review', time: '1-2 Days' },
                    { label: 'Setup', time: '2-3 Days' },
                    { label: 'Joining', time: '5-7 Days' }
                  ].map((t, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="text-gray-400 font-medium">{t.label}</span>
                      <span className="text-indigo-400 font-bold bg-indigo-500/10 px-3 py-1 rounded-full text-xs">{t.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer / Support */}
            <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center space-x-4">
                <div className="text-left text-xs space-y-1">
                  <p className="text-gray-400 flex items-center">
                    <EnvelopeIcon className="h-3 w-3 mr-1" /> hr@techoptima.com
                  </p>
                  <p className="text-gray-400 flex items-center">
                    <PhoneIcon className="h-3 w-3 mr-1" /> +91 XXX XXX XXXX
                  </p>
                </div>
              </div>

              <div className="flex space-x-4">
                <Link
                  to="/login"
                  className="inline-flex items-center px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-gray-300 transition-all hover:text-white"
                >
                  Go to Login
                </Link>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-700 hover:shadow-lg hover:shadow-indigo-500/20 rounded-xl text-sm font-bold text-white transition-all transform hover:scale-105"
                >
                  Dashboard
                  <ArrowRightIcon className="h-4 w-4 ml-2" />
                </Link>
              </div>
            </div>

            {/* Security Bottom Note */}
            <div className="flex items-center justify-center space-x-2 text-[10px] font-black uppercase tracking-widest text-gray-600 mt-4">
              <ShieldCheckIcon className="h-3 w-3" />
              <span>Secure End-to-End Encryption Enabled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingSuccessPage;