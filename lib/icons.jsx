'use client';
import React from 'react';

/**
 * Universal Remix Icon shim — drop-in replacement for lucide-react.
 * Usage: just change  rom 'lucide-react'  →  rom '@/lib/icons'
 * All icons accept the same props: size, className, strokeWidth (ignored), style
 */
const ri = (lineClass, fillClass) => {
  const Comp = ({ size, className = '', strokeWidth, fill, style, ...rest }) => {
    const useFill = fillClass && (fill || (typeof className === 'string' && className.includes('fill-')));

    let computedSize = size;
    if (!computedSize && typeof className === 'string') {
      const match = className.match(/\b(?:w|h)-(\d+(\.\d+)?)\b/);
      if (match) {
        computedSize = parseFloat(match[1]) * 4;
      }
    }
    if (!computedSize) computedSize = 20;

    return (
      <i
        className={`${useFill ? fillClass : lineClass} ${className}`.trim()}
        style={{
          fontSize: computedSize,
          width: computedSize,
          height: computedSize,
          lineHeight: 1,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          ...style,
        }}
        aria-hidden="true"
        {...rest}
      />
    );
  };
  Comp.displayName = lineClass;
  return Comp;
};

/* ─── Navigation ──────────────────────────────────────── */
export const Home            = ri('ri-home-5-line',            'ri-home-5-fill');
export const Search          = ri('ri-search-line',            'ri-search-fill');
export const Compass         = ri('ri-compass-3-line',         'ri-compass-3-fill');
export const Bell            = ri('ri-notification-3-line',    'ri-notification-3-fill');
export const MessageSquare   = ri('ri-chat-3-line',            'ri-chat-3-fill');
export const MessageCircle   = ri('ri-message-3-line',         'ri-message-3-fill');
export const Calendar        = ri('ri-calendar-schedule-line', 'ri-calendar-schedule-fill');
export const CalendarDays    = ri('ri-calendar-event-line',    'ri-calendar-event-fill');
export const Wallet          = ri('ri-wallet-3-line',          'ri-wallet-3-fill');
export const Shield          = ri('ri-shield-star-line',       'ri-shield-star-fill');
export const ShieldCheck     = ri('ri-shield-check-line',      'ri-shield-check-fill');
export const ShieldAlert     = ri('ri-shield-cross-line',      'ri-shield-cross-fill');

/* ─── User ─────────────────────────────────────────────── */
export const User            = ri('ri-user-3-line',            'ri-user-3-fill');
export const Users           = ri('ri-group-3-line',           'ri-group-3-fill');
export const UserCheck       = ri('ri-user-follow-line',       'ri-user-follow-fill');
export const LogIn           = ri('ri-login-circle-line',      'ri-login-circle-fill');
export const LogOut          = ri('ri-logout-circle-line',     'ri-logout-circle-fill');

/* ─── Actions ──────────────────────────────────────────── */
export const Plus            = ri('ri-add-line',               'ri-add-fill');
export const X               = ri('ri-close-line',             'ri-close-circle-fill');
export const Check           = ri('ri-check-line',             'ri-check-fill');
export const CheckCircle     = ri('ri-checkbox-circle-line',   'ri-checkbox-circle-fill');
export const CheckCircle2    = ri('ri-checkbox-circle-line',   'ri-checkbox-circle-fill');
export const XCircle         = ri('ri-close-circle-line',      'ri-close-circle-fill');
export const Trash2          = ri('ri-delete-bin-6-line',      'ri-delete-bin-6-fill');
export const Edit            = ri('ri-edit-2-line',            'ri-edit-2-fill');
export const Edit2           = ri('ri-edit-2-line',            'ri-edit-2-fill');
export const PenLine         = ri('ri-edit-line',              'ri-edit-fill');
export const Copy            = ri('ri-file-copy-line',         'ri-file-copy-fill');
export const Send            = ri('ri-send-plane-line',        'ri-send-plane-fill');
export const Share2          = ri('ri-share-forward-line',     'ri-share-forward-fill');
export const Download        = ri('ri-download-line',          'ri-download-fill');
export const Upload          = ri('ri-upload-line',            'ri-upload-fill');
export const RefreshCw       = ri('ri-refresh-line',           'ri-refresh-fill');
export const Loader2         = ri('ri-loader-4-line',          'ri-loader-4-line');
export const Filter          = ri('ri-filter-3-line',          'ri-filter-3-fill');
export const ExternalLink    = ri('ri-external-link-line',     'ri-external-link-fill');
export const ArrowLeft       = ri('ri-arrow-left-line',        'ri-arrow-left-fill');
export const ArrowRight      = ri('ri-arrow-right-line',       'ri-arrow-right-fill');
export const ArrowUp         = ri('ri-arrow-up-line',          'ri-arrow-up-fill');
export const ArrowUpRight    = ri('ri-arrow-up-right-line',    'ri-arrow-up-right-fill');
export const ChevronDown     = ri('ri-arrow-down-s-line',      'ri-arrow-down-s-fill');
export const ChevronUp       = ri('ri-arrow-up-s-line',        'ri-arrow-up-s-fill');
export const ChevronRight    = ri('ri-arrow-right-s-line',     'ri-arrow-right-s-fill');
export const ChevronLeft     = ri('ri-arrow-left-s-line',      'ri-arrow-left-s-fill');
export const MoreHorizontal  = ri('ri-more-2-fill',            'ri-more-2-fill');

/* ─── Content ──────────────────────────────────────────── */
export const Heart           = ri('ri-heart-3-line',           'ri-heart-3-fill');
export const Sparkles        = ri('ri-sparkling-2-line',       'ri-sparkling-2-fill');
export const Zap             = ri('ri-flashlight-line',        'ri-flashlight-fill');
export const Star            = ri('ri-star-line',              'ri-star-fill');
export const Award           = ri('ri-award-line',             'ri-award-fill');
export const Camera          = ri('ri-camera-line',            'ri-camera-fill');
export const MapPin          = ri('ri-map-pin-2-line',         'ri-map-pin-2-fill');
export const Bookmark        = ri('ri-bookmark-3-line',        'ri-bookmark-3-fill');
export const Tag             = ri('ri-price-tag-3-line',       'ri-price-tag-3-fill');
export const Image           = ri('ri-image-2-line',           'ri-image-2-fill');
export const Video           = ri('ri-video-line',             'ri-video-fill');
export const Music           = ri('ri-music-2-line',           'ri-music-2-fill');
export const Mic             = ri('ri-mic-line',               'ri-mic-fill');
export const Globe           = ri('ri-global-line',            'ri-global-fill');
export const Link            = ri('ri-link',                   'ri-link');
export const Radio           = ri('ri-radio-line',             'ri-radio-fill');
export const Phone           = ri('ri-phone-line',             'ri-phone-fill');
export const Mail            = ri('ri-mail-line',              'ri-mail-fill');

/* ─── Info / Status ────────────────────────────────────── */
export const Info            = ri('ri-information-line',       'ri-information-fill');
export const HelpCircle      = ri('ri-question-line',          'ri-question-fill');
export const AlertCircle     = ri('ri-error-warning-line',     'ri-error-warning-fill');
export const AlertTriangle   = ri('ri-alert-line',             'ri-alert-fill');
export const Ban             = ri('ri-forbid-2-line',          'ri-forbid-2-fill');
export const WifiOff         = ri('ri-wifi-off-line',          'ri-wifi-off-fill');
export const Clock           = ri('ri-time-line',              'ri-time-fill');
export const Hourglass       = ri('ri-hourglass-line',         'ri-hourglass-fill');
export const Eye             = ri('ri-eye-line',               'ri-eye-fill');
export const EyeOff          = ri('ri-eye-off-line',           'ri-eye-off-fill');
export const Lock            = ri('ri-lock-line',              'ri-lock-fill');
export const Unlock          = ri('ri-lock-unlock-line',       'ri-lock-unlock-fill');

/* ─── Layout / UI ──────────────────────────────────────── */
export const LayoutDashboard = ri('ri-layout-grid-line',       'ri-layout-grid-fill');
export const PanelLeftClose  = ri('ri-layout-left-line',       'ri-layout-left-fill');
export const PanelLeftOpen   = ri('ri-layout-left-2-line',     'ri-layout-left-2-fill');
export const Settings        = ri('ri-settings-3-line',        'ri-settings-3-fill');
export const CreditCard      = ri('ri-bank-card-line',         'ri-bank-card-fill');
export const Briefcase       = ri('ri-briefcase-4-line',       'ri-briefcase-4-fill');
export const BookOpen        = ri('ri-book-open-line',         'ri-book-open-fill');
export const FileText        = ri('ri-file-text-line',         'ri-file-text-fill');
export const Folder          = ri('ri-folder-line',            'ri-folder-fill');
export const Database        = ri('ri-database-2-line',        'ri-database-2-fill');
export const Layers          = ri('ri-stack-line',             'ri-stack-fill');

/* ─── Academic / Campus ────────────────────────────────── */
export const GraduationCap   = ri('ri-graduation-cap-line',    'ri-graduation-cap-fill');
export const Building2       = ri('ri-building-4-line',        'ri-building-4-fill');
export const Trophy          = ri('ri-trophy-line',            'ri-trophy-fill');
export const Palette         = ri('ri-palette-line',           'ri-palette-fill');
export const Code            = ri('ri-code-s-slash-line',      'ri-code-s-slash-fill');

/* ─── Misc ─────────────────────────────────────────────── */
export const Crown           = ri('ri-vip-crown-line',         'ri-vip-crown-fill');
export const AtSign          = ri('ri-at-line',                'ri-at-fill');
export const Gift            = ri('ri-gift-2-line',            'ri-gift-2-fill');
export const Flag            = ri('ri-flag-line',              'ri-flag-fill');
export const ShieldStar      = ri('ri-shield-star-line',       'ri-shield-star-fill');

/* ─── Missing / Extra ──────────────────────────────────── */
export const Activity        = ri('ri-pulse-line',              'ri-pulse-fill');
export const AlertOctagon    = ri('ri-alert-line',              'ri-alert-fill');
export const Apple           = ri('ri-apple-line',              'ri-apple-fill');
export const ArrowDown       = ri('ri-arrow-down-line',         'ri-arrow-down-fill');
export const CheckCheck      = ri('ri-check-double-line',       'ri-check-double-fill');
export const Code2           = ri('ri-code-s-slash-line',       'ri-code-s-slash-fill');
export const Coffee          = ri('ri-cup-line',                'ri-cup-fill');
export const Dumbbell        = ri('ri-boxing-line',             'ri-boxing-fill');
export const Edit3           = ri('ri-edit-line',               'ri-edit-fill');
export const Gamepad2        = ri('ri-gamepad-line',            'ri-gamepad-fill');
export const Inbox           = ri('ri-inbox-line',              'ri-inbox-fill');
export const Laptop          = ri('ri-computer-line',           'ri-computer-fill');
export const MicOff          = ri('ri-mic-off-line',            'ri-mic-off-fill');
export const MoreVertical    = ri('ri-more-fill',               'ri-more-fill');
export const Music2          = ri('ri-music-2-line',            'ri-music-2-fill');
export const PhoneOff        = ri('ri-phone-off-line',          'ri-phone-off-fill');
export const QrCode          = ri('ri-qr-code-line',            'ri-qr-code-fill');
export const Rocket          = ri('ri-rocket-line',             'ri-rocket-fill');
export const Save            = ri('ri-save-line',               'ri-save-fill');
export const Share           = ri('ri-share-line',              'ri-share-fill');
export const SlidersHorizontal = ri('ri-equalizer-line',        'ri-equalizer-fill');
export const Smartphone      = ri('ri-smartphone-line',         'ri-smartphone-fill');
export const Smile           = ri('ri-emotion-line',            'ri-emotion-fill');
export const SquarePen       = ri('ri-edit-box-line',           'ri-edit-box-fill');
export const Volume1         = ri('ri-volume-down-line',        'ri-volume-down-fill');
export const Volume2         = ri('ri-volume-up-line',          'ri-volume-up-fill');
export const LayoutGrid      = ri('ri-layout-grid-line',        'ri-layout-grid-fill');
export const List            = ri('ri-list-unordered',          'ri-list-check');
export const TrendingUp      = ri('ri-trending-up-line',        'ri-trending-up-fill');
export const BarChart2       = ri('ri-bar-chart-2-line',        'ri-bar-chart-2-fill');

