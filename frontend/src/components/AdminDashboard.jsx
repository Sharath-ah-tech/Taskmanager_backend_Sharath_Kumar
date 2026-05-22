import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [lists, setLists] = useState({ users: [], groups: [], tasks: [] });
  const [activeTab, setActiveTab] = useState('tasks');
  const [loading, setLoading] = useState(true);
  const [savingTaskId, setSavingTaskId] = useState(null);
  const [savingUserId, setSavingUserId] = useState(null);
  const [message, setMessage] = useState('');

  const fetchAdminData = useCallback(async () => {
    try {
      const [usersRes, groupsRes, tasksRes] = await Promise.all([
        api.get('/auth/admin/users/'),
        api.get('/groups/'),
        api.get('/tasks/')
      ]);

      setLists({
        users: usersRes.data || [],
        groups: groupsRes.data.results || groupsRes.data || [],
        tasks: tasksRes.data.results || tasksRes.data || []
      });
    } catch (err) {
      console.error('Failed to load admin data', err);
      setMessage('Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAdminData();
  }, [fetchAdminData]);

  const updateTask = async (task, changes) => {
    setSavingTaskId(task.id);
    setMessage('');
    try {
      const payload = { ...changes };

      if (Object.prototype.hasOwnProperty.call(payload, 'due_date') && !payload.due_date) {
        payload.due_date = null;
      }
      const response = await api.patch(`/tasks/${task.id}/`, payload);
      setLists(prev => ({
        ...prev,
        tasks: prev.tasks.map(item => item.id === task.id ? { ...item, ...response.data } : item)
      }));
    } catch (err) {
      console.error('Failed to update task', err);
      setMessage(err.response?.data?.error || 'Failed to update task.');
    } finally {
      setSavingTaskId(null);
    }
  };

  const updateUser = async (member, changes) => {
    setSavingUserId(member.id);
    setMessage('');
    try {
      const response = await api.patch(`/auth/admin/users/${member.id}/`, changes);
      setLists(prev => ({
        ...prev,
        users: prev.users.map(item => item.id === member.id ? { ...item, ...response.data } : item)
      }));
    } catch (err) {
      console.error('Failed to update member', err);
      setMessage(err.response?.data?.error || 'Failed to update member.');
    } finally {
      setSavingUserId(null);
    }
  };

  if (loading) return <div className="text-center mt-8"><div className="loader mx-auto"></div></div>;

  const stats = {
    users: lists.users.length,
    groups: lists.groups.length,
    tasks: lists.tasks.length
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="admin-subnav">
        <div>
          <div className="text-sm text-muted font-bold">Admin Dashboard</div>
          <div className="font-semibold">{user?.email}</div>
        </div>
        <div className="admin-tabs">
          <button className={`admin-tab ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>Tasks</button>
          <button className={`admin-tab ${activeTab === 'groups' ? 'active' : ''}`} onClick={() => setActiveTab('groups')}>Teams</button>
          <button className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Members</button>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-4xl font-bold mb-0">Admin Dashboard</h1>
          <span className="admin-indicator">Admin Area</span>
        </div>
        <p className="text-muted">Manage tasks, teams, and registered members.</p>
      </div>

      {message && <div className="alert alert-error">{message}</div>}

      <div className="grid-cards mb-8" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        <button className="glass-card text-left" onClick={() => setActiveTab('tasks')} style={{ borderTop: '4px solid var(--warning)' }}>
          <h3 className="text-muted font-semibold mb-2">Tasks</h3>
          <p className="text-4xl font-bold">{stats.tasks}</p>
        </button>
        <button className="glass-card text-left" onClick={() => setActiveTab('groups')} style={{ borderTop: '4px solid var(--success)' }}>
          <h3 className="text-muted font-semibold mb-2">Teams</h3>
          <p className="text-4xl font-bold">{stats.groups}</p>
        </button>
        <button className="glass-card text-left" onClick={() => setActiveTab('users')} style={{ borderTop: '4px solid var(--accent-primary)' }}>
          <h3 className="text-muted font-semibold mb-2">Members</h3>
          <p className="text-4xl font-bold">{stats.users}</p>
        </button>
      </div>

      {activeTab === 'tasks' && (
        <div className="glass-card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold mb-0">Task Controls</h2>
            <Link to="/tasks/new" className="btn btn-primary btn-sm">New Task</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                  <th className="p-3 text-sm font-semibold text-muted">Light</th>
                  <th className="p-3 text-sm font-semibold text-muted">Task</th>
                  <th className="p-3 text-sm font-semibold text-muted">Status</th>
                  <th className="p-3 text-sm font-semibold text-muted">Due Date</th>
                  <th className="p-3 text-sm font-semibold text-muted">Enabled</th>
                  <th className="p-3 text-sm font-semibold text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {lists.tasks.map(task => {
                  const statusClass = task.status === 'completed' ? 'completed' : 'pending';
                  const dateValue = task.due_date ? task.due_date.substring(0, 16) : '';
                  return (
                    <tr key={task.id} className="border-b last:border-0" style={{ borderColor: 'var(--border-color)', opacity: task.is_enabled === false ? 0.55 : 1 }}>
                      <td className="p-3"><span className={`status-light ${statusClass}`} title={task.status} aria-label={task.status}></span></td>
                      <td className="p-3">
                        <div className="font-semibold">{task.title}</div>
                        <div className="text-xs text-muted">Group #{task.group?.id || task.group}</div>
                      </td>
                      <td className="p-3">
                        <select
                          className="form-input"
                          value={task.status}
                          onChange={e => updateTask(task, { status: e.target.value })}
                          disabled={savingTaskId === task.id}
                        >
                          <option value="pending">Pending</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <input
                          type="datetime-local"
                          className="form-input"
                          value={dateValue}
                          onChange={e => updateTask(task, { due_date: e.target.value })}
                          disabled={savingTaskId === task.id}
                        />
                      </td>
                      <td className="p-3">
                        <label className="flex items-center gap-2 font-semibold">
                          <input
                            type="checkbox"
                            checked={task.is_enabled !== false}
                            onChange={e => updateTask(task, { is_enabled: e.target.checked })}
                            disabled={savingTaskId === task.id}
                            style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
                          />
                          {task.is_enabled === false ? 'Disabled' : 'Enabled'}
                        </label>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Link to={`/tasks/${task.id}`} className="btn btn-outline btn-sm">Open</Link>
                          <Link to={`/tasks/${task.id}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'groups' && (
        <div className="glass-card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold mb-0">Teams</h2>
            <Link to="/groups/new" className="btn btn-primary btn-sm">New Team</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                  <th className="p-3 text-sm font-semibold text-muted">Team</th>
                  <th className="p-3 text-sm font-semibold text-muted">Members</th>
                  <th className="p-3 text-sm font-semibold text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {lists.groups.map(group => (
                  <tr key={group.id} className="border-b last:border-0" style={{ borderColor: 'var(--border-color)' }}>
                    <td className="p-3">
                      <div className="font-semibold">{group.name}</div>
                      <div className="text-xs text-muted">{group.description || 'No description'}</div>
                    </td>
                    <td className="p-3">{group.member_count || group.members?.length || 0}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Link to={`/groups/${group.id}`} className="btn btn-outline btn-sm">Manage Members</Link>
                        <Link to={`/groups/${group.id}/edit`} className="btn btn-secondary btn-sm">Edit Team</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="glass-card">
          <h2 className="text-2xl font-bold mb-4">Member Controls</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                  <th className="p-3 text-sm font-semibold text-muted">Email</th>
                  <th className="p-3 text-sm font-semibold text-muted">Username</th>
                  <th className="p-3 text-sm font-semibold text-muted">Role</th>
                  <th className="p-3 text-sm font-semibold text-muted">Account</th>
                  <th className="p-3 text-sm font-semibold text-muted">Tasks</th>
                  <th className="p-3 text-sm font-semibold text-muted">Joined</th>
                </tr>
              </thead>
              <tbody>
                {lists.users.map(item => (
                  <tr key={item.id} className="border-b last:border-0" style={{ borderColor: 'var(--border-color)' }}>
                    <td className="p-3 font-medium">{item.email}</td>
                    <td className="p-3">
                      <input
                        className="form-input"
                        defaultValue={item.username || ''}
                        onBlur={e => {
                          const username = e.target.value.trim();
                          if (username !== (item.username || '')) updateUser(item, { username });
                        }}
                        disabled={savingUserId === item.id}
                        style={{ minWidth: '150px' }}
                      />
                    </td>
                    <td className="p-3">
                      <span className={`badge ${item.is_superuser ? 'badge-warning' : 'badge-primary'}`}>
                        {item.is_superuser ? 'Superuser' : 'User'}
                      </span>
                    </td>
                    <td className="p-3">
                      <label className="flex items-center gap-2 font-semibold">
                        <input
                          type="checkbox"
                          checked={item.is_active !== false}
                          onChange={e => updateUser(item, { is_active: e.target.checked })}
                          disabled={savingUserId === item.id}
                          style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
                        />
                        {item.is_active === false ? 'Disabled' : 'Enabled'}
                      </label>
                    </td>
                    <td className="p-3">
                      <label className="flex items-center gap-2 font-semibold">
                        <input
                          type="checkbox"
                          checked={item.can_add_task !== false}
                          onChange={e => updateUser(item, { can_add_task: e.target.checked })}
                          disabled={savingUserId === item.id}
                          style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
                        />
                        Can create
                      </label>
                    </td>
                    <td className="p-3 text-muted">{new Date(item.date_joined).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
