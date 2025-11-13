import { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdDelete, MdClose, MdSearch } from 'react-icons/md';
import './SubscriptionsPage.css';

interface Subscription {
  subscriptionId: string;
  userId: string;
  planId: string;
  userName?: string;
  planName?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  renewalCount: number;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  uid: string;
  fullName: string;
  email: string;
}

interface Plan {
  planId: string;
  planName: string;
}

interface SubscriptionFormData {
  userId: string;
  planId: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  renewalCount: number | string;
}

const SubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [formData, setFormData] = useState<SubscriptionFormData>({
    userId: '',
    planId: '',
    startDate: '',
    endDate: '',
    isActive: true,
    renewalCount: 0,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSubscriptions();
    fetchUsers();
    fetchPlans();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/subscriptions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions');
      }

      const data = await response.json();
      
      // Fetch user and plan names for each subscription
      const enrichedData = await Promise.all(
        data.map(async (sub: Subscription) => {
          try {
            const [userRes, planRes] = await Promise.all([
              fetch(`${import.meta.env.VITE_BACKEND_URL}/users/uid/${sub.userId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
              }),
              fetch(`${import.meta.env.VITE_BACKEND_URL}/plans/${sub.planId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
              }),
            ]);

            const userData = userRes.ok ? await userRes.json() : null;
            const planData = planRes.ok ? await planRes.json() : null;

            return {
              ...sub,
              userName: userData?.fullName || 'Unknown User',
              planName: planData?.planName || 'Unknown Plan',
            };
          } catch {
            return {
              ...sub,
              userName: 'Unknown User',
              planName: 'Unknown Plan',
            };
          }
        })
      );

      setSubscriptions(enrichedData);
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

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  };

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/plans`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPlans(data);
      }
    } catch (err) {
      console.error('Failed to fetch plans', err);
    }
  };

  const handleAddSubscription = () => {
    setEditMode(false);
    setSelectedSubscription(null);
    const today = new Date().toISOString().split('T')[0];
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    
    setFormData({
      userId: '',
      planId: '',
      startDate: today,
      endDate: endDate.toISOString().split('T')[0],
      isActive: true,
      renewalCount: 0,
    });
    setShowModal(true);
  };

  const handleEditSubscription = (subscription: Subscription) => {
    setEditMode(true);
    setSelectedSubscription(subscription);
    setFormData({
      userId: subscription.userId,
      planId: subscription.planId,
      startDate: subscription.startDate.split('T')[0],
      endDate: subscription.endDate.split('T')[0],
      isActive: subscription.isActive,
      renewalCount: subscription.renewalCount,
    });
    setShowModal(true);
  };

  const handleDeleteSubscription = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to delete this subscription?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/subscriptions/${subscriptionId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete subscription');
      }

      fetchSubscriptions();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const token = localStorage.getItem('adminToken');
      const url = editMode
        ? `${import.meta.env.VITE_BACKEND_URL}/subscriptions/${selectedSubscription?.subscriptionId}`
        : `${import.meta.env.VITE_BACKEND_URL}/subscriptions`;

      const method = editMode ? 'PUT' : 'POST';

      const submitData = {
        userId: formData.userId,
        planId: formData.planId,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        isActive: formData.isActive,
        renewalCount: Number(formData.renewalCount),
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save subscription');
      }

      setShowModal(false);
      fetchSubscriptions();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const filteredSubscriptions = subscriptions.filter(subscription => {
    const matchesSearch = 
      subscription.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.planName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscription.subscriptionId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'active' && subscription.isActive) ||
      (filterStatus === 'inactive' && !subscription.isActive);

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="subscriptions-page">
      <div className="page-header">
        <div>
          <h1>Subscriptions</h1>
          <p>Manage user subscription plans</p>
        </div>
        <button className="btn-primary" onClick={handleAddSubscription}>
          <MdAdd /> Add Subscription
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="controls-section">
        <div className="search-bar">
          <MdSearch />
          <input
            type="text"
            placeholder="Search by user, plan, or subscription ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filters-section">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
            className="filter-select"
          >
            <option value="all">All Subscriptions</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading subscriptions...</div>
      ) : (
        <div className="subscriptions-list">
          {filteredSubscriptions.length === 0 ? (
            <div className="no-data">No subscriptions found</div>
          ) : (
            filteredSubscriptions.map((subscription) => (
              <div key={subscription.subscriptionId} className="subscription-card">
                <div className="subscription-header">
                  <div>
                    <h3>{subscription.userName}</h3>
                    <p className="subscription-plan">{subscription.planName}</p>
                  </div>
                  <div className="subscription-actions">
                    <button
                      className="btn-icon"
                      onClick={() => handleEditSubscription(subscription)}
                      title="Edit"
                    >
                      <MdEdit />
                    </button>
                    <button
                      className="btn-icon btn-danger"
                      onClick={() => handleDeleteSubscription(subscription.subscriptionId)}
                      title="Delete"
                    >
                      <MdDelete />
                    </button>
                  </div>
                </div>

                <div className="subscription-details">
                  <div className="detail-item">
                    <span className="label">Status:</span>
                    <span className={`badge ${subscription.isActive ? 'badge-active' : 'badge-inactive'}`}>
                      {subscription.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Start Date:</span>
                    <span>{formatDate(subscription.startDate)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">End Date:</span>
                    <span>{formatDate(subscription.endDate)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Renewals:</span>
                    <span>{subscription.renewalCount}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ width: '98%', maxWidth: '1600px', minWidth: '1400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editMode ? 'Edit Subscription' : 'Add New Subscription'}</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>
                <MdClose />
              </button>
            </div>

            {error && <div className="error-message-modal">{error}</div>}

            <form onSubmit={handleSubmit} className="subscription-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>User *</label>
                  <select
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                    required
                    disabled={editMode}
                  >
                    <option value="">Select User</option>
                    {users.map((user) => (
                      <option key={user.uid} value={user.uid}>
                        {user.fullName} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Plan *</label>
                  <select
                    value={formData.planId}
                    onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                    required
                  >
                    <option value="">Select Plan</option>
                    {plans.map((plan) => (
                      <option key={plan.planId} value={plan.planId}>
                        {plan.planName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>End Date *</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.isActive.toString()}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Renewal Count</label>
                  <input
                    type="number"
                    value={formData.renewalCount}
                    onChange={(e) => setFormData({ ...formData, renewalCount: e.target.value })}
                    min="0"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editMode ? 'Update Subscription' : 'Create Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionsPage;
