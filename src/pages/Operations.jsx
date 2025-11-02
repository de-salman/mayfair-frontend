import { useState, useEffect } from 'react';
import { flightsAPI } from '../api/flights';
import { employeesAPI } from '../api/employees';
import Card from '../components/Card';

const Operations = () => {
  const [aircrafts, setAircrafts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [flightsRes, employeesRes] = await Promise.all([
        flightsAPI.getAll(),
        employeesAPI.getAll(),
      ]);

      // Extract unique aircrafts from flights
      const flights = flightsRes.data.data || [];
      const uniqueAircrafts = [...new Set(flights.map(f => f.aircraft).filter(Boolean))];
      setAircrafts(uniqueAircrafts.map(name => ({ name, flights: flights.filter(f => f.aircraft === name).length })));

      setEmployees(employeesRes.data.data || []);
      
      // Mock crew assignments (in real app, this would be a separate API)
      setAssignments([
        { aircraft: 'Boeing 777', pilot: 'Robert Miller', coPilot: 'Sarah Williams', date: '2024-01-20' },
        { aircraft: 'Airbus A380', pilot: 'John Doe', coPilot: 'Mike Johnson', date: '2024-01-21' },
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Operations</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aircraft List */}
        <Card title="Aircraft Fleet">
          <div className="space-y-4">
            {aircrafts.length > 0 ? (
              aircrafts.map((aircraft, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">{aircraft.name}</p>
                    <p className="text-sm text-gray-500">{aircraft.flights} flights scheduled</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No aircraft data available</p>
            )}
          </div>
        </Card>

        {/* Crew Assignments */}
        <Card title="Crew Assignments">
          <div className="space-y-4">
            {assignments.length > 0 ? (
              assignments.map((assignment, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-900">{assignment.aircraft}</p>
                    <p className="text-sm text-gray-500">{assignment.date}</p>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Pilot: {assignment.pilot}</p>
                    <p>Co-Pilot: {assignment.coPilot}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No crew assignments available</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Operations;
