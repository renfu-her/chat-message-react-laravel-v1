
import React, { useState } from 'react';
import { User, Group } from '../types';

interface GroupManagementProps {
  currentUser: User;
  users: User[];
  editingGroup?: Group;
  onClose: () => void;
  onCreate: (name: string, members: string[]) => void;
  onUpdate: (updates: Partial<Group>) => void;
}

const GroupManagement: React.FC<GroupManagementProps> = ({ 
  currentUser, users, editingGroup, onClose, onCreate, onUpdate 
}) => {
  const [name, setName] = useState(editingGroup?.name || '');
  const [selectedMembers, setSelectedMembers] = useState<string[]>(editingGroup?.members || [currentUser.id]);
  const [deniedMembers, setDeniedMembers] = useState<string[]>(editingGroup?.deniedMembers || []);

  const toggleMember = (userId: string) => {
    if (userId === currentUser.id) return; // Creator must be in group
    setSelectedMembers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const toggleDenied = (userId: string) => {
    if (userId === currentUser.id) return;
    setDeniedMembers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingGroup) {
      onUpdate({ name, members: selectedMembers, deniedMembers });
    } else {
      onCreate(name, selectedMembers);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-bold">{editingGroup ? 'Group Settings' : 'Create New Group'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Group Name</label>
            <input 
              autoFocus
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.g. Weekend Plans"
              className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none text-sm dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Member Selection */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Allow / Members</label>
              <div className="h-48 overflow-y-auto border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-800 p-2 space-y-1">
                {users.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleMember(u.id)}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${selectedMembers.includes(u.id) ? 'bg-primary/20 text-primary' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                  >
                    <img src={u.avatar} className="w-6 h-6 rounded-full" alt="" />
                    <span className="text-xs truncate">{u.name} {u.id === currentUser.id && '(Me)'}</span>
                    {selectedMembers.includes(u.id) && <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                  </button>
                ))}
              </div>
            </div>

            {/* Deny List */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 text-red-400">Deny Access</label>
              <div className="h-48 overflow-y-auto border border-red-100 dark:border-red-900/20 rounded-xl bg-red-50/30 dark:bg-red-900/10 p-2 space-y-1">
                {users.map(u => (
                  u.id !== currentUser.id && (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleDenied(u.id)}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${deniedMembers.includes(u.id) ? 'bg-red-500 text-white shadow-lg' : 'hover:bg-red-100 dark:hover:bg-red-900/30'}`}
                    >
                      <img src={u.avatar} className="w-6 h-6 rounded-full" alt="" />
                      <span className="text-xs truncate">{u.name}</span>
                      {deniedMembers.includes(u.id) && <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" /></svg>}
                    </button>
                  )
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={!name.trim()}
              className="flex-2 flex-[2] py-3 px-4 rounded-xl font-bold text-sm bg-primary text-white hover:bg-blue-600 shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
            >
              {editingGroup ? 'Save Changes' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupManagement;
