import { useState, useEffect } from 'react';
import { MdDelete, MdClose, MdWaterDrop, MdCalendarToday, MdViewList } from 'react-icons/md';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './WaterIntakePage.css';

interface WaterLog {
  logId: string;
  amount: number;
  timestamp: string;
  note?: string;
}

interface WaterIntake {
  intakeId: string;
  userId: string;
  date: string;
  logs: WaterLog[];
  totalConsumed: number;
  dailyTarget: number;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  uid: string;
  fullName: string;
  email: string;
}

const WaterIntakePage = () => {
  const [waterIntakes, setWaterIntakes] = useState<WaterIntake[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showAddLogModal, setShowAddLogModal] = useState(false);
  const [showUserSelectModal, setShowUserSelectModal] = useState(false);
  const [selectedIntake, setSelectedIntake] = useState<WaterIntake | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [error, setError] = useState('');
  const [plans, setPlans] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    userId: '',
    amount: 0.25,
    note: '',
  });

  useEffect(() => {
    fetchWaterIntakes();
    fetchUsers();
    fetchPlans();
    fetchSubscriptions();
  }, []);

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/plans`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch plans');

      const data = await response.json();
      setPlans(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/subscriptions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch subscriptions');

      const data = await response.json();
      setSubscriptions(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchWaterIntakes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/water-intake`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch water intakes');

      const data = await response.json();
      setWaterIntakes(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch users');

      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddLog = async (intakeId: string) => {
    try {
      // Find the current intake to check limits
      const currentIntake = waterIntakes.find(w => w.intakeId === intakeId);
      if (currentIntake) {
        const newTotal = currentIntake.totalConsumed + formData.amount;
        if (newTotal > currentIntake.dailyTarget) {
          const confirmExceed = window.confirm(
            `Adding ${formData.amount}L will bring total to ${newTotal.toFixed(2)}L, exceeding the daily target of ${currentIntake.dailyTarget}L. Continue anyway?`
          );
          if (!confirmExceed) return;
        }
      }

      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/water-intake/${intakeId}/log`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: formData.amount,
            timestamp: new Date().toISOString(),
            note: formData.note,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to add water log');

      await fetchWaterIntakes();
      setShowAddLogModal(false);
      setFormData({ ...formData, amount: 0.25, note: '' });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateIntake = async (userId: string) => {
    if (!selectedDate) return;

    try {
      const token = localStorage.getItem('adminToken');
      
      // Get user's active subscription to find daily target
      const subsResponse = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/subscriptions/user/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      let dailyTarget = 2.5; // Default
      
      if (subsResponse.ok) {
        const subscriptions = await subsResponse.json();
        
        // Find active subscription
        const activeSubscription = Array.isArray(subscriptions) 
          ? subscriptions.find(sub => sub.isActive === true)
          : subscriptions;
        
        if (activeSubscription && activeSubscription.planId) {
          const plan = plans.find(p => p.planId === activeSubscription.planId);
          
          if (plan && plan.dailyHydration) {
            dailyTarget = plan.dailyHydration;
          }
        }
      }

      // Create water intake with empty logs
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/water-intake`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId,
            date: selectedDate.toISOString(),
            logs: [],
            dailyTarget,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create water intake');
      }

      await fetchWaterIntakes();
      setShowUserSelectModal(false);
      // Keep day modal open to show the newly created intake
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteLog = async (intakeId: string, logId: string) => {
    if (!confirm('Are you sure you want to delete this water log?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/water-intake/${intakeId}/log/${logId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to delete water log');

      // Parse the updated water intake from the response
      const updatedIntake = await response.json();
      
      // Update the selected intake to reflect changes immediately
      if (selectedIntake && selectedIntake.intakeId === intakeId) {
        setSelectedIntake(updatedIntake);
      }
      
      await fetchWaterIntakes();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteIntake = async (intakeId: string) => {
    if (!confirm('Are you sure you want to delete this entire day\'s water intake?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/water-intake/${intakeId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to delete water intake');

      await fetchWaterIntakes();
      setShowDayModal(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getLocalDateString = (date: Date | string | any) => {
    let d: Date;
    
    if (typeof date === 'string') {
      d = new Date(date);
    } else if (date instanceof Date) {
      d = date;
    } else if (date && typeof date === 'object' && (date._seconds || date.seconds)) {
      // Firestore Timestamp object
      const seconds = date._seconds || date.seconds;
      d = new Date(seconds * 1000);
    } else if (date && typeof date === 'object' && date.toDate) {
      // Firestore Timestamp with toDate method
      d = date.toDate();
    } else {
      console.error('Invalid date format:', date);
      return '';
    }
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="water-intake-page">
      <div className="page-header">
        <div>
          <h1>💧 Water Intake Tracking</h1>
          <p>Monitor daily hydration for all users</p>
        </div>
        <div className="header-actions">
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
              title="Calendar View"
            >
              <MdCalendarToday />
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <MdViewList />
            </button>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {viewMode === 'calendar' && (
        <div className="calendar-view">
          <Calendar
            value={selectedDate}
            onChange={(value) => {
              const date = value as Date;
              setSelectedDate(date);
              setShowDayModal(true);
            }}
            tileClassName={({ date }) => {
              const dateStr = getLocalDateString(date);
              const hasIntake = waterIntakes.some(intake => {
                const intakeDateStr = getLocalDateString(intake.date);
                return intakeDateStr === dateStr;
              });
              return hasIntake ? 'has-intake' : '';
            }}
            tileContent={({ date }) => {
              const dateStr = getLocalDateString(date);
              const dayIntakes = waterIntakes.filter(intake => {
                const intakeDateStr = getLocalDateString(intake.date);
                return intakeDateStr === dateStr;
              });
              if (dayIntakes.length > 0) {
                const totalLiters = dayIntakes.reduce((sum, intake) => sum + intake.totalConsumed, 0);
                return <div className="intake-indicator">{totalLiters.toFixed(1)}L</div>;
              }
              return null;
            }}
          />
        </div>
      )}

      {viewMode === 'list' && loading ? (
        <div className="loading">Loading water intakes...</div>
      ) : viewMode === 'list' ? (
        <div className="intake-list">
          {waterIntakes.length === 0 ? (
            <div className="no-data">No water intake records found</div>
          ) : (
            waterIntakes.map((intake) => (
              <div key={intake.intakeId} className="intake-card">
                <div className="intake-header">
                  <div>
                    <h3>{formatDate(intake.date)}</h3>
                    <p className="intake-user">User: {intake.userId}</p>
                  </div>
                  <button
                    className="btn-icon btn-danger"
                    onClick={() => handleDeleteIntake(intake.intakeId)}
                    title="Delete"
                  >
                    <MdDelete />
                  </button>
                </div>

                <div className="progress-container">
                  <div className="progress-info">
                    <span className="progress-label">Daily Progress</span>
                    <span className="progress-value">
                      {intake.totalConsumed.toFixed(2)}L / {intake.dailyTarget}L
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${Math.min((intake.totalConsumed / intake.dailyTarget) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="logs-summary">
                  <MdWaterDrop /> {intake.logs.length} log{intake.logs.length !== 1 ? 's' : ''}
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}

      {showDayModal && selectedDate && (
        <div className="modal-overlay" onClick={() => setShowDayModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💧 Water Intake - {formatDate(selectedDate.toISOString())}</h2>
              <button 
                onClick={() => setShowUserSelectModal(true)} 
                className="btn btn-primary"
                style={{ 
                  marginRight: 'auto', 
                  marginLeft: '10px',
                  background: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)',
                  color: 'white',
                  border: 'none'
                }}
              >
                Add User
              </button>
              <button className="btn-close" onClick={() => setShowDayModal(false)}>
                <MdClose />
              </button>
            </div>

            <div className="modal-body">
              {(() => {
                const dateStr = getLocalDateString(selectedDate);
                const dayIntakes = waterIntakes.filter(intake => {
                  const intakeDateStr = getLocalDateString(intake.date);
                  return intakeDateStr === dateStr;
                });

                if (dayIntakes.length === 0) {
                  return <div className="no-data">No water intake records for this day. Click "Add User" to create one.</div>;
                }

                return (
                  <div className="intake-cards-grid">
                    {dayIntakes.map((intake) => {
                      const user = users.find(u => u.uid === intake.userId);
                      const userName = user?.fullName || intake.userId;
                      
                      return (
                        <div 
                          key={intake.intakeId} 
                          className="intake-card clickable"
                          style={{ position: 'relative' }}
                        >
                          <div 
                            onClick={() => {
                              setSelectedIntake(intake);
                              setShowAddLogModal(true);
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="intake-card-header">
                              <h3>{userName}</h3>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="badge">{intake.logs.length} logs</span>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteIntake(intake.intakeId);
                                  }}
                                  title="Delete water intake"
                                  style={{
                                    background: 'rgba(239, 68, 68, 0.9)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    width: '28px',
                                    height: '28px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    fontSize: '14px',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(220, 38, 38, 1)';
                                    e.currentTarget.style.transform = 'scale(1.1)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)';
                                    e.currentTarget.style.transform = 'scale(1)';
                                  }}
                                >
                                  <MdDelete />
                                </button>
                              </div>
                            </div>

                            <div className="progress-container">
                              <div className="progress-info">
                                <span className="progress-label">Daily Progress</span>
                                <span className="progress-value">
                                  {intake.totalConsumed.toFixed(2)}L / {intake.dailyTarget}L
                                </span>
                              </div>
                              <div className="progress-bar">
                                <div
                                  className="progress-fill"
                                  style={{ 
                                    width: `${Math.min((intake.totalConsumed / intake.dailyTarget) * 100, 100)}%`,
                                    backgroundColor: intake.totalConsumed > intake.dailyTarget ? '#ef4444' : '#06B6D4'
                                  }}
                                />
                              </div>
                            </div>

                            <div className="intake-card-footer">
                              <small>Click to manage logs</small>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Add/Manage Logs Modal */}
      {showAddLogModal && selectedIntake && (
        <div className="modal-overlay" onClick={() => setShowAddLogModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>Manage Water Intake</h2>
              <button className="btn-close" onClick={() => setShowAddLogModal(false)}>
                <MdClose />
              </button>
            </div>

            <div className="modal-body">
              {(() => {
                const user = users.find(u => u.uid === selectedIntake.userId);
                const userName = user?.fullName || selectedIntake.userId;
                
                return (
                  <>
                    <div className="user-info-section">
                      <h3>{userName}</h3>
                      <div className="progress-info">
                        <span className="progress-value">
                          {selectedIntake.totalConsumed.toFixed(2)}L / {selectedIntake.dailyTarget}L
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ 
                            width: `${Math.min((selectedIntake.totalConsumed / selectedIntake.dailyTarget) * 100, 100)}%`,
                            backgroundColor: selectedIntake.totalConsumed > selectedIntake.dailyTarget ? '#ef4444' : '#06B6D4'
                          }}
                        />
                      </div>
                    </div>

                    {/* Existing Logs */}
                    {selectedIntake.logs.length > 0 && (
                      <div className="logs-section">
                        <h4>Water Logs</h4>
                        <div className="logs-list">
                          {selectedIntake.logs.map((log) => (
                            <div key={log.logId} className="log-card">
                              <div className="log-content">
                                <div className="log-amount">
                                  <MdWaterDrop /> {log.amount}L
                                </div>
                                <div className="log-time">{formatTime(log.timestamp)}</div>
                                {log.note && <div className="log-note">{log.note}</div>}
                              </div>
                              <button
                                className="btn-icon btn-danger"
                                onClick={() => handleDeleteLog(selectedIntake.intakeId, log.logId)}
                                title="Delete"
                              >
                                <MdDelete />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add New Log Form */}
                    <div className="add-log-section">
                      <h4>Add New Log</h4>
                      
                      <div className="quick-add-buttons">
                        {[0.25, 0.5, 0.75, 1].map((amount) => (
                          <button
                            key={amount}
                            className={`quick-add-btn ${formData.amount === amount ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, amount })}
                          >
                            {amount}L
                          </button>
                        ))}
                      </div>

                      <div className="form-group">
                        <label>Custom Amount (Liters)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          className="form-control"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                        />
                      </div>

                      <div className="form-group">
                        <label>Note (Optional)</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g., After workout"
                          value={formData.note}
                          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                        />
                      </div>

                      <button
                        className="submit-button"
                        onClick={() => handleAddLog(selectedIntake.intakeId)}
                      >
                        <MdWaterDrop /> Add Log
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* User Selection Modal */}
      {showUserSelectModal && selectedDate && (
        <div className="modal-overlay" onClick={() => {
          setShowUserSelectModal(false);
          setSelectedUserId('');
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Select User for {formatDate(selectedDate.toISOString())}</h2>
              <button className="btn-close" onClick={() => {
                setShowUserSelectModal(false);
                setSelectedUserId('');
              }}>
                <MdClose />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>User</label>
                <select 
                  className="form-control"
                  value={selectedUserId}
                  onChange={(e) => {
                    setSelectedUserId(e.target.value);
                  }}
                >
                  <option value="">-- Select a User --</option>
                  {users.map((user) => {
                    // Check if this user already has intake for selected date
                    const dateStr = getLocalDateString(selectedDate);
                    const hasIntake = waterIntakes.some(intake => {
                      const intakeDateStr = getLocalDateString(intake.date);
                      return intake.userId === user.uid && intakeDateStr === dateStr;
                    });

                    // Check if user has active subscription
                    const hasActivePlan = subscriptions.some(sub => 
                      sub.userId === user.uid && sub.isActive === true
                    );

                    return (
                      <option 
                        key={user.uid} 
                        value={user.uid}
                        disabled={hasIntake || !hasActivePlan}
                        style={{
                          color: (hasIntake || !hasActivePlan) ? '#9CA3AF' : 'inherit',
                          fontStyle: (hasIntake || !hasActivePlan) ? 'italic' : 'normal'
                        }}
                      >
                        {user.fullName} ({user.email}) {hasIntake ? '- Already has intake' : !hasActivePlan ? '- Needs active plan' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedUserId && (
                <button
                  className="submit-button"
                  style={{
                    background: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    width: '100%',
                    marginTop: '20px',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}
                  onClick={async () => {
                    try {
                      // Create water intake (disabled users are already filtered out)
                      await handleCreateIntake(selectedUserId);
                      setSelectedUserId('');
                      
                    } catch (err: any) {
                      console.error('Error:', err);
                      alert(err.message || 'Failed to create water intake');
                    }
                  }}
                >
                  Create Water Intake
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaterIntakePage;
