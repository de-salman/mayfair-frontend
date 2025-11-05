import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { accountingAPI } from './api';
import Card from '../../components/Card';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import { useToast } from '../../context/ToastContext';
import { formatDate, formatCurrency } from '../../utils/formatters';
import dayjs from 'dayjs';

const Accounting = () => {
  const [loading, setLoading] = useState(true);
  const [accountingData, setAccountingData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingFlight, setEditingFlight] = useState(null);
  const [availableFlights, setAvailableFlights] = useState([]);
  const { showToast } = useToast();

  // Filters
  const [filters, setFilters] = useState({
    airline: '',
    route: '',
    startDate: dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
    dayOfWeek: '',
  });

  // Form data for flight accounting
  const [formData, setFormData] = useState({
    flightId: '',
    capacity: '',
    bookingLoad: '',
    baseFare: '',
    sectorTaxes: '',
    fuelSurcharge: '',
    serviceCharges: '',
    budgetPerFlight: '',
    operatingCosts: '',
    crewCosts: '',
    fuelCosts: '',
    maintenanceCosts: '',
    currency: 'USD',
    notes: '',
  });

  useEffect(() => {
    fetchData();
    fetchAvailableFlights();
  }, [filters]);

  const fetchAvailableFlights = async () => {
    try {
      // Fetch flights from the accounting endpoint which includes flights
      const response = await accountingAPI.getAll({
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
      if (response.data.data?.flights?.records) {
        setAvailableFlights(response.data.data.flights.records);
      }
    } catch (error) {
      console.error('Error fetching flights:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch accounting data with filters
      const params = {
        startDate: filters.startDate,
        endDate: filters.endDate,
      };
      
      const [accountingRes, summaryRes] = await Promise.all([
        accountingAPI.getAll(params),
        accountingAPI.getSummary(params),
      ]);

      setAccountingData(accountingRes.data.data);
      setSummaryData(summaryRes.data.data);
    } catch (error) {
      console.error('Error fetching accounting data:', error);
      showToast(error.response?.data?.error || 'Error fetching accounting data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditFlight = (flightData) => {
    setEditingFlight(flightData);
    const accounting = flightData.accounting || {};
    setFormData({
      flightId: flightData.flight.id,
      capacity: accounting.capacity || '',
      bookingLoad: accounting.bookingLoad ? (accounting.bookingLoad * 100).toFixed(2) : '', // Convert from 0-1 to percentage
      baseFare: accounting.baseFare || '',
      sectorTaxes: accounting.sectorTaxes || '',
      fuelSurcharge: accounting.fuelSurcharge || '',
      serviceCharges: accounting.serviceCharges || '',
      budgetPerFlight: accounting.budgetPerFlight || accounting.budget || '',
      operatingCosts: accounting.operatingCosts || '',
      crewCosts: accounting.crewCosts || '',
      fuelCosts: accounting.fuelCosts || '',
      maintenanceCosts: accounting.maintenanceCosts || '',
      currency: accounting.currency || 'USD',
      notes: accounting.notes || '',
    });
    setShowForm(true);
  };

  const handleSubmitFlightAccounting = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        capacity: parseFloat(formData.capacity) || 0,
        bookingLoad: parseFloat(formData.bookingLoad) / 100 || 0, // Convert percentage to 0-1
        baseFare: parseFloat(formData.baseFare) || 0,
        sectorTaxes: parseFloat(formData.sectorTaxes) || 0,
        fuelSurcharge: parseFloat(formData.fuelSurcharge) || 0,
        serviceCharges: parseFloat(formData.serviceCharges) || 0,
        budgetPerFlight: parseFloat(formData.budgetPerFlight) || 0,
        operatingCosts: parseFloat(formData.operatingCosts) || 0,
        crewCosts: parseFloat(formData.crewCosts) || 0,
        fuelCosts: parseFloat(formData.fuelCosts) || 0,
        maintenanceCosts: parseFloat(formData.maintenanceCosts) || 0,
      };

      if (editingFlight && editingFlight.accounting) {
        // Update existing record
        await accountingAPI.updateFlight(editingFlight.accounting.id, submitData);
        showToast('Flight accounting updated successfully!', 'success');
      } else {
        // Create new record using upsert endpoint
        await accountingAPI.upsertFlightByFlightId(formData.flightId, submitData);
        showToast('Flight accounting created successfully!', 'success');
      }
      
      fetchData();
      resetForm();
    } catch (error) {
      console.error('Error saving flight accounting:', error);
      showToast(error.response?.data?.error || 'Error saving flight accounting', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      flightId: '',
      capacity: '',
      bookingLoad: '',
      baseFare: '',
      sectorTaxes: '',
      fuelSurcharge: '',
      serviceCharges: '',
      budgetPerFlight: '',
      operatingCosts: '',
      crewCosts: '',
      fuelCosts: '',
      maintenanceCosts: '',
      currency: 'USD',
      notes: '',
    });
    setEditingFlight(null);
    setShowForm(false);
  };

  // Filter flights by airline and route
  const filteredFlights = accountingData?.flightsWithCalculations?.filter(flight => {
    if (filters.airline && flight.flight.aircraft && !flight.flight.aircraft.toLowerCase().includes(filters.airline.toLowerCase())) {
      return false;
    }
    if (filters.route) {
      // Check both single sector and round trip routes
      const singleRoute = `${flight.flight.origin}-${flight.flight.destination}`;
      const roundTripRoute = flight.flight.route || '';
      const routeToCheck = roundTripRoute || singleRoute;
      if (!routeToCheck.toLowerCase().includes(filters.route.toLowerCase())) {
        return false;
      }
    }
    if (filters.dayOfWeek) {
      const day = dayjs(flight.flight.date).format('dddd');
      if (day.toLowerCase() !== filters.dayOfWeek.toLowerCase()) {
        return false;
      }
    }
    return true;
  }) || [];

  // Calculate summary stats from filtered data
  const summaryStats = {
    totalFlights: filteredFlights.length,
    avgLoad: filteredFlights.length > 0
      ? filteredFlights.reduce((sum, f) => sum + (f.calculations?.bookingLoad || 0), 0) / filteredFlights.length
      : 0,
    totalRevenue: filteredFlights.reduce((sum, f) => sum + (f.calculations?.revenue || 0), 0),
    totalProfit: filteredFlights.reduce((sum, f) => sum + (f.calculations?.profit || 0), 0),
  };

  // Prepare chart data
  const chartData = filteredFlights
    .map(flight => ({
      date: dayjs(flight.flight.date).format('MMM DD'),
      bookings: flight.calculations?.seatsSold || 0,
      profit: flight.calculations?.profit || 0,
      revenue: flight.calculations?.revenue || 0,
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Get unique airlines and routes for filter dropdowns
  const uniqueAirlines = [...new Set(
    accountingData?.flights?.records?.map(f => f.aircraft).filter(Boolean) || []
  )];
  const uniqueRoutes = [...new Set(
    accountingData?.flightsWithCalculations?.map(f => {
      // For round trips, use the route field; for single sector, use origin-destination
      return f.flight?.route || `${f.flight?.origin}-${f.flight?.destination}`;
    }) || []
  )];

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSkeleton type="table" rows={8} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Accounting</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark transition-colors"
        >
          + Add Flight Accounting
        </button>
      </div>

      {/* Add/Edit Flight Accounting Form */}
      {showForm && (
        <Card className="mb-6" title={editingFlight ? 'Edit Flight Accounting' : 'Add Flight Accounting'}>
          <form onSubmit={handleSubmitFlightAccounting} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Flight *</label>
                <select
                  value={formData.flightId}
                  onChange={(e) => setFormData({ ...formData, flightId: e.target.value })}
                  required
                  disabled={!!editingFlight}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100"
                >
                  <option value="">Select Flight</option>
                  {availableFlights.map(flight => (
                    <option key={flight._id} value={flight._id}>
                      {flight.flightNo} - {flight.origin} → {flight.destination} ({formatDate(flight.date)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="AED">AED</option>
                  <option value="INR">INR</option>
                  <option value="PKR">PKR</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (Seats) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., 396"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Booking Load (%) *</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  required
                  value={formData.bookingLoad}
                  onChange={(e) => setFormData({ ...formData, bookingLoad: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., 75.5"
                />
                <p className="text-xs text-gray-500 mt-1">Enter as percentage (0-100)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base Fare *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={formData.baseFare}
                  onChange={(e) => setFormData({ ...formData, baseFare: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., 1500.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sector Taxes</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.sectorTaxes}
                  onChange={(e) => setFormData({ ...formData, sectorTaxes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., 250.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Surcharge</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.fuelSurcharge}
                  onChange={(e) => setFormData({ ...formData, fuelSurcharge: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., 150.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Charges</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.serviceCharges}
                  onChange={(e) => setFormData({ ...formData, serviceCharges: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., 50.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget Per Flight *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={formData.budgetPerFlight}
                  onChange={(e) => setFormData({ ...formData, budgetPerFlight: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., 50000.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Operating Costs</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.operatingCosts}
                  onChange={(e) => setFormData({ ...formData, operatingCosts: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., 10000.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Crew Costs</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.crewCosts}
                  onChange={(e) => setFormData({ ...formData, crewCosts: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., 8000.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Costs</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.fuelCosts}
                  onChange={(e) => setFormData({ ...formData, fuelCosts: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., 15000.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Costs</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.maintenanceCosts}
                  onChange={(e) => setFormData({ ...formData, maintenanceCosts: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., 5000.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Additional notes..."
              />
            </div>

            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark transition-colors"
              >
                {editingFlight ? 'Update' : 'Create'}
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

      {/* Filters Row */}
      <Card className="mb-6" title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Airline/Aircraft</label>
            <select
              value={filters.airline}
              onChange={(e) => handleFilterChange('airline', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Airlines</option>
              {uniqueAirlines.map(airline => (
                <option key={airline} value={airline}>{airline}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
            <select
              value={filters.route}
              onChange={(e) => handleFilterChange('route', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Routes</option>
              {uniqueRoutes.map(route => (
                <option key={route} value={route}>{route}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Day of Week</label>
            <select
              value={filters.dayOfWeek}
              onChange={(e) => handleFilterChange('dayOfWeek', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Days</option>
              <option value="monday">Monday</option>
              <option value="tuesday">Tuesday</option>
              <option value="wednesday">Wednesday</option>
              <option value="thursday">Thursday</option>
              <option value="friday">Friday</option>
              <option value="saturday">Saturday</option>
              <option value="sunday">Sunday</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Flights</p>
              <p className="text-3xl font-bold text-primary mt-2">{summaryStats.totalFlights}</p>
            </div>
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">✈️</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Load</p>
              <p className="text-3xl font-bold text-primary mt-2">
                {summaryStats.avgLoad.toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-primary mt-2">
                {formatCurrency(summaryStats.totalRevenue)}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Profit</p>
              <p className={`text-3xl font-bold mt-2 ${
                summaryStats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(summaryStats.totalProfit)}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Chart */}
      <Card className="mb-6" title="Bookings / Profit Trend">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="bookings" fill="#92408b" name="Bookings" />
            <Line yAxisId="right" type="monotone" dataKey="profit" stroke="#22c55e" name="Profit" strokeWidth={2} />
            <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#3b82f6" name="Revenue" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Detailed Table */}
      <Card title="Flight Profit/Loss Breakdown">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Flight No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aircraft</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seats Sold</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Load %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Fare</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Budget</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profit/Loss</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Margin</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFlights.length === 0 ? (
                <tr>
                  <td colSpan="13" className="px-6 py-4 text-center text-sm text-gray-500">
                    No flight data found
                  </td>
                </tr>
              ) : (
                filteredFlights.map((flight, index) => {
                  const calc = flight.calculations || {};
                  const profit = calc.profit || 0;
                  const margin = calc.profitMargin || 0;
                  
                  return (
                    <tr key={flight.flight.id || index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(flight.flight.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {flight.flight.flightNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {flight.flight.route || `${flight.flight.origin} → ${flight.flight.destination}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {flight.flight.aircraft || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {calc.capacity || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {calc.seatsSold || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {calc.bookingLoad ? `${calc.bookingLoad.toFixed(1)}%` : '0%'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(calc.avgFare || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(calc.revenue || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(calc.budgetPerFlight || 0)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        profit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(profit)}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        margin >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {margin.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEditFlight(flight)}
                          className="text-primary hover:text-primary-dark"
                        >
                          {flight.accounting ? 'Edit' : 'Add'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Accounting;
