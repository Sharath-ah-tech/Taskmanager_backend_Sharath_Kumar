import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { getTaskDetail, updateTask, deleteTask, addComment, deleteComment, uploadAttachment, deleteAttachment } from '../../services/tasks';
import { getGroups } from '../../services/groups';
import { useAuth } from '../../contexts/AuthContext';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [groups, setGroups] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [newComment, setNewComment] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = Boolean(user?.is_superuser);

  const fetchTask = useCallback(async () => {
    try {
      const res = await getTaskDetail(id);
      setTask(res.data);
      setFormData({
        ...res.data,
        group: res.data.group?.id || res.data.group || '',
      });
    } catch (error) {
      console.error('Failed to fetch task:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchGroups = useCallback(async () => {
    try {
      const res = await getGroups();
      setGroups(res.data.results || res.data);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTask();
    fetchGroups();
  }, [fetchTask, fetchGroups]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const dataToSubmit = isAdmin ? { ...formData } : { status: formData.status };
      if (!dataToSubmit.due_date) delete dataToSubmit.due_date;
      if (typeof dataToSubmit.due_date === 'string' && dataToSubmit.due_date.length > 16) {
        dataToSubmit.due_date = dataToSubmit.due_date.substring(0, 16);
      }
      await updateTask(id, dataToSubmit);
      setEditMode(false);
      fetchTask();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this task?')) {
      await deleteTask(id);
      navigate('/tasks');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await addComment(id, newComment);
      setNewComment('');
      fetchTask();
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    await deleteComment(id, commentId);
    fetchTask();
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    try {
      await uploadAttachment(id, selectedFile);
      setSelectedFile(null);
      fetchTask();
    } catch (error) {
      console.error('Failed to upload file:', error);
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    await deleteAttachment(id, attachmentId);
    fetchTask();
  };

  if (loading) return <div className="text-center mt-8"><div className="loader mx-auto"></div></div>;
  if (!task) return <div className="text-center mt-8 text-red-600 font-bold text-xl">Task not found</div>;

  const isExpired = task.due_date && new Date(task.due_date) < new Date(new Date().setHours(0,0,0,0));
  const isTaskDisabled = task.is_enabled === false || isExpired;
  const statusClass = task.status === 'completed' ? 'completed' : 'pending';

  return (
    <div className="animate-fade-in" style={{maxWidth: '1000px', margin: '0 auto'}}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <span className={`status-light ${statusClass}`} title={task.status} aria-label={task.status}></span>
          {task.title}
          {isTaskDisabled && <span className="text-xs font-bold bg-red-100 text-red-800 px-2 py-1 rounded">{isExpired ? 'EXPIRED' : 'DISABLED'}</span>}
        </h1>
        <div className="flex gap-2">
          <Link to="/tasks" className="btn btn-outline">Back</Link>
          {!editMode && (task.created_by === (user?.username || user?.email) || isAdmin) && (
            <button onClick={() => setEditMode(true)} className="btn btn-primary">Edit Task</button>
          )}
          {isAdmin && (
            <button onClick={handleDelete} className="btn btn-danger">Delete</button>
          )}
        </div>
      </div>

      <div className="grid-cards" style={{gridTemplateColumns: '2fr 1fr', gap: '2rem'}}>
        {/* Main Content Area */}
        <div className="space-y-6">
          {editMode ? (
            <div className="glass-card">
              <h2 className="text-xl font-bold mb-4">Edit Task</h2>
              <form onSubmit={handleUpdate}>
                {isAdmin && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Title</label>
                      <input
                        type="text"
                        value={formData.title || ''}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="form-input"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="form-input"
                        rows="5"
                      />
                    </div>
                  </>
                )}
                
                <div className="grid-cards mb-4" style={{gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                  <div className="form-group mb-0">
                    <label className="form-label">Status</label>
                    <select
                      value={formData.status || 'pending'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="form-input"
                    >
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  
                  <div className="form-group mb-0">
                    <label className="form-label">Light</label>
                    <div className="form-input flex items-center">
                      <span className={`status-light ${formData.status === 'completed' ? 'completed' : 'pending'}`} title={formData.status} aria-label={formData.status}></span>
                    </div>
                  </div>

                  {isAdmin && formData.priority === '__never__' && (
                    <div className="form-group mb-0">
                      <label className="form-label">Priority (Admin)</label>
                      <select
                        value={formData.priority || 'green_light'}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        className="form-input"
                      >
                        <option value="green_light">🟢 Green Light</option>
                        <option value="yellow_light">🟡 Yellow Light</option>
                        <option value="red_light">🔴 Red Light</option>
                      </select>
                    </div>
                  )}
                </div>

                {isAdmin && <div className="grid-cards mb-4" style={{gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                  <div className="form-group mb-0">
                    <label className="form-label">Due Date</label>
                    <input
                      type="datetime-local"
                      value={formData.due_date ? formData.due_date.substring(0, 16) : ''}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group mb-0">
                    <label className="form-label">Group</label>
                    <select
                      value={formData.group || ''}
                      onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                      className="form-input"
                    >
                      <option value="">Select Group</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                </div>}

                {isAdmin && (
                  <div className="form-group mb-6 flex items-center gap-3 p-4 rounded-lg mt-4" style={{background: 'var(--bg-secondary)', border: '1px solid var(--border-color)'}}>
                    <input
                      type="checkbox"
                      id="is_enabled"
                      checked={formData.is_enabled !== false}
                      onChange={e => setFormData({...formData, is_enabled: e.target.checked})}
                      style={{width: '20px', height: '20px', accentColor: 'var(--accent-primary)'}}
                    />
                    <label htmlFor="is_enabled" className="form-label mb-0" style={{cursor: 'pointer'}}>
                      <strong>Task Enabled</strong>
                    </label>
                  </div>
                )}

                <div className="flex gap-2 mt-6">
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                  <button type="button" onClick={() => setEditMode(false)} className="btn btn-secondary">Cancel</button>
                </div>
              </form>
            </div>
          ) : (
            <div className="glass-card" style={{opacity: isTaskDisabled ? 0.7 : 1}}>
              <h2 className="text-xl font-bold mb-4">Description</h2>
              <p className="text-muted leading-relaxed" style={{whiteSpace: 'pre-wrap'}}>
                {task.description || <em>No description provided.</em>}
              </p>
            </div>
          )}

          {/* Comments Section */}
          <div className="glass-card">
            <h2 className="text-xl font-bold mb-6">Discussion</h2>
            
            <div className="flex gap-3 mb-8">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="form-input flex-1"
                onKeyPress={e => e.key === 'Enter' && handleAddComment()}
              />
              <button onClick={handleAddComment} className="btn btn-primary">Post</button>
            </div>
            
            <div className="space-y-4">
              {task.comments?.length === 0 ? (
                <p className="text-muted text-center py-4">No comments yet. Start the discussion!</p>
              ) : (
                task.comments?.map((comment) => (
                  <div key={comment.id} className="p-4 rounded-lg" style={{background: 'var(--bg-secondary)', border: '1px solid var(--border-color)'}}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold">{comment.user}</div>
                      <div className="text-xs text-muted">{new Date(comment.created_at).toLocaleString()}</div>
                    </div>
                    <p className="text-muted mb-3">{comment.content}</p>
                    {(comment.user === (user?.username || user?.email) || isAdmin) && (
                      <button onClick={() => handleDeleteComment(comment.id)} className="btn btn-danger btn-sm">
                        Delete Comment
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="glass-card">
            <h2 className="text-lg font-bold mb-4 border-b pb-2" style={{borderColor: 'var(--border-color)'}}>Task Details</h2>
            
            <div className="space-y-4">
              <div>
                <div className="text-xs text-muted font-bold uppercase mb-1">Status</div>
                <span className={`status-light ${statusClass}`} title={task.status} aria-label={task.status}></span>
              </div>
              
              <div>
                <div className="text-xs text-muted font-bold uppercase mb-1">Due Date</div>
                <div className="font-medium">{task.due_date ? new Date(task.due_date).toLocaleString() : 'No due date'}</div>
              </div>
              
              <div>
                <div className="text-xs text-muted font-bold uppercase mb-1">Created By</div>
                <div className="font-medium">{task.created_by}</div>
              </div>
              
              <div>
                <div className="text-xs text-muted font-bold uppercase mb-1">Group</div>
                <div className="font-medium">
                  <Link to={`/groups/${task.group}`} className="hover:underline" style={{color: 'var(--accent-primary)'}}>
                    {task.group_name || 'View Group'}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <h2 className="text-lg font-bold mb-4 border-b pb-2" style={{borderColor: 'var(--border-color)'}}>Attachments</h2>
            
            <div className="flex gap-2 mb-4">
              <input 
                type="file" 
                onChange={(e) => setSelectedFile(e.target.files[0])} 
                className="form-input text-sm p-1" 
              />
              <button onClick={handleFileUpload} className="btn btn-secondary btn-sm">Upload</button>
            </div>
            
            {task.attachments?.length === 0 ? (
              <p className="text-muted text-sm text-center py-2">No files attached.</p>
            ) : (
              <ul className="space-y-3">
                {task.attachments?.map((attachment) => (
                  <li key={attachment.id} className="flex flex-col gap-1 p-2 rounded bg-white dark:bg-gray-800 border" style={{borderColor: 'var(--border-color)'}}>
                    <a href={attachment.file} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline truncate" style={{color: 'var(--accent-primary)'}}>
                      {attachment.file_name}
                    </a>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted">By {attachment.uploaded_by}</span>
                      <button onClick={() => handleDeleteAttachment(attachment.id)} className="btn btn-danger btn-sm">Remove</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
