import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'daily' | 'weekly' | 'special';
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  target: number;
  progress: number;
  completed: boolean;
  reward: {
    xp: number;
    badge?: string;
    unlock?: string;
  };
  expiresAt?: Date;
  category: 'consistency' | 'duration' | 'technique' | 'social' | 'mindfulness';
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastSessionDate: string;
  streakStartDate: string;
  totalDays: number;
  weeklyGoal: number;
  weeklyProgress: number;
  milestones: StreakMilestone[];
}

export interface StreakMilestone {
  days: number;
  title: string;
  reward: string;
  unlocked: boolean;
  icon: string;
}

const DAILY_CHALLENGES_POOL = [
  {
    title: 'Morning Zen',
    description: 'Complete a breathing session before 10 AM',
    icon: '🌅',
    type: 'daily' as const,
    difficulty: 'easy' as const,
    target: 1,
    reward: { xp: 50, badge: 'Early Bird' },
    category: 'consistency' as const
  },
  {
    title: 'Deep Breather',
    description: 'Practice breathing for 10 minutes total today',
    icon: '🫁',
    type: 'daily' as const,
    difficulty: 'medium' as const,
    target: 10,
    reward: { xp: 75 },
    category: 'duration' as const
  },
  {
    title: 'Pattern Master',
    description: 'Try 3 different breathing patterns',
    icon: '🎯',
    type: 'daily' as const,
    difficulty: 'medium' as const,
    target: 3,
    reward: { xp: 80, unlock: 'Advanced Pattern' },
    category: 'technique' as const
  },
  {
    title: 'Social Butterfly',
    description: 'Join a social breathing room',
    icon: '🦋',
    type: 'daily' as const,
    difficulty: 'easy' as const,
    target: 1,
    reward: { xp: 60 },
    category: 'social' as const
  },
  {
    title: 'Mindful Moments',
    description: 'Complete 5 perfect breathing cycles',
    icon: '🧘‍♀️',
    type: 'daily' as const,
    difficulty: 'hard' as const,
    target: 5,
    reward: { xp: 100, badge: 'Mindfulness Master' },
    category: 'mindfulness' as const
  },
  {
    title: 'Stress Buster',
    description: 'Use breathing for stress relief (detected by AI)',
    icon: '💆‍♀️',
    type: 'daily' as const,
    difficulty: 'medium' as const,
    target: 1,
    reward: { xp: 90 },
    category: 'mindfulness' as const
  },
  {
    title: 'Environment Explorer',
    description: 'Try 2 different AR environments',
    icon: '🌍',
    type: 'daily' as const,
    difficulty: 'easy' as const,
    target: 2,
    reward: { xp: 70 },
    category: 'technique' as const
  }
];

const WEEKLY_CHALLENGES = [
  {
    title: 'Weekly Warrior',
    description: 'Practice breathing every day this week',
    icon: '🏆',
    type: 'weekly' as const,
    difficulty: 'hard' as const,
    target: 7,
    reward: { xp: 500, badge: 'Consistency Champion' },
    category: 'consistency' as const
  },
  {
    title: 'Marathon Breather',
    description: 'Accumulate 60 minutes of breathing this week',
    icon: '🏃‍♂️',
    type: 'weekly' as const,
    difficulty: 'extreme' as const,
    target: 60,
    reward: { xp: 750, unlock: 'Marathon Badge' },
    category: 'duration' as const
  },
  {
    title: 'Social Leader',
    description: 'Join social rooms 5 times this week',
    icon: '👥',
    type: 'weekly' as const,
    difficulty: 'medium' as const,
    target: 5,
    reward: { xp: 400 },
    category: 'social' as const
  }
];

const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 3, title: 'Getting Started', reward: '50 XP Bonus', unlocked: false, icon: '🌱' },
  { days: 7, title: 'One Week Strong', reward: 'New Environment', unlocked: false, icon: '🔥' },
  { days: 14, title: 'Two Week Warrior', reward: 'Special Badge', unlocked: false, icon: '⚡' },
  { days: 30, title: 'Month Master', reward: 'Premium Pattern', unlocked: false, icon: '💎' },
  { days: 50, title: 'Halfway Hero', reward: 'Custom Avatar', unlocked: false, icon: '🦸‍♀️' },
  { days: 100, title: 'Century Achiever', reward: 'Legendary Status', unlocked: false, icon: '👑' },
  { days: 365, title: 'Year of Breathing', reward: 'Ultimate Master', unlocked: false, icon: '🌟' }
];

export function useBreathingChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastSessionDate: '',
    streakStartDate: '',
    totalDays: 0,
    weeklyGoal: 5,
    weeklyProgress: 0,
    milestones: STREAK_MILESTONES
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallenges();
    loadStreakData();
  }, []);

  const loadChallenges = async () => {
    try {
      const saved = await AsyncStorage.getItem('breathingChallenges');
      if (saved) {
        setChallenges(JSON.parse(saved));
      } else {
        generateDailyChallenges();
      }
    } catch (error) {
      console.log('Error loading challenges:', error);
      generateDailyChallenges();
    }
  };

  const loadStreakData = async () => {
    try {
      const saved = await AsyncStorage.getItem('streakData');
      if (saved) {
        const parsed = JSON.parse(saved);
        setStreakData({
          ...parsed,
          milestones: STREAK_MILESTONES.map(m => ({
            ...m,
            unlocked: parsed.currentStreak >= m.days
          }))
        });
      }
    } catch (error) {
      console.log('Error loading streak data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveChallenges = async (newChallenges: Challenge[]) => {
    try {
      await AsyncStorage.setItem('breathingChallenges', JSON.stringify(newChallenges));
      setChallenges(newChallenges);
    } catch (error) {
      console.log('Error saving challenges:', error);
    }
  };

  const saveStreakData = async (newData: StreakData) => {
    try {
      await AsyncStorage.setItem('streakData', JSON.stringify(newData));
      setStreakData(newData);
    } catch (error) {
      console.log('Error saving streak data:', error);
    }
  };

  const generateDailyChallenges = () => {
    // Generate 3 daily challenges
    const shuffled = [...DAILY_CHALLENGES_POOL].sort(() => 0.5 - Math.random());
    const dailyChallenges = shuffled.slice(0, 3).map((template, index) => ({
      id: `daily-${Date.now()}-${index}`,
      ...template,
      progress: 0,
      completed: false,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    }));

    // Add one weekly challenge
    const weeklyTemplate = WEEKLY_CHALLENGES[Math.floor(Math.random() * WEEKLY_CHALLENGES.length)];
    const weeklyChallenge = {
      id: `weekly-${Date.now()}`,
      ...weeklyTemplate,
      progress: 0,
      completed: false,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };

    const allChallenges = [...dailyChallenges, weeklyChallenge];
    saveChallenges(allChallenges);
  };

  const updateSessionStreak = async () => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    
    let newStreakData = { ...streakData };

    if (newStreakData.lastSessionDate === today) {
      // Already practiced today, no streak change
      return newStreakData;
    }

    if (newStreakData.lastSessionDate === yesterday || newStreakData.currentStreak === 0) {
      // Continue or start streak
      newStreakData.currentStreak += 1;
      newStreakData.totalDays += 1;
      
      if (newStreakData.currentStreak === 1) {
        newStreakData.streakStartDate = today;
      }
    } else {
      // Streak broken, start new one
      newStreakData.currentStreak = 1;
      newStreakData.streakStartDate = today;
      newStreakData.totalDays += 1;
    }

    newStreakData.longestStreak = Math.max(newStreakData.longestStreak, newStreakData.currentStreak);
    newStreakData.lastSessionDate = today;

    // Update weekly progress
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const weekStart = startOfWeek.toDateString();
    
    if (newStreakData.lastSessionDate >= weekStart) {
      newStreakData.weeklyProgress = Math.min(newStreakData.weeklyProgress + 1, newStreakData.weeklyGoal);
    }

    // Update milestones
    newStreakData.milestones = newStreakData.milestones.map(milestone => ({
      ...milestone,
      unlocked: newStreakData.currentStreak >= milestone.days
    }));

    await saveStreakData(newStreakData);
    return newStreakData;
  };

  const updateChallengeProgress = async (
    type: string, 
    category?: string, 
    amount: number = 1
  ) => {
    const updatedChallenges = challenges.map(challenge => {
      let shouldUpdate = false;

      // Check if challenge matches the activity
      switch (type) {
        case 'session_complete':
          shouldUpdate = challenge.category === 'consistency' || 
                        challenge.category === 'duration' ||
                        challenge.category === 'mindfulness';
          break;
        case 'pattern_used':
          shouldUpdate = challenge.category === 'technique';
          break;
        case 'social_join':
          shouldUpdate = challenge.category === 'social';
          break;
        case 'morning_session':
          shouldUpdate = challenge.title === 'Morning Zen';
          break;
        case 'stress_relief':
          shouldUpdate = challenge.title === 'Stress Buster';
          break;
        case 'environment_change':
          shouldUpdate = challenge.title === 'Environment Explorer';
          break;
      }

      if (shouldUpdate && !challenge.completed) {
        const newProgress = Math.min(challenge.progress + amount, challenge.target);
        return {
          ...challenge,
          progress: newProgress,
          completed: newProgress >= challenge.target
        };
      }

      return challenge;
    });

    await saveChallenges(updatedChallenges);
    return updatedChallenges.filter(c => c.completed && !challenges.find(old => old.id === c.id && old.completed));
  };

  const claimChallengeReward = async (challengeId: string) => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge || !challenge.completed) return null;

    // Mark as claimed (remove from active challenges)
    const updatedChallenges = challenges.filter(c => c.id !== challengeId);
    await saveChallenges(updatedChallenges);

    return challenge.reward;
  };

  const getStreakMotivation = () => {
    const { currentStreak } = streakData;
    
    if (currentStreak === 0) {
      return {
        message: "Start your breathing journey today! 🌱",
        color: '#10b981',
        intensity: 'low'
      };
    } else if (currentStreak < 7) {
      return {
        message: `${currentStreak} days strong! Keep building that habit! 🔥`,
        color: '#f59e0b',
        intensity: 'medium'
      };
    } else if (currentStreak < 30) {
      return {
        message: `${currentStreak} day streak! You're on fire! ⚡`,
        color: '#8b5cf6',
        intensity: 'high'
      };
    } else {
      return {
        message: `${currentStreak} days! You're a breathing master! 👑`,
        color: '#ef4444',
        intensity: 'extreme'
      };
    }
  };

  const getNextMilestone = () => {
    return streakData.milestones.find(m => !m.unlocked);
  };

  const getDifficultyColor = (difficulty: Challenge['difficulty']) => {
    switch (difficulty) {
      case 'easy': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      case 'extreme': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getCategoryIcon = (category: Challenge['category']) => {
    switch (category) {
      case 'consistency': return '📅';
      case 'duration': return '⏱️';
      case 'technique': return '🎯';
      case 'social': return '👥';
      case 'mindfulness': return '🧘‍♀️';
      default: return '⭐';
    }
  };

  return {
    challenges,
    streakData,
    loading,
    updateSessionStreak,
    updateChallengeProgress,
    claimChallengeReward,
    getStreakMotivation,
    getNextMilestone,
    getDifficultyColor,
    getCategoryIcon,
    generateDailyChallenges
  };
}