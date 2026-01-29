import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { taskAPI } from '../services/api';
import {
  ArrowLeft,
  FileText,
  Calendar,
  CheckCircle,
  Circle,
  GraduationCap,
  Clock,
  AlertCircle,
} from 'lucide-react';

const Preparation = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    taskAPI
      .getAll({ category: 'application' })
      .then((res) => {
        setTasks(res.data.data.tasks || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const documents = [
    { name: 'Statement of Purpose (SOP)', required: true },
    { name: 'Letters of Recommendation', required: true },
    { name: 'Academic Transcripts', required: true },
    { name: 'Resume / CV', required: true },
    { name: 'Passport', required: true },
    { name: 'Exam Scores (GRE/IELTS/TOEFL)', required: false },
  ];

  const timeline = [
    { month: 'Month 1', tasks: 'SOP + Resume', status: 'current' },
    { month: 'Month 2', tasks: 'Exams + Shortlisting', status: 'upcoming' },
    { month: 'Month 3', tasks: 'Forms + Applications', status: 'upcoming' },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-dark-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link to="/dashboard" className="p-2 hover:bg-dark-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Preparation Stage</h1>
            <p className="text-sm text-dark-400">Get your documents ready for applications</p>
          </div>
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
                {documents.map((doc, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-lg"
                  >
                    <Circle className="w-4 h-4 text-dark-500" />
                    <span className="text-sm flex-1">{doc.name}</span>
                    {doc.required && (
                      <span className="text-xs text-red-400">Required</span>
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

              <div className="space-y-4">
                {timeline.map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          item.status === 'current'
                            ? 'bg-accent-500'
                            : 'bg-dark-600'
                        }`}
                      />
                      {i < timeline.length - 1 && (
                        <div className="w-0.5 h-full bg-dark-700 mt-1" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="font-medium text-sm">{item.month}</p>
                      <p className="text-dark-400 text-sm">{item.tasks}</p>
                    </div>
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

            {loading ? (
              <div className="text-center py-8 text-dark-400">Loading tasks...</div>
            ) : tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-4 bg-dark-800/50 rounded-lg hover:bg-dark-800 transition-colors"
                  >
                    <div
                      className={`p-1 rounded ${
                        task.isCompleted
                          ? 'bg-accent-500/20 text-accent-400'
                          : 'bg-dark-700 text-dark-400'
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
                    {task.priority === 'high' && (
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">
                        High
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
