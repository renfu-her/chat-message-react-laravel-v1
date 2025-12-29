import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Theme, User, Group, ChatSession, Message, Attachment } from '../types';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import TopNav from '../components/TopNav';
import GroupManagement from '../components/GroupManagement';
import Profile from '../components/Profile';
import { useAuth } from '../contexts/AuthContext';
import { chatRoomAPI, messageAPI } from '../services/api';
import { getEcho } from '../services/echo';

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { currentUser, token, logout, updateUser } = useAuth();
  const [theme, setTheme] = useState<Theme>('light');
  const [users, setUsers] = useState<any[]>([]);
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<'personal' | 'group'>('personal');
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [isManagingGroup, setIsManagingGroup] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // 檢查認證
  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/login');
    }
  }, [currentUser, loading, navigate]);

  // 從 URL 參數設置活動會話
  useEffect(() => {
    if (id) {
      setActiveSession({ type: 'personal', id });
      setActiveTab('personal');
    } else {
      setActiveSession(null);
    }
  }, [id]);

  // 載入聊天室列表
  const loadChatRooms = useCallback(async () => {
    if (!token) return;
    try {
      const data = await chatRoomAPI.getAll(token);
      const allRooms = [
        ...data.owned_rooms.map((room: any) => ({
          id: room.id.toString(),
          name: room.name,
          type: room.type,
          creatorId: room.user_id?.toString() || '',
          members: room.members?.map((m: any) => m.id.toString()) || [],
          deniedMembers: [],
        })),
        ...data.member_rooms.map((room: any) => ({
          id: room.id.toString(),
          name: room.name,
          type: room.type,
          creatorId: room.user_id?.toString() || '',
          members: room.members?.map((m: any) => m.id.toString()) || [],
          deniedMembers: [],
        })),
      ];
      setChatRooms(allRooms);
    } catch (error) {
      console.error('Failed to load chat rooms:', error);
    }
  }, [token]);

  useEffect(() => {
    if (token && currentUser) {
      loadChatRooms();
    }
  }, [token, currentUser, loadChatRooms]);

  // 載入聊天室訊息
  const loadMessages = useCallback(async (chatRoomId: number) => {
    if (!token) return;
    try {
      const msgs = await messageAPI.getByChatRoom(chatRoomId, token);
      const formattedMessages: Message[] = msgs.map((msg: any) => ({
        id: msg.id.toString(),
        senderId: msg.user_id.toString(),
        recipientId: undefined,
        groupId: undefined,
        text: msg.content,
        attachment: msg.attachment_path ? {
          url: `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${msg.attachment_path}`,
          name: msg.attachment_path.split('/').pop() || 'attachment',
          mimeType: 'image/webp',
          size: 0,
          isImage: true,
        } : undefined,
        timestamp: new Date(msg.created_at).getTime(),
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }, [token]);

  // 當切換聊天室時載入訊息
  useEffect(() => {
    if (activeSession && token && activeSession.type === 'personal') {
      const chatRoomId = parseInt(activeSession.id);
      if (!isNaN(chatRoomId)) {
        loadMessages(chatRoomId);
        subscribeToChannel(chatRoomId);
      }
    }
  }, [activeSession, token, loadMessages]);

  // 訂閱 WebSocket 頻道
  const subscribeToChannel = (chatRoomId: number) => {
    const echo = getEcho();
    if (!echo) return;

    const channelName = `private-chat-room.${chatRoomId}`;
    
    echo.private(channelName)
      .listen('.message.sent', (e: any) => {
        const msg = e.message;
        const newMessage: Message = {
          id: msg.id.toString(),
          senderId: msg.user_id.toString(),
          recipientId: undefined,
          groupId: undefined,
          text: msg.content,
          attachment: msg.attachment_path ? {
            url: `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${msg.attachment_path}`,
            name: msg.attachment_path.split('/').pop() || 'attachment',
            mimeType: 'image/webp',
            size: 0,
            isImage: true,
          } : undefined,
          timestamp: new Date(msg.created_at).getTime(),
        };
        setMessages(prev => [...prev, newMessage]);
      });
  };

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sendMessage = async (text?: string, attachment?: Attachment) => {
    if (!activeSession || !currentUser || !token || (!text?.trim() && !attachment)) return;

    const chatRoomId = parseInt(activeSession.id);
    if (isNaN(chatRoomId)) return;

    try {
      const file = attachment ? await fetch(attachment.url).then(r => r.blob()).then(blob => {
        const file = new File([blob], attachment.name, { type: attachment.mimeType });
        return file;
      }) : undefined;

      await messageAPI.send(chatRoomId, {
        content: text,
        attachment: file,
      }, token);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleCreateGroup = async (name: string, members: string[]) => {
    if (!currentUser || !token) return;
    
    setLoading(true);
    try {
      const memberIds = members.map(id => parseInt(id)).filter(id => !isNaN(id));
      const room = await chatRoomAPI.create({
        name,
        type: 'private',
        member_ids: memberIds,
      }, token);
      
      setActiveSession({ type: 'group', id: room.id.toString() });
      setIsManagingGroup(false);
      await loadChatRooms();
      navigate(`/chat-group/${room.id}`);
    } catch (error) {
      console.error('Failed to create group:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateGroup = async (groupId: string, updates: Partial<Group>) => {
    setChatRooms(prev => prev.map(g => g.id === groupId ? { ...g, ...updates } : g));
  };

  const handleUpdateProfile = (updatedUser: User) => {
    updateUser(updatedUser);
  };

  const filteredMessages = useMemo(() => {
    if (!activeSession || !currentUser) return [];
    return messages.filter(m => {
      const sessionId = parseInt(activeSession.id);
      return activeSession.type === 'personal' && (
        m.senderId === currentUser.id || m.recipientId === activeSession.id
      );
    });
  }, [messages, activeSession, currentUser]);

  const activeGroup = activeSession?.type === 'group' 
    ? chatRooms.find(g => g.id === activeSession.id) 
    : null;

  if (!currentUser) return null;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-dark text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <Sidebar 
        users={users}
        groups={chatRooms}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeSession={activeSession}
        setActiveSession={(session) => {
          setActiveSession(session);
          if (session.type === 'personal') {
            navigate(`/chat/${session.id}`, { replace: true });
          } else {
            navigate(`/chat-group/${session.id}`, { replace: true });
          }
        }}
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
          onOpenProfile={() => setIsProfileOpen(true)}
          onLogout={handleLogout}
        />
        
        <main className="flex-1 overflow-hidden relative">
          {activeSession ? (
            <ChatWindow 
              session={activeSession}
              messages={filteredMessages}
              currentUser={currentUser}
              users={users}
              onSendMessage={sendMessage}
            />
          ) : (
            <div className="h-full flex items-center justify-center p-8 text-center">
              <div className="max-w-md animate-in zoom-in duration-500">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold mb-2">Welcome, {currentUser.name}!</h2>
                <p className="text-gray-500">Select a friend from the sidebar to start chatting.</p>
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

      {isProfileOpen && token && currentUser && (
        <Profile
          currentUser={currentUser}
          token={token}
          onClose={() => setIsProfileOpen(false)}
          onUpdate={handleUpdateProfile}
        />
      )}
    </div>
  );
};

export default ChatPage;

