'use client';

import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { Phone, X, Bell } from 'lucide-react';

// Types
interface Notification {
    id: string;
    type: string;
    lead_id: number;
    lead_name: string;
    lead_phone: string;
    message: string;
    urgency: 'high' | 'normal';
    timestamp: Date;
}

interface NotificationContextType {
    notifications: Notification[];
    soundEnabled: boolean;
    wsConnected: boolean;
    toggleSound: () => void;
    clearNotification: (id: string) => void;
    clearAll: () => void;
}

// Context
const NotificationContext = createContext<NotificationContextType | null>(null);

// Hook
export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        // Return default values if not in provider
        return {
            notifications: [],
            soundEnabled: true,
            wsConnected: false,
            toggleSound: () => { },
            clearNotification: () => { },
            clearAll: () => { },
        };
    }
    return context;
}

// Provider Component
export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [wsConnected, setWsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttempts = useRef(0);

    // Initialize audio
    useEffect(() => {
        // Create audio element for notification sound
        audioRef.current = new Audio('/sounds/notification.mp3');
        audioRef.current.volume = 0.7;

        // Fallback: try to create a beep sound if file doesn't exist
        audioRef.current.onerror = () => {
            console.log('Notification sound file not found, using fallback');
        };

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    // Play notification sound
    const playSound = () => {
        if (soundEnabled && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => {
                console.log('Audio play failed (user interaction required):', e);
            });
        }
    };

    // Connect to WebSocket
    useEffect(() => {
        const connectWebSocket = () => {
            try {
                // Get user ID from localStorage or default to 1
                const userId = localStorage.getItem('user_id') || '1';
                const wsUrl = `ws://localhost:8000/ws/notifications/${userId}`;

                console.log('🔌 Connecting to WebSocket:', wsUrl);

                wsRef.current = new WebSocket(wsUrl);

                wsRef.current.onopen = () => {
                    console.log('✅ WebSocket connected');
                    setWsConnected(true);
                    reconnectAttempts.current = 0;
                };

                wsRef.current.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        console.log('📨 WebSocket message:', data);

                        // Handle callback alerts
                        if (data.type === 'CALLBACK_ALERT') {
                            const notification: Notification = {
                                id: `${data.lead_id}-${Date.now()}`,
                                type: data.type,
                                lead_id: data.lead_id,
                                lead_name: data.lead_name || 'Unknown',
                                lead_phone: data.lead_phone || data.phone || '',
                                message: data.message || `Call ${data.lead_name} now!`,
                                urgency: data.urgency || 'normal',
                                timestamp: new Date(),
                            };

                            setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep max 10
                            playSound();

                            // Show browser notification if permitted
                            if (typeof window !== 'undefined' && 'Notification' in window) {
                                if (Notification.permission === 'granted') {
                                    new Notification('📞 Callback Reminder', {
                                        body: `Call ${data.lead_name} now!`,
                                        icon: '/icon.png',
                                        tag: `callback-${data.lead_id}`,
                                    });
                                }
                            }
                        }

                        // Handle heartbeat
                        if (data.type === 'HEARTBEAT' || data.type === 'PONG') {
                            console.log('💓 Heartbeat received');
                        }

                    } catch (e) {
                        console.error('WebSocket message parse error:', e);
                    }
                };

                wsRef.current.onclose = (event) => {
                    console.log('❌ WebSocket disconnected:', event.code, event.reason);
                    setWsConnected(false);

                    // Reconnect with exponential backoff
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
                    reconnectAttempts.current++;

                    console.log(`🔄 Reconnecting in ${delay / 1000}s (attempt ${reconnectAttempts.current})`);

                    reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
                };

                wsRef.current.onerror = (error) => {
                    console.error('WebSocket error:', error);
                };

            } catch (error) {
                console.error('WebSocket connection error:', error);
                setWsConnected(false);
            }
        };

        // Initial connection
        connectWebSocket();

        // Request browser notification permission
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }

        // Ping to keep alive
        const pingInterval = setInterval(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send('ping');
            }
        }, 25000);

        // Cleanup
        return () => {
            clearInterval(pingInterval);
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [soundEnabled]);

    const toggleSound = () => setSoundEnabled(prev => !prev);

    const clearNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const clearAll = () => setNotifications([]);

    return (
        <NotificationContext.Provider value={{
            notifications,
            soundEnabled,
            wsConnected,
            toggleSound,
            clearNotification,
            clearAll,
        }}>
            {children}

            {/* Notification Toasts */}
            <div style={{
                position: 'fixed',
                top: '80px',
                right: '20px',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                maxWidth: '380px',
            }}>
                {notifications.slice(0, 3).map((notification) => (
                    <div
                        key={notification.id}
                        style={{
                            padding: '16px',
                            borderRadius: '12px',
                            border: `1px solid ${notification.urgency === 'high' ? '#f85149' : '#d29922'}`,
                            backgroundColor: notification.urgency === 'high'
                                ? 'rgba(248, 81, 73, 0.95)'
                                : 'rgba(210, 153, 34, 0.95)',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                            animation: 'slideIn 0.3s ease-out',
                        }}
                    >
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <Phone size={20} color="white" />
                                </div>
                                <div>
                                    <p style={{ fontWeight: 600, color: 'white', fontSize: '14px', margin: 0 }}>
                                        {notification.lead_name}
                                    </p>
                                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', margin: 0 }}>
                                        {notification.lead_phone}
                                    </p>
                                </div>
                            </div>

                            {notification.urgency === 'high' && (
                                <span style={{
                                    padding: '2px 8px',
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    borderRadius: '4px',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    color: 'white',
                                }}>
                                    URGENT
                                </span>
                            )}

                            <button
                                onClick={() => clearNotification(notification.id)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    borderRadius: '4px',
                                }}
                            >
                                <X size={16} color="rgba(255,255,255,0.6)" />
                            </button>
                        </div>

                        {/* Message */}
                        <p style={{ color: 'white', fontSize: '13px', marginBottom: '12px' }}>
                            {notification.message}
                        </p>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => {
                                    window.location.href = `/calls?lead=${notification.lead_id}`;
                                    clearNotification(notification.id);
                                }}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    borderRadius: '6px',
                                    color: 'white',
                                    fontWeight: 600,
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                }}
                            >
                                <Phone size={14} /> Call Now
                            </button>
                            <button
                                onClick={() => clearNotification(notification.id)}
                                style={{
                                    padding: '10px 16px',
                                    backgroundColor: 'transparent',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    borderRadius: '6px',
                                    color: 'white',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                }}
                            >
                                Later
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Connection Status Indicator */}
            <div style={{
                position: 'fixed',
                bottom: '16px',
                right: '16px',
                zIndex: 9999,
                padding: '8px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: wsConnected ? 'rgba(35, 134, 54, 0.2)' : 'rgba(248, 81, 73, 0.2)',
                color: wsConnected ? '#3fb950' : '#f85149',
                border: `1px solid ${wsConnected ? 'rgba(35, 134, 54, 0.3)' : 'rgba(248, 81, 73, 0.3)'}`,
            }}>
                <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: wsConnected ? '#3fb950' : '#f85149',
                    animation: wsConnected ? 'pulse 2s infinite' : 'none',
                }} />
                {wsConnected ? 'Live Alerts On' : 'Reconnecting...'}
            </div>

            {/* CSS Animation */}
            <style jsx global>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
        </NotificationContext.Provider>
    );
}

export default NotificationProvider;
