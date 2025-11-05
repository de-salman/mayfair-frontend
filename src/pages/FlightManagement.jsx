import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { flightsAPI } from '../api/flights';
import Card from '../components/Card';
import LoadingSkeleton from '../components/LoadingSkeleton';
import CSVUploadResultModal from '../components/CSVUploadResultModal';
import { useToast } from '../context/ToastContext';
import { formatDate, formatDateTime } from '../utils/formatters';
import dayjs from 'dayjs';

const FlightManagement = () => {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    flightNo: '',
    origin: '',
    destination: '',
    date: '',
    time: '',
    aircraft: '',
    status: 'scheduled',
  });

  useEffect(() => {
    fetchFlights();
  }, []);

  const fetchFlights = async () => {
    try {
      const response = await flightsAPI.getAll();
      const flightsData = response.data.data || [];
      setFlights(flightsData);
      
      // Debug: Check round trips
      const roundTrips = flightsData.filter(f => !!f.returnFlightId);
      console.log('Total flights:', flightsData.length);
      console.log('Round trips found:', roundTrips.length);
      if (roundTrips.length > 0) {
        console.log('Sample round trip:', {
          flightNo: roundTrips[0].flightNo,
          returnFlightId: roundTrips[0].returnFlightId,
          returnFlightIdType: typeof roundTrips[0].returnFlightId,
          hasReturnFlightIdId: !!roundTrips[0].returnFlightId?._id,
          isReturnFlightIdObject: typeof roundTrips[0].returnFlightId === 'object'
        });
      }
    } catch (error) {
      console.error('Error fetching flights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    try {
      const response = await flightsAPI.uploadCSV(uploadFile);
      if (response.data.success) {
        setUploadResult(response.data);
        setShowUploadModal(false);
        setUploadFile(null);
        fetchFlights();
        showToast('CSV uploaded successfully!', 'success');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      showToast(error.response?.data?.error || 'Error uploading file', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await flightsAPI.create(formData);
      fetchFlights();
      resetForm();
      showToast('Flight created successfully!', 'success');
    } catch (error) {
      console.error('Error creating flight:', error);
      showToast(error.response?.data?.error || 'Error creating flight', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this flight?')) return;
    try {
      await flightsAPI.delete(id);
      fetchFlights();
      showToast('Flight deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting flight:', error);
      showToast(error.response?.data?.error || 'Error deleting flight', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      flightNo: '',
      origin: '',
      destination: '',
      date: '',
      time: '',
      aircraft: '',
      status: 'scheduled',
    });
    setShowForm(false);
  };

  // Group flights by date for timeline
  const groupedFlights = flights.reduce((acc, flight) => {
    const date = formatDate(flight.date);
    if (!acc[date]) acc[date] = [];
    acc[date].push(flight);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSkeleton type="table" rows={8} />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* CSV Upload Result Modal */}
      {uploadResult && (
        <CSVUploadResultModal
          result={uploadResult}
          onClose={() => setUploadResult(null)}
        />
      )}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Flight Management</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark transition-colors"
          >
            Upload CSV
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark transition-colors"
          >
            + Add Flight
          </button>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <Card className="w-full max-w-md" title="Upload Flights CSV">
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CSV File</label>
                <input
                  type="file"
                  accept=".csv"
                  required
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFile(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Add Flight Form */}
      {showForm && (
        <Card className="mb-6" title="Add New Flight">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Flight No</label>
                <input
                  type="text"
                  required
                  value={formData.flightNo}
                  onChange={(e) => setFormData({ ...formData, flightNo: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aircraft</label>
                <input
                  type="text"
                  value={formData.aircraft}
                  onChange={(e) => setFormData({ ...formData, aircraft: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Origin</label>
                <input
                  type="text"
                  required
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                <input
                  type="text"
                  required
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input
                  type="time"
                  required
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="scheduled">Scheduled</option>
                <option value="delayed">Delayed</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
                <option value="in-progress">In Progress</option>
              </select>
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark transition-colors"
              >
                Create Flight
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

      {/* Timeline Chart */}
      <Card title="Flight Timeline" className="mb-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={flights.slice(0, 20)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="flightNo" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="status" fill="#92408b" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Flights List */}
      <Card title="All Flights">
        {(() => {
          const displayedFlights = flights.filter((flight) => {
            // Filter out return flights (they're shown as part of the outbound flight)
            return !flights.some(f => {
              const fReturnId = f.returnFlightId?._id || f.returnFlightId;
              return fReturnId && fReturnId.toString() === flight._id.toString();
            });
          });
          const roundTripCount = displayedFlights.filter(f => {
            // Check if returnFlightId exists (can be ObjectId string or populated object)
            return !!f.returnFlightId;
          }).length;
          const singleSectorCount = displayedFlights.length - roundTripCount;
          
          return (
            <div className="mb-4 flex items-center gap-4 text-sm text-gray-600">
              <span className="font-medium">Total: {displayedFlights.length} flights</span>
              <span className="px-2 py-1 rounded-full bg-primary/10 text-primary">
                {roundTripCount} Round Trips
              </span>
              <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                {singleSectorCount} Single Sector
              </span>
            </div>
          );
        })()}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Flight No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aircraft</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {flights.map((flight) => {
                // Check if this is a round trip (has returnFlightId)
                // returnFlightId can be an ObjectId string or populated object
                // If populated, returnFlightId will be an object with properties
                // If not populated, returnFlightId will be an ObjectId string
                const hasReturnFlight = !!flight.returnFlightId;
                const isRoundTrip = hasReturnFlight;
                // If returnFlightId is populated, it will be an object with flight details
                // Otherwise, it's just an ObjectId and we'd need to fetch it (but it should be populated)
                const returnFlight = hasReturnFlight && typeof flight.returnFlightId === 'object' && flight.returnFlightId._id 
                  ? flight.returnFlightId 
                  : null;
                
                // Determine route display
                let routeDisplay = `${flight.origin} → ${flight.destination}`;
                if (isRoundTrip && returnFlight) {
                  // Show round trip as "MXP-DXB-MXP"
                  routeDisplay = `${flight.origin}-${flight.destination}-${returnFlight.destination}`;
                }
                
                // Check if this is the return flight of a round trip (should be filtered out)
                const isReturnFlight = flights.some(f => {
                  const fReturnId = f.returnFlightId?._id || f.returnFlightId;
                  return fReturnId && fReturnId.toString() === flight._id.toString();
                });
                
                // Skip displaying return flights (they're shown as part of the outbound flight)
                if (isReturnFlight) {
                  return null;
                }
                
                return (
                  <tr key={flight._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        {flight.flightNo}
                        {isRoundTrip && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/20 text-primary border border-primary/30">
                            Round Trip
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <span className={isRoundTrip ? 'font-semibold text-primary' : ''}>{routeDisplay}</span>
                        {isRoundTrip && returnFlight && (
                          <span className="text-xs text-gray-400">
                            ({flight.flightNo} / {returnFlight.flightNo})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(flight.date)} {flight.time}
                      {isRoundTrip && returnFlight && (
                        <div className="text-xs text-gray-400 mt-1">
                          Return: {formatDate(returnFlight.date)} {returnFlight.time}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{flight.aircraft || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        flight.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        flight.status === 'completed' ? 'bg-green-100 text-green-800' :
                        flight.status === 'delayed' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {flight.status}
                      </span>
                      {isRoundTrip && returnFlight && (
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                          returnFlight.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                          returnFlight.status === 'completed' ? 'bg-green-100 text-green-800' :
                          returnFlight.status === 'delayed' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {returnFlight.status} (Return)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDelete(flight._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default FlightManagement;
