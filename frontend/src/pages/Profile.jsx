import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Loader2, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { profileAPI } from '../services/api';
import toast from 'react-hot-toast';

const COUNTRIES = [
  { code: 'USA', name: 'United States', flag: '🇺🇸' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CAN', name: 'Canada', flag: '🇨🇦' },
  { code: 'AUS', name: 'Australia', flag: '🇦🇺' },
  { code: 'GER', name: 'Germany', flag: '🇩🇪' },
  { code: 'NLD', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'IRL', name: 'Ireland', flag: '🇮🇪' },
  { code: 'SGP', name: 'Singapore', flag: '🇸🇬' },
];

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const response = await profileAPI.get();
      setProfile(response.data.data.profile);
    } catch (error) {
      toast.error('Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await profileAPI.update(profile);
      toast.success('Profile saved!');
    } catch (error) {
      toast.error('Error saving profile');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCountry = (code) => {
    const current = profile?.preferredCountries || [];
    const updated = current.includes(code) ? current.filter((c) => c !== code) : [...current, code];
    updateField('preferredCountries', updated);
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
            <div><h1 className="text-xl font-bold">Profile</h1><p className="text-sm text-dark-500">Manage your information</p></div>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save Changes
          </button>
        </div>
      </div>

      <div className="px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* User Info */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center">
                <span className="text-2xl font-bold">{user?.fullName?.charAt(0)}</span>
              </div>
              <div>
                <h2 className="text-xl font-bold">{user?.fullName}</h2>
                <p className="text-dark-400">{user?.email}</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-dark-800/50 rounded-xl">
                <div className="text-sm text-dark-400">Profile Strength</div>
                <div className="text-2xl font-bold">{profile?.overallStrength || 0}%</div>
              </div>
              <div className="p-4 bg-dark-800/50 rounded-xl">
                <div className="text-sm text-dark-400">Current Stage</div>
                <div className="text-2xl font-bold">Stage {user?.currentStage}</div>
              </div>
            </div>
          </div>

          {/* Academic */}
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-4">Academic Background</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-dark-400 mb-2">Education Level</label>
                <select value={profile?.educationLevel || ''} onChange={(e) => updateField('educationLevel', e.target.value)} className="input-field">
                  <option value="">Select</option>
                  <option value="high_school">High School</option>
                  <option value="bachelors">Bachelor's</option>
                  <option value="masters">Master's</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-2">Major</label>
                <input type="text" value={profile?.major || ''} onChange={(e) => updateField('major', e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-2">GPA</label>
                <input type="number" value={profile?.gpa || ''} onChange={(e) => updateField('gpa', parseFloat(e.target.value))} step="0.1" className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-2">Graduation Year</label>
                <input type="number" value={profile?.graduationYear || ''} onChange={(e) => updateField('graduationYear', parseInt(e.target.value))} className="input-field" />
              </div>
            </div>
          </div>

          {/* Goals */}
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-4">Study Goals</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-dark-400 mb-2">Intended Degree</label>
                <select value={profile?.intendedDegree || ''} onChange={(e) => updateField('intendedDegree', e.target.value)} className="input-field">
                  <option value="">Select</option>
                  <option value="bachelors">Bachelor's</option>
                  <option value="masters">Master's</option>
                  <option value="mba">MBA</option>
                  <option value="phd">PhD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-2">Field of Study</label>
                <input type="text" value={profile?.fieldOfStudy || ''} onChange={(e) => updateField('fieldOfStudy', e.target.value)} className="input-field" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-dark-400 mb-2">Preferred Countries</label>
              <div className="grid grid-cols-4 gap-2">
                {COUNTRIES.map((c) => (
                  <button key={c.code} type="button" onClick={() => toggleCountry(c.code)} className={`p-2 rounded-xl border transition-all flex items-center gap-2 ${profile?.preferredCountries?.includes(c.code) ? 'border-primary-500 bg-primary-500/10' : 'border-dark-700 hover:border-dark-600'}`}>
                    <span>{c.flag}</span><span className="text-sm">{c.code}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Budget */}
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-4">Budget</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-dark-400 mb-2">Min Budget (USD/year)</label>
                <input type="number" value={profile?.budgetMin || ''} onChange={(e) => updateField('budgetMin', parseInt(e.target.value))} className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-2">Max Budget (USD/year)</label>
                <input type="number" value={profile?.budgetMax || ''} onChange={(e) => updateField('budgetMax', parseInt(e.target.value))} className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-2">Funding Plan</label>
                <select value={profile?.fundingPlan || ''} onChange={(e) => updateField('fundingPlan', e.target.value)} className="input-field">
                  <option value="">Select</option>
                  <option value="self_funded">Self-Funded</option>
                  <option value="scholarship">Scholarship</option>
                  <option value="loan">Loan</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Exams */}
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-4">Exams & Readiness</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-dark-400 mb-2">IELTS Status</label>
                <select value={profile?.ieltsStatus || ''} onChange={(e) => updateField('ieltsStatus', e.target.value)} className="input-field">
                  <option value="not_started">Not Started</option>
                  <option value="preparing">Preparing</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-2">IELTS Score</label>
                <input type="number" value={profile?.ieltsScore || ''} onChange={(e) => updateField('ieltsScore', parseFloat(e.target.value))} step="0.5" className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-2">GRE Status</label>
                <select value={profile?.greStatus || ''} onChange={(e) => updateField('greStatus', e.target.value)} className="input-field">
                  <option value="not_started">Not Started</option>
                  <option value="preparing">Preparing</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="not_required">Not Required</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-2">GRE Score</label>
                <input type="number" value={profile?.greScore || ''} onChange={(e) => updateField('greScore', parseInt(e.target.value))} className="input-field" />
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-2">SOP Status</label>
                <select value={profile?.sopStatus || ''} onChange={(e) => updateField('sopStatus', e.target.value)} className="input-field">
                  <option value="not_started">Not Started</option>
                  <option value="draft">Draft Ready</option>
                  <option value="ready">Final Ready</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
