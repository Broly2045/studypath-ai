import { useEffect, useState } from 'react';
import { taskAPI } from '../services/api';
import { FileText, Calendar, CheckCircle } from 'lucide-react';

const Preparation = () => {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    taskAPI.getAll({ category: 'application' }).then((res) => {
      setTasks(res.data.data.tasks);
    });
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Preparation Stage</h1>

      {/* Required Docs */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Required Documents</h2>
        <ul className="space-y-2 text-dark-400">
          <li>📄 Statement of Purpose (SOP)</li>
          <li>📄 Letters of Recommendation</li>
          <li>📄 Academic Transcripts</li>
          <li>📄 Resume / CV</li>
          <li>📄 Passport</li>
          <li>📄 Exam Scores</li>
        </ul>
      </section>

      {/* Timeline */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">High-Level Timeline</h2>
        <ul className="space-y-2 text-dark-400">
          <li>🗓 Month 1: SOP + Resume</li>
          <li>🗓 Month 2: Exams + Shortlisting</li>
          <li>🗓 Month 3: Forms + Applications</li>
        </ul>
      </section>

      {/* Tasks */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Your Tasks</h2>
        {tasks.map((task) => (
          <div key={task.id} className="glass-card p-4 mb-3">
            <CheckCircle className="inline w-4 h-4 mr-2" />
            {task.title}
          </div>
        ))}
      </section>
    </div>
  );
};

export default Preparation;
