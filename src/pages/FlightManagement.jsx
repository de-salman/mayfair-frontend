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
    isRoundTrip: false,
    returnFlightNo: '',
    returnDate: '',
    returnTime: '',
    returnStatus: 'scheduled',
  });

  useEffect(() => {
    fetchFlights();
  }, []);

  const fetchFlights = async () => {
    try {
      const response = await flightsAPI.getAll();
      const flightsData = response.data.data || [];
      setFlights(flightsData);
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
      if (formData.isRoundTrip) {
        // Create round trip: outbound flight first
        const outboundFlight = {
          flightNo: formData.flightNo,
          origin: formData.origin,
          destination: formData.destination,
          date: formData.date,
          time: formData.time,
          aircraft: formData.aircraft,
          status: formData.status,
          isRoundTrip: true,
        };
        
        const outboundResponse = await flightsAPI.create(outboundFlight);
        const outboundFlightId = outboundResponse.data.data._id;
        
        // Create return flight
        const returnFlight = {
          flightNo: formData.returnFlightNo || `${formData.flightNo}R`,
          origin: formData.destination, // Return flight origin is the outbound destination
          destination: formData.origin, // Return flight destination is the outbound origin
          date: formData.returnDate || formData.date, // Use return date or same as outbound
          time: formData.returnTime || formData.time,
          aircraft: formData.aircraft, // Same aircraft
          status: formData.returnStatus || formData.status,
          isRoundTrip: true,
        };
        
        const returnResponse = await flightsAPI.create(returnFlight);
        const returnFlightId = returnResponse.data.data._id;
        
        // Link outbound to return flight
        await flightsAPI.update(outboundFlightId, { returnFlightId: returnFlightId });
        
        showToast('Round trip created successfully!', 'success');
      } else {
        // Create single sector flight
        const flightData = {
          flightNo: formData.flightNo,
          origin: formData.origin,
          destination: formData.destination,
          date: formData.date,
          time: formData.time,
          aircraft: formData.aircraft,
          status: formData.status,
          isRoundTrip: false,
        };
        
        await flightsAPI.create(flightData);
        showToast('Flight created successfully!', 'success');
      }
      
      fetchFlights();
      resetForm();
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
      isRoundTrip: false,
      returnFlightNo: '',
      returnDate: '',
      returnTime: '',
      returnStatus: 'scheduled',
    });
    setShowForm(false);
  };

  // Filter out return flights (they're shown as part of the outbound flight)
  // A return flight is one where another flight has this flight's ID as their returnFlightId
  const displayedFlights = flights.filter((flight) => {
    // Check if this flight is a return flight by checking if any other flight
    // has this flight's ID as their returnFlightId
    const isReturnFlight = flights.some(f => {
      // Skip if same flight or no returnFlightId
      if (f._id.toString() === flight._id.toString() || !f.returnFlightId) {
        return false;
      }
      
      // returnFlightId can be an ObjectId string or populated object
      const fReturnId = f.returnFlightId?._id || f.returnFlightId;
      const flightId = flight._id?.toString() || flight._id;
      
      // Check if this flight's ID matches the returnFlightId
      if (fReturnId && flightId) {
        return fReturnId.toString() === flightId.toString();
      }
      
      return false;
    });
    
    // Only include flights that are NOT return flights
    return !isReturnFlight;
  });

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

            {/* Round Trip Option */}
            <div className="border-t pt-4">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="isRoundTrip"
                  checked={formData.isRoundTrip}
                  onChange={(e) => setFormData({ ...formData, isRoundTrip: e.target.checked })}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="isRoundTrip" className="ml-2 block text-sm font-medium text-gray-700">
                  Round Trip Flight
                </label>
              </div>

              {formData.isRoundTrip && (
                <div className="bg-primary/5 p-4 rounded-lg space-y-4 border border-primary/20">
                  <p className="text-sm font-medium text-primary mb-3">Return Flight Details</p>
                  
                  {/* Return Route (Auto-filled, readonly) */}
                  <div className="bg-blue-50 p-3 rounded border border-blue-200 mb-4">
                    <p className="text-xs font-medium text-blue-800 mb-2">Return Route (Auto-reversed):</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-blue-700 mb-1">Return Origin</label>
                        <input
                          type="text"
                          value={formData.destination || ''}
                          disabled
                          readOnly
                          className="w-full px-3 py-2 border border-blue-300 rounded-md bg-blue-100 text-blue-800 font-semibold cursor-not-allowed"
                        />
                        <p className="text-xs text-blue-600 mt-1">Auto: Outbound Destination</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-blue-700 mb-1">Return Destination</label>
                        <input
                          type="text"
                          value={formData.origin || ''}
                          disabled
                          readOnly
                          className="w-full px-3 py-2 border border-blue-300 rounded-md bg-blue-100 text-blue-800 font-semibold cursor-not-allowed"
                        />
                        <p className="text-xs text-blue-600 mt-1">Auto: Outbound Origin</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Return Flight No <span className="text-gray-500">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.returnFlightNo}
                        onChange={(e) => setFormData({ ...formData, returnFlightNo: e.target.value.toUpperCase() })}
                        placeholder={`Auto: ${formData.flightNo}R`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <p className="text-xs text-gray-500 mt-1">Leave empty to auto-generate as {formData.flightNo || 'FLIGHT'}R</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Return Aircraft</label>
                      <input
                        type="text"
                        value={formData.aircraft}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                      />
                      <p className="text-xs text-gray-500 mt-1">Same as outbound flight</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
                      <input
                        type="date"
                        value={formData.returnDate}
                        onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                        min={formData.date || undefined}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <p className="text-xs text-gray-500 mt-1">Leave empty to use outbound date</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Return Time</label>
                      <input
                        type="time"
                        value={formData.returnTime}
                        onChange={(e) => setFormData({ ...formData, returnTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <p className="text-xs text-gray-500 mt-1">Leave empty to use outbound time</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Return Status</label>
                    <select
                      value={formData.returnStatus}
                      onChange={(e) => setFormData({ ...formData, returnStatus: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="delayed">Delayed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="completed">Completed</option>
                      <option value="in-progress">In Progress</option>
                    </select>
                  </div>

                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <p className="text-sm text-green-800 font-medium">
                      <strong>Round Trip Route:</strong> {formData.origin || 'Origin'} → {formData.destination || 'Destination'} → {formData.origin || 'Origin'}
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      ✓ Outbound: {formData.origin || 'Origin'} → {formData.destination || 'Destination'}
                    </p>
                    <p className="text-xs text-green-700">
                      ✓ Return: {formData.destination || 'Destination'} → {formData.origin || 'Origin'} (Auto-reversed)
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark transition-colors"
              >
                {formData.isRoundTrip ? 'Create Round Trip' : 'Create Flight'}
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
              {displayedFlights.map((flight) => {
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
                // This check is already done in displayedFlights, but keeping it here as a safety check
                const isReturnFlight = flights.some(f => {
                  if (!f.returnFlightId || f._id.toString() === flight._id.toString()) {
                    return false;
                  }
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
