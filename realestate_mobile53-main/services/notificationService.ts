import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { apiService, API_URL } from './api';

function isAndroidExpoGoRuntime() {
    return (
        Platform.OS === 'android' &&
        (Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient')
    );
}

// Notification Types
export type NotificationType =
    | 'message'          // New chat message
    | 'follow'           // Someone followed you
    | 'support_reply'    // Support team replied (Questions)
    | 'booking'          // Booking related
    | 'property_update'  // Property status changed
    | 'question_update'  // Specifically for questions
    | 'system';          // System announcements (Alerts)

export interface AppNotification {
    _id: string;
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: {
        [key: string]: any;
        deepLink?: string;      // Where to navigate when clicked
        relatedId?: string;      // Thread ID, property ID, etc.
    };
    read: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface NotificationPreferences {
    pushEnabled: boolean;
    emailEnabled: boolean;
    smsEnabled: boolean;
    types: {
        questions: boolean;
        message_booking: boolean;
        messages: boolean;
        alerts: boolean;
    };
}


// Configure how notifications should be handled
if (!isAndroidExpoGoRuntime()) {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
        } as any),
    });
}

class NotificationService {
    private pushToken: string | null = null;
    private listeners: Map<string, Function[]> = new Map();

    private isUnsupportedExpoGoPushRuntime() {
        return isAndroidExpoGoRuntime();
    }

    async initialize() {
        if (this.isUnsupportedExpoGoPushRuntime()) {
            this.pushToken = null;
            return this;
        }

        // Request push notification permissions
        await this.requestPermissions();

        // Get and cache the Expo push token (registration to backend happens
        // in syncPushToken(), called after the user is authenticated)
        await this.registerForPushNotifications();

        // Listen for notification interactions
        this.setupNotificationListeners();

        // Sync badge count with backend unread count
        await this.syncBadgeCount();

        return this;
    }

    private async requestPermissions(): Promise<boolean> {
        if (this.isUnsupportedExpoGoPushRuntime()) {
            return false;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.warn('Push notification permissions not granted');
            return false;
        }

        return true;
    }

    private async registerForPushNotifications() {
        try {
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF8C42',
                });
            }

            if (this.isUnsupportedExpoGoPushRuntime()) {
                console.warn(
                    'Skipping remote push registration on Android Expo Go. Use a development build for push notifications.'
                );
                this.pushToken = null;
                return null;
            }

            const token = (await Notifications.getExpoPushTokenAsync()).data;
            this.pushToken = token;
            console.log('Push token obtained:', token);
            // Do not send to backend here — call syncPushToken() after login
            return token;
        } catch (error) {
            console.error('Error getting push token:', error);
            return null;
        }
    }


    private async sendPushTokenToBackend(pushToken: string) {
        try {
            await apiService.post('/client/notifications/register-token', {
                pushToken,
                platform: Platform.OS,
            });
            console.log('✅ Push token registered with backend');
        } catch (error) {
            console.error('Error sending push token to backend:', error);
        }
    }

    private setupNotificationListeners() {
        if (this.isUnsupportedExpoGoPushRuntime()) {
            return;
        }

        // Handle notification when app is in foreground
        Notifications.addNotificationReceivedListener((notification) => {
            console.log('Notification received:', notification);
            this.emit('notification:received', notification);
            // Sync badge after receiving new notification
            this.syncBadgeCount();
        });

        // Handle notification tap
        Notifications.addNotificationResponseReceivedListener((response) => {
            console.log('Notification tapped:', response);
            this.emit('notification:tapped', response);

            // Standardised deep link routing
            const data = response.notification.request.content.data;
            if (data?.deepLink) {
                const route = this.resolveDeepLink(data.deepLink as string, data);
                this.emit('notification:navigate', route);
            }
        });
    }

    /**
     * Map a backend deep-link string to a valid Expo Router path.
     * Handles both legacy and new formats consistently.
     */
    private resolveDeepLink(deepLink: string, data?: any): string {
        // /chat/:id  →  /(tabs)/Messages/chat/:id
        const chatMatch = deepLink.match(/^\/chat\/([\w-]+)$/);
        if (chatMatch) return `/chat/${chatMatch[1]}`;

        // /booking/:id  →  /booking/:id
        const bookingMatch = deepLink.match(/^\/booking\/([\w-]+)$/);
        if (bookingMatch) return `/booking/${bookingMatch[1]}`;

        // Already a full Expo-style path
        if (deepLink.startsWith('/(tabs)') || deepLink.startsWith('/')) {
            return deepLink;
        }

        // Default: messages tab
        return '/(tabs)/Messages';
    }

    /**
     * Register the cached Expo push token with the backend.
     * Must be called after the user has authenticated (apiService has the auth token).
     */
    async syncPushToken(): Promise<void> {
        if (this.isUnsupportedExpoGoPushRuntime()) {
            return;
        }

        try {
            if (!this.pushToken) {
                // Token not yet obtained — try to get it now
                await this.registerForPushNotifications();
            }
            if (this.pushToken) {
                await this.sendPushTokenToBackend(this.pushToken);
            }
        } catch (error) {
            console.error('Error syncing push token after login:', error);
        }
    }

    // Event emitter
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

    emit(event: string, data?: any) {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.forEach(callback => callback(data));
        }
    }

    /**
     * Refresh the in-app unread badge and notification list.
     * Call after login so already-mounted screens pick up existing notifications.
     */
    async refresh(): Promise<void> {
        if (this.isUnsupportedExpoGoPushRuntime()) {
            this.emit('notification:received', null);
            return;
        }

        try {
            const count = await this.getUnreadCount();
            await Notifications.setBadgeCountAsync(count);
            // Emit a synthetic received event — screens listening to this
            // (Explore badge, notifications list) will re-fetch accordingly.
            this.emit('notification:received', null);
        } catch {
            // Non-critical
        }
    }

    // API Methods
    async getNotifications(limit = 50, unreadOnly = false): Promise<AppNotification[]> {
        try {
            const endpoint = `/client/notifications?limit=${limit}&unreadOnly=${unreadOnly}`;
            const response = await apiService.get<AppNotification[]>(endpoint);

            if (!response.success) {
                // Fallback to local storage if backend not available
                return await this.getLocalNotifications();
            }

            return response.data || [];
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return await this.getLocalNotifications();
        }
    }

    async getUnreadCount(): Promise<number> {
        try {
            const response = await apiService.get<{ count: number }>('/client/notifications/unread-count');

            if (!response.success) {
                const local = await this.getLocalNotifications();
                return local.filter(n => !n.read).length;
            }

            return response.data?.count || 0;
        } catch (error) {
            const local = await this.getLocalNotifications();
            return local.filter(n => !n.read).length;
        }
    }

    async markAsRead(notificationId: string): Promise<boolean> {
        try {
            const response = await apiService.put(`/client/notifications/${notificationId}/read`);

            if (!response.success) {
                await this.markLocalAsRead(notificationId);
                await this.syncBadgeCount();
                return true;
            }

            this.emit('notification:read', notificationId);
            await this.syncBadgeCount();
            return true;
        } catch (error) {
            await this.markLocalAsRead(notificationId);
            await this.syncBadgeCount();
            return false;
        }
    }

    /**
     * Ask the backend to create notifications for any pending booking requests
     * that the current seller owns but that have no notification record yet.
     * Safe to call at every login — the backend is idempotent.
     */
    async syncBookingNotifications(): Promise<void> {
        try {
            await apiService.post('/client/notifications/sync-bookings');
        } catch (error) {
            console.error('Error syncing booking notifications:', error);
        }
    }

    async markAllAsRead(): Promise<boolean> {
        try {
            const response = await apiService.put('/client/notifications/read-all');

            if (!response.success) {
                await this.markAllLocalAsRead();
                await Notifications.setBadgeCountAsync(0);
                return true;
            }

            this.emit('notification:all-read');
            await Notifications.setBadgeCountAsync(0);
            return true;
        } catch (error) {
            await this.markAllLocalAsRead();
            await Notifications.setBadgeCountAsync(0);
            return false;
        }
    }

    async deleteAll(): Promise<boolean> {
        try {
            const response = await apiService.delete('/client/notifications');
            await this.clearLocalNotifications();
            this.emit('notification:cleared');
            await Notifications.setBadgeCountAsync(0);
            return response.success ?? true;
        } catch (error) {
            await this.clearLocalNotifications();
            await Notifications.setBadgeCountAsync(0);
            return false;
        }
    }

    async getPreferences(): Promise<NotificationPreferences> {
        try {
            const response = await apiService.get<NotificationPreferences>('/client/notifications/preferences');

            if (!response.success) {
                return this.getDefaultPreferences();
            }

            return response.data!;
        } catch (error) {
            return this.getDefaultPreferences();
        }
    }

    async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<boolean> {
        try {
            const response = await apiService.put<NotificationPreferences>('/client/notifications/preferences', preferences);

            if (!response.success) {
                // Save to local storage
                await AsyncStorage.setItem('notification_preferences', JSON.stringify(preferences));
                return true;
            }

            this.emit('preferences:updated', preferences);
            return true;
        } catch (error) {
            await AsyncStorage.setItem('notification_preferences', JSON.stringify(preferences));
            return false;
        }
    }

    // Local storage fallback methods
    private async getLocalNotifications(): Promise<AppNotification[]> {
        try {
            const json = await AsyncStorage.getItem('local_notifications');
            return json ? JSON.parse(json) : [];
        } catch (error) {
            return [];
        }
    }

    private async saveLocalNotification(notification: AppNotification) {
        try {
            const notifications = await this.getLocalNotifications();
            notifications.unshift(notification);
            await AsyncStorage.setItem('local_notifications', JSON.stringify(notifications.slice(0, 100))); // Keep last 100
            this.emit('notification:received', notification);
        } catch (error) {
            console.error('Error saving local notification:', error);
        }
    }

    private async markLocalAsRead(notificationId: string) {
        try {
            const notifications = await this.getLocalNotifications();
            const updated = notifications.map(n =>
                n._id === notificationId ? { ...n, read: true } : n
            );
            await AsyncStorage.setItem('local_notifications', JSON.stringify(updated));
        } catch (error) {
            console.error('Error marking local notification as read:', error);
        }
    }

    private async markAllLocalAsRead() {
        try {
            const notifications = await this.getLocalNotifications();
            const updated = notifications.map(n => ({ ...n, read: true }));
            await AsyncStorage.setItem('local_notifications', JSON.stringify(updated));
        } catch (error) {
            console.error('Error marking all local notifications as read:', error);
        }
    }

    private async clearLocalNotifications() {
        try {
            await AsyncStorage.setItem('local_notifications', JSON.stringify([]));
        } catch (error) {
            console.error('Error clearing local notifications:', error);
        }
    }

    private getDefaultPreferences(): NotificationPreferences {
        return {
            pushEnabled: true,
            emailEnabled: false,
            smsEnabled: false,
            types: {
                questions: true,
                message_booking: true,
                messages: true,
                alerts: true,
            },
        };
    }

    // Create local notification (for testing or offline mode)
    async createLocalNotification(
        type: NotificationType,
        title: string,
        body: string,
        data?: any
    ): Promise<AppNotification> {
        const notification: AppNotification = {
            _id: `local_notif_${Date.now()}`,
            userId: 'current_user',
            type,
            title,
            body,
            data,
            read: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await this.saveLocalNotification(notification);

        // Show local push notification if app is in background
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
            },
            trigger: null, // Show immediately
        });

        return notification;
    }

    // Schedule a local notification for future
    async scheduleNotification(
        title: string,
        body: string,
        triggerDate: Date,
        data?: any
    ) {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
            },
            trigger: triggerDate as any,
        });
    }

    // Cancel all scheduled notifications
    async cancelAllNotifications() {
        await Notifications.cancelAllScheduledNotificationsAsync();
    }

    // Get badge count
    async getBadgeCount(): Promise<number> {
        return await this.getUnreadCount();
    }

    // Set badge count
    async setBadgeCount(count: number) {
        await Notifications.setBadgeCountAsync(count);
    }

    /**
     * Sync the app icon badge with the backend's unread notification count.
     * Safe to call at any point — silently no-ops on error.
     */
    async syncBadgeCount(): Promise<void> {
        if (this.isUnsupportedExpoGoPushRuntime()) {
            return;
        }

        try {
            const count = await this.getUnreadCount();
            await Notifications.setBadgeCountAsync(count);
        } catch {
            // Non-critical — do not rethrow
        }
    }
}

export const notificationService = new NotificationService();
