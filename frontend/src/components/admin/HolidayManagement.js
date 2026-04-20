import React, { useState, useEffect } from 'react';
import {
    CalendarDaysIcon,
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    CheckCircleIcon,
    XCircleIcon,
    InformationCircleIcon,
    ArrowLeftIcon,
    CalendarIcon
} from '@heroicons/react/24/outline';
import { holidayAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const HolidayManagement = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [holidays, setHolidays] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        date: '',
        festival_type: 'NATIONAL',
        emoji: '',
        is_holiday: true,
        is_recurring: true,
        notify_employees: true
    });

    const FESTIVAL_TYPES = [
        { value: 'NATIONAL', label: 'National Holiday' },
        { value: 'RELIGIOUS', label: 'Religious Festival' },
        { value: 'CULTURAL', label: 'Cultural Event' },
        { value: 'COMPANY', label: 'Company Event' },
        { value: 'INTERNATIONAL', label: 'International Day' },
        { value: 'SEASONAL', label: 'Seasonal Festival' },
    ];

    useEffect(() => {
        fetchHolidays();
    }, []);

    const fetchHolidays = async () => {
        setIsLoading(true);
        try {
            const response = await holidayAPI.getHolidays();
            setHolidays(response.data.results || response.data);
        } catch (error) {
            toast.error('Failed to fetch holidays');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (holiday = null) => {
        if (holiday) {
            setEditingHoliday(holiday);
            setFormData({
                name: holiday.name,
                description: holiday.description || '',
                date: holiday.date,
                festival_type: holiday.festival_type,
                emoji: holiday.emoji || '',
                is_holiday: holiday.is_holiday,
                is_recurring: holiday.is_recurring,
                notify_employees: holiday.notify_employees
            });
        } else {
            setEditingHoliday(null);
            setFormData({
                name: '',
                description: '',
                date: new Date().toISOString().split('T')[0],
                festival_type: 'NATIONAL',
                emoji: '',
                is_holiday: true,
                is_recurring: true,
                notify_employees: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingHoliday) {
                await holidayAPI.updateHoliday(editingHoliday.id, formData);
                toast.success('Holiday updated successfully');
            } else {
                await holidayAPI.createHoliday(formData);
                toast.success('Holiday added successfully');
            }
            fetchHolidays();
            setIsModalOpen(false);
        } catch (error) {
            toast.error(editingHoliday ? 'Failed to update holiday' : 'Failed to add holiday');
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this holiday?')) {
            try {
                await holidayAPI.deleteHoliday(id);
                toast.success('Holiday deleted successfully');
                fetchHolidays();
            } catch (error) {
                toast.error('Failed to delete holiday');
                console.error(error);
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#070B14] p-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <button
                        type="button"
                        onClick={() => navigate('/dashboard')}
                        className="group flex items-center text-xs font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition-all"
                    >
                        <ArrowLeftIcon className="h-4 w-4 mr-2 transform group-hover:-translate-x-1 transition-transform" />
                        Back to Dashboard
                    </button>
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
                            <CalendarIcon className="h-8 w-8 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">Holiday Registry</h1>
                            <p className="text-sm text-slate-500 font-medium tracking-tight">Configure company-wide observational periods and festival events.</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className={`flex items-center justify-center px-6 py-3 bg-gradient-to-r ${theme.primaryGradient} text-white rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:scale-105 active:scale-95 transition-all duration-300 text-xs font-black uppercase tracking-widest`}
                >
                    <PlusIcon className="h-4 w-4 mr-2 stroke-[3]" />
                    Initialize Holiday
                </button>
            </div>

            {isLoading ? (
                <div className="flex flex-col justify-center items-center h-96 space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                    <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest animate-pulse">Syncing Calendar Data…</div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {holidays.map((holiday) => (
                        <div
                            key={holiday.id}
                            className="bg-slate-100 dark:bg-white/5 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-white/10 p-8 hover:border-black/20 dark:border-white/20 hover:bg-black/10 dark:bg-slate-100 dark:bg-white/10 transition-all duration-500 relative overflow-hidden group shadow-2xl"
                        >
                            {/* Card Background Decoration */}
                            <div className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${theme.primaryGradient} opacity-5 rounded-full blur-3xl group-hover:opacity-10 transition-opacity duration-500`}></div>

                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <div className="flex items-center">
                                    <div className="text-4xl mr-4 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">{holiday.emoji || '📅'}</div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight uppercase tracking-tight">{holiday.name}</h3>
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1 opacity-70">
                                            {new Date(holiday.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleOpenModal(holiday)}
                                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-black/10 dark:bg-slate-100 dark:bg-white/10 rounded-xl transition-all"
                                    >
                                        <PencilSquareIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(holiday.id)}
                                        className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-6 mb-2 relative z-10">
                                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium leading-relaxed line-clamp-2 min-h-[3rem]">
                                    {holiday.description || 'No descriptive metadata provided in registry.'}
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <span className="px-3 py-1 bg-slate-100 dark:bg-white/5 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-full border border-slate-200 dark:border-white/10 whitespace-nowrap">
                                        {holiday.festival_type.replace('_', ' ')}
                                    </span>
                                    {holiday.is_holiday ? (
                                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20 flex items-center whitespace-nowrap">
                                            <CheckCircleIcon className="h-3 w-3 mr-1" /> FULL HOLIDAY
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 bg-blue-500/10 text-blue-500 text-[9px] font-black uppercase tracking-widest rounded-full border border-blue-500/20 flex items-center whitespace-nowrap">
                                            <InformationCircleIcon className="h-3 w-3 mr-1" /> EVENT ONLY
                                        </span>
                                    )}
                                    {holiday.is_recurring && (
                                        <span className="px-3 py-1 bg-purple-500/10 text-purple-500 text-[9px] font-black uppercase tracking-widest rounded-full border border-purple-500/20 whitespace-nowrap">
                                            RECURRING
                                        </span>
                                    )}
                                </div>
                            </div>

                            {holiday.is_today && (
                                <div className={`absolute bottom-0 right-0 py-2 px-6 bg-gradient-to-l ${theme.primaryGradient} text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest rounded-tl-3xl shadow-2xl animate-pulse`}>
                                    ACTIVE TODAY! 🎉
                                </div>
                            )}
                        </div>
                    ))}

                    {holidays.length === 0 && (
                        <div className="col-span-full py-32 text-center bg-slate-100 dark:bg-white/5 rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10 dark:border-slate-200 dark:border-white/10">
                            <CalendarDaysIcon className="h-20 w-20 text-slate-700 mx-auto mb-6 opacity-50" />
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Zero Registry Entries</h3>
                            <p className="text-slate-500 mt-2 font-medium tracking-tight">Initiate the company calendar by adding the first organizational event.</p>
                            <button
                                onClick={() => handleOpenModal()}
                                className="mt-8 px-8 py-3 bg-black/10 dark:bg-slate-100 dark:bg-white/10 hover:bg-black/20 dark:bg-slate-100 dark:bg-white/20 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                            >
                                START REGISTRY
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Modal Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative bg-white dark:bg-[#0B1120] rounded-[2.5rem] border border-slate-200 dark:border-white/10 dark:border-slate-200 dark:border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-lg overflow-hidden transform animate-in zoom-in-95 duration-200">
                        <div className={`p-10 bg-gradient-to-br ${theme.primaryGradient} relative overflow-hidden`}>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-black/10 dark:bg-slate-100 dark:bg-white/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/3"></div>
                            <div className="relative z-10 flex justify-between items-center">
                                <div>
                                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">{editingHoliday ? 'Modify Entry' : 'New Registry'}</h2>
                                    <p className="text-white/60 text-xs font-black uppercase tracking-widest mt-2">Calendar Configuration Protocol</p>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-3 hover:bg-black/20 dark:bg-slate-100 dark:bg-white/20 rounded-2xl transition-all"
                                >
                                    <XCircleIcon className="h-7 w-7 text-white" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Holiday Title</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-sm text-slate-900 dark:text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 shadow-inner outline-none font-bold"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Independence Day"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Effective Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 shadow-inner outline-none font-bold [color-scheme:dark]"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Icon/Emoji Token</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-center text-2xl focus:ring-2 focus:ring-indigo-500/50 shadow-inner outline-none"
                                        value={formData.emoji}
                                        onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                                        placeholder="🎉"
                                        maxLength="5"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Registry Description</label>
                                <textarea
                                    className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-sm text-slate-900 dark:text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 shadow-inner outline-none min-h-[120px] font-medium leading-relaxed"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Tell employees about the context of this observational period..."
                                ></textarea>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Functional Classification</label>
                                <select
                                    className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 shadow-inner outline-none appearance-none font-bold bg-no-repeat bg-[right_1.5rem_center] bg-[length:1em_1em]"
                                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http:/www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke-width=\'2.5\' stroke=\'white\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' d=\'M19.5 8.25l-7.5 7.5-7.5-7.5\' /%3E%3C/svg%3E")' }}
                                    value={formData.festival_type}
                                    onChange={(e) => setFormData({ ...formData, festival_type: e.target.value })}
                                >
                                    {FESTIVAL_TYPES.map(type => (
                                        <option key={type.value} value={type.value} className="bg-white dark:bg-[#0B1120]">{type.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 gap-6 pt-4">
                                <Toggle label="Full Organizational Holiday" checked={formData.is_holiday} onChange={(v) => setFormData({ ...formData, is_holiday: v })} />
                                <Toggle label="Recursive Yearly Registry" checked={formData.is_recurring} onChange={(v) => setFormData({ ...formData, is_recurring: v })} />
                                <Toggle label="Broadcast Notification to All Employees" checked={formData.notify_employees} onChange={(v) => setFormData({ ...formData, notify_employees: v })} />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-6 py-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 dark:border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-black/10 dark:bg-slate-100 dark:bg-white/10 hover:text-slate-900 dark:text-white transition-all transform active:scale-95"
                                >
                                    Discard
                                </button>
                                <button
                                    type="submit"
                                    className={`flex-[2] px-6 py-4 bg-gradient-to-r ${theme.primaryGradient} text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] transition-all transform hover:scale-[1.02] active:scale-[0.98]`}
                                >
                                    {editingHoliday ? 'Update Registry' : 'Commit to Registry'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const Toggle = ({ label, checked, onChange }) => (
    <label className="flex items-center group cursor-pointer justify-between bg-slate-100 dark:bg-white/5 px-6 py-4 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-slate-200 dark:border-white/10 dark:border-slate-200 dark:border-white/10 transition-all">
        <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest group-hover:text-slate-900 dark:text-white transition-colors">{label}</span>
        <div className="relative flex items-center">
            <input
                type="checkbox"
                className="sr-only peer"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
            />
            <div className="w-11 h-6 bg-slate-100 dark:bg-white/5 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500 peer-checked:after:bg-slate-100 dark:bg-white/5"></div>
        </div>
    </label>
);

export default HolidayManagement;
