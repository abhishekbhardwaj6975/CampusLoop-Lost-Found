export const ITEM_CATEGORIES = [
  'Electronics',
  'ID & Cards',
  'Wallet & Cash',
  'Books & Notes',
  'Accessories',
  'Keys',
  'Water Bottles',
  'Bags',
  'Clothing',
  'Others',
];

export const CAMPUS_LOCATIONS = [
  'Central Library - 1st Floor',
  'Central Library - 2nd Floor',
  'Main Cafeteria',
  'CSE Block - Lab 1',
  'CSE Block - Lab 3',
  'Academic Block A - Seminar Hall',
  'Lecture Hall B-204',
  'Main Auditorium Lawn',
  'Sports Complex - Basketball Court',
  'Hostel Gate 2 Pathway',
  'Hostel Block 3 - ATM Kiosk',
  'Campus Main Gate - Bus Stand',
];

export const DEPARTMENTS = [
  'B.Tech CSE',
  'B.Tech IT',
  'B.Tech ECE',
  'B.Tech EEE',
  'B.Tech Mechanical',
  'B.Tech Civil',
  'MCA',
  'MBA',
  'Faculty / Staff',
  'Student Affairs & Administration',
];

export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const now = Date.now();
  const then = new Date(dateString).getTime();
  if (Number.isNaN(then)) return '';
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}

export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.errors?.[0]?.message ||
    error?.message ||
    fallback
  );
}

