import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ tasks: 0, groups: 0 });
  
  useEffect(() => {
    // In a real app, this would fetch actual stats from a dashboard endpoint
    // For now, we simulate fetching the list lengths to give the dashboard life
    const fetchStats = async () => {
      try {
        const [tasksRes, groupsRes] = await Promise.all([
          api.get('/tasks/'),
          api.get('/groups/')
        ]);
        setStats({
          tasks: tasksRes.data.count || tasksRes.data.length || 0,
          groups: groupsRes.data.count || groupsRes.data.length || 0
        });
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
      }
    };
    fetchStats();
  }, []);

  const greetings = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{greetings()}, {user?.username || user?.email?.split('@')[0]}</h1>
        <p className="text-muted text-lg">Here's what's happening with your projects today.</p>
      </div>

      <div className="grid-cards mb-8">
        <div className="glass-card flex flex-col justify-between" style={{borderTop: '4px solid var(--accent-primary)'}}>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg" style={{background: 'var(--accent-light)', color: 'var(--accent-primary)'}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4"></path>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
              </div>
              <h2 className="text-xl font-bold" style={{margin: 0}}>Tasks</h2>
            </div>
            <p className="text-3xl font-bold mb-2">{stats.tasks}</p>
            <p className="text-muted text-sm">Active tasks assigned to you</p>
          </div>
          <Link to="/tasks" className="btn btn-outline w-full mt-6" style={{textDecoration: 'none', justifyContent: 'center'}}>
            View All Tasks
          </Link>
        </div>

        <div className="glass-card flex flex-col justify-between" style={{borderTop: '4px solid var(--success)'}}>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg" style={{background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)'}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h2 className="text-xl font-bold" style={{margin: 0}}>Groups</h2>
            </div>
            <p className="text-3xl font-bold mb-2">{stats.groups}</p>
            <p className="text-muted text-sm">Teams you are collaborating with</p>
          </div>
          <Link to="/groups" className="btn btn-secondary w-full mt-6" style={{textDecoration: 'none', justifyContent: 'center', borderColor: 'rgba(16, 185, 129, 0.5)', color: 'var(--success)'}}>
            Manage Groups
          </Link>
        </div>
      </div>
      
      <div className="glass-card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold" style={{margin: 0}}>Quick Actions</h2>
        </div>
        <div className="flex gap-4">
          <Link to="/tasks" className="btn btn-primary">
            + New Task
          </Link>
          <Link to="/groups" className="btn btn-secondary">
            + New Group
          </Link>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;