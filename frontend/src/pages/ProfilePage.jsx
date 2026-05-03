import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import { formatDate } from '../utils';
import { Avatar } from '../components/shared/index.jsx';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profileForm, setProfileForm] = useState({ name: user?.name || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);
  const [pwMsg, setPwMsg] = useState(null);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileLoading(true);
    try {
      const { data } = await authAPI.updateProfile({ name: profileForm.name.trim() });
      updateUser(data.user);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPwMsg(null);
    if (pwForm.newPassword !== pwForm.confirm) {
      setPwMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwMsg({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    setPwLoading(true);
    try {
      await authAPI.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword
      });
      setPwMsg({ type: 'success', text: 'Password changed successfully' });
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setPwMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password' });
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your account settings</p>
      </div>

      {/* Profile card */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <Avatar user={user} size="lg" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-900 dark:text-white">{user?.name}</h2>
            <p className="text-slate-500 text-sm">{user?.email}</p>
            <span className={`badge text-xs capitalize mt-1 ${user?.role === 'admin'
              ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
              {user?.role}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-sm">
          <div>
            <p className="text-slate-500 text-xs">Member since</p>
            <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{formatDate(user?.createdAt)}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Account status</p>
            <p className="font-medium text-green-600 dark:text-green-400 mt-0.5">Active</p>
          </div>
        </div>

        <form onSubmit={handleProfileSave} className="space-y-4">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">Edit Profile</h3>

          {profileMsg && (
            <div className={`px-4 py-3 rounded-xl text-sm border
              ${profileMsg.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'}`}>
              {profileMsg.text}
            </div>
          )}

          <div>
            <label className="label">Full Name</label>
            <input type="text" value={profileForm.name}
              onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
              className="input" minLength={2} maxLength={50} required />
          </div>

          <div>
            <label className="label">Email</label>
            <input type="email" value={user?.email} disabled
              className="input opacity-60 cursor-not-allowed" />
            <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
          </div>

          <button type="submit" disabled={profileLoading} className="btn-primary">
            {profileLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Password card */}
      <div className="card p-6">
        <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Change Password</h3>

        {pwMsg && (
          <div className={`px-4 py-3 rounded-xl text-sm border mb-4
            ${pwMsg.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'}`}>
            {pwMsg.text}
          </div>
        )}

        <form onSubmit={handlePasswordSave} className="space-y-4">
          {[
            { key: 'currentPassword', label: 'Current Password', placeholder: '••••••••' },
            { key: 'newPassword', label: 'New Password', placeholder: 'Min. 6 characters' },
            { key: 'confirm', label: 'Confirm New Password', placeholder: '••••••••' }
          ].map(field => (
            <div key={field.key}>
              <label className="label">{field.label}</label>
              <input
                type="password"
                value={pwForm[field.key]}
                onChange={e => setPwForm({ ...pwForm, [field.key]: e.target.value })}
                className="input"
                placeholder={field.placeholder}
                required
                minLength={field.key !== 'currentPassword' ? 6 : undefined}
              />
            </div>
          ))}
          <button type="submit" disabled={pwLoading} className="btn-primary">
            {pwLoading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
