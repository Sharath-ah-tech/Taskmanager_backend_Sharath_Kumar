import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getTasks } from '../../services/tasks';

const CalendarView = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayTasks, setSelectedDayTasks] = useState(null); // Stores tasks for the clicked day
  const navigate = useNavigate();

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

  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDayTasks(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDayTasks(null);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDayTasks(null);
  };

  const isExpired = (dueDateStr) => {
    if (!dueDateStr) return false;
    const dueDate = new Date(dueDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Compare to start of today
    return dueDate < today;
  };

  const handleDayClick = (dayTasks, dayDate) => {
    // Only open popup if there are tasks on that day
    if (dayTasks.length > 0) {
      setSelectedDayTasks({ date: dayDate, tasks: dayTasks });
    }
  };

  const renderCalendar = () => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const days = getDaysInMonth(month, year);
    const firstDay = getFirstDayOfMonth(month, year);
    
    const calendarCells = [];
    
    // Empty cells for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      calendarCells.push(
        <td key={`empty-${i}`} className="border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 h-32 align-top p-1 w-[14.28%]"></td>
      );
    }
    
    // Actual days
    for (let day = 1; day <= days; day++) {
      const currentDayDate = new Date(year, month, day);
      const isToday = new Date().toDateString() === currentDayDate.toDateString();
      const isSunday = currentDayDate.getDay() === 0;
      
      // Filter tasks for this day
      const dayTasks = tasks.filter(task => {
        if (!task.due_date) return false;
        const taskDate = new Date(task.due_date);
        return taskDate.getDate() === day && taskDate.getMonth() === month && taskDate.getFullYear() === year;
      });
      
      calendarCells.push(
        <td 
          key={day} 
          onClick={() => handleDayClick(dayTasks, currentDayDate)}
          className={`border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] h-32 align-top p-1 w-[14.28%] transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${dayTasks.length > 0 ? 'cursor-pointer' : ''}`}
        >
          {/* Centered Date Number */}
          <div className="flex justify-center items-center mb-1">
            <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : isSunday ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
              {day}
            </span>
          </div>
          
          {/* Task Pills (Inside the grid) */}
          <div className="h-24 overflow-y-auto space-y-1 custom-scrollbar px-1">
            {dayTasks.map(task => {
              const expired = isExpired(task.due_date);
              const isTaskDisabled = task.is_enabled === false || expired;
              
              let pillClass = 'bg-green-100 text-green-800 border-l-4 border-green-500';
              if (task.priority === 'red_light') {
                pillClass = 'bg-red-100 text-red-800 border-l-4 border-red-500';
              } else if (task.priority === 'yellow_light') {
                pillClass = 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500';
              }
              
              if (isTaskDisabled) {
                pillClass = 'bg-gray-200 text-gray-700 border-l-4 border-gray-500 grayscale opacity-75 line-through';
              }

              return (
                <div 
                  key={task.id} 
                  className={`text-[10px] px-1 py-0.5 rounded truncate font-bold transition-all ${pillClass}`}
                  title={task.title}
                >
                  {task.title}
                </div>
              );
            })}
          </div>
        </td>
      );
    }
    
    // Fill remaining cells to complete the final row
    const remainingCells = (7 - (calendarCells.length % 7)) % 7;
    for (let i = 0; i < remainingCells; i++) {
      calendarCells.push(
        <td key={`empty-end-${i}`} className="border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 h-32 align-top p-1 w-[14.28%]"></td>
      );
    }
    
    // Group cells into rows of 7
    const rows = [];
    for (let i = 0; i < calendarCells.length; i += 7) {
      rows.push(
        <tr key={`row-${i}`}>
          {calendarCells.slice(i, i + 7)}
        </tr>
      );
    }
    
    return rows;
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  if (loading) return <div className="text-center mt-8"><div className="loader mx-auto"></div></div>;

  return (
    <div className="animate-fade-in" style={{maxWidth: '1200px', margin: '0 auto'}}>
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h1>
          
          <div className="flex items-center gap-2">
            <button onClick={handleToday} className="btn btn-outline py-1.5 px-4">
              Today
            </button>
            <div className="flex ml-2 gap-1">
              <button onClick={handlePrevMonth} className="btn btn-secondary py-1.5 px-3">
                &larr;
              </button>
              <button onClick={handleNextMonth} className="btn btn-secondary py-1.5 px-3">
                &rarr;
              </button>
            </div>
          </div>
        </div>
        
        <Link to="/tasks/new" className="btn btn-primary shadow-lg flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Create Task
        </Link>
      </div>

      {/* HTML Table Container */}
      <div className="glass-card p-4 shadow-lg border border-gray-200 dark:border-gray-700 relative">
        <table className="w-full table-fixed border-collapse border border-gray-300 dark:border-gray-700">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                <th key={day} className={`border border-gray-300 dark:border-gray-700 py-3 text-sm font-bold tracking-wider uppercase ${idx === 0 ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'}`}>
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {renderCalendar()}
          </tbody>
        </table>
      </div>

      {/* Pop-up Modal for Clicked Date Tasks */}
      {selectedDayTasks && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in p-4" onClick={() => setSelectedDayTasks(null)}>
          <div className="bg-white dark:bg-[#222] p-6 rounded-2xl max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Tasks for {selectedDayTasks.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</h3>
              <button onClick={() => setSelectedDayTasks(null)} className="text-gray-500 hover:text-gray-800">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar mb-4">
              {selectedDayTasks.tasks.map(task => {
                const expired = isExpired(task.due_date);
                const isTaskDisabled = task.is_enabled === false || expired;
                
                let colorClass = 'text-green-600 bg-green-50 border-green-200';
                if (task.priority === 'red_light') colorClass = 'text-red-600 bg-red-50 border-red-200';
                if (task.priority === 'yellow_light') colorClass = 'text-yellow-600 bg-yellow-50 border-yellow-200';
                if (isTaskDisabled) colorClass = 'text-gray-500 bg-gray-100 grayscale border-gray-300';

                return (
                  <div 
                    key={task.id} 
                    onClick={() => navigate(`/tasks/${task.id}`)}
                    className={`p-3 rounded-lg flex flex-col gap-1 cursor-pointer hover:brightness-95 transition-all border shadow-sm ${colorClass}`}
                  >
                    <div className="font-bold flex justify-between items-center text-[15px]">
                      <span>{task.title}</span>
                      {isTaskDisabled && <span className="text-[10px] uppercase font-black bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">{expired ? 'Expired' : 'Disabled'}</span>}
                    </div>
                    {task.description && (
                      <div className="text-xs opacity-80 line-clamp-2 mt-1">{task.description}</div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <Link 
              to="/tasks/new" 
              className="w-full btn btn-outline border-dashed text-gray-600 flex justify-center items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Create another task
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
