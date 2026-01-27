import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, CheckCircle2, Circle, Trash2, Loader2, ListTodo, Sparkles } from 'lucide-react';
import { taskAPI } from '../services/api';
import toast from 'react-hot-toast';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [counts, setCounts] = useState({ total: 0, completed: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', category: 'other', priority: 'medium' });

  useEffect(() => { fetchTasks(); }, [filter]);

  const fetchTasks = async () => {
    try {
      const params = {};
      if (filter === 'pending') params.status = 'pending';
      if (filter === 'completed') params.status = 'completed';
      const response = await taskAPI.getAll(params);
      setTasks(response.data.data.tasks);
      setCounts(response.data.data.counts);
    } catch (error) {
      toast.error('Error loading tasks');
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (id) => {
    try {
      await taskAPI.toggle(id);
      fetchTasks();
      toast.success('Task updated!');
    } catch (error) {
      toast.error('Error updating task');
    }
  };

  const deleteTask = async (id) => {
    try {
      await taskAPI.delete(id);
      fetchTasks();
      toast.success('Task deleted');
    } catch (error) {
      toast.error('Error deleting task');
    }
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    try {
      await taskAPI.create(newTask);
      setNewTask({ title: '', description: '', category: 'other', priority: 'medium' });
      setShowAddModal(false);
      fetchTasks();
      toast.success('Task created!');
    } catch (error) {
      toast.error('Error creating task');
    }
  };

  if (loading) {
    return (<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 text-primary-500 animate-spin" /></div>);
  }

  return (
    <div className="min-h-screen">
      <div className="border-b border-dark-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 hover:bg-dark-800 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
            <div><h1 className="text-xl font-bold">Tasks</h1><p className="text-sm text-dark-500">{counts.pending} pending, {counts.completed} completed</p></div>
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" />Add Task</button>
        </div>
      </div>

      <div className="px-6 py-4 border-b border-dark-800">
        <div className="max-w-4xl mx-auto flex gap-2">
          {['all', 'pending', 'completed'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm capitalize ${filter === f ? 'bg-primary-500/20 text-primary-400' : 'text-dark-400 hover:bg-dark-800'}`}>{f}</button>
          ))}
        </div>
      </div>

      <div className="px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks.map((task, i) => (
                <motion.div key={task.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`glass-card p-4 flex items-center gap-4 ${task.isCompleted ? 'opacity-60' : ''}`}>
                  <button onClick={() => toggleTask(task.id)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.isCompleted ? 'bg-accent-500 border-accent-500' : 'border-dark-600 hover:border-primary-500'}`}>
                    {task.isCompleted && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium ${task.isCompleted ? 'line-through text-dark-500' : ''}`}>{task.title}</div>
                    {task.description && <p className="text-sm text-dark-500 truncate">{task.description}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-dark-500">{task.category}</span>
                      {task.isAiGenerated && <span className="flex items-center gap-1 text-xs text-primary-400"><Sparkles className="w-3 h-3" />AI</span>}
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${task.priority === 'high' ? 'bg-red-500/20 text-red-400' : task.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-dark-700 text-dark-400'}`}>{task.priority}</span>
                  <button onClick={() => deleteTask(task.id)} className="p-2 text-dark-500 hover:text-red-400 hover:bg-dark-800 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12"><ListTodo className="w-12 h-12 text-dark-600 mx-auto mb-4" /><p className="text-dark-400">No tasks found</p></div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Task</h2>
            <form onSubmit={addTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Title</label>
                <input type="text" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} placeholder="Task title" className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Description</label>
                <textarea value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} placeholder="Optional description" className="input-field" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Category</label>
                  <select value={newTask.category} onChange={(e) => setNewTask({ ...newTask, category: e.target.value })} className="input-field">
                    <option value="exam">Exam</option>
                    <option value="document">Document</option>
                    <option value="application">Application</option>
                    <option value="research">Research</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Priority</label>
                  <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })} className="input-field">
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 btn-secondary">Cancel</button>
                <button type="submit" className="flex-1 btn-primary">Add Task</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
