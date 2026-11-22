import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import './AdminUsers.css';

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const initialForm = {
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'user'
  };

  const [form, setForm] = useState(initialForm);

  const loadUsers = () => {
    setLoading(true);
    adminService.getUsers()
      .then((res) => {
        setUsers(res.users || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const showNotification = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  };

  const openAdd = () => {
    setEditMode(false);
    setEditingId(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditMode(true);
    setEditingId(u._id);
    setForm({
      name: u.name,
      email: u.email,
      password: '',
      phone: u.phone || '',
      role: u.role || 'user'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      alert('Please fill Name and Email.');
      return;
    }
    if (!editMode && !form.password) {
      alert('Password is required for new users.');
      return;
    }

    setSaving(true);
    try {
      if (editMode) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await adminService.updateUser(editingId, payload);
        showNotification('User updated successfully!', 'success');
      } else {
        await adminService.createUser(form);
        showNotification('User created successfully!', 'success');
      }
      setShowModal(false);
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not save user.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await adminService.deleteUser(id);
      showNotification('User deleted successfully.', 'success');
      setUsers(users.filter(u => u._id !== id));
    } catch (err) {
      showNotification(err.response?.data?.message || 'Could not delete user.', 'error');
    }
  };

  return (
    <div className="page-enter">
      <div className="page-top">
        <div>
          <h1>Users &amp; Organizers</h1>
          <p className="text-muted">Manage all registered attendees, organizers, and platform administrators</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <span className="material-icons">person_add</span> Add New User
        </button>
      </div>

      {message && (
        <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      <div className="card">
        {loading ? (
          <div className="spinner"></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Full Name</th>
                  <th>Email Address</th>
                  <th>Phone</th>
                  <th>Account Role</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u._id}>
                    <td>{i + 1}</td>
                    <td>
                      <div className="user-cell">
                        <div className="mini-avatar">{u.name?.charAt(0)?.toUpperCase()}</div>
                        <strong>{u.name}</strong>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>{u.phone || '—'}</td>
                    <td>
                      <span
                        className={`badge ${
                          u.role === 'admin'
                            ? 'badge-primary'
                            : u.role === 'organizer'
                            ? 'badge-warning'
                            : 'badge-info'
                        }`}
                      >
                        {u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : 'User'}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button
                          className="btn btn-sm"
                          style={{ background: '#17a2b8', color: '#fff' }}
                          onClick={() => openEdit(u)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{ background: '#dc3545', color: '#fff' }}
                          onClick={() => handleDelete(u._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editMode ? 'Edit User' : 'Add New User'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    className="form-control"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    className="form-control"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{editMode ? 'New Password (leave blank to keep current)' : 'Password *'}</label>
                  <input
                    type="password"
                    className="form-control"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required={!editMode}
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    className="form-control"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    className="form-control"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  >
                    <option value="user">User / Attendee</option>
                    <option value="organizer">Event Organizer</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editMode ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
