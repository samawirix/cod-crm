'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import { toast } from 'sonner';
import { Bell, Phone } from 'lucide-react';

interface NotificationProviderProps {
    children: ReactNode;
    agentId?: number;
}

export function NotificationProvider({ children, agentId: propAgentId }: NotificationProviderProps) {
    const ws = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [effectiveAgentId, setEffectiveAgentId] = useState<number | null>(propAgentId || null);
    const reconnectTimeout = useRef<NodeJS.Timeout>();
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 10;

    // Get agentId from localStorage on mount
    useEffect(() => {
        if (!propAgentId) {
            const storedUserId = localStorage.getItem('user_id') || localStorage.getItem('userId');
            if (storedUserId) {
                setEffectiveAgentId(parseInt(storedUserId, 10));
            } else {
                // Default to 1 for development
                setEffectiveAgentId(1);
            }
        }
    }, [propAgentId]);

    // WebSocket connection effect
    useEffect(() => {
        if (!effectiveAgentId) return;

        const connectWebSocket = () => {
            try {
                const wsUrl = `ws://localhost:8000/ws/notifications/${effectiveAgentId}`;
                console.log('🔌 Connecting to WebSocket:', wsUrl);

                ws.current = new WebSocket(wsUrl);

                ws.current.onopen = () => {
                    console.log('✅ WebSocket connected');
                    setIsConnected(true);
                    reconnectAttempts.current = 0;
                };

                ws.current.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    console.log('📨 WebSocket message:', data);

                    if (data.type === 'CALLBACK_ALERT') {
                        // Play notification sound
                        playNotificationSound();

                        // Show toast notification with action
                        toast.success(
                            <div className="flex items-start gap-3">
                                <Bell className="w-5 h-5 text-blue-400 mt-0.5" />
                                <div>
                                    <p className="font-semibold">{data.urgency === 'high' ? '⚠️ OVERDUE CALLBACK!' : '📞 Time to Call!'}</p>
                                    <p className="text-sm text-gray-200">{data.lead_name}</p>
                                    <p className="text-xs text-gray-400 mt-1">{data.lead_phone}</p>
                                    {data.callback_notes && (
                                        <p className="text-xs text-gray-500 mt-1">📝 {data.callback_notes}</p>
                                    )}
                                </div>
                            </div>,
                            {
                                duration: 15000,
                                action: {
                                    label: 'Call Now',
                                    onClick: () => {
                                        window.location.href = `/calls?lead=${data.lead_id}`;
                                    }
                                }
                            }
                        );
                    }

                    if (data.type === 'CONNECTION_SUCCESS') {
                        toast.info('🔔 Live notifications enabled', { duration: 3000 });
                    }

                    if (data.type === 'HEARTBEAT') {
                        console.log('💓 Heartbeat received');
                    }
                };

                ws.current.onerror = (error) => {
                    console.error('❌ WebSocket error:', error);
                    setIsConnected(false);
                };

                ws.current.onclose = () => {
                    console.log('🔌 WebSocket disconnected');
                    setIsConnected(false);

                    // Attempt to reconnect with exponential backoff
                    if (reconnectAttempts.current < maxReconnectAttempts) {
                        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
                        reconnectTimeout.current = setTimeout(() => {
                            console.log(`🔄 Reconnecting... (attempt ${reconnectAttempts.current + 1})`);
                            reconnectAttempts.current++;
                            connectWebSocket();
                        }, delay);
                    }
                };

            } catch (error) {
                console.error('Failed to connect to WebSocket:', error);
                setIsConnected(false);
            }
        };

        // Initial connection
        connectWebSocket();

        // Cleanup
        return () => {
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
            }
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [effectiveAgentId]);

    const playNotificationSound = () => {
        try {
            const audio = new Audio('/sounds/notification.mp3');
            audio.volume = 0.7;
            audio.play().catch(err => {
                console.log('Could not play sound:', err);
            });
        } catch (error) {
            console.log('Audio not available:', error);
        }
    };

    return (
        <>
            {children}

            {/* Connection Status Indicator */}
            {effectiveAgentId && (
                <div className="fixed bottom-4 right-4 z-50">
                    <div className={`
                        px-3 py-2 rounded-full text-xs font-medium flex items-center gap-2
                        ${isConnected
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }
                    `}>
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                        {isConnected ? 'Live Alerts On' : 'Reconnecting...'}
                    </div>
                </div>
            )}
        </>
    );
}
