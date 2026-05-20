import { useState, useEffect } from 'react';
import { getNotifications, getUnreadCount, markAsRead } from '../../services/notifications';

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await getUnreadCount();
      setUnreadCount(res.data.unread_count);
    } catch (error) {}
  };

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data);
    } catch (error) {}
  };

  const handleBellClick = async () => {
    if (!showDropdown) await fetchNotifications();
    setShowDropdown(!showDropdown);
  };

  const handleMarkRead = async (id) => {
    await markAsRead(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    setUnreadCount(prev => prev - 1);
  };

  return (
    <div className="relative">
      <button onClick={handleBellClick} className="relative">
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded shadow-lg z-10 max-h-96 overflow-y-auto">
          <div className="p-2 font-bold border-b">Notifications</div>
          {notifications.length === 0 ? (
            <div className="p-4 text-gray-500 text-center">No notifications</div>
          ) : (
            notifications.map(notif => (
              <div key={notif.id} className="p-3 border-b hover:bg-gray-50 cursor-pointer" onClick={() => handleMarkRead(notif.id)}>
                <p className="text-sm">{notif.message}</p>
                <span className="text-xs text-gray-400">{new Date(notif.created_at).toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
export default NotificationBell;