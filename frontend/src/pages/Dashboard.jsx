import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Sparkles,
  Target,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowRight,
  University,
  ListTodo,
  MessageSquare,
  User,
  LogOut,
  Menu,
  X,
  Lock,
  Unlock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, taskAPI } from '../services/api';
import toast from 'react-hot-toast';

const STAGES = [
  { id: 1, name: 'Building Profile', icon: User },
  { id: 2, name: 'Discovering', icon: Target },
  { id: 3, name: 'Finalizing', icon: Lock },
  { id: 4, name: 'Preparing', icon: ListTodo },
];

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, [user?.currentStage]);

  const fetchDashboard = async () => {
    try {
      const response = await dashboardAPI.get();
      setData(response.data.data);
    } catch (error) {
      toast.error('Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (taskId) => {
    try {
      await taskAPI.toggle(taskId);
      fetchDashboard();
      toast.success('Task updated!');
    } catch (error) {
      toast.error('Error updating task');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { profile, shortlistedUniversities, tasks, stats, currentStageInfo } = data || {};

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-dark-900/95 backdrop-blur-xl border-r border-dark-800 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-dark-800">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-lg font-bold">StudyPath<span className="text-primary-400">.ai</span></span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 bg-primary-500/10 text-primary-400 rounded-xl">
              <TrendingUp className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </Link>
            <Link to="/counselor" className="flex items-center gap-3 px-4 py-3 text-dark-400 hover:text-white hover:bg-dark-800 rounded-xl transition-colors">
              <Sparkles className="w-5 h-5" />
              <span>AI Counselor</span>
            </Link>
            <Link to="/universities" className="flex items-center gap-3 px-4 py-3 text-dark-400 hover:text-white hover:bg-dark-800 rounded-xl transition-colors">
              <University className="w-5 h-5" />
              <span>Universities</span>
            </Link>
            <Link to="/tasks" className="flex items-center gap-3 px-4 py-3 text-dark-400 hover:text-white hover:bg-dark-800 rounded-xl transition-colors">
              <ListTodo className="w-5 h-5" />
              <span>Tasks</span>
              {stats?.pendingTasks > 0 && (
                <span className="ml-auto px-2 py-0.5 bg-primary-500 text-white text-xs rounded-full">{stats.pendingTasks}</span>
              )}
            </Link>
            <Link to="/profile" className="flex items-center gap-3 px-4 py-3 text-dark-400 hover:text-white hover:bg-dark-800 rounded-xl transition-colors">
              <User className="w-5 h-5" />
              <span>Profile</span>
            </Link>
          </nav>

          {/* User */}
          <div className="p-4 border-t border-dark-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold">{user?.fullName?.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{user?.fullName}</div>
                <div className="text-sm text-dark-500 truncate">{user?.email}</div>
              </div>
            </div>
            <button onClick={logout} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-xl transition-colors">
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-dark-800">
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-dark-800 rounded-lg">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold">Dashboard</span>
          <div className="w-10" />
        </div>

        <div className="p-6 lg:p-8 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold mb-1">Welcome back, {user?.fullName?.split(' ')[0]}!</h1>
              <p className="text-dark-400">Here's your study abroad journey progress</p>
            </div>
            <Link to="/counselor" className="btn-primary flex items-center gap-2 w-fit">
              <Sparkles className="w-5 h-5" />
              Talk to AI Counselor
            </Link>
          </div>

          {/* Stage Progress */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 mb-6">
            <h3 className="font-semibold mb-4">Your Journey</h3>
            <div className="flex items-center justify-between">
              {STAGES.map((stage, i) => (
                <div key={stage.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`stage-indicator ${user?.currentStage === stage.id ? 'active' : user?.currentStage > stage.id ? 'completed' : 'pending'}`}>
                      {user?.currentStage > stage.id ? <CheckCircle2 className="w-5 h-5" /> : <stage.icon className="w-5 h-5" />}
                    </div>
                    <span className={`mt-2 text-xs ${user?.currentStage === stage.id ? 'text-white' : 'text-dark-500'}`}>{stage.name}</span>
                  </div>
                  {i < STAGES.length - 1 && (
                    <div className={`w-12 md:w-24 h-1 mx-2 rounded ${user?.currentStage > stage.id ? 'bg-accent-500' : 'bg-dark-700'}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 bg-primary-500/10 rounded-xl">
              <div className="flex items-center gap-2 text-primary-400">
                <Target className="w-5 h-5" />
                <span className="font-medium">Current: {currentStageInfo?.name}</span>
              </div>
              <p className="text-sm text-dark-400 mt-1">{currentStageInfo?.description}</p>
            </div>
          </motion.div>

          {user?.currentStage >= 3 && (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-card p-6 mb-6 border border-accent-500/40"
  >
    <h3 className="text-lg font-semibold mb-2">
      🎯 Preparation Stage Unlocked
    </h3>
    <p className="text-dark-400 mb-4">
      You’ve locked a university. Start preparing SOPs, exams, and application forms.
    </p>
    <Link
      to="/preparation"
      className="btn-primary inline-flex items-center gap-2"
    >
      Go to Preparation
    </Link>
  </motion.div>
)}


          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Profile Strength', value: `${stats?.profileStrength || 0}%`, icon: TrendingUp, color: 'primary' },
              { label: 'Universities', value: stats?.totalShortlisted || 0, icon: University, color: 'accent' },
              { label: 'Locked', value: stats?.lockedUniversities || 0, icon: Lock, color: 'purple' },
              { label: 'Pending Tasks', value: stats?.pendingTasks || 0, icon: Clock, color: 'amber' },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-5">
                <div className={`w-10 h-10 bg-${stat.color}-500/20 rounded-xl flex items-center justify-center mb-3`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
                </div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-dark-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Profile Strength */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Profile Strength</h3>
                <Link to="/profile" className="text-primary-400 text-sm hover:underline">Edit Profile</Link>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Academics', value: profile?.academicStrength },
                  { label: 'Exams', value: profile?.examStrength },
                  { label: 'SOP', value: profile?.sopStrength },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-dark-400">{item.label}</span>
                      <span className={`font-medium ${item.value === 'strong' ? 'text-accent-400' : item.value === 'average' ? 'text-amber-400' : 'text-red-400'}`}>
                        {item.value || 'Not set'}
                      </span>
                    </div>
                    <div className="strength-meter">
                      <div className={`strength-meter-fill ${item.value || 'weak'}`} style={{ width: item.value === 'strong' ? '100%' : item.value === 'average' ? '60%' : '30%' }} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Tasks */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">AI To-Do List</h3>
                <Link to="/tasks" className="text-primary-400 text-sm hover:underline">View All</Link>
              </div>
              {tasks?.length > 0 ? (
                <div className="space-y-2">
                  {tasks.slice(0, 5).map((task) => (
                    <div key={task.id} className="task-item">
                      <button onClick={() => toggleTask(task.id)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${task.isCompleted ? 'bg-accent-500 border-accent-500' : 'border-dark-600 hover:border-primary-500'}`}>
                        {task.isCompleted && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className={`truncate ${task.isCompleted ? 'text-dark-500 line-through' : ''}`}>{task.title}</div>
                        <div className="text-xs text-dark-500">{task.category}</div>
                      </div>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${task.priority === 'high' ? 'bg-red-500/20 text-red-400' : task.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-dark-700 text-dark-400'}`}>
                        {task.priority}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-dark-500">
                  <ListTodo className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No tasks yet</p>
                </div>
              )}
            </motion.div>

            {/* Shortlisted Universities */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Shortlisted Universities</h3>
                <Link to="/universities" className="text-primary-400 text-sm hover:underline">Explore More</Link>
              </div>
              {shortlistedUniversities?.all?.length > 0 ? (
                <div className="grid md:grid-cols-3 gap-4">
                  {['dream', 'target', 'safe'].map((category) => (
                    <div key={category}>
                      <div className={`text-sm font-medium mb-2 ${category === 'dream' ? 'text-amber-400' : category === 'target' ? 'text-primary-400' : 'text-accent-400'}`}>
                        {category.charAt(0).toUpperCase() + category.slice(1)} ({shortlistedUniversities[category]?.length || 0})
                      </div>
                      <div className="space-y-2">
                        {shortlistedUniversities[category]?.slice(0, 2).map((item) => (
                          <div key={item.id} className={`p-3 rounded-xl border ${category === 'dream' ? 'border-amber-500/30 bg-amber-500/5' : category === 'target' ? 'border-primary-500/30 bg-primary-500/5' : 'border-accent-500/30 bg-accent-500/5'}`}>
                            <div className="flex items-center gap-2">
                              {item.isLocked && <Lock className="w-4 h-4 text-accent-400" />}
                              <span className="font-medium truncate">{item.university?.name}</span>
                            </div>
                            <div className="text-xs text-dark-500 mt-1">{item.university?.country}</div>
                          </div>
                        ))}
                        {(!shortlistedUniversities[category] || shortlistedUniversities[category].length === 0) && (
                          <div className="p-3 rounded-xl border border-dark-700 border-dashed text-center text-dark-500 text-sm">
                            No {category} universities yet
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <University className="w-12 h-12 mx-auto mb-2 text-dark-600" />
                  <p className="text-dark-500 mb-4">No universities shortlisted yet</p>
                  <Link to="/universities" className="btn-primary inline-flex items-center gap-2">
                    Explore Universities <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;