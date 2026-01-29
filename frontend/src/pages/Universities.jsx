import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Sparkles,
  University,
  Lock,
  Unlock,
  Plus,
  Globe,
  DollarSign,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { universityAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Universities = () => {
  const { refreshUser } = useAuth();

  const [recommendations, setRecommendations] = useState([]);
  const [shortlist, setShortlist] = useState({
    dream: [],
    target: [],
    safe: [],
  });
  const [activeTab, setActiveTab] = useState('recommendations');
  const [loading, setLoading] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(false);

  /* ---------------- FETCH DATA ---------------- */
  const fetchData = async () => {
    try {
      const [recsRes, shortlistRes] = await Promise.all([
        universityAPI.getRecommendations(),
        universityAPI.getShortlist(),
      ]);

      setRecommendations(recsRes.data.data.recommendations || []);
      setShortlist(shortlistRes.data.data.grouped || { dream: [], target: [], safe: [] });
    } catch {
      toast.error('Error loading universities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ---------------- ACTIONS ---------------- */
  const refreshRecommendations = async () => {
    setLoadingRecs(true);
    try {
      const res = await universityAPI.getRecommendations();
      setRecommendations(res.data.data.recommendations || []);
      toast.success('Recommendations updated');
    } catch {
      toast.error('Failed to refresh recommendations');
    } finally {
      setLoadingRecs(false);
    }
  };

  const addToShortlist = async (uni) => {
    try {
      const res = await universityAPI.getAll({ search: uni.name });
      const universityId = res.data.data.universities[0]?.id;

      await universityAPI.addToShortlist({
        universityId,
        category: uni.category,
        fitReason: uni.fitReason,
        risks: uni.risks,
        acceptanceChance: uni.acceptanceChance,
      });

      toast.success(`${uni.name} added to shortlist`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error adding university');
    }
  };

  const lockUniversity = async (id) => {
    try {
      await universityAPI.lock(id);
      toast.success('University locked');

      // ⭐ CRITICAL FIX
      await refreshUser();

      fetchData();
    } catch {
      toast.error('Error locking university');
    }
  };

  const unlockUniversity = async (id) => {
    try {
      await universityAPI.unlock(id);
      toast.success('University unlocked');
      fetchData();
    } catch {
      toast.error('Error unlocking university');
    }
  };

  const removeFromShortlist = async (id) => {
    try {
      await universityAPI.removeFromShortlist(id);
      toast.success('University removed');
      fetchData();
    } catch {
      toast.error('Error removing university');
    }
  };

  /* ---------------- LOADING ---------------- */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
      </div>
    );
  }

  /* ---------------- RENDER ---------------- */
  return (
    <div className="min-h-screen">
      {/* HEADER */}
      <div className="border-b border-dark-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="p-2 hover:bg-dark-800 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Universities</h1>
              <p className="text-sm text-dark-500">Discover and shortlist</p>
            </div>
          </div>

          <button
            onClick={refreshRecommendations}
            disabled={loadingRecs}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loadingRecs ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="border-b border-dark-800 px-6">
        <div className="max-w-6xl mx-auto flex gap-4">
          {[
            { id: 'recommendations', label: 'AI Recommendations', icon: Sparkles },
            { id: 'shortlist', label: 'My Shortlist', icon: University },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-dark-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div className="px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* AI RECOMMENDATIONS */}
          {activeTab === 'recommendations' && (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Personalized Recommendations</h2>
                <p className="text-dark-400 text-sm">Based on your profile</p>
              </div>

              {recommendations.length > 0 ? (
                <div className="grid md:grid-cols-3 gap-6">
                  {['dream', 'target', 'safe'].map((category) => (
                    <div key={category}>
                      <h3 className="font-semibold capitalize mb-3">{category}</h3>

                      {recommendations
                        .filter((r) => r.category === category)
                        .map((uni, i) => (
                          <motion.div
  key={uni.name}
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: i * 0.05 }}
  className="glass-card p-5 mb-4 hover:border-primary-500/40 transition-all"
>
  {/* Header */}
  <div className="flex items-start justify-between mb-2">
    <div>
      <h4 className="font-semibold">{uni.name}</h4>
      <p className="text-sm text-dark-400 flex items-center gap-1">
        <Globe className="w-3 h-3" />
        {uni.city}, {uni.country}
      </p>
    </div>

    {uni.ranking && (
      <span className="px-2 py-1 bg-dark-800 rounded text-xs">
        #{uni.ranking}
      </span>
    )}
  </div>

  {/* Fit reason */}
  <p className="text-sm text-dark-400 mb-3">{uni.fitReason}</p>

  {/* Meta info */}
  <div className="flex flex-wrap gap-2 mb-3">
    {uni.tuitionMin && uni.tuitionMax && (
      <span className="px-2 py-1 bg-dark-800 rounded text-xs flex items-center gap-1">
        <DollarSign className="w-3 h-3" />
        ${uni.tuitionMin.toLocaleString()}–${uni.tuitionMax.toLocaleString()}
      </span>
    )}

    {uni.acceptanceChance && (
      <span
        className={`px-2 py-1 rounded text-xs ${
          uni.acceptanceChance === 'high'
            ? 'bg-accent-500/20 text-accent-400'
            : uni.acceptanceChance === 'medium'
            ? 'bg-amber-500/20 text-amber-400'
            : 'bg-red-500/20 text-red-400'
        }`}
      >
        {uni.acceptanceChance} chance
      </span>
    )}
  </div>

  {/* Risks */}
  {uni.risks && (
    <p className="text-xs text-red-400 mb-3">
      ⚠️ {uni.risks}
    </p>
  )}

  {/* Action */}
  <button
    onClick={() => addToShortlist(uni)}
    className="w-full btn-secondary text-sm flex items-center justify-center gap-2"
  >
    <Plus className="w-4 h-4" />
    Add to Shortlist
  </button>
</motion.div>

                        ))}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-dark-400">No recommendations yet</p>
              )}
            </>
          )}

          {/* SHORTLIST */}
          {activeTab === 'shortlist' && (
            <>
              <h2 className="text-lg font-semibold mb-2">Your Shortlist</h2>
              <p className="text-dark-400 text-sm mb-6">
                Lock at least one university to move to the next stage
              </p>

              <div className="grid md:grid-cols-3 gap-6">
                {['dream', 'target', 'safe'].map((category) => (
                  <div key={category}>
                    <h3 className="font-semibold capitalize mb-3">{category}</h3>

                    {shortlist[category]?.map((item) => (
                      <div
                        key={item.id}
                        className={`glass-card p-5 mb-4 ${
                          item.isLocked ? 'border-accent-500/50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {item.isLocked && <Lock className="w-4 h-4 text-accent-400" />}
                          <h4 className="font-semibold">{item.university?.name}</h4>
                        </div>

                        <p className="text-sm text-dark-400 mb-3">
                          {item.university?.country}
                        </p>

                        <div className="flex gap-2">
                          {item.isLocked ? (
                            <button
                              onClick={() => unlockUniversity(item.id)}
                              className="flex-1 btn-ghost text-sm"
                            >
                              <Unlock className="w-4 h-4 inline mr-1" />
                              Unlock
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => lockUniversity(item.id)}
                                className="flex-1 btn-primary text-sm"
                              >
                                <Lock className="w-4 h-4 inline mr-1" />
                                Lock
                              </button>
                              <button
                                onClick={() => removeFromShortlist(item.id)}
                                className="btn-ghost text-sm text-red-400"
                              >
                                Remove
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Universities;
