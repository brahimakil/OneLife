import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  MdDashboard, 
  MdPeople, 
  MdFitnessCenter, 
  MdCardMembership,
  MdLogout,
  MdExpandMore,
  MdExpandLess,
  MdMenu,
  MdClose,
  MdSettings,
  MdSubscriptions,
  MdTrackChanges,
  MdWaterDrop,
  MdRestaurant,
  MdBedtime,
  MdBarChart
} from 'react-icons/md';
import { IoFitnessSharp } from 'react-icons/io5';
import { BiDumbbell } from 'react-icons/bi';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const [gymDropdownOpen, setGymDropdownOpen] = useState(false);
  const [trackingDropdownOpen, setTrackingDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    navigate('/login');
  };

  const toggleGymDropdown = () => {
    setGymDropdownOpen(!gymDropdownOpen);
  };

  const toggleTrackingDropdown = () => {
    setTrackingDropdownOpen(!trackingDropdownOpen);
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <IoFitnessSharp className="sidebar-logo" />
          {isOpen && (
            <>
              <h2>OneLife</h2>
              <p>Admin Panel</p>
            </>
          )}
          <button className="sidebar-toggle-btn" onClick={toggleSidebar} title={isOpen ? 'Close sidebar' : 'Open sidebar'}>
            {isOpen ? <MdClose /> : <MdMenu />}
          </button>
        </div>

      <nav className="sidebar-nav">
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <MdDashboard className="nav-icon" />
          {isOpen && <span>Dashboard</span>}
        </NavLink>

        <NavLink 
          to="/users" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <MdPeople className="nav-icon" />
          {isOpen && <span>Users Management</span>}
        </NavLink>

        <NavLink 
          to="/plans" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <MdCardMembership className="nav-icon" />
          {isOpen && <span>Plans Management</span>}
        </NavLink>

        <NavLink 
          to="/subscriptions" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <MdSubscriptions className="nav-icon" />
          {isOpen && <span>Subscriptions</span>}
        </NavLink>

        {/* User Tracking Dropdown */}
        <div className="nav-dropdown">
          <button 
            className={`nav-item dropdown-toggle ${trackingDropdownOpen ? 'open' : ''}`}
            onClick={toggleTrackingDropdown}
          >
            <MdTrackChanges className="nav-icon" />
            {isOpen && <span>User Tracking</span>}
            {isOpen && (trackingDropdownOpen ? (
              <MdExpandLess className="dropdown-arrow" />
            ) : (
              <MdExpandMore className="dropdown-arrow" />
            ))}
          </button>
          
          <div className={`dropdown-menu ${trackingDropdownOpen ? 'show' : ''}`}>
            <NavLink 
              to="/workout-progress" 
              className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
            >
              <MdTrackChanges className="nav-icon" />
              <span>Workout Progress</span>
            </NavLink>

            <NavLink 
              to="/water-intake" 
              className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
            >
              <MdWaterDrop className="nav-icon" />
              <span>Water Intake</span>
            </NavLink>

            <NavLink 
              to="/food-intake" 
              className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
            >
              <MdRestaurant className="nav-icon" />
              <span>Food Intake</span>
            </NavLink>

            <NavLink 
              to="/sleep-tracking" 
              className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
            >
              <MdBedtime className="nav-icon" />
              <span>Sleep Tracking</span>
            </NavLink>
          </div>
        </div>

        <NavLink 
          to="/daily-statistics" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <MdBarChart className="nav-icon" />
          {isOpen && <span>Daily Statistics</span>}
        </NavLink>

        {/* Gym Management Dropdown */}
        <div className="nav-dropdown">
          <button 
            className={`nav-item dropdown-toggle ${gymDropdownOpen ? 'open' : ''}`}
            onClick={toggleGymDropdown}
          >
            <MdFitnessCenter className="nav-icon" />
            {isOpen && <span>Gym Management</span>}
            {isOpen && (gymDropdownOpen ? (
              <MdExpandLess className="dropdown-arrow" />
            ) : (
              <MdExpandMore className="dropdown-arrow" />
            ))}
          </button>
          
          <div className={`dropdown-menu ${gymDropdownOpen ? 'show' : ''}`}>
            <NavLink 
              to="/gym/routines" 
              className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
            >
              <MdFitnessCenter className="nav-icon" />
              <span>Manage Gym Routines</span>
            </NavLink>
            
            <NavLink 
              to="/gym/exercises" 
              className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
            >
              <BiDumbbell className="nav-icon" />
              <span>Manage Exercises</span>
            </NavLink>
          </div>
        </div>

        <NavLink 
          to="/settings" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <MdSettings className="nav-icon" />
          {isOpen && <span>Settings</span>}
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <MdLogout className="nav-icon" />
          {isOpen && <span>Logout</span>}
        </button>
      </div>
    </div>
    </>
  );
};

export default Sidebar;
