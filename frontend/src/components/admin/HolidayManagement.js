import React, { useState, useEffect } from 'react';
import {
    CalendarDaysIcon,
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    CheckCircleIcon,
    XCircleIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';
import { holidayAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'react-toastify';

const HolidayManagement = () => {
    const { theme } = useTheme();
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
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className={`text-3xl font-bold bg-gradient-to-r ${theme.primaryGradient} bg-clip-text text-transparent`}>
                        Holiday Management
                    </h1>
                    <p className="text-gray-500 mt-2">Manage company holidays and festivals</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className={`flex items-center px-4 py-2 bg-gradient-to-r ${theme.primaryGradient} text-white rounded-xl shadow-lg hover:scale-105 transition-all duration-300 font-medium`}
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add Holiday
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {holidays.map((holiday) => (
                        <div
                            key={holiday.id}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300 relative overflow-hidden group"
                        >
                            {/* Card Background Decoration */}
                            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${theme.primaryGradient} opacity-5 rounded-bl-full translate-x-12 -translate-y-12 group-hover:translate-x-8 group-hover:-translate-y-8 transition-transform duration-500`}></div>

                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center">
                                    <div className="text-3xl mr-3">{holiday.emoji || '📅'}</div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg leading-tight">{holiday.name}</h3>
                                        <p className="text-sm text-gray-500">{new Date(holiday.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                    </div>
                                </div>
                                <div className="flex space-x-1">
                                    <button
                                        onClick={() => handleOpenModal(holiday)}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <PencilSquareIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(holiday.id)}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3 mb-4">
                                <p className="text-gray-600 text-sm line-clamp-2 min-h-[2.5rem]">
                                    {holiday.description || 'No description provided.'}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-md">
                                        {holiday.festival_type.replace('_', ' ')}
                                    </span>
                                    {holiday.is_holiday ? (
                                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-md flex items-center">
                                            <CheckCircleIcon className="h-3 w-3 mr-1" /> Holiday
                                        </span>
                                    ) : (
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-md flex items-center">
                                            <InformationCircleIcon className="h-3 w-3 mr-1" /> Event
                                        </span>
                                    )}
                                    {holiday.is_recurring && (
                                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-md">
                                            Recurring
                                        </span>
                                    )}
                                </div>
                            </div>

                            {holiday.is_today && (
                                <div className={`mt-2 py-1 px-3 bg-gradient-to-r ${theme.primaryGradient} text-white text-xs font-bold rounded-full inline-block animate-pulse`}>
                                    TODAY! 🎉
                                </div>
                            )}
                        </div>
                    ))}

                    {holidays.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                            <CalendarDaysIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-medium text-gray-900">No holidays found</h3>
                            <p className="text-gray-500 mt-2">Get started by adding your first company holiday.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform animate-in slide-in-from-bottom-8 duration-300">
                        <div className={`p-6 bg-gradient-to-r ${theme.primaryGradient} text-white`}>
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold">{editingHoliday ? 'Edit Holiday' : 'Add New Holiday'}</h2>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-1 hover:bg-white/20 rounded-full transition-colors"
                                >
                                    <XCircleIcon className="h-6 w-6" />
                                </button>
                            </div>
                            <p className="text-white/80 text-sm mt-1">Set the details for your company holiday or event</p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Holiday Name*</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Independence Day"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Date*</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Emoji</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none text-center text-xl"
                                        value={formData.emoji}
                                        onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                                        placeholder="🎉"
                                        maxLength="5"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                                <textarea
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none min-h-[80px]"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Tell employees about this holiday..."
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
                                <select
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all outline-none appearance-none bg-no-repeat bg-[right_1rem_center] bg-[length:1em_1em]"
                                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke-width=\'1.5\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' d=\'M19.5 8.25l-7.5 7.5-7.5-7.5\' /%3E%3C/svg%3E")' }}
                                    value={formData.festival_type}
                                    onChange={(e) => setFormData({ ...formData, festival_type: e.target.value })}
                                >
                                    {FESTIVAL_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-3 pt-2">
                                <label className="flex items-center group cursor-pointer">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={formData.is_holiday}
                                            onChange={(e) => setFormData({ ...formData, is_holiday: e.target.checked })}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                                    </div>
                                    <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">Is Company Holiday</span>
                                </label>

                                <label className="flex items-center group cursor-pointer">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={formData.is_recurring}
                                            onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                                    </div>
                                    <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">Repeats Yearly</span>
                                </label>

                                <label className="flex items-center group cursor-pointer">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={formData.notify_employees}
                                            onChange={(e) => setFormData({ ...formData, notify_employees: e.target.checked })}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                                    </div>
                                    <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">Notify Employees</span>
                                </label>
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={`flex-1 px-4 py-3 bg-gradient-to-r ${theme.primaryGradient} text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]`}
                                >
                                    {editingHoliday ? 'Update' : 'Save'} Holiday
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Glassmorphism Styles */}
            <style jsx>{`
        .bg-glass {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
      `}</style>
        </div>
    );
};

export default HolidayManagement;
