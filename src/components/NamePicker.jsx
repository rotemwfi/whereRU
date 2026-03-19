import { useState, useEffect } from 'react';
import { getUsers } from '../data';
import '../App.css';

const AVATARS = {
  Rotem: '👩',
  Dana:  '👩‍💼',
  Yossi: '👨',
  Michal:'👩‍🦱',
  Avi:   '👨‍💼',
};

export default function NamePicker({ onSelect }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    getUsers().then((rows) => setUsers(rows.map((r) => r.name)));
  }, []);

  return (
    <div className="picker-screen">
      <div className="picker-header">
        <h1 className="app-title">Where RU?</h1>
        <p className="app-subtitle">Who are you? Pick your name to continue.</p>
      </div>

      <div className="user-cards">
        {users.map((name) => (
          <button
            key={name}
            className="user-card"
            onClick={() => onSelect(name)}
          >
            <span className="user-avatar">{AVATARS[name] || '👤'}</span>
            <span className="user-name">{name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
