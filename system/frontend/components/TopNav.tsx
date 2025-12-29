
import React from 'react';
import { User, Group, ChatSession, Theme } from '../types';

interface TopNavProps {
  theme: Theme;
  toggleTheme: () => void;
  currentUser: User;
  activeSession: ChatSession | null;
  activeGroup: Group | null;
  onManageGroup: () => void;
  onLogout: () => void;
}

const TopNav: React.FC<TopNavProps> = ({ 
  theme, toggleTheme, currentUser, activeSession, activeGroup, onManageGroup, onLogout 
}) => {
  return (
    <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md flex items-center justify-between px-6 z-10">
      <div className="flex items-center gap-4">
        {activeSession ? (
          <>
            {activeSession.type === 'group' ? (
              <div className="flex items-center gap-3 cursor-pointer group" onClick={onManageGroup}>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {activeGroup?.name.charAt(0)}
                </div>
                <div>
                  <h2 className="font-bold text-sm group-hover:text-primary transition-colors">{activeGroup?.name}</h2>
                  <p className="text-[10px] text-gray-500">Group · {activeGroup?.members.length} participants</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                 <img src={`https://picsum.photos/seed/${activeSession.id}/100`} className="w-10 h-10 rounded-full" alt="" />
                 <div>
                   <h2 className="font-bold text-sm">Chatting with {activeSession.id}</h2>
                   <p className="text-[10px] text-green-500">Online</p>
                 </div>
              </div>
            )}
          </>
        ) : (
          <h2 className="font-bold text-lg text-primary">Chat Message React</h2>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
          title="Toggle Theme"
        >
          {theme === 'dark' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
          )}
        </button>

        {activeGroup && (
          <button 
            onClick={onManageGroup}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
            title="Group Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
        )}

        <div className="h-8 w-px bg-gray-200 dark:bg-gray-800 mx-2"></div>

        <button 
          onClick={onLogout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 font-bold text-xs transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Sign Out
        </button>
      </div>
    </header>
  );
};

export default TopNav;