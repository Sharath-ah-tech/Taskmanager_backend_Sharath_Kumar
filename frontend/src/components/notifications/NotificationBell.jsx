import { useState, useEffect, useCallback } from 'react';
import { getNotifications, getUnreadCount, markAsRead } from '../../services/notifications';

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await getUnreadCount();
      setUnreadCount(res.data.unread_count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data.results || res.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const handleBellClick = async () => {
    if (!showDropdown) await fetchNotifications();
    setShowDropdown(!showDropdown);
  };

  const handleMarkRead = async (id) => {
    await markAsRead(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    setUnreadCount(prev => Math.max(prev - 1, 0));
  };

  return (
    <div className="relative">
      <button onClick={handleBellClick} className="icon-button" aria-label="Notifications">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {unreadCount > 0 && (
          <span className="notification-count">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="notification-menu">
          <div className="p-3 font-bold border-b flex justify-between items-center" style={{ borderColor: 'var(--border-color)' }}>
            <span>Notifications</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowDropdown(false)}>Close</button>
          </div>
          {notifications.length === 0 ? (
            <div className="p-4 text-muted text-center">No notifications</div>
          ) : (
            notifications.map(notif => (
              <button key={notif.id} className="notification-item" onClick={() => handleMarkRead(notif.id)}>
                <span className="text-sm font-medium">{notif.message}</span>
                <span className="text-xs text-muted mt-2" style={{ display: 'block' }}>
                  {new Date(notif.created_at).toLocaleString()}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
