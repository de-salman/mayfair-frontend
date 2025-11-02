import { useState, useEffect } from 'react';
import { campaignsAPI } from '../api/campaigns';
import Card from '../components/Card';
import { formatCurrency } from '../utils/formatters';

const Marketing = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    budget: '',
    platform: '',
    status: 'draft',
    performance: {},
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await campaignsAPI.getAll();
      setCampaigns(response.data.data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const campaignData = {
        ...formData,
        budget: parseFloat(formData.budget),
        performance: formData.performance || {},
      };
      await campaignsAPI.create(campaignData);
      fetchCampaigns();
      resetForm();
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert(error.response?.data?.error || 'Error creating campaign');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;
    try {
      await campaignsAPI.delete(id);
      fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      alert(error.response?.data?.error || 'Error deleting campaign');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      budget: '',
      platform: '',
      status: 'draft',
      performance: {},
    });
    setShowForm(false);
  };

  const calculatePerformance = (campaign) => {
    if (!campaign.performance || !campaign.performance.impressions) return 0;
    const ctr = campaign.performance.ctr || 0;
    return ctr.toFixed(2);
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Marketing Campaigns</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark transition-colors"
        >
          + Create Campaign
        </button>
      </div>

      {showForm && (
        <Card className="mb-6" title="Create New Campaign">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
              <input
                type="text"
                required
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                placeholder="e.g., Facebook, Instagram, Google Ads"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark transition-colors"
              >
                Create Campaign
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((campaign) => (
          <Card key={campaign._id}>
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                  campaign.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                  campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {campaign.status}
                </span>
              </div>
              <p className="text-sm text-gray-600">{campaign.platform}</p>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Budget</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(campaign.budget)}</span>
                </div>
                {campaign.performance && campaign.performance.ctr && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">CTR</span>
                    <span className="text-sm font-semibold text-primary">{calculatePerformance(campaign)}%</span>
                  </div>
                )}
                {campaign.performance && campaign.performance.conversions && (
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-600">Conversions</span>
                    <span className="text-sm font-semibold text-gray-900">{campaign.performance.conversions}</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => handleDelete(campaign._id)}
                className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                Delete
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Marketing;
