import { useState, useEffect } from 'react';
import { MdClose, MdCalendarToday, MdViewList } from 'react-icons/md';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './WaterIntakePage.css';

interface SleepTracking {
  sleepId: string;
  userId: string;
  date: string;
  bedTime: string;
  wakeTime: string;
  totalHours: number;
  sleepQuality: 'poor' | 'fair' | 'good' | 'excellent';
  notes: string;
  targetHours: number;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  uid: string;
  fullName: string;
  email: string;
}

const SleepTrackingPage = () => {
  const [sleepRecords, setSleepRecords] = useState<SleepTracking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showUserSelectModal, setShowUserSelectModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedSleepRecord, setSelectedSleepRecord] = useState<SleepTracking | null>(null);
  const [formData, setFormData] = useState({
    bedTime: '',
    wakeTime: '',
    sleepQuality: 'good' as 'poor' | 'fair' | 'good' | 'excellent',
    notes: '',
  });

  useEffect(() => {
    fetchSleepRecords();
    fetchUsers();
    fetchSubscriptions();
  }, []);

  const fetchSleepRecords = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/sleep-tracking`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSleepRecords(data);
      }
    } catch (err) {
      console.error('Failed to fetch sleep records', err);
    } finally {
      setLoading(false);
    }
  };

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
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/subscriptions`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data);
      }
    } catch (err) {
      console.error('Failed to fetch subscriptions', err);
    }
  };

  const getLocalDateString = (dateInput: Date | string | any) => {
    let date: Date;
    
    if (typeof dateInput === 'string') {
      date = new Date(dateInput);
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else if (dateInput && typeof dateInput === 'object' && (dateInput._seconds || dateInput.seconds)) {
      // Firestore Timestamp object
      const seconds = dateInput._seconds || dateInput.seconds;
      date = new Date(seconds * 1000);
    } else if (dateInput && typeof dateInput === 'object' && dateInput.toDate) {
      // Firestore Timestamp with toDate method
      date = dateInput.toDate();
    } else {
      console.error('Invalid date format:', dateInput);
      return '';
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getQualityEmoji = (quality: string) => {
    switch (quality) {
      case 'poor': return '😟';
      case 'fair': return '😐';
      case 'good': return '😊';
      case 'excellent': return '🌟';
      default: return '😊';
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'poor': return '#ef4444';
      case 'fair': return '#f59e0b';
      case 'good': return '#10b981';
      case 'excellent': return '#8b5cf6';
      default: return '#10b981';
    }
  };

  const handleDeleteSleep = async (sleepId: string) => {
    if (!window.confirm('Are you sure you want to delete this sleep record?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/sleep-tracking/${sleepId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        await fetchSleepRecords();
        setSelectedSleepRecord(null);
      } else {
        setError('Failed to delete sleep record');
      }
    } catch (err) {
      setError('Error deleting sleep record');
    }
  };

  const handleUserSelect = (uid: string) => {
    setSelectedUserId(uid);
    setShowUserSelectModal(false);
    
    // Reset form
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    setFormData({
      bedTime: `${getLocalDateString(yesterday)}T23:00`,
      wakeTime: `${getLocalDateString(selectedDate || now)}T07:00`,
      sleepQuality: 'good',
      notes: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedUserId || !selectedDate) {
      setError('Please select a user and date');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/sleep-tracking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: selectedUserId,
          date: getLocalDateString(selectedDate) + 'T00:00:00.000Z',
          bedTime: new Date(formData.bedTime).toISOString(),
          wakeTime: new Date(formData.wakeTime).toISOString(),
          sleepQuality: formData.sleepQuality,
          notes: formData.notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create sleep record');
      }

      await fetchSleepRecords();
      setSelectedUserId('');
      setShowDayModal(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const calculateTotalHours = () => {
    if (!formData.bedTime || !formData.wakeTime) return 0;
    const bed = new Date(formData.bedTime);
    const wake = new Date(formData.wakeTime);
    const hours = (wake.getTime() - bed.getTime()) / (1000 * 60 * 60);
    return hours > 0 ? hours.toFixed(1) : 0;
  };

  return (
    <div className="water-intake-page">
      <div className="page-header">
        <div>
          <h1>😴 Sleep Tracking</h1>
          <p>Monitor sleep patterns and quality for users</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
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
              const hasSleep = sleepRecords.some(record => {
                const recordDateStr = getLocalDateString(record.date);
                return recordDateStr === dateStr;
              });
              return hasSleep ? 'has-progress' : '';
            }}
            tileContent={({ date }) => {
              const dateStr = getLocalDateString(date);
              const daySleep = sleepRecords.filter(record => {
                const recordDateStr = getLocalDateString(record.date);
                return recordDateStr === dateStr;
              });
              
              if (daySleep.length > 0) {
                return (
                  <div className="tile-indicator">
                    <span className="count">{daySleep.length}</span>
                  </div>
                );
              }
              return null;
            }}
          />
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="list-view">
          {sleepRecords.length === 0 ? (
            <div className="no-data">No sleep records found</div>
          ) : (
            <div className="intake-cards-grid">
              {sleepRecords.map((record) => {
                const user = users.find(u => u.uid === record.userId);
                const userName = user?.fullName || record.userId;
                
                return (
                  <div 
                    key={record.sleepId} 
                    className="intake-card clickable"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedSleepRecord(record)}
                  >
                    <div className="intake-card-header">
                      <h3>{userName}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span 
                          className="badge" 
                          style={{ 
                            background: getQualityColor(record.sleepQuality),
                            color: 'white'
                          }}
                        >
                          {getQualityEmoji(record.sleepQuality)} {record.sleepQuality}
                        </span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSleep(record.sleepId);
                          }}
                          title="Delete sleep record"
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
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <p className="intake-date">{formatDate(record.date)}</p>

                    <div className="sleep-summary" style={{ marginTop: '15px' }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '10px'
                      }}>
                        <span style={{ fontSize: '14px', color: '#64748b' }}>Sleep Duration</span>
                        <span style={{ 
                          fontSize: '18px', 
                          fontWeight: 'bold',
                          color: record.totalHours >= record.targetHours ? '#10b981' : '#f59e0b'
                        }}>
                          {record.totalHours}h / {record.targetHours}h
                        </span>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        fontSize: '13px',
                        color: '#94a3b8'
                      }}>
                        <span>🌙 {formatTime(record.bedTime)}</span>
                        <span>→</span>
                        <span>☀️ {formatTime(record.wakeTime)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Day Modal */}
      {showDayModal && selectedDate && (
        <div className="modal-overlay" onClick={() => setShowDayModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>😴 Sleep Records - {formatDate(selectedDate.toISOString())}</h2>
              <button 
                onClick={() => setShowUserSelectModal(true)} 
                className="btn btn-primary"
                style={{ 
                  marginRight: 'auto', 
                  marginLeft: '10px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
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
                const daySleep = sleepRecords.filter(record => {
                  const recordDateStr = getLocalDateString(record.date);
                  return recordDateStr === dateStr;
                });

                if (daySleep.length === 0) {
                  return <div className="no-data">No sleep records for this day. Click "Add User" to create one.</div>;
                }

                return (
                  <div className="intake-cards-grid">
                    {daySleep.map((record) => {
                      const user = users.find(u => u.uid === record.userId);
                      const userName = user?.fullName || record.userId;
                      
                      return (
                        <div 
                          key={record.sleepId} 
                          className="intake-card clickable"
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            setSelectedSleepRecord(record);
                            setShowDayModal(false);
                          }}
                        >
                          <div className="intake-card-header">
                            <h3>{userName}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span 
                                className="badge" 
                                style={{ 
                                  background: getQualityColor(record.sleepQuality),
                                  color: 'white'
                                }}
                              >
                                {getQualityEmoji(record.sleepQuality)} {record.sleepQuality}
                              </span>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSleep(record.sleepId);
                                }}
                                title="Delete sleep record"
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
                                  e.currentTarget.style.transform = 'scale(1.05)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)';
                                  e.currentTarget.style.transform = 'scale(1)';
                                }}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>

                          <div className="sleep-summary" style={{ marginTop: '15px' }}>
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '10px'
                            }}>
                              <span style={{ fontSize: '14px', color: '#64748b' }}>Sleep Duration</span>
                              <span style={{ 
                                fontSize: '18px', 
                                fontWeight: 'bold',
                                color: record.totalHours >= record.targetHours ? '#10b981' : '#f59e0b'
                              }}>
                                {record.totalHours}h / {record.targetHours}h
                              </span>
                            </div>
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              fontSize: '13px',
                              color: '#94a3b8'
                            }}>
                              <span>🌙 {formatTime(record.bedTime)}</span>
                              <span>→</span>
                              <span>☀️ {formatTime(record.wakeTime)}</span>
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

      {/* User Select Modal */}
      {showUserSelectModal && (
        <div className="modal-overlay" onClick={() => setShowUserSelectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select User for Sleep Tracking</h2>
              <button className="btn-close" onClick={() => setShowUserSelectModal(false)}>
                <MdClose />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Select User</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleUserSelect(e.target.value);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Choose a user...</option>
                  {users.map(user => {
                    const dateStr = selectedDate ? getLocalDateString(selectedDate) : '';
                    const hasRecord = sleepRecords.some(
                      record => record.userId === user.uid && getLocalDateString(record.date) === dateStr
                    );
                    const hasActivePlan = subscriptions.some(
                      sub => sub.userId === user.uid && sub.isActive === true
                    );

                    return (
                      <option
                        key={user.uid}
                        value={user.uid}
                        disabled={hasRecord || !hasActivePlan}
                      >
                        {user.fullName} ({user.email}) {hasRecord ? '- Already recorded' : !hasActivePlan ? '- Needs active plan' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Sleep Form Modal */}
      {selectedUserId && !showUserSelectModal && (
        <div className="modal-overlay" onClick={() => setSelectedUserId('')}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Sleep Record</h2>
              <button className="btn-close" onClick={() => setSelectedUserId('')}>
                <MdClose />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              {error && <div className="error-message">{error}</div>}

              <div className="form-group">
                <label>Bed Time</label>
                <input
                  type="datetime-local"
                  value={formData.bedTime}
                  onChange={(e) => setFormData({ ...formData, bedTime: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Wake Time</label>
                <input
                  type="datetime-local"
                  value={formData.wakeTime}
                  onChange={(e) => setFormData({ ...formData, wakeTime: e.target.value })}
                  required
                />
              </div>

              <div style={{ 
                padding: '12px', 
                background: '#f1f5f9', 
                borderRadius: '8px', 
                marginBottom: '15px',
                textAlign: 'center'
              }}>
                <strong>Total Hours: {calculateTotalHours()}h</strong>
              </div>

              <div className="form-group">
                <label>Sleep Quality</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  {(['poor', 'fair', 'good', 'excellent'] as const).map(quality => (
                    <button
                      key={quality}
                      type="button"
                      onClick={() => setFormData({ ...formData, sleepQuality: quality })}
                      style={{
                        padding: '12px',
                        border: formData.sleepQuality === quality ? '3px solid' : '2px solid #e2e8f0',
                        borderColor: formData.sleepQuality === quality ? getQualityColor(quality) : '#e2e8f0',
                        borderRadius: '8px',
                        background: formData.sleepQuality === quality ? `${getQualityColor(quality)}15` : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontSize: '24px',
                        textAlign: 'center'
                      }}
                    >
                      <div>{getQualityEmoji(quality)}</div>
                      <div style={{ fontSize: '12px', marginTop: '5px', textTransform: 'capitalize' }}>
                        {quality}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="How did you sleep?"
                  rows={3}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ 
                  width: '100%',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)'
                }}
              >
                Save Sleep Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Sleep Details Modal */}
      {selectedSleepRecord && !showDayModal && (
        <div className="modal-overlay" onClick={() => setSelectedSleepRecord(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>😴 Sleep Details</h2>
              <button className="btn-close" onClick={() => setSelectedSleepRecord(null)}>
                <MdClose />
              </button>
            </div>
            <div className="modal-body">
              <div className="details-section">
                <h3>User Information</h3>
                <p><strong>Name:</strong> {users.find(u => u.uid === selectedSleepRecord.userId)?.fullName}</p>
                <p><strong>Date:</strong> {formatDate(selectedSleepRecord.date)}</p>
              </div>

              <div className="details-section">
                <h3>Sleep Duration</h3>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '15px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  marginBottom: '15px'
                }}>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '5px' }}>Bed Time</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>🌙 {formatTime(selectedSleepRecord.bedTime)}</div>
                  </div>
                  <div style={{ fontSize: '24px', color: '#cbd5e1' }}>→</div>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '5px' }}>Wake Time</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>☀️ {formatTime(selectedSleepRecord.wakeTime)}</div>
                  </div>
                </div>
                <div style={{ 
                  textAlign: 'center',
                  padding: '15px',
                  background: selectedSleepRecord.totalHours >= selectedSleepRecord.targetHours ? '#dcfce7' : '#fef3c7',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '5px' }}>Total Sleep</div>
                  <div style={{ 
                    fontSize: '28px', 
                    fontWeight: 'bold',
                    color: selectedSleepRecord.totalHours >= selectedSleepRecord.targetHours ? '#16a34a' : '#d97706'
                  }}>
                    {selectedSleepRecord.totalHours}h / {selectedSleepRecord.targetHours}h
                  </div>
                </div>
              </div>

              <div className="details-section">
                <h3>Sleep Quality</h3>
                <div style={{ 
                  display: 'inline-block',
                  padding: '10px 20px',
                  background: getQualityColor(selectedSleepRecord.sleepQuality),
                  color: 'white',
                  borderRadius: '20px',
                  fontSize: '18px'
                }}>
                  {getQualityEmoji(selectedSleepRecord.sleepQuality)} {selectedSleepRecord.sleepQuality.charAt(0).toUpperCase() + selectedSleepRecord.sleepQuality.slice(1)}
                </div>
              </div>

              {selectedSleepRecord.notes && (
                <div className="details-section">
                  <h3>Notes</h3>
                  <p style={{ 
                    padding: '12px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    fontStyle: 'italic'
                  }}>
                    {selectedSleepRecord.notes}
                  </p>
                </div>
              )}

              <button 
                onClick={() => handleDeleteSleep(selectedSleepRecord.sleepId)}
                className="btn"
                style={{ 
                  width: '100%',
                  background: '#ef4444',
                  color: 'white',
                  marginTop: '20px'
                }}
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SleepTrackingPage;
