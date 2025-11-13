import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdPeople, MdFitnessCenter, MdCardMembership } from 'react-icons/md';
import { FaUsers, FaDumbbell } from 'react-icons/fa';
import './Dashboard.css';

interface AdminData {
  fullName: string;
  email: string;
}

interface Stats {
  totalUsers: number;
  totalPlans: number;
  totalRoutines: number;
  totalExercises: number;
}

interface Activity {
  type: 'user' | 'subscription' | 'routine' | 'exercise';
  title: string;
  description: string;
  timestamp: string;
}

interface PlanStats {
  planId: string;
  planName: string;
  subscriberCount: number;
  type: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalPlans: 0,
    totalRoutines: 0,
    totalExercises: 0,
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [popularPlans, setPopularPlans] = useState<PlanStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedData = localStorage.getItem('adminData');
    if (storedData) {
      setAdminData(JSON.parse(storedData));
    }
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      // Fetch all data in parallel
      const [usersRes, plansRes, routinesRes, exercisesRes, subsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_BACKEND_URL}/users`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_BACKEND_URL}/plans`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_BACKEND_URL}/gym-routines`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_BACKEND_URL}/exercises`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_BACKEND_URL}/subscriptions`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      const [users, plans, routines, exercises, subscriptions] = await Promise.all([
        usersRes.json(),
        plansRes.json(),
        routinesRes.json(),
        exercisesRes.json(),
        subsRes.json(),
      ]);

      setStats({
        totalUsers: users.length || 0,
        totalPlans: plans.length || 0,
        totalRoutines: routines.length || 0,
        totalExercises: exercises.length || 0,
      });

      // Generate recent activities from real data
      const recentActivities: Activity[] = [];

      // Add recent users (last 3)
      users.slice(-3).reverse().forEach((user: any) => {
        recentActivities.push({
          type: 'user',
          title: 'New user registered',
          description: `${user.fullName} joined the platform`,
          timestamp: user.createdAt || new Date().toISOString(),
        });
      });

      // Add recent subscriptions (last 3)
      subscriptions.slice(-3).reverse().forEach((sub: any) => {
        const user = users.find((u: any) => u.email === sub.userId);
        const plan = plans.find((p: any) => p.planId === sub.planId);
        recentActivities.push({
          type: 'subscription',
          title: 'Plan subscription',
          description: `${user?.fullName || sub.userId} subscribed to ${plan?.planName || 'a plan'}`,
          timestamp: sub.createdAt || new Date().toISOString(),
        });
      });

      // Add recent routines (last 2)
      routines.slice(-2).reverse().forEach((routine: any) => {
        recentActivities.push({
          type: 'routine',
          title: 'New routine created',
          description: `${routine.routineName} routine added`,
          timestamp: routine.createdAt || new Date().toISOString(),
        });
      });

      // Sort by timestamp and take top 5
      recentActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(recentActivities.slice(0, 5));

      // Calculate plan statistics
      const planSubscriberCounts = new Map<string, number>();
      subscriptions.forEach((sub: any) => {
        const count = planSubscriberCounts.get(sub.planId) || 0;
        planSubscriberCounts.set(sub.planId, count + 1);
      });

      const planStats = plans.map((plan: any) => ({
        planId: plan.planId,
        planName: plan.planName,
        subscriberCount: planSubscriberCounts.get(plan.planId) || 0,
        type: plan.type || 'Standard',
      })).sort((a: PlanStats, b: PlanStats) => b.subscriberCount - a.subscriberCount);

      setPopularPlans(planStats.slice(0, 3));
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: <MdPeople />,
      gradient: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
      path: '/users',
    },
    {
      title: 'Active Plans',
      value: stats.totalPlans,
      icon: <MdCardMembership />,
      gradient: 'linear-gradient(135deg, #004E89 0%, #0066B2 100%)',
      path: '/plans',
    },
    {
      title: 'Gym Routines',
      value: stats.totalRoutines,
      icon: <MdFitnessCenter />,
      gradient: 'linear-gradient(135deg, #00D084 0%, #00B872 100%)',
      path: '/gym/routines',
    },
    {
      title: 'Total Exercises',
      value: stats.totalExercises,
      icon: <FaDumbbell />,
      gradient: 'linear-gradient(135deg, #3AB4F2 0%, #2E9FD8 100%)',
      path: '/gym/exercises',
    },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Welcome Back, {adminData?.fullName || 'Admin'}! 👋</h1>
          <p>Here's what's happening with your fitness platform today</p>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading dashboard data...</div>
      ) : (
        <>
          <div className="stats-grid">
            {statCards.map((stat, index) => (
              <div key={index} className="stat-card" style={{ background: stat.gradient }}>
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-content">
                  <p className="stat-title">{stat.title}</p>
                  <h3 className="stat-value">{stat.value.toLocaleString()}</h3>
                  <button onClick={() => navigate(stat.path)} className="stat-link">View Details →</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="dashboard-content">
        <div className="content-row">
          <div className="content-card large">
            <div className="card-header">
              <h3>Recent Activity</h3>
              <button className="btn-text">View All</button>
            </div>
            <div className="activity-list">
              {activities.length > 0 ? (
                activities.map((activity, index) => {
                  const getIcon = () => {
                    switch (activity.type) {
                      case 'user': return <FaUsers />;
                      case 'subscription': return <MdCardMembership />;
                      case 'routine': return <MdFitnessCenter />;
                      case 'exercise': return <FaDumbbell />;
                      default: return <FaUsers />;
                    }
                  };

                  const getTimeAgo = (timestamp: string) => {
                    const now = new Date();
                    const date = new Date(timestamp);
                    const diff = now.getTime() - date.getTime();
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    
                    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
                    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
                    return 'Just now';
                  };

                  return (
                    <div key={index} className="activity-item">
                      <div className={`activity-icon ${activity.type}`}>
                        {getIcon()}
                      </div>
                      <div className="activity-details">
                        <h4>{activity.title}</h4>
                        <p>{activity.description}</p>
                        <span className="activity-time">{getTimeAgo(activity.timestamp)}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="no-data">No recent activity</div>
              )}
            </div>
          </div>

          <div className="content-card">
            <div className="card-header">
              <h3>Quick Actions</h3>
            </div>
            <div className="quick-actions">
              <button className="action-btn" onClick={() => navigate('/users')}>
                <MdPeople className="action-icon" />
                <span>Add New User</span>
              </button>
              <button className="action-btn" onClick={() => navigate('/plans')}>
                <MdCardMembership className="action-icon" />
                <span>Create Plan</span>
              </button>
              <button className="action-btn" onClick={() => navigate('/gym/routines')}>
                <MdFitnessCenter className="action-icon" />
                <span>Add Routine</span>
              </button>
              <button className="action-btn" onClick={() => navigate('/gym/exercises')}>
                <FaDumbbell className="action-icon" />
                <span>Add Exercise</span>
              </button>
            </div>
          </div>
        </div>

        <div className="content-row">
          <div className="content-card">
            <div className="card-header">
              <h3>Popular Plans</h3>
            </div>
            <div className="plan-list">
              {popularPlans.length > 0 ? (
                popularPlans.map((plan) => (
                  <div key={plan.planId} className="plan-item">
                    <div className="plan-info">
                      <h4>{plan.planName}</h4>
                      <p>{plan.subscriberCount} subscriber{plan.subscriberCount !== 1 ? 's' : ''}</p>
                    </div>
                    <div className={`plan-badge ${plan.type.toLowerCase()}`}>{plan.type}</div>
                  </div>
                ))
              ) : (
                <div className="no-data">No plans available</div>
              )}
            </div>
          </div>

          <div className="content-card">
            <div className="card-header">
              <h3>System Status</h3>
            </div>
            <div className="status-list">
              <div className="status-item">
                <div className="status-dot active"></div>
                <span>All Systems Operational</span>
              </div>
              <div className="status-item">
                <div className="status-dot active"></div>
                <span>Database Connected</span>
              </div>
              <div className="status-item">
                <div className="status-dot active"></div>
                <span>API Responsive</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
