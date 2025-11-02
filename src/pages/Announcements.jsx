import { useState, useEffect } from 'react';
import { announcementsAPI } from '../api/announcements';
import Card from '../components/Card';
import { formatDate, formatDateTime } from '../utils/formatters';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await announcementsAPI.getAll();
      setAnnouncements(response.data.data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await announcementsAPI.create(formData);
      fetchAnnouncements();
      resetForm();
    } catch (error) {
      console.error('Error creating announcement:', error);
      alert(error.response?.data?.error || 'Error creating announcement');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await announcementsAPI.delete(id);
      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert(error.response?.data?.error || 'Error deleting announcement');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
    });
    setShowForm(false);
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark transition-colors"
        >
          + Create Announcement
        </button>
      </div>

      {showForm && (
        <Card className="mb-6" title="Create New Announcement">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows="5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark transition-colors"
              >
                Create Announcement
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {announcements.map((announcement) => (
          <Card key={announcement._id}>
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                <button
                  onClick={() => handleDelete(announcement._id)}
                  className="text-red-600 hover:text-red-900 text-sm"
                >
                  Delete
                </button>
              </div>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{announcement.message}</p>
              <div className="border-t border-gray-200 pt-3 text-xs text-gray-500">
                <p>Created by: {announcement.createdBy?.name || 'Unknown'}</p>
                <p>Date: {formatDateTime(announcement.date || announcement.createdAt)}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Announcements;
