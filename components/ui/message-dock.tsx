"use client";

import { cn } from "@/lib/utils";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { getCartoonAvatar } from "@/utils/avatar";


export interface Character {
  id?: string | number;
  emoji: string;
  name: string;
  online: boolean;
  backgroundColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
  gradientColors?: string;
  avatar?: string; // Optional image URL
  isGroup?: boolean;
  category?: string;
  isOfficial?: boolean;
  price?: number;
  isPaid?: boolean;
  [key: string]: any;
}

export interface MessageDockProps {
  // Character data
  characters?: Character[];
  activeCharacterName?: string;
  
  // Event handlers
  onMessageSend?: (message: string, character: Character, characterIndex: number) => void;
  onCharacterSelect?: (character: Character | null, characterIndex: number) => void;
  onDockToggle?: (isExpanded: boolean) => void;
  onSparkleClick?: () => void;
  onMenuClick?: () => void;
  
  // Styling & layout
  className?: string;
  expandedWidth?: number;
  position?: "bottom" | "top";
  showSparkleButton?: boolean;
  showMenuButton?: boolean;
  
  // Animation settings
  enableAnimations?: boolean;
  animationDuration?: number;
  
  // UI customization
  placeholder?: (characterName: string) => string;
  theme?: "light" | "dark" | "auto";
  
  // Advanced settings
  autoFocus?: boolean;
  closeOnClickOutside?: boolean;
  closeOnEscape?: boolean;
  closeOnSend?: boolean;
}

const defaultCharacters: Character[] = [
  { emoji: "✨", name: "Sparkle", online: false },
  {
    emoji: "🧑‍💻",
    name: "Aarav (CS)",
    online: true,
    backgroundColor: "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400",
    gradientFrom: "from-emerald-900/50",
    gradientTo: "to-emerald-700/30",
    gradientColors: "#064e3b, #047857",
  },
  {
    emoji: "🎨",
    name: "Neha (Design)",
    online: true,
    backgroundColor: "bg-purple-500/10 border border-purple-500/20 text-purple-400",
    gradientFrom: "from-purple-900/50",
    gradientTo: "to-purple-700/30",
    gradientColors: "#581c87, #7c3aed",
  },
  {
    emoji: "📅",
    name: "Priya (Events)",
    online: true,
    backgroundColor: "bg-amber-500/10 border border-amber-500/20 text-amber-400",
    gradientFrom: "from-amber-900/50",
    gradientTo: "to-amber-700/30",
    gradientColors: "#78350f, #d97706",
  },
  {
    emoji: "🤖",
    name: "Campus Guide AI",
    online: true,
    backgroundColor: "bg-rose-500/10 border border-rose-500/20 text-rose-400",
    gradientFrom: "from-rose-900/50",
    gradientTo: "to-rose-700/30",
    gradientColors: "#881337, #e11d48",
  },
];

const getGradientColors = (character: Character) => {
  return character.gradientColors || "#86efac, #dcfce7";
};

const getCharacterAvatar = (character: Character) => {
  if (character.avatar) return character.avatar;
  // Use deterministic cartoon avatar — clean, consistent, matches site aesthetic
  const cleanName = character.name.replace(/\s*\(.*\)/, '').trim();
  return getCartoonAvatar(cleanName);
};

export function MessageDock({
  characters = defaultCharacters,
  activeCharacterName,
  onMessageSend,
  onCharacterSelect,
  onDockToggle,
  onSparkleClick,
  onMenuClick,
  className,
  expandedWidth = 448,
  position = "bottom",
  showSparkleButton = true,
  showMenuButton = true,
  enableAnimations = true,
  animationDuration = 1,
  placeholder = (name: string) => `Message ${name}...`,
  theme = "light",
  autoFocus = true,
  closeOnClickOutside = true,
  closeOnEscape = true,
  closeOnSend = true,
}: MessageDockProps) {
  const shouldReduceMotion = useReducedMotion();
  const [expandedCharacter, setExpandedCharacter] = useState<number | null>(
    null
  );
  const isExpanded = expandedCharacter !== null;
  const [messageInput, setMessageInput] = useState("");
  const dockRef = useRef<HTMLDivElement>(null);
  const [collapsedWidth, setCollapsedWidth] = useState<number>(266); // Default fallback
  const contentRef = useRef<HTMLDivElement>(null);

  // Measure the natural content width whenever characters change or on mount
  useEffect(() => {
    if (contentRef.current && !isExpanded) {
      // scrollWidth is the total width of all children including gaps
      // We add 34px for container padding (px-4 = 32px) and borders (2px)
      const width = contentRef.current.scrollWidth + 34;
      if (width > 34) {
        setCollapsedWidth(width);
      }
    }
  }, [characters, isExpanded]);


  // Keep track of the last synchronized active character to prevent auto-expanding on character array updates
  const lastActiveCharacterRef = useRef<string | null>(null);

  // Synchronize expandedCharacter state with activeCharacterName prop ONLY when it changes
  useEffect(() => {
    if (activeCharacterName !== lastActiveCharacterRef.current) {
      lastActiveCharacterRef.current = activeCharacterName || null;
      
      if (activeCharacterName) {
        const idx = characters.findIndex(c => c.name === activeCharacterName);
        if (idx !== -1) {
    // eslint-disable-next-line react-hooks/set-state-in-effect
          setExpandedCharacter(idx);
          onDockToggle?.(true);
        } else {
          setExpandedCharacter(null);
          onDockToggle?.(false);
        }
      } else {
        setExpandedCharacter(null);
        onDockToggle?.(false);
      }
    }
  }, [activeCharacterName, characters, onDockToggle]);

  // Click outside handler
  useEffect(() => {
    if (!closeOnClickOutside) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dockRef.current && !dockRef.current.contains(event.target as Node)) {
        onCharacterSelect?.(null, -1);
        setMessageInput("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [closeOnClickOutside, onCharacterSelect]);

  const containerVariants = {
    hidden: {
      opacity: 0,
      y: 100,
      scale: 0.8,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30,
        mass: 0.8,
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const hoverAnimation = shouldReduceMotion
    ? { scale: 1.02 }
    : {
        scale: 1.05,
        y: -8,
        transition: {
          type: "spring" as const,
          stiffness: 400,
          damping: 25,
        },
      };

  const handleCharacterClick = (index: number) => {
    const character = characters[index];
    
    if (expandedCharacter === index) {
      onCharacterSelect?.(null, -1);
      setMessageInput("");
      setExpandedCharacter(null);
      onDockToggle?.(false);
    } else {
      onCharacterSelect?.(character, index);
      setExpandedCharacter(index);
      onDockToggle?.(true);
    }
  };

  const handleSendMessage = () => {
    if (messageInput.trim() && expandedCharacter !== null) {
      const character = characters[expandedCharacter];
      
      // Call the onMessageSend callback
      onMessageSend?.(messageInput, character, expandedCharacter);
      
      setMessageInput("");
      
      if (closeOnSend) {
        onCharacterSelect?.(null, -1);
      }
    }
  };

  const handleSparkleClick = () => {
    onSparkleClick?.();
    const aiIndex = characters.length - 1;
    handleCharacterClick(aiIndex);
  };

  const handleMenuClick = () => {
    onMenuClick?.();
    if (isExpanded) {
      onCharacterSelect?.(null, -1);
      setMessageInput("");
    } else {
      handleCharacterClick(1);
    }
  };

  const selectedCharacter =
    expandedCharacter !== null ? characters[expandedCharacter] : null;

  const positionClasses = position === "top" 
    ? "fixed top-6 left-1/2 -translate-x-1/2 z-50"
    : "fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50";

  return (
    <motion.div
      ref={dockRef}
      className={cn(positionClasses, className)}
      initial={enableAnimations ? "hidden" : "visible"}
      animate="visible"
      variants={enableAnimations ? containerVariants : {}}
    >
      <motion.div
        className="rounded-full px-4 py-2 shadow-2xl border border-[var(--border-subtle)] backdrop-blur-xl max-w-[calc(100vw-32px)]"
        animate={{
          width: isExpanded ? expandedWidth : collapsedWidth,
          background: isExpanded && selectedCharacter
            ? "var(--bg-elevated)"
            : "var(--bg-overlay)",
          boxShadow: isExpanded && selectedCharacter
            ? `0 12px 40px -10px ${selectedCharacter.gradientColors?.split(',')[0] || 'var(--border-subtle)'}44`
            : "0 12px 40px -12px rgba(0,0,0,0.15)",
        }}
        transition={enableAnimations ? { 
          type: "spring" as const, 
          stiffness: isExpanded ? 300 : 500, 
          damping: isExpanded ? 30 : 35, 
          mass: isExpanded ? 0.8 : 0.6,
          background: {
            duration: 0.2 * animationDuration,
            ease: "easeInOut"
          }
        } : { duration: 0 }}
      >
        <div ref={contentRef} className="flex items-center gap-2 relative w-full">
          {/* Sparkle or Back button */}
          <motion.div className="flex items-center justify-center z-20 flex-shrink-0">
            <AnimatePresence mode="wait">
              {!isExpanded && showSparkleButton ? (
                <motion.button
                  key="sparkle"
                  className="w-12 h-12 flex items-center justify-center cursor-pointer"
                  onClick={handleSparkleClick}
                  whileHover={{ scale: 1.02, y: -2, transition: { type: "spring", stiffness: 400, damping: 25 } }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Sparkle"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5, x: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" />
                  </svg>
                </motion.button>
              ) : isExpanded ? (
                <motion.button
                  key="back"
                  className="w-10 h-10 flex items-center justify-center cursor-pointer rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  onClick={() => {
                     setExpandedCharacter(null);
                     setMessageInput("");
                     onDockToggle?.(false);
                     onCharacterSelect?.(null, -1);
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  aria-label="Close"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-primary)]">
                    <path d="m15 18-6-6 6-6"/>
                  </svg>
                </motion.button>
              ) : null}
            </AnimatePresence>
          </motion.div>
 
          {/* First separator */}
          {!isExpanded && (
            <div className="w-px h-6 bg-[var(--border-subtle)] mr-2 -ml-2 flex-shrink-0" />
          )}

          {/* Character buttons */}
          {characters.slice(1, -1).map((character, index) => {
            const actualIndex = index + 1;
            const isSelected = expandedCharacter === actualIndex;

            if (isExpanded && !isSelected) return null;

            return (
              <motion.div
                key={character.name}
                className="relative flex-shrink-0"
                style={{
                  overflow: "visible",
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  x: 0,
                }}
                transition={{
                  type: "spring" as const,
                  stiffness: 400,
                  damping: 30,
                }}
              >
                <motion.button
                  className={cn(
                    "relative w-10 h-10 rounded-full flex items-center justify-center text-xl cursor-pointer",
                    isSelected && isExpanded
                      ? "bg-white/90"
                      : character.backgroundColor
                  )}
                  onClick={() => handleCharacterClick(actualIndex)}
                  whileHover={!isExpanded ? hoverAnimation : { scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={`Message ${character.name}`}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
                    <img 
                      src={getCharacterAvatar(character)} 
                      alt={character.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Online indicator */}
                  {character.online && (
                    <motion.div
                      className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                </motion.button>
              </motion.div>
            );
          })}

          {/* Text input - slides out from center */}
          <AnimatePresence>
            {isExpanded && (
              <motion.input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSendMessage();
                  }
                  if (e.key === "Escape" && closeOnEscape) {
                    setExpandedCharacter(null);
                    setMessageInput("");
                    onDockToggle?.(false);
                  }
                }}
                placeholder={placeholder(selectedCharacter?.name || "")}
                className="flex-grow mx-2 bg-transparent border-none outline-none text-sm font-medium text-white placeholder-neutral-500 min-w-0"
                autoFocus={autoFocus}
                initial={{ opacity: 0, x: 20 }}
                animate={{ 
                  opacity: 1, 
                  x: 0,
                  transition: {
                    delay: 0.2,
                    type: "spring" as const,
                    stiffness: 400,
                    damping: 30,
                  }
                }}
                exit={{ 
                  opacity: 0,
                  transition: {
                    duration: 0.1,
                    ease: "easeOut"
                  }
                }}
              />
            )}
          </AnimatePresence>

          {/* Second separator */}
          {!isExpanded && (
            <div className="w-px h-6 bg-white/10 ml-2 -mr-2 flex-shrink-0" />
          )}

          {/* Menu button / Send button - transforms in place */}
          {showMenuButton && (
            <motion.div
              className="flex items-center justify-center z-20 flex-shrink-0"
              transition={{ type: "spring" as const, stiffness: 400, damping: 30 }}
            >
              <AnimatePresence mode="wait">
                {!isExpanded ? (
                <motion.button
                  key="menu"
                  className="w-12 h-12 flex items-center justify-center cursor-pointer"
                  onClick={handleMenuClick}
                  whileHover={{
                    scale: 1.02,
                    y: -2,
                    transition: {
                      type: "spring",
                      stiffness: 400,
                      damping: 25,
                    },
                  }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Menu"
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ type: "spring" as const, stiffness: 400, damping: 30 }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-neutral-400 hover:text-white transition-colors"
                  >
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </motion.button>
                ) : (
                <motion.button
                  key="send"
                  onClick={handleSendMessage}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/90 hover:bg-white transition-colors disabled:opacity-50 cursor-pointer relative z-30"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={!messageInput.trim()}
                  initial={{ opacity: 0, scale: 0, rotate: -90 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1, 
                    rotate: 0,
                    transition: {
                      delay: 0.25,
                      type: "spring" as const,
                      stiffness: 400,
                      damping: 30,
                    }
                  }}
                  exit={{ 
                    opacity: 0, 
                    scale: 0, 
                    rotate: 90,
                    transition: {
                      duration: 0.1,
                      ease: "easeIn"
                    }
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-neutral-800"
                  >
                    <path d="m22 2-7 20-4-9-9-4z" />
                    <path d="M22 2 11 13" />
                  </svg>
                </motion.button>
              )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
