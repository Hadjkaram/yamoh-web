"use client";

import { useEffect, useState } from "react";
import { Bell, BellDot } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const unreadCount = notifications.filter(n => !n.lu).length;

  useEffect(() => {
    // 1. Charger les notifications existantes
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);
      if (data) setNotifications(data);
    };

    fetchNotifications();

    // 2. ÉCOUTER EN TEMPS RÉEL (Realtime)
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
          // Optionnel : Jouer un petit son ici
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const markAsRead = async () => {
    await supabase.from('notifications').update({ lu: true }).eq('user_id', userId);
    setNotifications(notifications.map(n => ({ ...n, lu: true })));
  };

  return (
    <div className="relative">
      <button 
        onClick={() => { setShowDropdown(!showDropdown); if(!showDropdown) markAsRead(); }}
        className="p-2 rounded-full hover:bg-gray-100 transition cursor-pointer relative"
      >
        {unreadCount > 0 ? <BellDot className="text-yamo-orange" /> : <Bell className="text-gray-600" />}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          <div className="p-4 border-b border-gray-50 font-bold text-yamo-teal">Notifications</div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-gray-400 text-center">Aucune notification</p>
            ) : (
              notifications.map(n => (
                <div key={n.id} className={`p-4 border-b border-gray-50 text-sm ${!n.lu ? 'bg-orange-50/50' : ''}`}>
                  <p className="font-bold text-gray-800">{n.titre}</p>
                  <p className="text-gray-600">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}