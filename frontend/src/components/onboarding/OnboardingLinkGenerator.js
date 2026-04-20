import React, { useState } from 'react';
import {
  Link2,
  Copy,
  CheckCircle,
  Calendar,
  Clock,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Star,
  Sparkles
} from 'lucide-react';

const OnboardingLinkGenerator = () => {
  const [generatedLink, setGeneratedLink] = useState('');
  const [linkInfo, setLinkInfo] = useState(null);
  const [copyStatus, setCopyStatus] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const toBase64Url = (input) => {
    const b64 = btoa(input);
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  };

  const generateNewLink = () => {
    setIsGenerating(true);

    // Simulate brief loading for better UX
    setTimeout(() => {
      const timestamp = Math.floor(Date.now() / 1000);
      const data = `GENERIC_${timestamp}`;
      const encoded = toBase64Url(data);

      // Get the current origin or use a default
      const baseUrl = window.location.origin || 'http://localhost:3002';
      const link = `${baseUrl}/onboarding/form/${encoded}`;

      const createdDate = new Date(timestamp * 1000);
      const expiryDate = new Date(createdDate.getTime() + (7 * 24 * 60 * 60 * 1000));

      setGeneratedLink(link);
      setLinkInfo({
        created: createdDate,
        expires: expiryDate,
        timestamp: timestamp,
        encoded: encoded
      });

      setCopyStatus('');
      setIsGenerating(false);
    }, 800);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopyStatus('success');
      setTimeout(() => setCopyStatus(''), 3000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = generatedLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.body.removeChild(textArea);

      try {
        document.execCommand('copy');
        setCopyStatus('success');
        setTimeout(() => setCopyStatus(''), 3000);
      } catch (fallbackErr) {
        setCopyStatus('error');
        setTimeout(() => setCopyStatus(''), 3000);
      }
    }
  };

  const getRemainingTime = () => {
    if (!linkInfo) return null;

    const now = new Date();
    const remaining = linkInfo.expires - now;
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    if (remaining <= 0) {
      return { text: 'Expired', color: 'text-red-600', bgColor: 'bg-red-100' };
    } else if (days > 1) {
      return { text: `${days} days, ${hours} hours`, color: 'text-green-600', bgColor: 'bg-green-100' };
    } else if (days === 1) {
      return { text: `1 day, ${hours} hours`, color: 'text-amber-600', bgColor: 'bg-amber-100' };
    } else {
      return { text: `${hours} hours, ${minutes} minutes`, color: 'text-red-600', bgColor: 'bg-red-100' };
    }
  };

  const remainingTime = getRemainingTime();

  return (
    <div className="min-h-screen bg-[#070B14] dark:bg-slate-900">
      {/* Enhanced Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-700">
        <div className="absolute inset-0 bg-black opacity-10"></div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full translate-x-48 translate-y-48 blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20 shadow-xl">
                <Link2 className="h-10 w-10 text-white" />
              </div>
              <Sparkles className="h-8 w-8 text-yellow-300 animate-pulse" />
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3">
              Onboarding Link Generator
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Generate secure, timestamped onboarding links for employees to complete their registration process
            </p>

            <div className="flex items-center justify-center space-x-6 text-blue-100">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span className="text-sm font-medium">7-Day Validity</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-300" />
                <span className="text-sm font-medium">Secure & Unique</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Generator Card */}
        <div className="bg-white/5 dark:bg-slate-800/50 backdrop-blur-sm rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden">
          <div className="p-8 lg:p-12">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl mb-6 shadow-lg">
                <Link2 className="w-10 h-10 text-white" />
              </div>

              <h2 className="text-3xl font-bold text-white mb-4">Generate Onboarding Link</h2>
              <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Create a secure onboarding link that employees can use to submit their information.
                Each link is valid for 7 days from the time of generation.
              </p>
            </div>

            {/* Generate Button */}
            <div className="text-center mb-8">
              <button
                onClick={generateNewLink}
                disabled={isGenerating}
                className={`inline-flex items-center px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl transition-all duration-300 transform ${isGenerating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:scale-105 hover:shadow-indigo-500/25'
                  } text-white`}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-6 h-6 mr-3 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6 mr-3" />
                    Generate New Link
                  </>
                )}
              </button>
            </div>

            {/* Generated Link Display */}
            {generatedLink && linkInfo && (
              <div className="space-y-6 animate-fadeIn">
                {/* Success Header */}
                <div className="text-center p-6 bg-emerald-500/10 rounded-2xl border-2 border-emerald-500/20">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl mb-4 shadow-lg">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-emerald-400 mb-2">
                    Link Generated Successfully!
                  </h3>
                  <p className="text-emerald-300">
                    Your onboarding link is ready to be shared with employees
                  </p>
                </div>

                {/* Link Information Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/5 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
                    <div className="flex items-center space-x-3 mb-4">
                      <Calendar className="w-6 h-6 text-slate-400" />
                      <h4 className="font-bold text-white">Creation Details</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-semibold text-blue-400">Created:</span>
                        <p className="text-slate-400">{linkInfo.created.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-blue-400">Expires:</span>
                        <p className="text-slate-400">{linkInfo.expires.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-500/100/10 rounded-2xl p-6 border border-purple-500/20">
                    <div className="flex items-center space-x-3 mb-4">
                      <Clock className="w-6 h-6 text-purple-600" />
                      <h4 className="font-bold text-purple-400">Time Remaining</h4>
                    </div>
                    {remainingTime && (
                      <div className={`inline-flex items-center px-4 py-2 rounded-xl font-semibold text-sm ${remainingTime.bgColor} ${remainingTime.color}`}>
                        {remainingTime.text}
                      </div>
                    )}
                  </div>
                </div>

                {/* Generated Link */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <label className="block font-bold text-white mb-3 text-lg">
                    Generated Onboarding Link:
                  </label>
                  <div className="relative">
                    <textarea
                      value={generatedLink}
                      readOnly
                      className="w-full h-24 p-4 font-mono text-sm bg-black/40 border-2 border-white/10 rounded-xl resize-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 text-white transition-all duration-200"
                      placeholder="Your generated link will appear here..."
                    />
                    <div className="absolute top-2 right-2">
                      <ExternalLink className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>

                  {/* Copy Button */}
                  <div className="mt-4 flex items-center justify-between">
                    <button
                      onClick={copyToClipboard}
                      className={`inline-flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 ${copyStatus === 'success'
                        ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white'
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
                        } shadow-lg`}
                    >
                      {copyStatus === 'success' ? (
                        <>
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Copied to Clipboard!
                        </>
                      ) : (
                        <>
                          <Copy className="w-5 h-5 mr-2" />
                          Copy Link
                        </>
                      )}
                    </button>

                    {copyStatus === 'error' && (
                      <span className="text-red-600 font-medium">
                        Copy failed - please select and copy manually
                      </span>
                    )}
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-amber-500/5 backdrop-blur-sm rounded-2xl p-6 border border-amber-500/20">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-amber-400 mb-3 uppercase tracking-widest text-sm">Important Instructions</h4>
                      <ul className="space-y-2 text-amber-200/70">
                        <li className="flex items-start space-x-2">
                          <span className="w-1.5 h-1.5 bg-amber-500/40 rounded-full mt-2 flex-shrink-0"></span>
                          <span>This link expires in <strong className="text-amber-400">7 days</strong> from creation</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="w-1.5 h-1.5 bg-amber-500/40 rounded-full mt-2 flex-shrink-0"></span>
                          <span>Send this link to employees via email or other secure methods</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="w-1.5 h-1.5 bg-amber-500/40 rounded-full mt-2 flex-shrink-0"></span>
                          <span>Multiple employees can use the same link</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="w-1.5 h-1.5 bg-amber-500/40 rounded-full mt-2 flex-shrink-0"></span>
                          <span>Once an employee submits, they cannot submit again with the same email</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="w-1.5 h-1.5 bg-amber-500/40 rounded-full mt-2 flex-shrink-0"></span>
                          <span><strong className="text-amber-400">Note:</strong> Employees will fill personal info and upload documents. HR completes employment details after review.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Technical Details (Collapsible) */}
                <details className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <summary className="p-4 font-semibold text-white cursor-pointer hover:bg-white/10 transition-colors duration-200 list-none flex items-center justify-between">
                    <span>Technical Details</span>
                    <RefreshCw className="w-4 h-4 text-slate-500" />
                  </summary>
                  <div className="p-4 pt-0 space-y-3 text-sm text-slate-400">
                    <div>
                      <span className="font-semibold">Encoded Data:</span>
                      <code className="ml-2 px-2 py-1 bg-white/5/10 rounded font-mono text-xs">{linkInfo.encoded}</code>
                    </div>
                    <div>
                      <span className="font-semibold">Timestamp:</span>
                      <code className="ml-2 px-2 py-1 bg-white/5/10 rounded font-mono text-xs">{linkInfo.timestamp}</code>
                    </div>
                    <div>
                      <span className="font-semibold">Link Format:</span>
                      <code className="ml-2 px-2 py-1 bg-white/5/10 rounded font-mono text-xs break-all">
                        /onboarding/form/{linkInfo.encoded}
                      </code>
                    </div>
                  </div>
                </details>
              </div>
            )}

            {/* Help Section */}
            {!generatedLink && (
              <div className="mt-12 bg-white/5 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
                <h3 className="font-bold text-white mb-4 text-lg">How it Works</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-bold">1</span>
                    </div>
                    <h4 className="font-semibold text-white mb-2">Generate Link</h4>
                    <p className="text-slate-400">Click the button to create a unique, timestamped onboarding link</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-bold">2</span>
                    </div>
                    <h4 className="font-semibold text-white mb-2">Share with Employees</h4>
                    <p className="text-slate-400">Send the link via email to employees who need to complete onboarding</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-bold">3</span>
                    </div>
                    <h4 className="font-semibold text-white mb-2">Track Submissions</h4>
                    <p className="text-slate-400">Monitor employee submissions through the employee management system</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};

export default OnboardingLinkGenerator;
