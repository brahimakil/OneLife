import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { MdDelete, MdClose, MdCalendarToday, MdViewList, MdAdd } from 'react-icons/md';
import 'react-calendar/dist/Calendar.css';

interface User {
  id: string;
  uid: string;
  fullName: string;
  email: string;
}

interface FoodItem {
  itemName: string;
  quantity: number;
  unit: string;
  calories: number;
  proteins: number;
  carbohydrates: number;
  fats: number;
}

interface Meal {
  mealId: string;
  mealType: string;
  timestamp: string;
  items: FoodItem[];
  mealTotal: {
    calories: number;
    proteins: number;
    carbohydrates: number;
    fats: number;
  };
}

interface FoodIntake {
  foodId: string;
  userId: string;
  date: string;
  meals: Meal[];
  totalConsumed: {
    calories: number;
    proteins: number;
    carbohydrates: number;
    fats: number;
  };
  dailyTargets: {
    calories: number;
    proteins: number;
    carbohydrates: number;
    fats: number;
  };
  createdAt: string;
  updatedAt: string;
}

const FoodIntakePage = () => {
  const [foodIntakes, setFoodIntakes] = useState<FoodIntake[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showMealModal, setShowMealModal] = useState(false);
  const [showUserSelectModal, setShowUserSelectModal] = useState(false);
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [selectedFoodIntake, setSelectedFoodIntake] = useState<FoodIntake | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [error, setError] = useState('');
  const [plans, setPlans] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  const [mealFormData, setMealFormData] = useState({
    mealType: 'breakfast',
    items: [] as FoodItem[],
  });

  const [currentItem, setCurrentItem] = useState<FoodItem>({
    itemName: '',
    quantity: 0,
    unit: 'grams',
    calories: 0,
    proteins: 0,
    carbohydrates: 0,
    fats: 0,
  });

  const resetCurrentItem = () => {
    setCurrentItem({
      itemName: '',
      quantity: 0,
      unit: 'grams',
      calories: 0,
      proteins: 0,
      carbohydrates: 0,
      fats: 0,
    });
  };

  useEffect(() => {
    fetchFoodIntakes();
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

  const fetchFoodIntakes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/food-intake`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch food intakes');

      const data = await response.json();
      setFoodIntakes(data);
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

  const handleCreateFoodIntake = async (userId: string) => {
    if (!selectedDate) return;

    try {
      const token = localStorage.getItem('adminToken');
      
      // Get user's active subscription to find daily targets
      const subsResponse = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/subscriptions/user/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      let dailyTargets = {
        calories: 2000,
        proteins: 150,
        carbohydrates: 200,
        fats: 65,
      };
      
      if (subsResponse.ok) {
        const subscriptions = await subsResponse.json();
        
        // Find active subscription
        const activeSubscription = Array.isArray(subscriptions) 
          ? subscriptions.find(sub => sub.isActive === true)
          : subscriptions;
        
        if (activeSubscription && activeSubscription.planId) {
          const plan = plans.find(p => p.planId === activeSubscription.planId);
          
          if (plan) {
            dailyTargets = {
              calories: plan.dailyCalories || 2000,
              proteins: plan.dailyProteins || 150,
              carbohydrates: plan.dailyCarbohydrates || 200,
              fats: plan.dailyFats || 65,
            };
          }
        }
      }

      // Create food intake with empty meals
      // Convert local date to UTC midnight to avoid timezone issues
      const utcDate = new Date(Date.UTC(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        0, 0, 0, 0
      ));
      
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/food-intake`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId,
            date: utcDate.toISOString(),
            meals: [],
            dailyTargets,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create food intake');
      }

      await fetchFoodIntakes();
      setShowUserSelectModal(false);
      setSelectedUserId('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteFoodIntake = async (foodId: string) => {
    if (!confirm('Are you sure you want to delete this entire day\'s food intake?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/food-intake/${foodId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to delete food intake');

      await fetchFoodIntakes();
      setShowDayModal(false);
      setSelectedFoodIntake(null);
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
    <div className="food-intake-page">
      <div className="page-header">
        <div>
          <h1>🍽️ Food Intake Tracking</h1>
          <p>Monitor daily nutrition and meals for all users</p>
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
              const hasFoodIntake = foodIntakes.some(intake => {
                const intakeDateStr = getLocalDateString(intake.date);
                return intakeDateStr === dateStr;
              });
              return hasFoodIntake ? 'has-progress' : '';
            }}
            tileContent={({ date }) => {
              const dateStr = getLocalDateString(date);
              const dayIntakes = foodIntakes.filter(intake => {
                const intakeDateStr = getLocalDateString(intake.date);
                return intakeDateStr === dateStr;
              });
              
              if (dayIntakes.length > 0) {
                return (
                  <div className="tile-indicator">
                    <span className="count">{dayIntakes.length}</span>
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
          {foodIntakes.length === 0 ? (
            <div className="no-data">No food intake records found</div>
          ) : (
            <div className="intake-cards-grid">
              {foodIntakes.map((intake) => {
                const user = users.find(u => u.uid === intake.userId);
                const userName = user?.fullName || intake.userId;
                
                return (
                  <div 
                    key={intake.foodId} 
                    className="intake-card clickable"
                    style={{ cursor: 'pointer' }}
                  >
                    <div 
                      onClick={() => {
                        setSelectedFoodIntake(intake);
                      }}
                    >
                      <div className="intake-card-header">
                        <h3>{userName}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="badge">{intake.meals.length} meals</span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFoodIntake(intake.foodId);
                            }}
                            title="Delete food intake"
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
                      <p className="intake-date">{formatDate(intake.date)}</p>

                      <div className="nutrition-summary">
                        <div className="nutrition-item">
                          <span className="label">🔥 Calories</span>
                          <span className="value">
                            {intake.totalConsumed.calories.toFixed(0)} / {intake.dailyTargets.calories}
                          </span>
                        </div>
                        <div className="nutrition-item">
                          <span className="label">🥩 Protein</span>
                          <span className="value">
                            {intake.totalConsumed.proteins.toFixed(1)}g / {intake.dailyTargets.proteins}g
                          </span>
                        </div>
                        <div className="nutrition-item">
                          <span className="label">🍞 Carbs</span>
                          <span className="value">
                            {intake.totalConsumed.carbohydrates.toFixed(1)}g / {intake.dailyTargets.carbohydrates}g
                          </span>
                        </div>
                        <div className="nutrition-item">
                          <span className="label">🥑 Fats</span>
                          <span className="value">
                            {intake.totalConsumed.fats.toFixed(1)}g / {intake.dailyTargets.fats}g
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Day Modal - Shows all users' food intakes for selected day */}
      {showDayModal && selectedDate && (
        <div className="modal-overlay" onClick={() => setShowDayModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🍽️ Food Intake - {formatDate(selectedDate.toISOString())}</h2>
              <button 
                onClick={() => setShowUserSelectModal(true)} 
                className="btn btn-primary"
                style={{ 
                  marginRight: 'auto', 
                  marginLeft: '10px',
                  background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
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
                const dayIntakes = foodIntakes.filter(intake => {
                  const intakeDateStr = getLocalDateString(intake.date);
                  return intakeDateStr === dateStr;
                });

                if (dayIntakes.length === 0) {
                  return <div className="no-data">No food intake records for this day. Click "Add User" to create one.</div>;
                }

                return (
                  <div className="intake-cards-grid">
                    {dayIntakes.map((intake) => {
                      const user = users.find(u => u.uid === intake.userId);
                      const userName = user?.fullName || intake.userId;
                      
                      return (
                        <div 
                          key={intake.foodId} 
                          className="intake-card clickable"
                          style={{ cursor: 'pointer' }}
                        >
                          <div 
                            onClick={() => {
                              setSelectedFoodIntake(intake);
                              setShowDayModal(false);
                            }}
                          >
                            <div className="intake-card-header">
                              <h3>{userName}</h3>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="badge">{intake.meals.length} meals</span>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFoodIntake(intake.foodId);
                                  }}
                                  title="Delete food intake"
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

                          {/* Nutrition Progress Bars */}
                          <div className="nutrition-progress">
                            <div className="progress-item">
                              <div className="progress-label">
                                <span>Calories</span>
                                <span>{intake.totalConsumed.calories} / {intake.dailyTargets.calories}</span>
                              </div>
                              <div className="progress-bar">
                                <div
                                  className="progress-fill"
                                  style={{ 
                                    width: `${Math.min((intake.totalConsumed.calories / intake.dailyTargets.calories) * 100, 100)}%`,
                                    backgroundColor: '#FF6B35'
                                  }}
                                />
                              </div>
                            </div>

                            <div className="progress-item">
                              <div className="progress-label">
                                <span>Protein</span>
                                <span>{intake.totalConsumed.proteins}g / {intake.dailyTargets.proteins}g</span>
                              </div>
                              <div className="progress-bar">
                                <div
                                  className="progress-fill"
                                  style={{ 
                                    width: `${Math.min((intake.totalConsumed.proteins / intake.dailyTargets.proteins) * 100, 100)}%`,
                                    backgroundColor: '#3B82F6'
                                  }}
                                />
                              </div>
                            </div>

                            <div className="progress-item">
                              <div className="progress-label">
                                <span>Carbs</span>
                                <span>{intake.totalConsumed.carbohydrates}g / {intake.dailyTargets.carbohydrates}g</span>
                              </div>
                              <div className="progress-bar">
                                <div
                                  className="progress-fill"
                                  style={{ 
                                    width: `${Math.min((intake.totalConsumed.carbohydrates / intake.dailyTargets.carbohydrates) * 100, 100)}%`,
                                    backgroundColor: '#10B981'
                                  }}
                                />
                              </div>
                            </div>

                            <div className="progress-item">
                              <div className="progress-label">
                                <span>Fats</span>
                                <span>{intake.totalConsumed.fats}g / {intake.dailyTargets.fats}g</span>
                              </div>
                              <div className="progress-bar">
                                <div
                                  className="progress-fill"
                                  style={{ 
                                    width: `${Math.min((intake.totalConsumed.fats / intake.dailyTargets.fats) * 100, 100)}%`,
                                    backgroundColor: '#F59E0B'
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="intake-card-footer">
                            <small>Click to view and manage meals</small>
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
                    // Check if this user already has food intake for selected date
                    const dateStr = getLocalDateString(selectedDate);
                    const hasIntake = foodIntakes.some(intake => {
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
                    background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
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
                      await handleCreateFoodIntake(selectedUserId);
                      setSelectedUserId('');
                      
                    } catch (err: any) {
                      console.error('Error:', err);
                      alert(err.message || 'Failed to create food intake');
                    }
                  }}
                >
                  Create Food Intake
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Food Intake Detail Modal */}
      {selectedFoodIntake && (
        <div className="modal-overlay" onClick={() => {
          setSelectedFoodIntake(null);
          setShowDayModal(true);
        }}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {users.find(u => u.uid === selectedFoodIntake.userId)?.fullName || 'User'} - 
                {formatDate(selectedFoodIntake.date)}
              </h2>
              <button className="btn-close" onClick={() => {
                setSelectedFoodIntake(null);
                setShowDayModal(true);
              }}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="food-intake-detail">
                <div className="detail-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowMealModal(true)}
                  >
                    <MdAdd /> Add Meal
                  </button>
                </div>

                {/* Nutrition Summary */}
                <div className="nutrition-summary">
                  <h3>Daily Nutrition Summary</h3>
                  <div className="nutrition-grid">
                    <div className="nutrition-card">
                      <div className="nutrition-value">{selectedFoodIntake.totalConsumed.calories}</div>
                      <div className="nutrition-label">Calories</div>
                      <div className="nutrition-target">Target: {selectedFoodIntake.dailyTargets.calories}</div>
                    </div>
                    <div className="nutrition-card">
                      <div className="nutrition-value">{selectedFoodIntake.totalConsumed.proteins}g</div>
                      <div className="nutrition-label">Protein</div>
                      <div className="nutrition-target">Target: {selectedFoodIntake.dailyTargets.proteins}g</div>
                    </div>
                    <div className="nutrition-card">
                      <div className="nutrition-value">{selectedFoodIntake.totalConsumed.carbohydrates}g</div>
                      <div className="nutrition-label">Carbs</div>
                      <div className="nutrition-target">Target: {selectedFoodIntake.dailyTargets.carbohydrates}g</div>
                    </div>
                    <div className="nutrition-card">
                      <div className="nutrition-value">{selectedFoodIntake.totalConsumed.fats}g</div>
                      <div className="nutrition-label">Fats</div>
                      <div className="nutrition-target">Target: {selectedFoodIntake.dailyTargets.fats}g</div>
                    </div>
                  </div>
                </div>

                {/* Meals List */}
                <div className="meals-section">
                  <h3>Meals ({selectedFoodIntake.meals.length})</h3>
                  {selectedFoodIntake.meals.length === 0 ? (
                    <div className="no-data">No meals logged yet. Click "Add Meal" to start.</div>
                  ) : (
                    <div className="meals-list">
                      {selectedFoodIntake.meals.map((meal) => (
                        <div key={meal.mealId} className="meal-card">
                          <div className="meal-header">
                            <div>
                              <h4>{meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)}</h4>
                              <span className="meal-time">{formatTime(meal.timestamp)}</span>
                            </div>
                            <button 
                              className="btn-icon btn-danger" 
                              title="Delete Meal"
                              onClick={async () => {
                                if (!confirm('Are you sure you want to delete this meal?')) return;
                                
                                try {
                                  const token = localStorage.getItem('adminToken');
                                  const response = await fetch(
                                    `${import.meta.env.VITE_BACKEND_URL}/food-intake/${selectedFoodIntake.foodId}/meal/${meal.mealId}`,
                                    {
                                      method: 'DELETE',
                                      headers: {
                                        'Authorization': `Bearer ${token}`,
                                      },
                                    }
                                  );

                                  if (!response.ok) throw new Error('Failed to delete meal');

                                  // Parse the response to get updated food intake
                                  const updatedFoodIntake = await response.json();
                                  
                                  // Update the selected food intake
                                  setSelectedFoodIntake(updatedFoodIntake);
                                  
                                  // Refresh the list
                                  await fetchFoodIntakes();
                                } catch (err: any) {
                                  setError(err.message);
                                }
                              }}
                            >
                              <MdDelete />
                            </button>
                          </div>
                          <div className="meal-items">
                            {meal.items.map((item, idx) => (
                              <div key={idx} className="meal-item">
                                <span className="item-name">{item.itemName}</span>
                                <span className="item-quantity">{item.quantity} {item.unit}</span>
                                <span className="item-nutrition">
                                  {item.calories}cal | {item.proteins}g P | {item.carbohydrates}g C | {item.fats}g F
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="meal-total">
                            <strong>Meal Total:</strong>
                            {meal.mealTotal.calories}cal | 
                            {meal.mealTotal.proteins}g protein | 
                            {meal.mealTotal.carbohydrates}g carbs | 
                            {meal.mealTotal.fats}g fats
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Meal Modal */}
      {showMealModal && selectedFoodIntake && (
        <div className="modal-overlay" onClick={() => {
          setShowMealModal(false);
          setShowAddItemForm(false);
          resetCurrentItem();
        }}>
          <div className="modal-content meal-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🍽️ Add Meal</h2>
              <button className="btn-close" onClick={() => {
                setShowMealModal(false);
                setShowAddItemForm(false);
                resetCurrentItem();
              }}>
                ×
              </button>
            </div>

            <div className="modal-body">
              {/* Meal Type Selection */}
              <div className="meal-type-section">
                <label className="form-label">Meal Type</label>
                <div className="meal-type-grid">
                  <button
                    className={`meal-type-btn ${mealFormData.mealType === 'breakfast' ? 'active' : ''}`}
                    onClick={() => setMealFormData({ ...mealFormData, mealType: 'breakfast' })}
                  >
                    <span className="meal-icon">🌅</span>
                    <span>Breakfast</span>
                  </button>
                  <button
                    className={`meal-type-btn ${mealFormData.mealType === 'lunch' ? 'active' : ''}`}
                    onClick={() => setMealFormData({ ...mealFormData, mealType: 'lunch' })}
                  >
                    <span className="meal-icon">☀️</span>
                    <span>Lunch</span>
                  </button>
                  <button
                    className={`meal-type-btn ${mealFormData.mealType === 'dinner' ? 'active' : ''}`}
                    onClick={() => setMealFormData({ ...mealFormData, mealType: 'dinner' })}
                  >
                    <span className="meal-icon">🌙</span>
                    <span>Dinner</span>
                  </button>
                  <button
                    className={`meal-type-btn ${mealFormData.mealType === 'snack' ? 'active' : ''}`}
                    onClick={() => setMealFormData({ ...mealFormData, mealType: 'snack' })}
                  >
                    <span className="meal-icon">🍪</span>
                    <span>Snack</span>
                  </button>
                </div>
              </div>

              {/* Current Meal Summary */}
              {mealFormData.items.length > 0 && (
                <div className="meal-summary-card">
                  <h3>Meal Summary</h3>
                  <div className="summary-stats">
                    <div className="stat-item">
                      <span className="stat-value">
                        {mealFormData.items.reduce((sum, item) => sum + item.calories, 0)}
                      </span>
                      <span className="stat-label">Calories</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">
                        {mealFormData.items.reduce((sum, item) => sum + item.proteins, 0)}g
                      </span>
                      <span className="stat-label">Protein</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">
                        {mealFormData.items.reduce((sum, item) => sum + item.carbohydrates, 0)}g
                      </span>
                      <span className="stat-label">Carbs</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">
                        {mealFormData.items.reduce((sum, item) => sum + item.fats, 0)}g
                      </span>
                      <span className="stat-label">Fats</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Food Items List */}
              <div className="items-section">
                <div className="section-header">
                  <h3>Food Items ({mealFormData.items.length})</h3>
                  {!showAddItemForm && (
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => setShowAddItemForm(true)}
                    >
                      <MdAdd /> Add Item
                    </button>
                  )}
                </div>

                {mealFormData.items.length === 0 && !showAddItemForm ? (
                  <div className="empty-state">
                    <span className="empty-icon">🍽️</span>
                    <p>No items added yet</p>
                    <button 
                      className="btn btn-primary"
                      onClick={() => setShowAddItemForm(true)}
                    >
                      <MdAdd /> Add Your First Item
                    </button>
                  </div>
                ) : (
                  <div className="items-list-grid">
                    {mealFormData.items.map((item, idx) => (
                      <div key={idx} className="food-item-card">
                        <div className="item-header">
                          <h4>{item.itemName}</h4>
                          <button
                            className="btn-icon btn-danger"
                            onClick={() => {
                              const newItems = mealFormData.items.filter((_, i) => i !== idx);
                              setMealFormData({ ...mealFormData, items: newItems });
                            }}
                          >
                            <MdDelete />
                          </button>
                        </div>
                        <div className="item-details">
                          <span className="item-quantity-badge">{item.quantity} {item.unit}</span>
                        </div>
                        <div className="item-nutrition-grid">
                          <div className="nutrition-item">
                            <span className="nutrition-value">{item.calories}</span>
                            <span className="nutrition-label">cal</span>
                          </div>
                          <div className="nutrition-item">
                            <span className="nutrition-value">{item.proteins}g</span>
                            <span className="nutrition-label">protein</span>
                          </div>
                          <div className="nutrition-item">
                            <span className="nutrition-value">{item.carbohydrates}g</span>
                            <span className="nutrition-label">carbs</span>
                          </div>
                          <div className="nutrition-item">
                            <span className="nutrition-value">{item.fats}g</span>
                            <span className="nutrition-label">fats</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Item Form */}
                {showAddItemForm && (
                  <div className="add-item-form">
                    <h4>Add New Item</h4>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Item Name *</label>
                        <input
                          type="text"
                          value={currentItem.itemName}
                          onChange={(e) => setCurrentItem({ ...currentItem, itemName: e.target.value })}
                          placeholder="e.g., Chicken Breast"
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Quantity *</label>
                        <input
                          type="number"
                          value={currentItem.quantity || ''}
                          onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseFloat(e.target.value) || 0 })}
                          placeholder="100"
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Unit *</label>
                        <select
                          value={currentItem.unit}
                          onChange={(e) => setCurrentItem({ ...currentItem, unit: e.target.value })}
                          className="form-control"
                        >
                          <option value="grams">grams</option>
                          <option value="oz">oz</option>
                          <option value="cup">cup</option>
                          <option value="piece">piece</option>
                          <option value="tbsp">tbsp</option>
                          <option value="tsp">tsp</option>
                          <option value="ml">ml</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Calories *</label>
                        <input
                          type="number"
                          value={currentItem.calories || ''}
                          onChange={(e) => setCurrentItem({ ...currentItem, calories: parseFloat(e.target.value) || 0 })}
                          placeholder="165"
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Protein (g) *</label>
                        <input
                          type="number"
                          value={currentItem.proteins || ''}
                          onChange={(e) => setCurrentItem({ ...currentItem, proteins: parseFloat(e.target.value) || 0 })}
                          placeholder="31"
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Carbs (g) *</label>
                        <input
                          type="number"
                          value={currentItem.carbohydrates || ''}
                          onChange={(e) => setCurrentItem({ ...currentItem, carbohydrates: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                          className="form-control"
                        />
                      </div>
                      <div className="form-group">
                        <label>Fats (g) *</label>
                        <input
                          type="number"
                          value={currentItem.fats || ''}
                          onChange={(e) => setCurrentItem({ ...currentItem, fats: parseFloat(e.target.value) || 0 })}
                          placeholder="3.6"
                          className="form-control"
                        />
                      </div>
                    </div>
                    <div className="form-actions">
                      <button 
                        className="btn btn-secondary"
                        onClick={() => {
                          setShowAddItemForm(false);
                          resetCurrentItem();
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn btn-success"
                        onClick={() => {
                          if (!currentItem.itemName || currentItem.quantity <= 0) {
                            setError('Please fill in item name and quantity');
                            return;
                          }
                          setMealFormData({
                            ...mealFormData,
                            items: [...mealFormData.items, currentItem],
                          });
                          setShowAddItemForm(false);
                          resetCurrentItem();
                        }}
                      >
                        <MdAdd /> Add Item
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => {
                  setShowMealModal(false);
                  setShowAddItemForm(false);
                  resetCurrentItem();
                }}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    if (mealFormData.items.length === 0) {
                      setError('Please add at least one item to the meal');
                      return;
                    }

                    try {
                      setLoading(true);
                      const token = localStorage.getItem('adminToken');
                      const response = await fetch(
                        `${import.meta.env.VITE_BACKEND_URL}/food-intake/${selectedFoodIntake.foodId}/meal`,
                        {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                          },
                          body: JSON.stringify(mealFormData),
                        }
                      );

                      if (!response.ok) throw new Error('Failed to add meal');

                      // Parse the response to get updated food intake
                      const updatedFoodIntake = await response.json();
                      
                      setShowMealModal(false);
                      setMealFormData({ mealType: 'breakfast', items: [] });
                      setShowAddItemForm(false);
                      resetCurrentItem();
                      await fetchFoodIntakes();
                      
                      // Update the selected food intake with the response data
                      if (updatedFoodIntake) {
                        setSelectedFoodIntake(updatedFoodIntake);
                      }
                    } catch (error: any) {
                      console.error('Error adding meal:', error);
                      setError(error.message || 'Failed to add meal');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading || mealFormData.items.length === 0}
                >
                  {loading ? 'Adding...' : `Add Meal (${mealFormData.items.length} items)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodIntakePage;
