import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  getUsers, getLocations, DAYS, SLOTS,
  getCheckins, saveCheckin, clearCheckin,
  getCurrentWeekDates, formatDate, getWeekStart,
} from '../data';
import Settings from './Settings';

const POLL_INTERVAL = 3 * 60 * 1000;

// ─── Location Badge ────────────────────────────────────────────────────────────
function LocationBadge({ locationId, onClick, isOwn, locations }) {
  const loc = locations.find((l) => l.id === locationId) || null;
  return (
    <div
      className={`cell-badge ${isOwn ? 'clickable' : ''} ${loc ? 'filled' : 'empty'}`}
      style={loc ? { backgroundColor: loc.bg, color: loc.color, borderColor: loc.color } : {}}
      onClick={onClick ? (e) => onClick(e) : undefined}
      title={isOwn ? 'Click to change' : ''}
    >
      {loc ? `${loc.icon} ${loc.label}` : isOwn ? '+ Add' : '—'}
    </div>
  );
}

// ─── Location Picker Popup (portal — renders outside table to avoid clipping) ──
function LocationPicker({ onSelect, onClear, onClose, locations, anchorEl }) {
  const ref = useRef();
  const [style, setStyle] = useState({});

  useEffect(() => {
    if (anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      setStyle({
        position: 'fixed',
        top: rect.bottom + 6,
        left: rect.left + rect.width / 2,
        transform: 'translateX(-50%)',
        zIndex: 9999,
      });
    }
  }, [anchorEl]);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target) &&
          anchorEl && !anchorEl.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose, anchorEl]);

  return createPortal(
    <div className="location-picker" ref={ref} style={style}>
      {locations.map((loc) => (
        <button
          key={loc.id}
          className="loc-btn"
          style={{ backgroundColor: loc.bg, color: loc.color, borderColor: loc.color }}
          onClick={() => onSelect(loc.id)}
        >
          {loc.icon} {loc.label}
        </button>
      ))}
      <button className="loc-btn clear-btn" onClick={onClear}>
        ✕ Clear
      </button>
    </div>,
    document.body
  );
}

// ─── Main Weekly Grid ──────────────────────────────────────────────────────────
export default function WeeklyGrid({ currentUser, onChangeUser }) {
  const [checkins, setCheckins] = useState([]);
  const [lastUpdated, setLastUpdated] = useState('');
  const [openCell, setOpenCell] = useState(null);
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const weekDates = getCurrentWeekDates();
  const weekStart = getWeekStart();

  const refresh = useCallback(async () => {
    const c = await getCheckins(weekStart);
    setCheckins(c);
    const now = new Date();
    setLastUpdated(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
  }, [weekStart]);

  useEffect(() => {
    async function init() {
      const [u, l] = await Promise.all([getUsers(), getLocations()]);
      setUsers(u.map((user) => user.name));
      setLocations(l);
      await refresh();
    }
    init();
    const timer = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [refresh]);

  function getCheckin(user, day, slot) {
    const found = checkins.find(
      (c) => c.user_name === user && c.day === day && c.slot === slot
    );
    return found ? found.location_id : null;
  }

  async function handleSelect(user, day, slot, locationId) {
    await saveCheckin(user, day, slot, locationId, weekStart);
    setOpenCell(null);
    refresh();
  }

  async function handleClear(user, day, slot) {
    await clearCheckin(user, day, slot, weekStart);
    setOpenCell(null);
    refresh();
  }

  function toggleCell(user, day, slot, anchor) {
    const key = `${user}-${day}-${slot}`;
    const currentKey = openCell ? `${openCell.user}-${openCell.day}-${openCell.slot}` : null;
    setOpenCell(currentKey === key ? null : { user, day, slot, anchor });
  }

  return (
    <div className="grid-screen">
      {/* Header */}
      <div className="grid-header">
        <div className="greeting">
          <span className="greeting-wave">👋</span>
          <span>Shalom, <strong>{currentUser}</strong>!</span>
        </div>
        <div className="header-actions">
          <button className="settings-btn" onClick={() => setShowSettings(true)}>
            ⚙️ Settings
          </button>
          <button className="change-btn" onClick={onChangeUser}>
            Change User
          </button>
        </div>
      </div>

      {/* Scrollable table */}
      <div className="table-wrapper">
        <table className="week-table">
          <thead>
            <tr>
              <th className="user-col">Team</th>
              {weekDates.map((date, di) => (
                <th key={di} colSpan={2} className="day-header">
                  {DAYS[di]}
                  <span className="day-date">{formatDate(date)}</span>
                </th>
              ))}
            </tr>
            <tr className="slot-row">
              <th className="user-col"></th>
              {DAYS.map((day) =>
                SLOTS.map((slot) => (
                  <th key={`${day}-${slot}`} className="slot-header">
                    {slot === 'morning' ? '🌅 Morning' : '🌆 Afternoon'}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user} className={user === currentUser ? 'my-row' : ''}>
                <td className="user-cell">
                  <span className="user-label">{user}</span>
                  {user === currentUser && <span className="you-tag">you</span>}
                </td>
                {DAYS.map((day) =>
                  SLOTS.map((slot) => {
                    const isOwn = user === currentUser;
                    const locationId = getCheckin(user, day, slot);
                    const isOpen =
                      openCell &&
                      openCell.user === user &&
                      openCell.day === day &&
                      openCell.slot === slot;

                    return (
                      <td key={`${day}-${slot}`} className="grid-cell">
                        <LocationBadge
                          locationId={locationId}
                          isOwn={isOwn}
                          locations={locations}
                          onClick={isOwn ? (e) => toggleCell(user, day, slot, e.currentTarget) : undefined}
                        />
                        {isOpen && (
                          <LocationPicker
                            onSelect={(locId) => handleSelect(user, day, slot, locId)}
                            onClear={() => handleClear(user, day, slot)}
                            onClose={() => setOpenCell(null)}
                            locations={locations}
                            anchorEl={openCell.anchor}
                          />
                        )}
                      </td>
                    );
                  })
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="grid-footer">
        Last updated: <strong>{lastUpdated}</strong>
        &nbsp;&nbsp;·&nbsp;&nbsp;
        Auto-refreshes every 3 minutes
      </div>

      {showSettings && (
        <Settings
          onClose={() => setShowSettings(false)}
          onUsersChange={setUsers}
          onLocationsChange={setLocations}
        />
      )}
    </div>
  );
}
