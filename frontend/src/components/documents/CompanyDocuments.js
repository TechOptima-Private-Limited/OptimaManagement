import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { companyDocumentsAPI } from '../../services/api';
import { getCurrentUser, getUserRole } from '../../utils/auth';
import { ROLE_CATEGORIES } from '../../utils/roleConfig';

const CompanyDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);

  const user = getCurrentUser();
  const role = getUserRole();
  const isSuperuser = !!user?.is_superuser;
  const canUpload =
    isSuperuser ||
    role === 'ADMIN' ||
    role === 'HR_MANAGER' ||
    ROLE_CATEGORIES.C_LEVEL.includes(role);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { data } = await companyDocumentsAPI.getDocuments();
      setDocuments(data.results || data || []);
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to fetch company documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async () => {
    if (!title.trim() || !file) {
      toast.error('Please provide title and file');
      return;
    }

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('file', file);

    try {
      setUploading(true);
      await companyDocumentsAPI.uploadDocument(formData);
      toast.success('Document uploaded successfully');
      setTitle('');
      setFile(null);
      fetchDocuments();
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await companyDocumentsAPI.deleteDocument(id);
      toast.success('Document deleted');
      fetchDocuments();
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to delete document');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-2">Company Documents</h1>
        <p className="text-slate-400 mb-6">All employees can view and download documents.</p>

        {canUpload && (
          <div className="bg-slate-900/60 border border-white/10 rounded-xl p-4 mb-6">
            <h2 className="text-lg font-semibold text-white mb-3">Upload Document</h2>
            <div className="grid md:grid-cols-3 gap-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Document title"
                className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white"
              />
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-slate-300"
              />
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2 rounded-lg font-semibold"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        )}

        <div className="bg-slate-900/60 border border-white/10 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-6 text-slate-400">Loading documents...</div>
          ) : documents.length === 0 ? (
            <div className="p-6 text-slate-400">No documents uploaded yet.</div>
          ) : (
            <ul className="divide-y divide-white/10">
              {documents.map((doc) => (
                <li key={doc.id} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-white font-medium">{doc.title}</p>
                    <p className="text-xs text-slate-400">
                      Uploaded by {doc.uploaded_by_name || 'Unknown'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={doc.file_url || doc.file}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm"
                    >
                      View
                    </a>
                    {canUpload && (
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-600 text-white text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyDocuments;
