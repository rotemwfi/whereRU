import { useState, useEffect } from 'react';
import NamePicker from './components/NamePicker';
import WeeklyGrid from './components/WeeklyGrid';
import { getCurrentUser, saveCurrentUser } from './data';
import './App.css';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);

  // On first load, restore saved user from localStorage
  useEffect(() => {
    const saved = getCurrentUser();
    if (saved) setCurrentUser(saved);
  }, []);

  function handleSelectUser(name) {
    saveCurrentUser(name);
    setCurrentUser(name);
  }

  function handleChangeUser() {
    setCurrentUser(null);
  }

  return (
    <div className="app">
      {!currentUser ? (
        <NamePicker onSelect={handleSelectUser} />
      ) : (
        <WeeklyGrid currentUser={currentUser} onChangeUser={handleChangeUser} />
      )}
    </div>
  );
}
