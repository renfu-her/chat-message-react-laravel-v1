import React, { useState } from 'react';
import { User, Group, ChatSession } from '../types';
import Avatar from './Avatar';

interface SidebarProps {
  users: User[];
  groups: Group[];
  contacts: User[]; // 非朋友用戶
  activeTab: 'personal' | 'group' | 'contact';
  setActiveTab: (tab: 'personal' | 'group' | 'contact') => void;
  activeSession: ChatSession | null;
  setActiveSession: (session: ChatSession) => void;
  currentUser: User;
  onNewGroup: () => void;
  onAddFriend?: (userId: string) => void; // 添加朋友的回調
}

const Sidebar: React.FC<SidebarProps> = ({ 
  users, groups, contacts, activeTab, setActiveTab, activeSession, setActiveSession, currentUser, onNewGroup, onAddFriend
}) => {
  // 展開/收縮狀態
  const [expandedSections, setExpandedSections] = useState<{
    friends: boolean;
    groups: boolean;
    contacts: boolean;
  }>({
    friends: true,
    groups: false,
    contacts: false,
  });

  // 過濾出朋友（排除當前用戶）
  const friends = users.filter(user => user.id !== currentUser.id);

  // 切換展開/收縮
  const toggleSection = (section: 'friends' | 'groups' | 'contacts') => {
    setExpandedSections(prev => {
      const newState = {
        friends: false,
        groups: false,
        contacts: false,
      };
      newState[section] = !prev[section];
      return newState;
    });
    
    // 設置對應的 tab
    if (section === 'friends') {
      setActiveTab('personal');
    } else if (section === 'groups') {
      setActiveTab('group');
    } else if (section === 'contacts') {
      setActiveTab('contact');
    }
  };

  return (
    <aside className="w-80 border-r border-gray-200 dark:border-gray-800 flex flex-col bg-white dark:bg-gray-900 shadow-sm z-10">
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
        <Avatar
          src={currentUser.avatar}
          name={currentUser.name}
          size="md"
          showStatus
          status="online"
          border
        />
        <div>
          <h1 className="font-bold text-sm">{currentUser.name}</h1>
          <p className="text-xs text-green-500 font-medium capitalize">Online (You)</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Friends 區塊 */}
        <div className="border-b border-gray-100 dark:border-gray-800">
          <button
            onClick={() => toggleSection('friends')}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">Friends</span>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.friends ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSections.friends && (
            <div className="px-2 pb-2 space-y-1">
              {friends.length > 0 ? (
                friends.map(user => (
                  <button
                    key={user.id}
                    onClick={() => {
                      setActiveTab('personal');
                      setActiveSession({ type: 'personal', id: user.id });
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      activeSession?.type === 'personal' && activeSession?.id === user.id
                        ? 'bg-primary text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Avatar
                      src={user.avatar}
                      name={user.name}
                      size="sm"
                      showStatus
                      status={user.status}
                    />
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold truncate">{user.name}</p>
                      <p
                        className={`text-[10px] ${
                          activeSession?.type === 'personal' && activeSession?.id === user.id
                            ? 'text-blue-100'
                            : 'text-gray-500'
                        } truncate`}
                      >
                        {user.status === 'online' ? 'Active now' : 'Seen 2h ago'}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-xs text-gray-400 text-center">No friends yet</p>
              )}
            </div>
          )}
        </div>

        {/* Groups 區塊 */}
        <div className="border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <button
              onClick={() => toggleSection('groups')}
              className="flex-1 flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">Groups</span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.groups ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              onClick={onNewGroup}
              className="px-3 py-3 text-primary hover:text-blue-600 transition-colors"
              title="Create new group"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          {expandedSections.groups && (
            <div className="px-2 pb-2 space-y-1">
              {groups.length > 0 ? (
                groups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => {
                      setActiveTab('group');
                      setActiveSession({ type: 'group', id: group.id });
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      activeSession?.type === 'group' && activeSession?.id === group.id
                        ? 'bg-primary text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center font-bold text-primary">
                      {group.name.charAt(0)}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold truncate">{group.name}</p>
                      <p
                        className={`text-[10px] ${
                          activeSession?.type === 'group' && activeSession?.id === group.id
                            ? 'text-blue-100'
                            : 'text-gray-500'
                        } truncate`}
                      >
                        {group.members.length} members
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-xs text-gray-400 text-center">No groups yet</p>
              )}
            </div>
          )}
        </div>

        {/* Contact 區塊 */}
        <div className="border-b border-gray-100 dark:border-gray-800">
          <button
            onClick={() => toggleSection('contacts')}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">Contact</span>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.contacts ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSections.contacts && (
            <div className="px-2 pb-2 space-y-1">
              {contacts.length > 0 ? (
                contacts.map(user => (
                  <div
                    key={user.id}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
                  >
                    <Avatar
                      src={user.avatar}
                      name={user.name}
                      size="sm"
                      showStatus
                      status="offline"
                    />
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold truncate">{user.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">Not a friend</p>
                    </div>
                    {onAddFriend && (
                      <button
                        onClick={() => onAddFriend(user.id)}
                        className="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs bg-primary text-white rounded-lg hover:bg-blue-600 transition-all"
                        title="Add as friend"
                      >
                        Add
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="px-3 py-2 text-xs text-gray-400 text-center">No contacts available</p>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
