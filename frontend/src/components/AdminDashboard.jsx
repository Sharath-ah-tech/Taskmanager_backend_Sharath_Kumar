import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { user } = useAuth();
  
  const [stats, setStats] = useState({ users: 0, groups: 0, tasks: 0 });
  const [lists, setLists] = useState({ users: [], groups: [], tasks: [] });
  const [activeTab, setActiveTab] = useState(null); // 'users', 'groups', 'tasks'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const [usersRes, groupsRes, tasksRes] = await Promise.all([
          api.get('/auth/admin/users/'), // The new endpoint we created
          api.get('/groups/'),
          api.get('/tasks/')
        ]);
        
        const usersData = usersRes.data || [];
        const groupsData = groupsRes.data.results || groupsRes.data || [];
        const tasksData = tasksRes.data.results || tasksRes.data || [];
        
        setLists({
          users: usersData,
          groups: groupsData,
          tasks: tasksData
        });
        
        setStats({
          users: usersData.length,
          groups: groupsData.length,
          tasks: tasksData.length
        });
      } catch (err) {
        console.error("Failed to load admin stats", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdminStats();
  }, []);

  if (loading) return <div className="text-center mt-8"><div className="loader mx-auto"></div></div>;

  return (
    <div className="animate-fade-in" style={{maxWidth: '1200px', margin: '0 auto'}}>
      <div className="mb-8 flex items-center gap-4">
        <div className="p-3 rounded-xl" style={{background: 'linear-gradient(135deg, var(--danger), #dc2626)', color: 'white'}}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
            <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
          </svg>
        </div>
        <div>
          <h1 className="text-4xl font-bold mb-1">Admin Dashboard</h1>
          <p className="text-muted">Platform Overview & Management</p>
        </div>
      </div>

      <div className="grid-cards mb-8" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))'}}>
        <div 
          onClick={() => setActiveTab(activeTab === 'users' ? null : 'users')}
          className="glass-card cursor-pointer transition-all hover:scale-105" 
          style={{borderTop: '4px solid var(--accent-primary)', outline: activeTab === 'users' ? '2px solid var(--accent-primary)' : 'none'}}
        >
          <h3 className="text-muted font-semibold mb-2 flex items-center justify-between">
            Total Users
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </h3>
          <p className="text-4xl font-bold">{stats.users}</p>
          <p className="text-xs text-blue-500 mt-2 font-semibold">Click to view details &rarr;</p>
        </div>
        
        <div 
          onClick={() => setActiveTab(activeTab === 'groups' ? null : 'groups')}
          className="glass-card cursor-pointer transition-all hover:scale-105" 
          style={{borderTop: '4px solid var(--success)', outline: activeTab === 'groups' ? '2px solid var(--success)' : 'none'}}
        >
          <h3 className="text-muted font-semibold mb-2 flex items-center justify-between">
            Total Groups
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </h3>
          <p className="text-4xl font-bold">{stats.groups}</p>
          <p className="text-xs text-green-500 mt-2 font-semibold">Click to view details &rarr;</p>
        </div>
        
        <div 
          onClick={() => setActiveTab(activeTab === 'tasks' ? null : 'tasks')}
          className="glass-card cursor-pointer transition-all hover:scale-105" 
          style={{borderTop: '4px solid var(--warning)', outline: activeTab === 'tasks' ? '2px solid var(--warning)' : 'none'}}
        >
          <h3 className="text-muted font-semibold mb-2 flex items-center justify-between">
            Total Tasks
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </h3>
          <p className="text-4xl font-bold">{stats.tasks}</p>
          <p className="text-xs text-yellow-500 mt-2 font-semibold">Click to view details &rarr;</p>
        </div>
      </div>
      
      {/* Dynamic List Rendering */}
      {activeTab === 'users' && (
        <div className="glass-card animate-fade-in mb-8">
          <h2 className="text-2xl font-bold mb-4">All Users</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b" style={{borderColor: 'var(--border-color)'}}>
                  <th className="p-3 text-sm font-semibold text-muted">ID</th>
                  <th className="p-3 text-sm font-semibold text-muted">Email / Username</th>
                  <th className="p-3 text-sm font-semibold text-muted">Role</th>
                  <th className="p-3 text-sm font-semibold text-muted">Date Joined</th>
                </tr>
              </thead>
              <tbody>
                {lists.users.map(u => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800" style={{borderColor: 'var(--border-color)'}}>
                    <td className="p-3 text-sm">{u.id}</td>
                    <td className="p-3 text-sm font-medium">{u.email || u.username} {u.id === user?.id && <span className="bg-blue-100 text-blue-800 text-xs px-1.5 rounded ml-2">You</span>}</td>
                    <td className="p-3 text-sm">
                      {u.is_admin ? <span className="text-red-500 font-bold text-xs uppercase tracking-wider">Admin</span> : <span className="text-gray-500 text-xs uppercase tracking-wider">User</span>}
                    </td>
                    <td className="p-3 text-sm text-muted">{new Date(u.date_joined).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'groups' && (
        <div className="glass-card animate-fade-in mb-8">
          <h2 className="text-2xl font-bold mb-4">All Groups</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b" style={{borderColor: 'var(--border-color)'}}>
                  <th className="p-3 text-sm font-semibold text-muted">Name</th>
                  <th className="p-3 text-sm font-semibold text-muted">Description</th>
                  <th className="p-3 text-sm font-semibold text-muted">Action</th>
                </tr>
              </thead>
              <tbody>
                {lists.groups.map(g => (
                  <tr key={g.id} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800" style={{borderColor: 'var(--border-color)'}}>
                    <td className="p-3 text-sm font-medium">{g.name}</td>
                    <td className="p-3 text-sm text-muted max-w-xs truncate">{g.description || 'No description'}</td>
                    <td className="p-3 text-sm">
                      <Link to={`/groups/${g.id}`} className="text-blue-500 hover:underline">View Group</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="glass-card animate-fade-in mb-8">
          <h2 className="text-2xl font-bold mb-4">All Tasks</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b" style={{borderColor: 'var(--border-color)'}}>
                  <th className="p-3 text-sm font-semibold text-muted">Title</th>
                  <th className="p-3 text-sm font-semibold text-muted">Priority</th>
                  <th className="p-3 text-sm font-semibold text-muted">Status</th>
                  <th className="p-3 text-sm font-semibold text-muted">Action</th>
                </tr>
              </thead>
              <tbody>
                {lists.tasks.map(t => {
                  let priorityColor = 'text-green-500';
                  if (t.priority === 'red_light') priorityColor = 'text-red-500';
                  if (t.priority === 'yellow_light') priorityColor = 'text-yellow-500';

                  return (
                    <tr key={t.id} className={`border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800 ${t.is_enabled === false ? 'opacity-50 grayscale' : ''}`} style={{borderColor: 'var(--border-color)'}}>
                      <td className="p-3 text-sm font-medium">{t.title} {t.is_enabled === false && <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-1 rounded">DISABLED</span>}</td>
                      <td className={`p-3 text-xs font-bold uppercase ${priorityColor}`}>
                        {t.priority.replace('_', ' ')}
                      </td>
                      <td className="p-3 text-sm text-muted capitalize">{t.status.replace('_', ' ')}</td>
                      <td className="p-3 text-sm">
                        <Link to={`/tasks/${t.id}`} className="text-blue-500 hover:underline">View Task</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {!activeTab && (
        <div className="glass-card">
          <h2 className="text-2xl font-bold mb-4">Platform Settings</h2>
          <p className="text-muted mb-6">Click on any of the metric cards above to view detailed lists of platform data.</p>
          
          <div className="alert alert-info">
            <strong>Note:</strong> You are seeing this page because your account has <code>is_admin</code> privileges.
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
