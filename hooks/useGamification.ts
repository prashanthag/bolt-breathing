import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress: number;
  target: number;
  category: 'streaks' | 'sessions' | 'time' | 'social' | 'mastery';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface UserStats {
  level: number;
  xp: number;
  xpToNext: number;
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  breathingMastery: number;
  socialPoints: number;
  achievements: Achievement[];
}

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_breath',
    title: 'First Breath',
    description: 'Complete your first breathing session',
    icon: '🌱',
    progress: 0,
    target: 1,
    category: 'sessions',
    rarity: 'common'
  },
  {
    id: 'daily_warrior',
    title: 'Daily Warrior',
    description: 'Practice breathing for 7 days in a row',
    icon: '🔥',
    progress: 0,
    target: 7,
    category: 'streaks',
    rarity: 'rare'
  },
  {
    id: 'zen_master',
    title: 'Zen Master',
    description: 'Reach breathing level 10',
    icon: '🧘‍♀️',
    progress: 0,
    target: 10,
    category: 'mastery',
    rarity: 'epic'
  },
  {
    id: 'marathon_breather',
    title: 'Marathon Breather',
    description: 'Complete 100 breathing sessions',
    icon: '🏃‍♂️',
    progress: 0,
    target: 100,
    category: 'sessions',
    rarity: 'epic'
  },
  {
    id: 'mindful_hour',
    title: 'Mindful Hour',
    description: 'Spend 60 minutes breathing this week',
    icon: '⏱️',
    progress: 0,
    target: 60,
    category: 'time',
    rarity: 'rare'
  },
  {
    id: 'social_butterfly',
    title: 'Social Butterfly',
    description: 'Join 5 group breathing sessions',
    icon: '🦋',
    progress: 0,
    target: 5,
    category: 'social',
    rarity: 'rare'
  },
  {
    id: 'legend',
    title: 'Breathing Legend',
    description: 'Maintain a 30-day streak',
    icon: '👑',
    progress: 0,
    target: 30,
    category: 'streaks',
    rarity: 'legendary'
  }
];

const XP_PER_LEVEL = 100;
const XP_PER_SESSION = 10;
const XP_STREAK_BONUS = 5;
const XP_PERFECT_SESSION = 15;

export function useGamification() {
  const [stats, setStats] = useState<UserStats>({
    level: 1,
    xp: 0,
    xpToNext: XP_PER_LEVEL,
    totalSessions: 0,
    totalMinutes: 0,
    currentStreak: 0,
    longestStreak: 0,
    breathingMastery: 0,
    socialPoints: 0,
    achievements: INITIAL_ACHIEVEMENTS
  });
  const [loading, setLoading] = useState(true);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const savedStats = await AsyncStorage.getItem('userStats');
      if (savedStats) {
        const parsed = JSON.parse(savedStats);
        // Merge with new achievements if any were added
        const mergedAchievements = mergeAchievements(parsed.achievements || [], INITIAL_ACHIEVEMENTS);
        setStats({
          ...parsed,
          achievements: mergedAchievements
        });
      }
    } catch (error) {
      console.log('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const mergeAchievements = (saved: Achievement[], initial: Achievement[]): Achievement[] => {
    const savedMap = new Map(saved.map(a => [a.id, a]));
    return initial.map(achievement => savedMap.get(achievement.id) || achievement);
  };

  const saveStats = async (newStats: UserStats) => {
    try {
      await AsyncStorage.setItem('userStats', JSON.stringify(newStats));
      setStats(newStats);
    } catch (error) {
      console.log('Error saving stats:', error);
    }
  };

  const calculateLevel = (xp: number): { level: number; xpToNext: number } => {
    const level = Math.floor(xp / XP_PER_LEVEL) + 1;
    const xpToNext = (level * XP_PER_LEVEL) - xp;
    return { level, xpToNext };
  };

  const checkAchievements = (newStats: UserStats): Achievement[] => {
    const unlockedAchievements: Achievement[] = [];
    
    const updatedAchievements = newStats.achievements.map(achievement => {
      if (achievement.unlockedAt) return achievement;

      let progress = achievement.progress;
      
      switch (achievement.id) {
        case 'first_breath':
          progress = Math.min(newStats.totalSessions, achievement.target);
          break;
        case 'daily_warrior':
          progress = Math.min(newStats.currentStreak, achievement.target);
          break;
        case 'zen_master':
          progress = Math.min(newStats.level, achievement.target);
          break;
        case 'marathon_breather':
          progress = Math.min(newStats.totalSessions, achievement.target);
          break;
        case 'mindful_hour':
          progress = Math.min(newStats.totalMinutes, achievement.target);
          break;
        case 'social_butterfly':
          progress = Math.min(newStats.socialPoints, achievement.target);
          break;
        case 'legend':
          progress = Math.min(newStats.longestStreak, achievement.target);
          break;
      }

      const updatedAchievement = { ...achievement, progress };
      
      if (progress >= achievement.target && !achievement.unlockedAt) {
        updatedAchievement.unlockedAt = new Date();
        unlockedAchievements.push(updatedAchievement);
      }
      
      return updatedAchievement;
    });

    return unlockedAchievements;
  };

  const addSessionXP = async (sessionDuration: number, isPerfectSession: boolean = false) => {
    const baseXP = XP_PER_SESSION;
    const streakBonus = stats.currentStreak > 0 ? XP_STREAK_BONUS : 0;
    const perfectBonus = isPerfectSession ? XP_PERFECT_SESSION - XP_PER_SESSION : 0;
    const totalXP = baseXP + streakBonus + perfectBonus;

    const newTotalXP = stats.xp + totalXP;
    const { level, xpToNext } = calculateLevel(newTotalXP);
    
    const newStats: UserStats = {
      ...stats,
      xp: newTotalXP,
      level,
      xpToNext,
      totalSessions: stats.totalSessions + 1,
      totalMinutes: stats.totalMinutes + Math.round(sessionDuration / 60),
      breathingMastery: Math.min(100, stats.breathingMastery + (isPerfectSession ? 2 : 1))
    };

    const unlockedAchievements = checkAchievements(newStats);
    newStats.achievements = newStats.achievements.map(a => 
      unlockedAchievements.find(ua => ua.id === a.id) || a
    );

    await saveStats(newStats);
    
    if (unlockedAchievements.length > 0) {
      setNewAchievements(unlockedAchievements);
    }

    return { xpGained: totalXP, levelUp: level > stats.level, unlockedAchievements };
  };

  const updateStreak = async (isConsecutiveDay: boolean) => {
    const newStreak = isConsecutiveDay ? stats.currentStreak + 1 : 1;
    const newStats: UserStats = {
      ...stats,
      currentStreak: newStreak,
      longestStreak: Math.max(stats.longestStreak, newStreak)
    };

    const unlockedAchievements = checkAchievements(newStats);
    newStats.achievements = newStats.achievements.map(a => 
      unlockedAchievements.find(ua => ua.id === a.id) || a
    );

    await saveStats(newStats);
    
    if (unlockedAchievements.length > 0) {
      setNewAchievements(prev => [...prev, ...unlockedAchievements]);
    }
  };

  const addSocialPoints = async (points: number) => {
    const newStats: UserStats = {
      ...stats,
      socialPoints: stats.socialPoints + points
    };

    const unlockedAchievements = checkAchievements(newStats);
    newStats.achievements = newStats.achievements.map(a => 
      unlockedAchievements.find(ua => ua.id === a.id) || a
    );

    await saveStats(newStats);
    
    if (unlockedAchievements.length > 0) {
      setNewAchievements(prev => [...prev, ...unlockedAchievements]);
    }
  };

  const clearNewAchievements = () => {
    setNewAchievements([]);
  };

  const resetStats = async () => {
    const resetStats: UserStats = {
      level: 1,
      xp: 0,
      xpToNext: XP_PER_LEVEL,
      totalSessions: 0,
      totalMinutes: 0,
      currentStreak: 0,
      longestStreak: 0,
      breathingMastery: 0,
      socialPoints: 0,
      achievements: INITIAL_ACHIEVEMENTS
    };
    await saveStats(resetStats);
  };

  return {
    stats,
    loading,
    newAchievements,
    addSessionXP,
    updateStreak,
    addSocialPoints,
    clearNewAchievements,
    resetStats
  };
}