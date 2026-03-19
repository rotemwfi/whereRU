import { useState, useEffect } from 'react';
import {
  getUsers, getLocations, addUser, deleteUser, renameUser,
  addLocation, deleteLocation, updateLocation,
} from '../data';
import '../App.css';

export default function Settings({ onClose, onUsersChange, onLocationsChange }) {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    async function load() {
      const [u, l] = await Promise.all([getUsers(), getLocations()]);
      setUsers(u.map((user) => user.name));
      setLocations(l);
    }
    load();
  }, []);

  const handleAddUser = async () => {
    const name = 'New User';
    await addUser(name);
    const updated = [...users, name];
    setUsers(updated);
    onUsersChange(updated);
  };

  const handleDeleteUser = async (name) => {
    await deleteUser(name);
    const updated = users.filter((n) => n !== name);
    setUsers(updated);
    onUsersChange(updated);
  };

  // onChange: update local state only (no DB call — instant typing)
  const handleRenameUserLocal = (index, newName) => {
    const updated = [...users];
    updated[index] = newName;
    setUsers(updated);
  };

  // onBlur: save to Supabase when user finishes typing
  const handleRenameUserSave = async (index, newName, originalName) => {
    if (newName === originalName) return;
    await renameUser(originalName, newName);
    const updated = [...users];
    updated[index] = newName;
    onUsersChange(updated);
  };

  const handleAddLocation = async () => {
    const newLoc = {
      id: `loc-${Date.now()}`,
      label: 'New Location',
      icon: '📍',
      color: '#000000',
      bg: '#ffffff',
      sort_order: locations.length,
    };
    await addLocation(newLoc);
    const updated = [...locations, newLoc];
    setLocations(updated);
    onLocationsChange(updated);
  };

  const handleDeleteLocation = async (id) => {
    await deleteLocation(id);
    const updated = locations.filter((l) => l.id !== id);
    setLocations(updated);
    onLocationsChange(updated);
  };

  // onChange: update local state only (instant typing, no DB call)
  const handleUpdateLocationLocal = (id, field, value) => {
    const updated = locations.map((l) => (l.id === id ? { ...l, [field]: value } : l));
    setLocations(updated);
  };

  // onBlur / onChange for colors: save to Supabase
  const handleUpdateLocationSave = async (id, field, value) => {
    const updates = { [field]: value };
    await updateLocation(id, updates);
    const updated = locations.map((l) => (l.id === id ? { ...l, ...updates } : l));
    setLocations(updated);
    onLocationsChange(updated);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-tabs">
          <button
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button
            className={`tab-btn ${activeTab === 'locations' ? 'active' : ''}`}
            onClick={() => setActiveTab('locations')}
          >
            Locations
          </button>
        </div>

        <div className="modal-content">
          {activeTab === 'users' && (
            <div className="tab-panel">
              {users.map((user, index) => (
                <div key={index} className="settings-row">
                  <input
                    type="text"
                    className="settings-input"
                    value={user}
                    onChange={(e) => handleRenameUserLocal(index, e.target.value)}
                    onBlur={(e) => handleRenameUserSave(index, e.target.value, users[index])}
                  />
                  <button className="delete-btn" onClick={() => handleDeleteUser(user)}>Delete</button>
                </div>
              ))}
              <button className="add-btn" onClick={handleAddUser}>+ Add User</button>
            </div>
          )}

          {activeTab === 'locations' && (
            <div className="tab-panel">
              {locations.map((loc) => (
                <div key={loc.id} className="settings-row">
                  <input
                    type="text"
                    className="settings-input small"
                    title="Icon"
                    value={loc.icon}
                    onChange={(e) => handleUpdateLocationLocal(loc.id, 'icon', e.target.value)}
                    onBlur={(e) => handleUpdateLocationSave(loc.id, 'icon', e.target.value)}
                  />
                  <input
                    type="text"
                    className="settings-input"
                    title="Label"
                    value={loc.label}
                    onChange={(e) => handleUpdateLocationLocal(loc.id, 'label', e.target.value)}
                    onBlur={(e) => handleUpdateLocationSave(loc.id, 'label', e.target.value)}
                  />
                  <input
                    type="color"
                    className="settings-input color-picker"
                    title="Text Color"
                    value={loc.color}
                    onChange={(e) => handleUpdateLocationSave(loc.id, 'color', e.target.value)}
                  />
                  <input
                    type="color"
                    className="settings-input color-picker"
                    title="Background Color"
                    value={loc.bg}
                    onChange={(e) => handleUpdateLocationSave(loc.id, 'bg', e.target.value)}
                  />
                  <button className="delete-btn" onClick={() => handleDeleteLocation(loc.id)}>Delete</button>
                </div>
              ))}
              <button className="add-btn" onClick={handleAddLocation}>+ Add Location</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
