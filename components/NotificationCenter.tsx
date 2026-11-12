'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Bell, X, Check, Trash2, ShieldAlert, Trophy, CreditCard, CalendarCheck, Zap, Star, Flame, AlertCircle } from 'lucide-react';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, clearAllNotifications } from '../app/actions/notifications';
import { triggerHaptic } from '../lib/haptics';
import { useLanguage } from '../lib/i18n';

const emptySubscribe = () => () => {};

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
}

export default function NotificationCenter() {
  const { lang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      // Map to correct Date object
      const formatted = data.map(n => ({
        ...n,
        createdAt: new Date(n.createdAt)
      }));
      setNotifications(formatted);
      setUnreadCount(formatted.filter(n => !n.isRead).length);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotifications();
    }, 100);
    // Poll notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleMarkAsRead = async (id: string) => {
    try {
      triggerHaptic('light');
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      triggerHaptic('success');
      setLoading(true);
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    try {
      triggerHaptic('medium');
      setLoading(true);
      await clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
      setConfirmClear(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    const iconClass = "w-4 h-4 stroke-[2.5px] text-black";
    switch (type) {
      case 'BUDGET_ALERT':
        return <div className="p-1.5 bg-[#fecaca] border-2 border-black dark:border-neutral-700 rounded-lg shadow-[1px_1px_0px_0px_#000]"><ShieldAlert className={iconClass} /></div>;
      case 'GOAL_REACHED':
        return <div className="p-1.5 bg-[#fef08a] border-2 border-black dark:border-neutral-700 rounded-lg shadow-[1px_1px_0px_0px_#000]"><Trophy className={iconClass} /></div>;
      case 'PAYLATER_DUE':
      case 'DEBT_DUE':
        return <div className="p-1.5 bg-[#fed7aa] border-2 border-black dark:border-neutral-700 rounded-lg shadow-[1px_1px_0px_0px_#000]"><CreditCard className={iconClass} /></div>;
      case 'SUBSCRIPTION_DUE':
        return <div className="p-1.5 bg-[#dbeafe] border-2 border-black dark:border-neutral-700 rounded-lg shadow-[1px_1px_0px_0px_#000]"><CalendarCheck className={iconClass} /></div>;
      case 'TRIAL_WARNING':
        return <div className="p-1.5 bg-[#f5d0fe] border-2 border-black dark:border-neutral-700 rounded-lg shadow-[1px_1px_0px_0px_#000]"><Zap className={iconClass} /></div>;
      case 'PAYMENT_APPROVED':
        return <div className="p-1.5 bg-[#bbf7d0] border-2 border-black dark:border-neutral-700 rounded-lg shadow-[1px_1px_0px_0px_#000]"><Check className={iconClass} /></div>;
      case 'PAYMENT_REJECTED':
        return <div className="p-1.5 bg-[#fca5a5] border-2 border-black dark:border-neutral-700 rounded-lg shadow-[1px_1px_0px_0px_#000]"><X className={iconClass} /></div>;
      case 'ACHIEVEMENT':
        return <div className="p-1.5 bg-[#e9d5ff] border-2 border-black dark:border-neutral-700 rounded-lg shadow-[1px_1px_0px_0px_#000]"><Star className={iconClass} /></div>;
      case 'STREAK':
        return <div className="p-1.5 bg-[#fed7aa] border-2 border-black dark:border-neutral-700 rounded-lg shadow-[1px_1px_0px_0px_#000]"><Flame className={iconClass} /></div>;
      default:
        return <div className="p-1.5 bg-[#e5e7eb] border-2 border-black dark:border-neutral-700 rounded-lg shadow-[1px_1px_0px_0px_#000]"><AlertCircle className={iconClass} /></div>;
    }
  };

  return (
    <>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => {
          triggerHaptic('light');
          setIsOpen(true);
          setConfirmClear(false);
          fetchNotifications();
        }}
        className="relative h-9 sm:h-10 w-9 sm:w-10 border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-none shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer flex items-center justify-center text-black dark:text-white shrink-0"
      >
        <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5px]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-[#ff6b6b] text-white text-[9px] font-black border-2 border-black px-1.5 py-0.2 rounded-full shadow-[1px_1px_0px_0px_#000]">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Slide-out Sidebar Drawer Overlay */}
      {isOpen && mounted && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 overflow-hidden select-none">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <div className="w-screen max-w-md bg-[#FAF9F5] dark:bg-neutral-900 border-l-2 border-black dark:border-neutral-700 shadow-2xl flex flex-col h-full transform transition-transform duration-300 ease-out translate-x-0 text-black dark:text-white">
              
              {/* Header */}
              <div className="p-4 sm:p-5 border-b-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-900 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-black uppercase tracking-wider">
                    {lang === 'en' ? 'Notifications' : 'Notifikasi'}
                  </span>
                  {unreadCount > 0 && (
                    <span
                      className="text-black text-[10px] font-black border-2 border-black px-2 py-0.5 rounded-full shadow-[1px_1px_0px_0px_#000]"
                      style={{ backgroundColor: 'var(--theme-accent, #FFE066)' }}
                    >
                      {unreadCount} {lang === 'en' ? 'New' : 'Baru'}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="min-w-[44px] min-h-[44px] p-1.5 border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-none shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer flex items-center justify-center"
                >
                  <X className="w-4 h-4 stroke-[2.5px]" />
                </button>
              </div>

              {/* Actions toolbar */}
              {notifications.length > 0 && (
                <div className="px-4 sm:px-5 py-2.5 border-b-2 border-black dark:border-neutral-700 bg-white/70 dark:bg-neutral-800/70 flex justify-between gap-2 items-center">
                  {confirmClear ? (
                    <div className="w-full flex items-center justify-between gap-2 animate-in fade-in">
                      <span className="text-[10px] font-black uppercase text-red-600 dark:text-red-400">
                        {lang === 'en' ? 'Clear all notifications?' : 'Hapus semua notifikasi?'}
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setConfirmClear(false)}
                          className="px-2.5 py-1 border-2 border-black dark:border-neutral-700 bg-neutral-200 dark:bg-neutral-700 text-black dark:text-white text-[10px] font-black uppercase rounded-lg shadow-[1px_1px_0px_0px_#000] cursor-pointer"
                        >
                          {lang === 'en' ? 'Cancel' : 'Batal'}
                        </button>
                        <button
                          type="button"
                          onClick={handleClearAll}
                          disabled={loading}
                          className="px-2.5 py-1 border-2 border-black dark:border-neutral-700 bg-red-500 text-white text-[10px] font-black uppercase rounded-lg shadow-[1px_1px_0px_0px_#000] cursor-pointer disabled:opacity-50"
                        >
                          {lang === 'en' ? 'Yes, Clear' : 'Ya, Hapus'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleMarkAllAsRead}
                        disabled={loading || unreadCount === 0}
                        className="flex-1 py-1.5 px-2 border-2 border-black dark:border-neutral-700 rounded-xl bg-[#bbf7d0] dark:bg-emerald-950/80 hover:bg-[#a6ecbd] dark:hover:bg-emerald-900 text-black dark:text-emerald-200 text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {lang === 'en' ? 'Mark All Read' : 'Tandai Semua Dibaca'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setConfirmClear(true);
                        }}
                        disabled={loading}
                        className="py-1.5 px-3 border-2 border-black dark:border-neutral-700 rounded-xl bg-red-100 dark:bg-red-950/80 hover:bg-red-200 dark:hover:bg-red-900 text-red-700 dark:text-red-300 text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{lang === 'en' ? 'Clear' : 'Hapus'}</span>
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <div className="w-16 h-16 border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-2xl flex items-center justify-center mb-4 shadow-[4px_4px_0px_0px_#000]">
                      <Bell className="w-8 h-8 text-neutral-300 dark:text-neutral-600 stroke-[2px]" />
                    </div>
                    <p className="text-sm font-black uppercase tracking-wider">
                      {lang === 'en' ? 'No notifications yet' : 'Belum ada notifikasi'}
                    </p>
                    <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mt-1">
                      {lang === 'en' ? 'All your finances are looking good!' : 'Semua kabar keuangan Anda terpantau aman!'}
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`relative border-2 border-black dark:border-neutral-700 rounded-2xl p-4 shadow-[3px_3px_0px_0px_#000] transition-all flex gap-3 ${
                        notif.isRead 
                          ? 'bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200' 
                          : 'bg-[#faf5d9] dark:bg-neutral-750 text-black dark:text-white font-semibold'
                      }`}
                    >
                      {/* Left icon wrapper */}
                      <div className="flex-shrink-0 mt-0.5">
                        {getIcon(notif.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-grow min-w-0 pr-6">
                        <p className={`text-xs font-black uppercase tracking-wider ${notif.isRead ? 'text-neutral-900 dark:text-neutral-100' : 'text-black dark:text-white'}`}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 font-bold uppercase tracking-wide mt-1 leading-relaxed">
                          {notif.body}
                        </p>
                        <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest mt-2">
                          {notif.createdAt.toLocaleDateString(lang === 'en' ? 'en-US' : 'id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>

                      {/* Mark as read tick action button */}
                      {!notif.isRead && (
                        <button
                          type="button"
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="absolute top-3 right-3 p-1 border-2 border-black dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-lg shadow-[1px_1px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer flex items-center justify-center"
                          title={lang === 'en' ? 'Mark as read' : 'Tandai sudah dibaca'}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3px]" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
