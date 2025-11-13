import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import UsersPage from './pages/UsersPage';
import PlansPage from './pages/PlansPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import WorkoutProgressPage from './pages/WorkoutProgressPage';
import WaterIntakePage from './pages/WaterIntakePage';
import FoodIntakePage from './pages/FoodIntakePage';
import SleepTrackingPage from './pages/SleepTrackingPage';
import DailyStatisticsPage from './pages/DailyStatisticsPage';
import GymRoutinesPage from './pages/GymRoutinesPage';
import ExercisesPage from './pages/ExercisesPage';
import SettingsPage from './pages/SettingsPage';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Layout>
                <UsersPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/plans"
          element={
            <ProtectedRoute>
              <Layout>
                <PlansPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/subscriptions"
          element={
            <ProtectedRoute>
              <Layout>
                <SubscriptionsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/workout-progress"
          element={
            <ProtectedRoute>
              <Layout>
                <WorkoutProgressPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/water-intake"
          element={
            <ProtectedRoute>
              <Layout>
                <WaterIntakePage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/food-intake"
          element={
            <ProtectedRoute>
              <Layout>
                <FoodIntakePage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sleep-tracking"
          element={
            <ProtectedRoute>
              <Layout>
                <SleepTrackingPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/daily-statistics"
          element={
            <ProtectedRoute>
              <Layout>
                <DailyStatisticsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/gym/routines"
          element={
            <ProtectedRoute>
              <Layout>
                <GymRoutinesPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/gym/exercises"
          element={
            <ProtectedRoute>
              <Layout>
                <ExercisesPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <SettingsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Default Route */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
