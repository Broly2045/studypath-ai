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
  DollarSign,
  Loader2,
  RefreshCw,
  Star,
  Target,
  Shield,
  Trash2,
  CheckCircle,
  MapPin,
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

  const categoryConfig = {
    dream: {
      icon: Star,
      color: 'text-purple-400',
      bg: 'bg-purple-500/20',
      border: 'border-purple-500/30',
      label: 'Dream',
      description: 'Reach schools',
    },
    target: {
      icon: Target,
      color: 'text-blue-400',
      bg: 'bg-blue-500/20',
      border: 'border-blue-500/30',
      label: 'Target',
      description: 'Good match',
    },
    safe: {
      icon: Shield,
      color: 'text-green-400',
      bg: 'bg-green-500/20',
      border: 'border-green-500/30',
      label: 'Safe',
      description: 'High chance',
    },
  };

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
      await universityAPI.addToShortlist({
        universityName: uni.name,
        universityCountry: uni.country,
        universityCity: uni.city,
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

  const totalShortlisted = shortlist.dream.length + shortlist.target.length + shortlist.safe.length;
  const totalLocked = [...shortlist.dream, ...shortlist.target, ...shortlist.safe].filter(
    (s) => s.isLocked
  ).length;

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
            <Link to="/dashboard" className="p-2 hover:bg-dark-800 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Universities</h1>
              <p className="text-sm text-dark-400">Discover and shortlist</p>
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
            { id: 'shortlist', label: 'My Shortlist', icon: University, count: totalShortlisted },
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
              {tab.count > 0 && (
                <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 text-xs rounded-full">
                  {tab.count}
                </span>
              )}
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
                <h2 className="text-lg font-semibold mb-1">Personalized Recommendations</h2>
                <p className="text-dark-400 text-sm">Based on your profile</p>
              </div>

              {recommendations.length > 0 ? (
                <div className="grid md:grid-cols-3 gap-6">
                  {['dream', 'target', 'safe'].map((category) => {
                    const config = categoryConfig[category];
                    const CategoryIcon = config.icon;
                    const unis = recommendations.filter((r) => r.category === category);

                    return (
                      <div key={category}>
                        {/* Category Header */}
                        <div className="flex items-center gap-2 mb-4">
                          <div className={`p-1.5 rounded-lg ${config.bg}`}>
                            <CategoryIcon className={`w-4 h-4 ${config.color}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold">{config.label}</h3>
                            <p className="text-xs text-dark-500">{config.description}</p>
                          </div>
                          <span className="ml-auto text-xs text-dark-500">{unis.length}</span>
                        </div>

                        {/* University Cards */}
                        <div className="space-y-4">
                          {unis.map((uni, i) => (
                            <motion.div
                              key={uni.name}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className={`glass-card p-5 hover:${config.border} transition-all`}
                            >
                              {/* Header */}
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h4 className="font-semibold leading-tight">{uni.name}</h4>
                                  <p className="text-sm text-dark-400 flex items-center gap-1 mt-1">
                                    <MapPin className="w-3 h-3" />
                                    {uni.city}, {uni.country}
                                  </p>
                                </div>
                                {uni.ranking && (
                                  <span className="px-2 py-1 bg-dark-800 rounded text-xs font-medium">
                                    #{uni.ranking}
                                  </span>
                                )}
                              </div>

                              {/* Fit reason */}
                              <p className="text-sm text-dark-400 mb-3 line-clamp-2">
                                {uni.fitReason}
                              </p>

                              {/* Meta info */}
                              <div className="flex flex-wrap gap-2 mb-3">
                                {uni.tuitionMin && uni.tuitionMax && (
                                  <span className="px-2 py-1 bg-dark-800 rounded text-xs flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" />
                                    ${uni.tuitionMin.toLocaleString()}–$
                                    {uni.tuitionMax.toLocaleString()}
                                  </span>
                                )}
                                {uni.acceptanceChance && (
                                  <span
                                    className={`px-2 py-1 rounded text-xs ${
                                      uni.acceptanceChance === 'high'
                                        ? 'bg-green-500/20 text-green-400'
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
                                <p className="text-xs text-amber-400/80 mb-3">⚠️ {uni.risks}</p>
                              )}

                              {/* Action */}
                              <button
                                onClick={() => addToShortlist(uni)}
                                className="w-full py-2 px-4 bg-dark-800 hover:bg-dark-700 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                                Add to Shortlist
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Sparkles className="w-12 h-12 text-dark-600 mx-auto mb-3" />
                  <p className="text-dark-400">No recommendations yet</p>
                  <p className="text-dark-500 text-sm">Complete your profile to get started</p>
                </div>
              )}
            </>
          )}

          {/* SHORTLIST */}
          {activeTab === 'shortlist' && (
            <>
              {/* Summary Stats */}
              <div className="flex items-center gap-6 mb-6">
                <div>
                  <h2 className="text-lg font-semibold mb-1">Your Shortlist</h2>
                  <p className="text-dark-400 text-sm">
                    Lock at least one university to move to the next stage
                  </p>
                </div>
                {totalShortlisted > 0 && (
                  <div className="ml-auto flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{totalShortlisted}</p>
                      <p className="text-xs text-dark-500">Shortlisted</p>
                    </div>
                    <div className="w-px h-8 bg-dark-700" />
                    <div className="text-center">
                      <p className="text-2xl font-bold text-accent-400">{totalLocked}</p>
                      <p className="text-xs text-dark-500">Locked</p>
                    </div>
                  </div>
                )}
              </div>

              {totalShortlisted === 0 ? (
                <div className="text-center py-12">
                  <University className="w-12 h-12 text-dark-600 mx-auto mb-3" />
                  <p className="text-dark-400">No universities shortlisted yet</p>
                  <p className="text-dark-500 text-sm mb-4">
                    Add universities from AI Recommendations
                  </p>
                  <button
                    onClick={() => setActiveTab('recommendations')}
                    className="btn-primary text-sm"
                  >
                    Browse Recommendations
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-6">
                  {['dream', 'target', 'safe'].map((category) => {
                    const config = categoryConfig[category];
                    const CategoryIcon = config.icon;
                    const items = shortlist[category] || [];
                    const lockedCount = items.filter((i) => i.isLocked).length;

                    return (
                      <div key={category}>
                        {/* Category Header */}
                        <div className="flex items-center gap-2 mb-4">
                          <div className={`p-1.5 rounded-lg ${config.bg}`}>
                            <CategoryIcon className={`w-4 h-4 ${config.color}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold">{config.label}</h3>
                            <p className="text-xs text-dark-500">
                              {items.length} added · {lockedCount} locked
                            </p>
                          </div>
                        </div>

                        {/* University Cards */}
                        <div className="space-y-4">
                          {items.length === 0 ? (
                            <div
                              className={`border border-dashed ${config.border} rounded-xl p-6 text-center`}
                            >
                              <p className="text-dark-500 text-sm">No {category} schools yet</p>
                            </div>
                          ) : (
                            items.map((item, i) => (
                              <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={`glass-card p-5 transition-all ${
                                  item.isLocked
                                    ? 'border-accent-500/50 bg-accent-500/5'
                                    : 'hover:border-dark-600'
                                }`}
                              >
                                {/* Locked Badge */}
                                {item.isLocked && (
                                  <div className="flex items-center gap-1.5 text-accent-400 text-xs font-medium mb-3">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    Locked
                                  </div>
                                )}

                                {/* University Info */}
                                <h4 className="font-semibold mb-1">{item.university?.name}</h4>
                                <p className="text-sm text-dark-400 flex items-center gap-1 mb-3">
                                  <MapPin className="w-3 h-3" />
                                  {item.university?.city && `${item.university.city}, `}
                                  {item.university?.country}
                                </p>

                                {/* Acceptance Chance */}
                                {item.acceptanceChance && (
                                  <div className="mb-4">
                                    <span
                                      className={`px-2 py-1 rounded text-xs ${
                                        item.acceptanceChance === 'high'
                                          ? 'bg-green-500/20 text-green-400'
                                          : item.acceptanceChance === 'medium'
                                          ? 'bg-amber-500/20 text-amber-400'
                                          : 'bg-red-500/20 text-red-400'
                                      }`}
                                    >
                                      {item.acceptanceChance} chance
                                    </span>
                                  </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2">
                                  {item.isLocked ? (
                                    <button
                                      onClick={() => unlockUniversity(item.id)}
                                      className="flex-1 py-2 px-4 bg-dark-800 hover:bg-dark-700 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                                    >
                                      <Unlock className="w-4 h-4" />
                                      Unlock
                                    </button>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => lockUniversity(item.id)}
                                        className="flex-1 py-2 px-4 bg-accent-500 hover:bg-accent-600 text-white rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                                      >
                                        <Lock className="w-4 h-4" />
                                        Lock
                                      </button>
                                      <button
                                        onClick={() => removeFromShortlist(item.id)}
                                        className="p-2 bg-dark-800 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors"
                                        title="Remove"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </motion.div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Universities;