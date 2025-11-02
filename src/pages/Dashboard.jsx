import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '../components/Card';
import { employeesAPI } from '../api/employees';
import { flightsAPI } from '../api/flights';
import { campaignsAPI } from '../api/campaigns';
import { tasksAPI } from '../api/tasks';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';

const Dashboard = () => {
  const { user, isAllowed } = useAuth();
  const [stats, setStats] = useState({
    employees: 0,
    flightsToday: 0,
    campaigns: 0,
    tasks: 0,
  });
  const [flightData, setFlightData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const today = dayjs().format('YYYY-MM-DD');
        
        // Fetch data based on user's module access
        // Employees (requires hrms module)
        const employeesPromise = (isAllowed('hrms') || user?.role === 'superadmin')
          ? employeesAPI.getAll().catch(() => ({ data: { data: [] } }))
          : Promise.resolve({ data: { data: [] } });
        
        // Flights (requires flightManagement module)
        const flightsTodayPromise = (isAllowed('flightManagement') || user?.role === 'superadmin')
          ? flightsAPI.getToday().catch(() => ({ data: { data: [] } }))
          : Promise.resolve({ data: { data: [] } });
        
        const flightsSummaryPromise = (isAllowed('flightManagement') || user?.role === 'superadmin')
          ? flightsAPI.getSummary(today).catch(() => ({ data: { success: false, data: {} } }))
          : Promise.resolve({ data: { success: false, data: {} } });
        
        // Campaigns (requires campaigns module)
        const campaignsPromise = (isAllowed('campaigns') || user?.role === 'superadmin')
          ? campaignsAPI.getAll().catch(() => ({ data: { data: [] } }))
          : Promise.resolve({ data: { data: [] } });
        
        // Tasks (no specific module required - accessible to all authenticated users)
        const tasksPromise = tasksAPI.getAll().catch(() => ({ data: { data: [] } }));

        const [employeesRes, flightsTodayRes, campaignsRes, tasksRes, summaryRes] = await Promise.all([
          employeesPromise,
          flightsTodayPromise,
          campaignsPromise,
          tasksPromise,
          flightsSummaryPromise,
        ]);

        setStats({
          employees: employeesRes.data?.data?.length || 0,
          flightsToday: flightsTodayRes.data?.data?.length || 0,
          campaigns: campaignsRes.data?.data?.length || 0,
          tasks: tasksRes.data?.data?.length || 0,
        });

        // Format flight summary data for chart
        if (summaryRes?.data?.success && summaryRes.data.data?.hourlyTimeline) {
          setFlightData(summaryRes.data.data.hourlyTimeline);
        } else {
          setFlightData([]);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set defaults on error
        setStats({ employees: 0, flightsToday: 0, campaigns: 0, tasks: 0 });
        setFlightData([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [user, isAllowed]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Employees</p>
              <p className="text-3xl font-bold text-primary mt-2">{stats.employees}</p>
            </div>
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Flights Today</p>
              <p className="text-3xl font-bold text-primary mt-2">{stats.flightsToday}</p>
            </div>
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">✈️</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Running Campaigns</p>
              <p className="text-3xl font-bold text-primary mt-2">{stats.campaigns}</p>
            </div>
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📢</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Open Tasks</p>
              <p className="text-3xl font-bold text-primary mt-2">{stats.tasks}</p>
            </div>
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Flights Chart */}
      <Card title="Flights per Hour Today" subtitle={`${dayjs().format('MMMM D, YYYY')}`}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={flightData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#92408b" name="Flights" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default Dashboard;
