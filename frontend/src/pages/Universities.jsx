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

  /* ----------------------------------
     Fetch All Data
  -----------------------------------*/
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

  /* ----------------------------------
     Actions
  -----------------------------------*/
  const refreshRecommendations = async () => {
    setLoadingRecs(true);
    try {
      const res = await universityAPI.getRecommendations();
      setRecommendations(res.data.data.recommendations || []);
      toast.success('Recommendations updated!');
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

      // ⭐ CRITICAL: sync backend stage → frontend
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

  /* ----------------------------------
     Loading State
  -----------------------------------*/
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
      </div>
    );
  }

  /* ----------------------------------
     Render
  -----------------------------------*/
  return (
    <div className="min-h-screen">
      {/* Header */}
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

      {/* Tabs */}
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

      {/* Content */}
      <div className="px-6 py-8">
        <div className="max-w-6xl mx-auto">
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
