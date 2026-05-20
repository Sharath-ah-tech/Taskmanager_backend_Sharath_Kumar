import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTasks, deleteTask } from '../../services/tasks';
import { useAuth } from '../../contexts/AuthContext';

const TaskList = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await getTasks();
      setTasks(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this task?')) {
      try {
        await deleteTask(id);
        fetchTasks();
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'red_light': return { color: '#dc2626', bg: 'rgba(239, 68, 68, 0.1)', text: '🔴 Red Light', border: '#dc2626' };
      case 'yellow_light': return { color: '#d97706', bg: 'rgba(245, 158, 11, 0.1)', text: '🟡 Yellow Light', border: '#d97706' };
      default: return { color: '#16a34a', bg: 'rgba(34, 197, 94, 0.1)', text: '🟢 Green Light', border: '#16a34a' };
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="text-center mt-8"><div className="loader mx-auto"></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-1">My Tasks</h1>
          <p className="text-muted">Manage your assigned tasks and priorities.</p>
        </div>
        <Link to="/tasks/new" className="btn btn-primary">
          + New Task
        </Link>
      </div>
      
      {tasks.length === 0 ? (
        <div className="glass-card text-center py-12">
          <h3 className="text-2xl font-semibold mb-2">No tasks found</h3>
          <p className="text-muted mb-6">You don't have any tasks assigned yet. Get started by creating one!</p>
          <Link to="/tasks/new" className="btn btn-outline">Create First Task</Link>
        </div>
      ) : (
        <div className="grid-cards mb-8" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))'}}>
          {tasks.map((task) => {
            const priorityInfo = getPriorityStyle(task.priority);
            
            const isExpired = task.due_date && new Date(task.due_date) < new Date(new Date().setHours(0,0,0,0));
            const isTaskDisabled = task.is_enabled === false || isExpired;
            
            return (
              <div 
                key={task.id} 
                className="glass-card flex flex-col justify-between"
                style={{
                  borderTop: `4px solid ${priorityInfo.border}`,
                  opacity: isTaskDisabled ? 0.6 : 1,
                  filter: isTaskDisabled ? 'grayscale(0.8)' : 'none',
                  position: 'relative'
                }}
              >
                {isTaskDisabled && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded">
                    {isExpired ? 'EXPIRED' : 'DISABLED'}
                  </div>
                )}
                
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <Link to={`/tasks/${task.id}`} className="text-xl font-bold hover:underline" style={{textDecoration: 'none'}}>
                      {task.title}
                    </Link>
                  </div>
                  
                  <p className="text-muted text-sm mb-4" style={{display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>
                    {task.description || 'No description provided.'}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span 
                      className="text-xs font-bold px-2 py-1 rounded-md" 
                      style={{background: priorityInfo.bg, color: priorityInfo.color}}
                    >
                      {priorityInfo.text}
                    </span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${getStatusColor(task.status)}`}>
                      {task.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="text-xs text-muted flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No Due Date'}
                  </div>
                  
                  <div className="flex gap-2">
                    <Link to={`/tasks/${task.id}/edit`} className="text-sm font-semibold hover:underline" style={{color: 'var(--accent-primary)'}}>
                      Edit
                    </Link>
                    {(task.created_by === (user?.username || user?.email) || user?.is_admin) && (
                      <button onClick={() => handleDelete(task.id)} className="text-sm font-semibold hover:underline text-red-600">
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TaskList;