import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { io, Socket } from 'socket.io-client';

import { API_URL as BASE_URL } from './api';

export const API_URL = BASE_URL;
const SOCKET_URL = BASE_URL;

const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'user_data',
};

export interface Message {
  _id: string;
  threadId: string;
  sender: {
    userId: any;
    role: string;
  };
  type: 'text' | 'image' | 'file' | 'system';
  content: {
    text?: string;
    mediaUrl?: string;
    fileName?: string;
  };
  status: 'sent' | 'delivered' | 'read' | 'failed';
  readBy?: { userId: string; readAt: Date }[];
  isEdited?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Thread {
  _id: string;
  participants: {
    userId: any;
    role: string;
  }[];
  type: string;
  status: 'active' | 'closed' | 'archived';
  category?: string;
  priority?: string;
  lastMessage?: {
    content?: {
      text?: string;
    };
    createdAt?: string;
    timestamp?: Date;
    type?: string;
  };
  unreadCount: number;
  messageCount: number;
  metadata?: {
    listingId?: string;
    listingType?: "property" | "vehicle";
  };
  recipientName?: string; // For local threads
  createdAt: string;
  updatedAt: string;
}

interface ThreadListingContext {
  listingId?: string;
  listingType?: "property" | "vehicle";
}

class ChatService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private listeners: Map<string, Function[]> = new Map();

  /** Initialize only if not already done (token already set). */
  async ensureInitialized() {
    if (!this.token) {
      await this.initialize();
    }
  }

  async initialize() {
    try {
      // Get token from SecureStore (where it's actually stored)
      // With fallback to AsyncStorage for compatibility
      let token: string | null = null;

      try {
        token = await SecureStore.getItemAsync(STORAGE_KEYS.TOKEN);
      } catch (secureStoreError) {
        console.warn('⚠️ SecureStore error, falling back to AsyncStorage:', secureStoreError);
        // Fallback to AsyncStorage
        token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      }

      if (!token) {
        console.warn('⚠️ No auth token found in storage');
        throw new Error('No auth token found');
      }

      this.token = token;
      console.log('🔐 Auth token retrieved successfully');

      // Initialize socket connection
      this.socket = io(SOCKET_URL, {
        auth: { token: this.token },
        transports: ['websocket', 'polling'],
      });

      this.socket.on('connect', () => {
        console.log('✅ Connected to chat server');
        this.emit('connected');
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Disconnected from chat server');
        this.emit('disconnected');
      });

      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
        this.emit('error', error);
      });

      // Message events
      this.socket.on('message:new', async (data) => {
        console.log('📨 New message:', data);
        this.emit('message:new', data);

        // Trigger notification if message is from someone else
        try {
          const { notificationService } = await import('./notificationService');
          const currentUserId = await this.getCurrentUserId();
          const senderId = data.message.sender.userId?._id || data.message.sender.userId;

          if (senderId !== currentUserId) {
            await notificationService.createLocalNotification(
              'message',
              'New Message',
              data.message.content.text || 'You received a new image',
              { deepLink: `/chat/${data.threadId}`, relatedId: data.threadId }
            );
          }
        } catch (err) {
          console.warn('Error triggering notification for new message:', err);
        }
      });

      this.socket.on('message:edited', (data) => {
        this.emit('message:edited', data);
      });

      this.socket.on('message:deleted', (data) => {
        this.emit('message:deleted', data);
      });

      // Typing events
      this.socket.on('typing:user', (data) => {
        this.emit('typing:user', data);
      });

      // Read receipts
      this.socket.on('messages:read', (data) => {
        this.emit('messages:read', data);
      });

      // Thread events
      this.socket.on('thread:status:changed', (data) => {
        this.emit('thread:status:changed', data);
      });

      // Global Notification events from backend
      this.socket.on('notification:received', async (data) => {
        console.log('🔔 Global notification received:', data);
        try {
          const { notificationService } = await import('./notificationService');
          // @ts-ignore - internal emit
          notificationService.emit('notification:received', data);

          // Also show a local push notification if it's not a message (since message is handled separately or we want it here)
          // If we want the Notification system to be the source of truth, we could handle all here.
        } catch (err) {
          console.warn('Error handling global notification:', err);
        }
      });

      return this;
    } catch (error: any) {
      console.error('❌ Error initializing chat service:', error.message || error);
      throw error;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Event listener management
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  // API Methods
  async getOrCreateSupportThread(): Promise<Thread> {
    try {
      const response = await fetch(`${API_URL}/api/client/messages/support/thread`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({ category: 'general' }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('getOrCreateSupportThread failed:', response.status, errorText);
        throw new Error(`Failed to get support thread: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error in getOrCreateSupportThread:', error);
      throw error;
    }
  }

  async getUserThreads(): Promise<Thread[]> {
    try {
      await this.ensureInitialized();
      const { localChatStorage } = await import('./localChatStorage');
      const allThreads: Thread[] = [];

      // 1. Get backend threads
      try {
        const response = await fetch(`${API_URL}/api/client/messages/threads`, {
          headers: {
            'Authorization': `Bearer ${this.token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.data)) {
            allThreads.push(...data.data);
            console.log(`📋 Retrieved ${data.data.length} backend threads`);
          }
        }
      } catch (error) {
        console.warn('Failed to fetch backend threads:', error);
      }

      // 2. Get local threads (deduplicate against backend threads)
      try {
        const localThreads = await localChatStorage.getAllThreads();
        console.log(`📋 Retrieved ${localThreads.length} local threads`);

        // Get participant IDs already covered by backend threads
        const backendParticipantPairs = new Set<string>();
        allThreads.forEach(t => {
          const ids = t.participants
            .map(p => (typeof p.userId === 'string' ? p.userId : p.userId?._id || p.userId))
            .filter(Boolean)
            .sort()
            .join('_');
          const listingKey = t.metadata?.listingId && t.metadata?.listingType
            ? `${t.metadata.listingType}_${t.metadata.listingId}`
            : 'general';
          if (ids) backendParticipantPairs.add(`${ids}_${listingKey}`);
        });

        // Only add local threads that don't overlap with backend threads by ID or participants
        const backendIds = new Set(allThreads.map(t => t._id));
        for (const lt of localThreads) {
          if (backendIds.has(lt._id)) continue; // same ID
          const ltIds = lt.participants
            .map(p => (typeof p.userId === 'string' ? p.userId : p.userId?._id || p.userId))
            .filter(Boolean)
            .sort()
            .join('_');
          const ltListingKey = lt.metadata?.listingId && lt.metadata?.listingType
            ? `${lt.metadata.listingType}_${lt.metadata.listingId}`
            : 'general';
          if (ltIds && backendParticipantPairs.has(`${ltIds}_${ltListingKey}`)) continue; // same participants + listing context
          allThreads.push(lt);
        }
      } catch (error) {
        console.warn('Failed to fetch local threads:', error);
      }

      // 3. Sort by last message time (most recent first)
      allThreads.sort((a, b) => {
        const timeA = a.lastMessage?.createdAt || a.updatedAt || 0;
        const timeB = b.lastMessage?.createdAt || b.updatedAt || 0;
        return new Date(timeB).getTime() - new Date(timeA).getTime();
      });

      console.log(`📋 Total threads: ${allThreads.length}`);
      return allThreads;
    } catch (error) {
      console.error('Error in getUserThreads:', error);
      return [];
    }
  }

  async getOrCreateThread(
    recipientId: string,
    recipientName?: string,
    listingContext?: ThreadListingContext
  ): Promise<Thread | null> {
    try {
      await this.ensureInitialized();

      // Import local storage here to avoid circular dependency
      const { localChatStorage } = await import('./localChatStorage');

      // Get current user ID from token (decode JWT or from AsyncStorage)
      const currentUserId = await this.getCurrentUserId();
      if (!currentUserId) {
        console.error('Cannot create thread: current user ID not found');
        return null;
      }

      // 1. Check local storage first for existing thread
      const localThread = await localChatStorage.findThreadByParticipant(
        currentUserId,
        recipientId,
        listingContext
      );
      if (localThread) {
        console.log('Found existing local thread:', localThread._id);
        return localThread;
      }

      // 2. Try to find existing thread from backend
      const listResponse = await fetch(`${API_URL}/api/client/messages/threads`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (listResponse.ok) {
        const listData = await listResponse.json();
        if (listData.data && Array.isArray(listData.data)) {
          const existing = listData.data.find((t: any) =>
            t.participants.some((p: any) => {
              const id = p.userId?._id || p.userId || p;
              return id === recipientId;
            }) && (
              listingContext?.listingId && listingContext?.listingType
                ? t.metadata?.listingId?.toString?.() === listingContext.listingId &&
                  t.metadata?.listingType === listingContext.listingType
                : !t.metadata?.listingId
            )
          );
          if (existing) {
            console.log('Found existing backend thread:', existing._id);
            return existing;
          }
        }
      }

      // 3. Try to create new thread on backend
      const response = await fetch(`${API_URL}/api/client/messages/threads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          recipientId,
          listingId: listingContext?.listingId,
          listingType: listingContext?.listingType,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Created new backend thread:', data.data._id);
        return data.data;
      }

      const errorText = await response.text();
      throw new Error(`Failed to create thread: ${response.status} ${errorText}`);

      return null;

    } catch (error) {
      console.error('Error in getOrCreateThread:', error);

      // Only use local fallback for genuine offline/network failures.
      try {
        const message = error instanceof Error ? error.message : String(error);
        const isNetworkFailure = /network|fetch|timeout|offline/i.test(message);
        if (!isNetworkFailure) {
          return null;
        }

        const { localChatStorage } = await import('./localChatStorage');
        const currentUserId = await this.getCurrentUserId();
        if (currentUserId) {
          const localThread = await localChatStorage.createLocalThread(
            recipientId,
            currentUserId,
            recipientName,
            listingContext
          );
          console.log('Created local fallback thread:', localThread._id);
          return localThread;
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }

      return null;
    }
  }

  private async getCurrentUserId(): Promise<string | null> {
    try {
      // Try to get from AsyncStorage using the correct key
      const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (userJson) {
        const user = JSON.parse(userJson);
        return user._id || user.id || null;
      }

      // If not in storage, could decode from JWT token
      // For now, return null and handle appropriately
      return null;
    } catch (error) {
      console.error('Error getting current user ID:', error);
      return null;
    }
  }

  async getMessages(threadId: string, limit = 50): Promise<Message[]> {
    try {
      await this.ensureInitialized();

      // Check if this is a local thread
      if (threadId.startsWith('local_')) {
        const { localChatStorage } = await import('./localChatStorage');
        const messages = await localChatStorage.getMessages(threadId);
        console.log(`📨 Retrieved ${messages.length} local messages for thread ${threadId}`);
        return messages.slice(-limit); // Return last N messages
      }

      // Backend thread - fetch from API
      const response = await fetch(`${API_URL}/api/client/messages/threads/${threadId}/messages?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get messages');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error in getMessages:', error);
      // Return empty array instead of throwing for better UX
      return [];
    }
  }

  async sendMessage(threadId: string, text: string): Promise<Message> {
    try {
      await this.ensureInitialized();

      // Check if this is a local thread
      if (threadId.startsWith('local_')) {
        const { localChatStorage } = await import('./localChatStorage');
        const currentUserId = await this.getCurrentUserId();

        if (!currentUserId) {
          throw new Error('Current user ID not found');
        }

        const message = localChatStorage.createLocalMessage(threadId, currentUserId, text, 'text');
        await localChatStorage.saveMessage(message);
        console.log('💬 Sent local message:', message._id);

        // Emit event for local handling
        this.emit('message:new', { threadId, message });

        return message;
      }

      // Backend thread - send to API
      const response = await fetch(`${API_URL}/api/client/messages/threads/${threadId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          type: 'text',
          content: { text },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  }

  async sendImage(threadId: string, imageUri: string, caption?: string): Promise<Message> {
    await this.ensureInitialized();

    // Check if this is a local thread
    if (threadId.startsWith('local_')) {
      const { localChatStorage } = await import('./localChatStorage');
      const currentUserId = await this.getCurrentUserId();

      if (!currentUserId) {
        throw new Error('Current user ID not found');
      }

      const message = localChatStorage.createLocalMessage(threadId, currentUserId, imageUri, 'image');
      if (caption && message.content) {
        message.content.text = caption;
      }
      await localChatStorage.saveMessage(message);

      // Emit event for local handling
      this.emit('message:new', { threadId, message });

      return message;
    }

    // Backend thread - send to API
    const formData = new FormData();

    // Extract filename from URI
    const filename = imageUri.split('/').pop() || 'image.jpg';

    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: filename,
    } as any);

    if (caption) {
      formData.append('caption', caption);
    }

    const response = await fetch(`${API_URL}/api/client/messages/threads/${threadId}/messages/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to send image');
    }

    const data = await response.json();
    return data.data;
  }

  // Socket methods
  joinThread(threadId: string) {
    // Local threads don't exist on the backend, skip socket join
    if (this.socket && !threadId.startsWith('local_')) {
      this.socket.emit('thread:join', { threadId });
    }
  }

  leaveThread(threadId: string) {
    // Local threads don't exist on the backend, skip socket leave
    if (this.socket && !threadId.startsWith('local_')) {
      this.socket.emit('thread:leave', { threadId });
    }
  }

  startTyping(threadId: string) {
    if (this.socket && !threadId.startsWith('local_')) {
      this.socket.emit('typing:start', { threadId });
    }
  }

  stopTyping(threadId: string) {
    if (this.socket && !threadId.startsWith('local_')) {
      this.socket.emit('typing:stop', { threadId });
    }
  }

  markAsRead(threadId: string) {
    if (this.socket && !threadId.startsWith('local_')) {
      this.socket.emit('message:read', { threadId });
    }
  }
}

export const chatService = new ChatService();
