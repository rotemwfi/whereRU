import { supabase } from './lib/supabase';

export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
export const SLOTS = ['morning', 'afternoon'];

export function getWeekStart() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split('T')[0];
}

export function getCurrentWeekDates() {
  const today = new Date();
  const day = today.getDay();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - day);
  return DAYS.map((_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });
}

export function formatDate(date) {
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

export function getCurrentUser() {
  return localStorage.getItem('whereRU_currentUser') || null;
}

export function saveCurrentUser(name) {
  localStorage.setItem('whereRU_currentUser', name);
}

export async function getUsers() {
  const { data } = await supabase.from('users').select('*').order('sort_order');
  return data || [];
}

export async function addUser(name) {
  await supabase.from('users').insert({ name, emoji: '👤', sort_order: 0 });
}

export async function deleteUser(name) {
  await supabase.from('users').delete().eq('name', name);
}

export async function renameUser(oldName, newName) {
  await supabase.from('users').update({ name: newName }).eq('name', oldName);
}

export async function getLocations() {
  const { data } = await supabase.from('locations').select('*').order('sort_order');
  return data || [];
}

export async function addLocation(loc) {
  await supabase.from('locations').insert(loc);
}

export async function deleteLocation(id) {
  await supabase.from('locations').delete().eq('id', id);
}

export async function updateLocation(id, updates) {
  await supabase.from('locations').upsert({ id, ...updates });
}

export async function getCheckins(weekStart) {
  const { data } = await supabase.from('checkins').select('*').eq('week_start', weekStart);
  return data || [];
}

export async function saveCheckin(user_name, day, slot, location_id, week_start) {
  await supabase.from('checkins').upsert(
    { user_name, day, slot, location_id, week_start },
    { onConflict: 'user_name,day,slot,week_start' }
  );
}

export async function clearCheckin(user_name, day, slot, week_start) {
  await supabase.from('checkins').delete().match({ user_name, day, slot, week_start });
}
