import { useState, useEffect } from 'react';
import echo from '../config/echo';
import api from '../api/client';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState(null);

  // Charger l'utilisateur
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('auth_user'));
        setUser(userData);
      } catch (error) {
        console.error('Erreur chargement utilisateur:', error);
      }
    };
    fetchUser();
  }, []);

  // Charger les notifications initiales
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const response = await api.get('/notifications');
        setNotifications(response.data.data || []);
        setUnreadCount(response.data.data?.filter(n => !n.read_at).length || 0);
      } catch (error) {
        console.error('Erreur chargement notifications:', error);
      }
    };

    fetchNotifications();
  }, [user]);

  // 🔴 ÉCOUTE TEMPS RÉEL
  useEffect(() => {
    if (!user) return;

    // Écouter selon le rôle de l'utilisateur
    let channel = null;

    if (user.role === 'doctor') {
      channel = echo.private(`doctor.${user.id}`);
    } else if (user.role === 'patient') {
      channel = echo.private(`patient.${user.id}`);
    } else if (user.role === 'secretary') {
      channel = echo.private('secretaries');
    } else if (user.role === 'admin') {
      channel = echo.private('admins');
    }

    if (!channel) return;

    // 🔴 NOUVEAU RDV CRÉÉ
    channel.listen('.appointment.created', (data) => {
      console.log('🆕 Nouveau RDV:', data);
      
      // Ajouter la notification
      const newNotification = {
        id: Date.now(),
        type: 'appointment_created',
        message: data.message,
        data: data,
        created_at: new Date().toISOString(),
        read_at: null,
      };

      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Jouer un son
      try {
        new Audio('/notification.mp3').play();
      } catch (error) {
        console.log('Son de notification non disponible');
      }
    });

    // 🔴 STATUT CHANGÉ
    channel.listen('.appointment.status.changed', (data) => {
      console.log('🔄 Statut changé:', data);
      
      const newNotification = {
        id: Date.now(),
        type: 'appointment_status_changed',
        message: data.message,
        data: data,
        created_at: new Date().toISOString(),
        read_at: null,
      };

      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    // 🔴 PATIENT ARRIVÉ
    channel.listen('.patient.arrived', (data) => {
      console.log('👤 Patient arrivé:', data);
      
      const newNotification = {
        id: Date.now(),
        type: 'patient_arrived',
        message: data.message,
        data: data,
        created_at: new Date().toISOString(),
        read_at: null,
      };

      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    // 🔴 ACTIVITÉ GLOBALE (admins)
    if (user.role === 'admin') {
      channel.listen('.activity.created', (data) => {
        console.log('🔔 Activité:', data);
        
        const newNotification = {
          id: Date.now(),
          type: 'global_activity',
          message: data.message,
          data: data,
          created_at: new Date().toISOString(),
          read_at: null,
        };

        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
      });
    }

    // Cleanup
    return () => {
      if (channel) {
        echo.leave(channel.name);
      }
    };
  }, [user]);

  const markAsRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erreur marquer comme lu:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Erreur marquer tout comme lu:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notifications.find(n => n.id === id)?.read_at === null) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Erreur suppression notification:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    user,
  };
};
