import { useState, useEffect } from 'react';
import { MdCalendarToday, MdSearch, MdFilterList, MdDownload, MdPerson, MdFitnessCenter, MdLocalDrink, MdRestaurant, MdBedtime, MdTrendingUp, MdTrendingDown, MdCheckCircle, MdCancel } from 'react-icons/md';
import './DailyStatisticsPage.css';

interface DailyStatistic {
  statId: string;
  userId: string;
  planId: string;
  date: string;
  consumed: {
    hydration: number;
    calories: number;
    proteins: number;
    carbohydrates: number;
    fats: number;
  };
  burned: {
    calories: number;
    proteins: number;
    carbohydrates: number;
    fats: number;
    waterLoss: number;
  };
  net: {
    calories: number;
    proteins: number;
    carbohydrates: number;
    fats: number;
    hydration: number;
  };
  planTargets: {
    hydration: number;
    calories: number;
    proteins: number;
    carbohydrates: number;
    fats: number;
  };
  hoursSlept: number;
  workoutCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface User {
  uid: string;
  userId?: string;
  fullName: string;
  email: string;
}

const DailyStatisticsPage = () => {
  const [statistics, setStatistics] = useState<DailyStatistic[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const itemsPerPage = 9;
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchStatistics();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchStatistics = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('adminToken');
      console.log('Fetching from:', `${import.meta.env.VITE_BACKEND_URL}/daily-statistics`);
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/daily-statistics`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      console.log('Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Statistics data:', data);
        console.log('Number of records:', data.length);
        setStatistics(data);
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        setError(`Failed to fetch statistics: ${response.status}`);
      }
    } catch (error) {
      setError('Error fetching statistics');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.uid === userId || u.email === userId);
    return user ? `${user.fullName} (${user.email})` : userId;
  };

  const calculatePercentage = (actual: number, target: number) => {
    if (target === 0) return 0;
    return Math.round((actual / target) * 100);
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90 && percentage <= 110) return 'success';
    if (percentage >= 70 && percentage <= 130) return 'warning';
    return 'danger';
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 90 && percentage <= 110) return <MdCheckCircle />;
    return <MdCancel />;
  };

  const filteredStatistics = statistics.filter(stat => {
    const matchesSearch = selectedUserId === '' || stat.userId === selectedUserId;
    const matchesDate = !selectedDate || stat.date.startsWith(selectedDate);
    
    let matchesFilter = true;
    if (filterStatus === 'completed') {
      matchesFilter = stat.workoutCompleted;
    } else if (filterStatus === 'incomplete') {
      matchesFilter = !stat.workoutCompleted;
    } else if (filterStatus === 'target-met') {
      const caloriePercentage = calculatePercentage(stat.net.calories, stat.planTargets.calories);
      matchesFilter = caloriePercentage >= 90 && caloriePercentage <= 110;
    }

    return matchesSearch && matchesDate && matchesFilter;
  });

  console.log('Total statistics:', statistics.length);
  console.log('Filtered statistics:', filteredStatistics.length);
  console.log('Selected date:', selectedDate);
  console.log('Selected user:', selectedUserId);

  const totalPages = Math.ceil(filteredStatistics.length / itemsPerPage);
  const paginatedStatistics = filteredStatistics.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleClearFilters = () => {
    setSelectedDate('');
    setSelectedUserId('');
    setFilterStatus('all');
    setSearchTerm('');
    setCurrentPage(1);
  };

  return (
    <div className="daily-statistics-page">
      <div className="statistics-header">
        <div>
          <h1>Daily Statistics Dashboard</h1>
          <p>Comprehensive nutrition and activity tracking overview</p>
        </div>
        <div className="header-actions">
          <button className="btn-download" title="Export Data">
            <MdDownload /> Export
          </button>
        </div>
      </div>

      {/* Controls Section */}
      <div className="statistics-controls">
        <div className="search-filters-row">
          <div className="filter-group">
            <MdCalendarToday className="filter-icon" />
            <label className="filter-label">Date:</label>
            <input
              type="date"
              className="filter-date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="filter-group">
            <MdPerson className="filter-icon" />
            <label className="filter-label">User:</label>
            <select
              className="filter-select"
              value={selectedUserId}
              onChange={(e) => {
                setSelectedUserId(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Users</option>
              {users.map(user => (
                <option key={user.uid} value={user.uid}>{user.fullName}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <MdFilterList className="filter-icon" />
            <label className="filter-label">Status:</label>
            <select
              className="filter-select"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Status</option>
              <option value="completed">Workout Completed</option>
              <option value="incomplete">Workout Incomplete</option>
              <option value="target-met">Target Met</option>
            </select>
          </div>

          <button className="btn-clear" onClick={handleClearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Statistics Content */}
      {loading ? (
        <div className="loading">Loading statistics...</div>
      ) : filteredStatistics.length === 0 ? (
        <div className="no-data">
          <div className="no-data-icon"><MdFitnessCenter /></div>
          <h3>No Statistics Found</h3>
          <p>No daily statistics available for the selected filters</p>
        </div>
      ) : (
        <>
        <div className="statistics-table-container">
          <table className="statistics-table">
            <thead>
              <tr>
                    <th>Date</th>
                    <th>User</th>
                    <th>Hydration</th>
                    <th>Calories</th>
                    <th>Protein</th>
                    <th>Carbs</th>
                    <th>Fats</th>
                    <th>Sleep</th>
                    <th>Workout</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStatistics.map(stat => {
                    const caloriePercentage = calculatePercentage(stat.consumed.calories, stat.planTargets.calories);
                    const hydrationPercentage = calculatePercentage(stat.net.hydration, stat.planTargets.hydration);
                    
                    return (
                      <tr key={stat.statId}>
                        <td>{new Date(stat.date).toLocaleDateString()}</td>
                        <td>{getUserName(stat.userId)}</td>
                        <td>
                          <span className={`badge ${getStatusColor(hydrationPercentage)}`}>
                            {Math.round(stat.net.hydration * 10) / 10}L / {Math.round(stat.planTargets.hydration * 10) / 10}L
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getStatusColor(caloriePercentage)}`}>
                            {Math.round(stat.consumed.calories)} / {Math.round(stat.planTargets.calories)}
                          </span>
                        </td>
                        <td>{Math.round(stat.consumed.proteins)}g / {Math.round(stat.planTargets.proteins)}g</td>
                        <td>{Math.round(stat.consumed.carbohydrates)}g / {Math.round(stat.planTargets.carbohydrates)}g</td>
                        <td>{Math.round(stat.consumed.fats)}g / {Math.round(stat.planTargets.fats)}g</td>
                        <td>{Math.round(stat.hoursSlept * 10) / 10}h</td>
                        <td>
                          <span className={`workout-status ${stat.workoutCompleted ? 'done' : 'not-done'}`}>
                            {stat.workoutCompleted ? 'Done' : 'Skipped'}
                          </span>
                        </td>
                        <td>
                          <span className={`status-indicator ${getStatusColor(caloriePercentage)}`}>
                            {getStatusIcon(caloriePercentage)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </button>
              <div className="pagination-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                className="pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DailyStatisticsPage;
