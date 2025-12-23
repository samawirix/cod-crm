'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Bell, Phone } from 'lucide-react';

interface NotificationProviderProps {
    children: React.ReactNode;
    agentId?: number;
}

export function NotificationProvider({ children, agentId }: NotificationProviderProps) {
    const ws = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const reconnectTimeout = useRef<NodeJS.Timeout>();

    useEffect(() => {
        if (!agentId) return;

        const connectWebSocket = () => {
            try {
                const wsUrl = `ws://localhost:8000/ws/notifications/${agentId}`;
                console.log('🔌 Connecting to WebSocket:', wsUrl);

                ws.current = new WebSocket(wsUrl);

                ws.current.onopen = () => {
                    console.log('✅ WebSocket connected');
                    setIsConnected(true);
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
                                    <p className="font-semibold">📞 Time to Call!</p>
                                    <p className="text-sm text-gray-400">{data.lead_name}</p>
                                    <p className="text-xs text-gray-500 mt-1">{data.lead_phone}</p>
                                </div>
                            </div>,
                            {
                                duration: 10000,
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

                    // Attempt to reconnect after 5 seconds
                    reconnectTimeout.current = setTimeout(() => {
                        console.log('🔄 Attempting to reconnect...');
                        connectWebSocket();
                    }, 5000);
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
    }, [agentId]);

    const playNotificationSound = () => {
        try {
            const audio = new Audio('/sounds/notification.mp3');
            audio.volume = 0.5;
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
            {agentId && (
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
