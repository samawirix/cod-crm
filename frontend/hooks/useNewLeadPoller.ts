import { useEffect, useRef, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';

interface NewLeadInfo {
    id: number;
    first_name: string;
    last_name?: string;
    city?: string;
}

interface UseNewLeadPollerOptions {
    interval?: number; // Polling interval in ms (default: 30000)
    enabled?: boolean; // Enable/disable polling
    onNewLead?: (lead: NewLeadInfo) => void; // Callback when new lead detected
    playSound?: boolean; // Play notification sound
}

interface UseNewLeadPollerReturn {
    leadCount: number;
    newLeadsCount: number; // Number of new leads since last check
    lastCheck: Date | null;
    isPolling: boolean;
    error: string | null;
    checkNow: () => Promise<void>;
}

const STORAGE_KEY = 'cod_crm_last_lead_count';
const SOUND_URL = '/sounds/notification.mp3';

export function useNewLeadPoller({
    interval = 30000,
    enabled = true,
    onNewLead,
    playSound = true,
}: UseNewLeadPollerOptions = {}): UseNewLeadPollerReturn {
    const [leadCount, setLeadCount] = useState<number>(0);
    const [newLeadsCount, setNewLeadsCount] = useState<number>(0);
    const [lastCheck, setLastCheck] = useState<Date | null>(null);
    const [isPolling, setIsPolling] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const lastCountRef = useRef<number | null>(null);

    // Initialize audio element
    useEffect(() => {
        if (typeof window !== 'undefined' && playSound) {
            audioRef.current = new Audio(SOUND_URL);
            audioRef.current.volume = 0.5;
        }

        // Load last count from localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            lastCountRef.current = parseInt(stored, 10);
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [playSound]);

    const playNotificationSound = useCallback(() => {
        if (audioRef.current && playSound) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch((e) => {
                console.warn('Could not play notification sound:', e);
            });
        }
    }, [playSound]);

    const checkForNewLeads = useCallback(async () => {
        if (!enabled) return;

        setIsPolling(true);
        setError(null);

        try {
            // Fetch recent leads to get count and latest lead info
            const response = await apiClient.get('/api/v1/leads/', {
                params: { limit: 5, skip: 0 }
            });

            const currentCount = response.data.total || 0;
            const leads = response.data.leads || [];

            setLeadCount(currentCount);
            setLastCheck(new Date());

            // Check if we have new leads
            if (lastCountRef.current !== null && currentCount > lastCountRef.current) {
                const newCount = currentCount - lastCountRef.current;
                setNewLeadsCount(newCount);

                // Play sound
                playNotificationSound();

                // Call callback with latest lead info
                if (onNewLead && leads.length > 0) {
                    const latestLead = leads[0];
                    onNewLead({
                        id: latestLead.id,
                        first_name: latestLead.first_name,
                        last_name: latestLead.last_name,
                        city: latestLead.city,
                    });
                }

                console.log(`🔔 New leads detected! Count increased from ${lastCountRef.current} to ${currentCount}`);
            }

            // Update stored count
            lastCountRef.current = currentCount;
            localStorage.setItem(STORAGE_KEY, currentCount.toString());

        } catch (err: any) {
            console.error('Lead polling error:', err);
            setError(err.message || 'Failed to check for new leads');
        } finally {
            setIsPolling(false);
        }
    }, [enabled, onNewLead, playNotificationSound]);

    // Set up polling interval
    useEffect(() => {
        if (!enabled) return;

        // Initial check
        checkForNewLeads();

        // Set up interval
        const intervalId = setInterval(checkForNewLeads, interval);

        return () => {
            clearInterval(intervalId);
        };
    }, [enabled, interval, checkForNewLeads]);

    return {
        leadCount,
        newLeadsCount,
        lastCheck,
        isPolling,
        error,
        checkNow: checkForNewLeads,
    };
}
