import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { profileAPI } from '../services/api';
import Avatar from './Avatar';

interface ProfileProps {
  currentUser: User;
  token: string;
  onClose: () => void;
  onUpdate: (user: User) => void;
}

const Profile: React.FC<ProfileProps> = ({ currentUser, token, onClose, onUpdate }) => {
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 載入最新的個人資料
    const loadProfile = async () => {
      try {
        const profile = await profileAPI.get(token);
        setName(profile.name);
        setEmail(profile.email);
        if (profile.avatar_url) {
          setAvatar(profile.avatar_url);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    };
    loadProfile();
  }, [token]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const updateData: { name?: string; avatar?: File } = {};
      
      if (name !== currentUser.name) {
        updateData.name = name;
      }
      if (avatarFile) {
        updateData.avatar = avatarFile;
      }

      if (Object.keys(updateData).length === 0) {
        setError('No changes to save');
        setLoading(false);
        return;
      }

      const response = await profileAPI.update(updateData, token);
      
      const updatedUser: User = {
        ...currentUser,
        name: response.name,
        email: response.email,
        avatar: response.avatar_url || avatar,
      };

      onUpdate(updatedUser);
      setSuccess('Profile updated successfully!');
      
      // 清除檔案選擇
      setAvatarFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold dark:text-white">Edit Profile</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 頭像上傳 */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <Avatar
                src={avatar}
                name={name}
                size="xl"
                className="border-4 border-primary"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full hover:bg-blue-600 transition-colors shadow-lg"
                title="Change avatar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />
            <p className="text-xs text-gray-500 mt-2">Click to change avatar (Max 5MB)</p>
          </div>

          {/* 名稱 */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-transparent rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none text-sm text-gray-900 dark:text-white transition-all"
              required
            />
          </div>

          {/* 電子郵件（只讀） */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              readOnly
              disabled
              className="w-full bg-gray-100 dark:bg-gray-700 border border-transparent rounded-xl px-4 py-3 text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed transition-all"
            />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>

          {/* 錯誤訊息 */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* 成功訊息 */}
          {success && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
              <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
            </div>
          )}

          {/* 按鈕 */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-primary/20"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;

