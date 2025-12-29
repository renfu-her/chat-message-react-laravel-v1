
import React from 'react';
import { User, Group, ChatSession, ChatType } from '../types';

interface SidebarProps {
  users: User[];
  groups: Group[];
  activeTab: ChatType;
  setActiveTab: (tab: ChatType) => void;
  activeSession: ChatSession | null;
  setActiveSession: (session: ChatSession) => void;
  currentUser: User;
  onNewGroup: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  users, groups, activeTab, setActiveTab, activeSession, setActiveSession, currentUser, onNewGroup 
}) => {
  // Filter out the current user from the friends list
  const friends = users.filter(user => user.id !== currentUser.id);

  return (
    <aside className="w-80 border-r border-gray-200 dark:border-gray-800 flex flex-col bg-white dark:bg-gray-900 shadow-sm z-10">
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
        <div className="relative">
          <img src={currentUser.avatar} alt={currentUser.name} className="w-10 h-10 rounded-full border-2 border-primary" />
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
        </div>
        <div>
          <h1 className="font-bold text-sm">{currentUser.name}</h1>
          <p className="text-xs text-green-500 font-medium capitalize">Online (You)</p>
        </div>
      </div>

      <div className="flex px-2 pt-3">
        <button 
          onClick={() => setActiveTab('personal')}
          className={`flex-1 py-2 text-sm font-medium border-b-2 transition-all ${activeTab === 'personal' ? 'border-primary text-primary' : 'border-transparent text-gray-400'}`}
        >
          Friends
        </button>
        <button 
          onClick={() => setActiveTab('group')}
          className={`flex-1 py-2 text-sm font-medium border-b-2 transition-all ${activeTab === 'group' ? 'border-primary text-primary' : 'border-transparent text-gray-400'}`}
        >
          Groups
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {activeTab === 'personal' ? (
          <div className="space-y-1">
            <p className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">My Friends</p>
            {friends.map(user => (
              <button
                key={user.id}
                onClick={() => setActiveSession({ type: 'personal', id: user.id })}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${activeSession?.id === user.id ? 'bg-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                <div className="relative flex-shrink-0">
                  <img src={user.avatar} className="w-9 h-9 rounded-full object-cover" alt="" />
                  {user.status === 'online' && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold truncate">{user.name}</p>
                  <p className={`text-[10px] ${activeSession?.id === user.id ? 'text-blue-100' : 'text-gray-500'} truncate`}>
                    {user.status === 'online' ? 'Active now' : 'Seen 2h ago'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex justify-between items-center px-3 py-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Group Chats</p>
              <button onClick={onNewGroup} className="text-primary hover:text-blue-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
            {groups.map(group => (
              <button
                key={group.id}
                onClick={() => setActiveSession({ type: 'group', id: group.id })}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${activeSession?.id === group.id ? 'bg-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center font-bold text-primary">
                  {group.name.charAt(0)}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold truncate">{group.name}</p>
                  <p className={`text-[10px] ${activeSession?.id === group.id ? 'text-blue-100' : 'text-gray-500'} truncate`}>
                    {group.members.length} members
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
