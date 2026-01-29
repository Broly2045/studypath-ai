import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const StageGuard = ({ minStage, children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.currentStage < minStage) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default StageGuard;
