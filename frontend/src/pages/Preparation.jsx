import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { taskAPI } from '../services/api';
import {
  ArrowLeft,
  FileText,
  Calendar,
  CheckCircle,
  Circle,
  RefreshCw,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const Preparation = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkedDocs, setCheckedDocs] = useState({});
  const [completedMonths, setCompletedMonths] = useState({});

  const documents = [
    { id: 'sop', name: 'Statement of Purpose (SOP)', required: true },
    { id: 'lor', name: 'Letters of Recommendation', required: true },
    { id: 'transcripts', name: 'Academic Transcripts', required: true },
    { id: 'resume', name: 'Resume / CV', required: true },
    { id: 'passport', name: 'Passport', required: true },
    { id: 'exams', name: 'Exam Scores (GRE/IELTS/TOEFL)', required: false },
  ];

  const toggleDocument = (docId) => {
    setCheckedDocs((prev) => ({
      ...prev,
      [docId]: !prev[docId],
    }));
  };

  const timeline = [
    { id: 'month1', month: 'Month 1', tasks: 'SOP + Resume' },
    { id: 'month2', month: 'Month 2', tasks: 'Exams + Shortlisting' },
    { id: 'month3', month: 'Month 3', tasks: 'Forms + Applications' },
  ];

  const toggleMonth = (monthId) => {
    setCompletedMonths((prev) => ({
      ...prev,
      [monthId]: !prev[monthId],
    }));
  };

  const fetchTasks = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const res = await taskAPI.getAll();
      // Filter for application-related tasks
      const allTasks = res.data.data.tasks || [];
      const applicationTasks = allTasks.filter(
        (t) => t.category === 'application' || t.category === 'university' || t.category === 'deadline'
      );
      setTasks(applicationTasks);
    } catch {
      toast.error('Error loading tasks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleRefresh = () => {
    fetchTasks(true);
  };

  const toggleTaskComplete = async (taskId, currentStatus) => {
    try {
      await taskAPI.update(taskId, { isCompleted: !currentStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, isCompleted: !currentStatus } : t))
      );
      toast.success(currentStatus ? 'Task marked incomplete' : 'Task completed!');
    } catch {
      toast.error('Error updating task');
    }
  };

  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-dark-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 hover:bg-dark-800 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Preparation Stage</h1>
              <p className="text-sm text-dark-400">Get your documents ready for applications</p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Required Documents */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary-500/20 rounded-lg">
                  <FileText className="w-5 h-5 text-primary-400" />
                </div>
                <h2 className="text-lg font-semibold">Required Documents</h2>
              </div>

              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => toggleDocument(doc.id)}
                    className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-lg hover:bg-dark-800 transition-colors cursor-pointer group"
                  >
                    <div
                      className={`p-1 rounded transition-colors ${
                        checkedDocs[doc.id]
                          ? 'bg-accent-500/20 text-accent-400'
                          : 'bg-dark-700 text-dark-400 group-hover:bg-dark-600'
                      }`}
                    >
                      {checkedDocs[doc.id] ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </div>
                    <span className={`text-sm flex-1 ${checkedDocs[doc.id] ? 'text-dark-400 line-through' : ''}`}>
                      {doc.name}
                    </span>
                    {doc.required && !checkedDocs[doc.id] && (
                      <span className="text-xs text-red-400">Required</span>
                    )}
                    {checkedDocs[doc.id] && (
                      <span className="text-xs text-accent-400">Ready</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-accent-500/20 rounded-lg">
                  <Calendar className="w-5 h-5 text-accent-400" />
                </div>
                <h2 className="text-lg font-semibold">High-Level Timeline</h2>
              </div>

              <div className="space-y-2">
                {timeline.map((item, i) => (
                  <div
                    key={item.id}
                    onClick={() => toggleMonth(item.id)}
                    className="flex gap-4 p-3 bg-dark-800/50 rounded-lg hover:bg-dark-800 transition-colors cursor-pointer group"
                  >
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                          completedMonths[item.id]
                            ? 'bg-accent-500'
                            : 'bg-dark-600 group-hover:bg-dark-500'
                        }`}
                      >
                        {completedMonths[item.id] && (
                          <CheckCircle className="w-3 h-3 text-white" />
                        )}
                      </div>
                      {i < timeline.length - 1 && (
                        <div
                          className={`w-0.5 flex-1 mt-1 ${
                            completedMonths[item.id] ? 'bg-accent-500' : 'bg-dark-700'
                          }`}
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <p
                        className={`font-medium text-sm ${
                          completedMonths[item.id] ? 'text-accent-400' : ''
                        }`}
                      >
                        {item.month}
                      </p>
                      <p
                        className={`text-sm ${
                          completedMonths[item.id]
                            ? 'text-dark-500 line-through'
                            : 'text-dark-400'
                        }`}
                      >
                        {item.tasks}
                      </p>
                    </div>
                    {completedMonths[item.id] && (
                      <span className="text-xs text-accent-400 self-center">Done</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tasks Section */}
          <div className="mt-6 glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-lg font-semibold">Your Tasks</h2>
              <span className="ml-auto text-sm text-dark-400">
                {tasks.length} task{tasks.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Progress Bar */}
            {tasks.length > 0 && (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-dark-400">Progress</span>
                  <span className="text-dark-400">
                    {completedCount}/{tasks.length} completed
                  </span>
                </div>
                <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-500 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
              </div>
            ) : tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => toggleTaskComplete(task.id, task.isCompleted)}
                    className="flex items-center gap-3 p-4 bg-dark-800/50 rounded-lg hover:bg-dark-800 transition-colors cursor-pointer group"
                  >
                    <div
                      className={`p-1 rounded transition-colors ${
                        task.isCompleted
                          ? 'bg-accent-500/20 text-accent-400'
                          : 'bg-dark-700 text-dark-400 group-hover:bg-dark-600'
                      }`}
                    >
                      {task.isCompleted ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </div>
                    <span
                      className={`flex-1 ${
                        task.isCompleted ? 'text-dark-400 line-through' : ''
                      }`}
                    >
                      {task.title}
                    </span>
                    {task.priority === 'high' && !task.isCompleted && (
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">
                        High
                      </span>
                    )}
                    {task.category && (
                      <span className="px-2 py-1 bg-dark-700 text-dark-400 text-xs rounded capitalize">
                        {task.category}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 text-dark-500 mx-auto mb-2" />
                <p className="text-dark-400">No tasks yet</p>
                <p className="text-dark-500 text-sm">
                  Lock universities to generate preparation tasks
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preparation;
