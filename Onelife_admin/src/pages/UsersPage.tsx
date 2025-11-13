import { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdDelete, MdClose, MdSearch } from 'react-icons/md';
import './UsersPage.css';

interface User {
  id: string;
  uid: string;
  email: string;
  fullName: string;
  dob: string;
  weight: number;
  height: number;
  createdAt: string;
  updatedAt: string;
}

interface UserFormData {
  fullName: string;
  email: string;
  password: string;
  dob: string;
  weight: number | string;
  height: number | string;
}

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<UserFormData>({
    fullName: '',
    email: '',
    password: '',
    dob: '',
    weight: '',
    height: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setEditMode(false);
    setSelectedUser(null);
    setFormData({
      fullName: '',
      email: '',
      password: '',
      dob: '',
      weight: '',
      height: '',
    });
    setShowModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditMode(true);
    setSelectedUser(user);
    setFormData({
      fullName: user.fullName,
      email: user.email,
      password: '',
      dob: user.dob,
      weight: user.weight,
      height: user.height,
    });
    setShowModal(true);
  };

  const handleDeleteUser = async (email: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/users/${email}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const url = editMode
        ? `${import.meta.env.VITE_BACKEND_URL}/users/${selectedUser?.email}`
        : `${import.meta.env.VITE_BACKEND_URL}/users`;

      const method = editMode ? 'PUT' : 'POST';

      const payload: any = {
        fullName: formData.fullName,
        email: formData.email,
        dob: formData.dob,
        weight: Number(formData.weight),
        height: Number(formData.height),
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save user');
      }

      setShowModal(false);
      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h1>Users Management</h1>
          <p>Manage all users of your fitness platform</p>
        </div>
        <button className="btn btn-primary" onClick={handleAddUser}>
          <MdAdd /> Add User
        </button>
      </div>

      <div className="users-controls">
        <div className="search-box">
          <MdSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => setError('')}>
            <MdClose />
          </button>
        </div>
      )}

      {loading && !showModal ? (
        <div className="loading">Loading users...</div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email</th>
                <th>Date of Birth</th>
                <th>Weight (kg)</th>
                <th>Height (cm)</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="no-data">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.fullName}</td>
                    <td>{user.email}</td>
                    <td>{new Date(user.dob).toLocaleDateString()}</td>
                    <td>{user.weight}</td>
                    <td>{user.height}</td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => handleEditUser(user)}
                        >
                          <MdEdit />
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDeleteUser(user.email)}
                        >
                          <MdDelete />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editMode ? 'Edit User' : 'Add New User'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <MdClose />
              </button>
            </div>

            {error && (
              <div className="modal-error-banner">
                <span>{error}</span>
                <button onClick={() => setError('')}>
                  <MdClose />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="user-form">
              <div className="input-group">
                <label htmlFor="fullName" className="input-label">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  className="input-field"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="email" className="input-label">Email</label>
                <input
                  id="email"
                  type="email"
                  className="input-field"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={editMode}
                />
              </div>

              <div className="input-group">
                <label htmlFor="password" className="input-label">
                  Password {editMode && '(leave blank to keep current)'}
                </label>
                <input
                  id="password"
                  type="password"
                  className="input-field"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editMode}
                  minLength={6}
                />
              </div>

              <div className="input-group">
                <label htmlFor="dob" className="input-label">Date of Birth</label>
                <input
                  id="dob"
                  type="date"
                  className="input-field"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="weight" className="input-label">Weight (kg)</label>
                <input
                  id="weight"
                  type="number"
                  step="0.1"
                  className="input-field"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="height" className="input-label">Height (cm)</label>
                <input
                  id="height"
                  type="number"
                  step="0.1"
                  className="input-field"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : editMode ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
