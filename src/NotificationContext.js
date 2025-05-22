import React, { createContext, useState, useCallback } from 'react';
import axiosInstance from './utils/axiosInstance';

export const NotificationContext = createContext({
    notificationCount: 0,
    updateNotificationCount: () => { }
});

export const NotificationProvider = ({ children }) => {
    const [notificationCount, setNotificationCount] = useState(0);

    const updateNotificationCount = useCallback(async (userid) => {
        if (!userid) return;
        try {
            console.log(`Fetching notification count for userid: ${userid}`);
            const response = await axiosInstance.get('/notification/count');
            const count = response.data.data.count || 0;
            setNotificationCount(count);
            console.log('Updated notification count:', count);
        } catch (error) {
            console.error('Error fetching notification count:', error);
        }
    }, []);

    return (
        <NotificationContext.Provider value={{ notificationCount, updateNotificationCount }}>
            {children}
        </NotificationContext.Provider>
    );
};