
import React, { useState, useEffect, useMemo } from 'react';
import { Theme, User, Group, ChatSession, Message, Attachment } from './types';
import { INITIAL_USERS, INITIAL_GROUPS } from './constants';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import TopNav from './components/TopNav';
import GroupManagement from './components/GroupManagement';
import Login from './components/Login';
import Register from './components/Register';
import { GoogleGenAI } from "@google/genai";

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('light');
  const [authView, setAuthView] = useState<'login' | 'register' | 'chat'>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [groups, setGroups] = useState<Group[]>(INITIAL_GROUPS);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<'personal' | 'group'>('personal');
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [isManagingGroup, setIsManagingGroup] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setAuthView('chat');
  };

  const handleRegister = (name: string, email: string) => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: name,
      email: email,
      avatar: `https://picsum.photos/seed/${name}/200`,
      status: 'online',
    };
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    setAuthView('chat');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthView('login');
    setActiveSession(null);
  };

  const sendMessage = (text?: string, attachment?: Attachment) => {
    if (!activeSession || !currentUser || (!text?.trim() && !attachment)) return;

    const isGroup = activeSession.type === 'group';
    
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      recipientId: !isGroup ? activeSession.id : undefined,
      groupId: isGroup ? activeSession.id : undefined,
      text: text?.trim(),
      attachment,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, newMessage]);

    if (activeSession.type === 'personal' && activeSession.id === 'user-2') {
       if (text) triggerGeminiResponse(text);
       else if (attachment) triggerGeminiResponse(`You sent me a file: ${attachment.name}`);
    }
  };

  const triggerGeminiResponse = async (userMsg: string) => {
    try {
      if (!currentUser) return;
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Act as a user in a chat application. Reply briefly to: "${userMsg}"`,
      });
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        senderId: 'user-2',
        recipientId: currentUser.id,
        text: response.text || 'Got it!',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error("Gemini Error:", err);
    }
  };

  const handleCreateGroup = (name: string, members: string[]) => {
    if (!currentUser) return;
    const newGroup: Group = {
      id: `group-${Date.now()}`,
      name,
      creatorId: currentUser.id,
      members: [...new Set([currentUser.id, ...members])],
      deniedMembers: [],
    };
    setGroups(prev => [...prev, newGroup]);
    setActiveSession({ type: 'group', id: newGroup.id });
    setIsManagingGroup(false);
  };

  const updateGroup = (groupId: string, updates: Partial<Group>) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, ...updates } : g));
  };

  const filteredMessages = useMemo(() => {
    if (!activeSession || !currentUser) return [];
    if (activeSession.type === 'group') {
      return messages.filter(m => m.groupId === activeSession.id);
    } else {
      const otherUserId = activeSession.id;
      return messages.filter(m => 
        !m.groupId && (
          (m.senderId === currentUser.id && m.recipientId === otherUserId) ||
          (m.senderId === otherUserId && m.recipientId === currentUser.id)
        )
      );
    }
  }, [messages, activeSession, currentUser]);

  const activeGroup = activeSession?.type === 'group' 
    ? groups.find(g => g.id === activeSession.id) 
    : null;

  const isDeniedFromGroup = activeGroup?.deniedMembers.includes(currentUser?.id || '');

  if (authView === 'login') {
    return <Login users={users} onLogin={handleLogin} onGoToRegister={() => setAuthView('register')} />;
  }
  if (authView === 'register') {
    return <Register onRegister={handleRegister} onGoToLogin={() => setAuthView('login')} />;
  }

  if (!currentUser) return null;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-dark text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <Sidebar 
        users={users}
        groups={groups}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeSession={activeSession}
        setActiveSession={setActiveSession}
        currentUser={currentUser}
        onNewGroup={() => setIsManagingGroup(true)}
      />

      <div className="flex flex-col flex-1 relative overflow-hidden">
        <TopNav 
          theme={theme} 
          toggleTheme={toggleTheme} 
          currentUser={currentUser}
          activeSession={activeSession}
          activeGroup={activeGroup}
          onManageGroup={() => setIsManagingGroup(true)}
          onLogout={handleLogout}
        />
        
        <main className="flex-1 overflow-hidden relative">
          {activeSession ? (
            isDeniedFromGroup ? (
              <div className="h-full flex items-center justify-center p-8 text-center">
                <div>
                  <h2 className="text-2xl font-bold text-red-500 mb-2">Access Denied</h2>
                  <p className="text-gray-500">You have been denied access to this group.</p>
                </div>
              </div>
            ) : (
              <ChatWindow 
                session={activeSession}
                messages={filteredMessages}
                currentUser={currentUser}
                users={users}
                onSendMessage={sendMessage}
              />
            )
          ) : (
            <div className="h-full flex items-center justify-center p-8 text-center">
              <div className="max-w-md animate-in zoom-in duration-500">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold mb-2">Welcome, {currentUser.name}!</h2>
                <p className="text-gray-500">Select a friend or a group from the sidebar to start chatting.</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {isManagingGroup && (
        <GroupManagement 
          currentUser={currentUser}
          users={users}
          editingGroup={activeGroup || undefined}
          onClose={() => setIsManagingGroup(false)}
          onCreate={handleCreateGroup}
          onUpdate={(updates) => {
            if (activeGroup) updateGroup(activeGroup.id, updates);
            setIsManagingGroup(false);
          }}
        />
      )}
    </div>
  );
};

export default App;