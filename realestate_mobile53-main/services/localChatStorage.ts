import AsyncStorage from '@react-native-async-storage/async-storage';
import { Thread, Message } from './chatService';

const LOCAL_THREADS_KEY = 'local_chat_threads';
const LOCAL_MESSAGES_KEY = 'local_chat_messages_';

// Local fallback storage for chat threads when backend is unavailable
class LocalChatStorage {
    // Create a local thread
    async createLocalThread(
        recipientId: string,
        currentUserId: string,
        recipientName?: string,
        listingContext?: { listingId?: string; listingType?: 'property' | 'vehicle' }
    ): Promise<Thread> {
        const threadId = listingContext?.listingId && listingContext?.listingType
            ? `local_${currentUserId}_${recipientId}_${listingContext.listingType}_${listingContext.listingId}`
            : `local_${currentUserId}_${recipientId}`;

        const thread: Thread = {
            _id: threadId,
            participants: [
                {
                    userId: currentUserId,
                    role: 'user',
                },
                {
                    userId: recipientId,
                    role: 'owner',
                },
            ],
            type: 'owner_chat',
            status: 'active',
            unreadCount: 0,
            messageCount: 0,
            metadata: listingContext,
            recipientName: recipientName, // Store recipient name for display
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await this.saveThread(thread);
        return thread;
    }

    // Save thread to local storage
    async saveThread(thread: Thread): Promise<void> {
        try {
            const threadsJson = await AsyncStorage.getItem(LOCAL_THREADS_KEY);
            const threads: Thread[] = threadsJson ? JSON.parse(threadsJson) : [];

            const existingIndex = threads.findIndex(t => t._id === thread._id);
            if (existingIndex >= 0) {
                threads[existingIndex] = thread;
            } else {
                threads.push(thread);
            }

            await AsyncStorage.setItem(LOCAL_THREADS_KEY, JSON.stringify(threads));
        } catch (error) {
            console.error('Error saving thread:', error);
        }
    }

    // Get thread by ID
    async getThread(threadId: string): Promise<Thread | null> {
        try {
            const threadsJson = await AsyncStorage.getItem(LOCAL_THREADS_KEY);
            if (!threadsJson) return null;

            const threads: Thread[] = JSON.parse(threadsJson);
            return threads.find(t => t._id === threadId) || null;
        } catch (error) {
            console.error('Error getting thread:', error);
            return null;
        }
    }

    // Find thread with a specific participant
    async findThreadByParticipant(
        currentUserId: string,
        recipientId: string,
        listingContext?: { listingId?: string; listingType?: 'property' | 'vehicle' }
    ): Promise<Thread | null> {
        try {
            const threadsJson = await AsyncStorage.getItem(LOCAL_THREADS_KEY);
            if (!threadsJson) return null;

            const threads: Thread[] = JSON.parse(threadsJson);
            return threads.find(t => {
                const participantIds = t.participants.map(p => {
                    const id = typeof p.userId === 'string' ? p.userId : (p.userId?._id || p.userId);
                    return id;
                });

                if (!(participantIds.includes(currentUserId) && participantIds.includes(recipientId))) {
                    return false;
                }

                if (listingContext?.listingId && listingContext?.listingType) {
                    return (
                        t.metadata?.listingId === listingContext.listingId &&
                        t.metadata?.listingType === listingContext.listingType
                    );
                }

                return !t.metadata?.listingId;
            }) || null;
        } catch (error) {
            console.error('Error finding thread:', error);
            return null;
        }
    }

    // Save a message to local storage
    async saveMessage(message: Message): Promise<void> {
        try {
            const key = `${LOCAL_MESSAGES_KEY}${message.threadId}`;
            const messagesJson = await AsyncStorage.getItem(key);
            const messages: Message[] = messagesJson ? JSON.parse(messagesJson) : [];

            // Avoid duplicates
            if (!messages.find(m => m._id === message._id)) {
                messages.push(message);
                await AsyncStorage.setItem(key, JSON.stringify(messages));
            }

            // Update thread's last message
            const thread = await this.getThread(message.threadId);
            if (thread) {
                thread.lastMessage = {
                    content: {
                        text: message.content.text || 'Image',
                    },
                    createdAt: message.createdAt,
                    type: message.type,
                };
                thread.messageCount = messages.length;
                thread.updatedAt = new Date().toISOString();
                await this.saveThread(thread);
            }
        } catch (error) {
            console.error('Error saving message:', error);
        }
    }

    // Get messages for a thread
    async getMessages(threadId: string): Promise<Message[]> {
        try {
            const key = `${LOCAL_MESSAGES_KEY}${threadId}`;
            const messagesJson = await AsyncStorage.getItem(key);
            return messagesJson ? JSON.parse(messagesJson) : [];
        } catch (error) {
            console.error('Error getting messages:', error);
            return [];
        }
    }

    // Create a local message
    createLocalMessage(
        threadId: string,
        senderId: string,
        text: string,
        type: 'text' | 'image' = 'text'
    ): Message {
        return {
            _id: `local_msg_${Date.now()}_${Math.random()}`,
            threadId,
            sender: {
                userId: senderId,
                role: 'user',
            },
            type,
            content: {
                text: type === 'text' ? text : undefined,
                mediaUrl: type === 'image' ? text : undefined,
            },
            status: 'sent',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }

    // Check if a thread is local
    isLocalThread(threadId: string): boolean {
        return threadId.startsWith('local_');
    }

    // Get all threads
    async getAllThreads(): Promise<Thread[]> {
        try {
            const threadsJson = await AsyncStorage.getItem(LOCAL_THREADS_KEY);
            return threadsJson ? JSON.parse(threadsJson) : [];
        } catch (error) {
            console.error('Error getting all threads:', error);
            return [];
        }
    }
}

export const localChatStorage = new LocalChatStorage();
