import { useState } from 'react';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';

export interface ShareableAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: string;
  progress?: {
    current: number;
    total: number;
  };
}

export interface ProgressCard {
  type: 'streak' | 'level' | 'achievement' | 'milestone' | 'weekly_summary';
  title: string;
  subtitle: string;
  stats: {
    label: string;
    value: string | number;
    icon?: string;
  }[];
  achievements?: ShareableAchievement[];
  gradient: string[];
  theme: 'calm' | 'energetic' | 'focused' | 'achievement' | 'milestone';
}

export function useSocialSharing() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastSharedCard, setLastSharedCard] = useState<ProgressCard | null>(null);

  const createStreakCard = (streakData: any): ProgressCard => {
    const motivationMap = {
      low: ['#10b981', '#059669'],
      medium: ['#f59e0b', '#d97706'], 
      high: ['#8b5cf6', '#7c3aed'],
      extreme: ['#ef4444', '#dc2626']
    };

    const intensity = streakData.currentStreak === 0 ? 'low' : 
                     streakData.currentStreak < 7 ? 'medium' :
                     streakData.currentStreak < 30 ? 'high' : 'extreme';

    return {
      type: 'streak',
      title: `${streakData.currentStreak} Day Streak! 🔥`,
      subtitle: streakData.currentStreak === 0 ? 'Start your journey today' : 
               streakData.currentStreak === 1 ? 'Great start! Keep going' :
               'Building consistency every day',
      stats: [
        { label: 'Current Streak', value: streakData.currentStreak, icon: '🔥' },
        { label: 'Longest Streak', value: streakData.longestStreak, icon: '🏆' },
        { label: 'Total Days', value: streakData.totalDays, icon: '📅' },
        { label: 'This Week', value: `${streakData.weeklyProgress}/${streakData.weeklyGoal}`, icon: '⭐' }
      ],
      gradient: motivationMap[intensity],
      theme: 'calm'
    };
  };

  const createLevelCard = (stats: any): ProgressCard => {
    const xpForNextLevel = stats.level * 1000;
    const currentLevelXP = stats.xp - ((stats.level - 1) * 1000);
    
    return {
      type: 'level',
      title: `Level ${stats.level} Breathing Master`,
      subtitle: `${stats.xp} total experience earned`,
      stats: [
        { label: 'Level', value: stats.level, icon: '🎯' },
        { label: 'Total XP', value: stats.xp, icon: '⭐' },
        { label: 'Sessions', value: stats.sessionsCompleted, icon: '🧘‍♀️' },
        { label: 'Progress', value: `${Math.round((currentLevelXP / 1000) * 100)}%`, icon: '📈' }
      ],
      gradient: ['#667eea', '#764ba2'],
      theme: 'achievement'
    };
  };

  const createAchievementCard = (achievement: ShareableAchievement): ProgressCard => {
    const rarityGradients = {
      common: ['#10b981', '#059669'],
      rare: ['#3b82f6', '#1d4ed8'],
      epic: ['#8b5cf6', '#7c3aed'],
      legendary: ['#f59e0b', '#d97706']
    };

    return {
      type: 'achievement',
      title: `Achievement Unlocked! ${achievement.icon}`,
      subtitle: achievement.title,
      stats: [
        { label: 'Rarity', value: achievement.rarity.toUpperCase(), icon: '💎' },
        { label: 'Category', value: achievement.category, icon: '📂' },
        { label: 'Unlocked', value: achievement.unlockedAt.toLocaleDateString(), icon: '🗓️' }
      ],
      achievements: [achievement],
      gradient: rarityGradients[achievement.rarity],
      theme: 'achievement'
    };
  };

  const createMilestoneCard = (milestone: any, streakData: any): ProgressCard => {
    return {
      type: 'milestone',
      title: `${milestone.icon} ${milestone.title}`,
      subtitle: `${milestone.days} day milestone achieved!`,
      stats: [
        { label: 'Milestone', value: `${milestone.days} Days`, icon: milestone.icon },
        { label: 'Reward', value: milestone.reward, icon: '🎁' },
        { label: 'Current Streak', value: streakData.currentStreak, icon: '🔥' },
        { label: 'Total Journey', value: `${streakData.totalDays} days`, icon: '🛤️' }
      ],
      gradient: ['#f59e0b', '#d97706'],
      theme: 'milestone'
    };
  };

  const createWeeklySummaryCard = (weeklyStats: any): ProgressCard => {
    return {
      type: 'weekly_summary',
      title: 'Weekly Breathing Summary 📊',
      subtitle: 'Your week of mindful breathing',
      stats: [
        { label: 'Sessions', value: weeklyStats.sessions, icon: '🧘‍♀️' },
        { label: 'Total Minutes', value: weeklyStats.totalMinutes, icon: '⏱️' },
        { label: 'Streak Days', value: weeklyStats.streakDays, icon: '🔥' },
        { label: 'XP Earned', value: weeklyStats.xpEarned, icon: '⭐' },
        { label: 'Patterns Used', value: weeklyStats.patternsUsed, icon: '🎯' },
        { label: 'Best Day', value: weeklyStats.bestDay, icon: '🏆' }
      ],
      gradient: ['#667eea', '#764ba2'],
      theme: 'focused'
    };
  };

  const generateShareableImage = async (cardRef: any, card: ProgressCard): Promise<string | null> => {
    if (!cardRef.current) return null;

    setIsGenerating(true);
    try {
      // Capture the card as image
      const imageUri = await captureRef(cardRef.current, {
        format: 'png',
        quality: 1.0,
        width: 400,
        height: 600,
      });

      // Save to device cache for sharing
      const fileName = `breathing_${card.type}_${Date.now()}.png`;
      const newPath = `${FileSystem.cacheDirectory}${fileName}`;
      
      await FileSystem.moveAsync({
        from: imageUri,
        to: newPath,
      });

      setLastSharedCard(card);
      return newPath;
    } catch (error) {
      console.error('Error generating shareable image:', error);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const shareCard = async (imageUri: string, card: ProgressCard) => {
    try {
      const shareOptions = {
        mimeType: 'image/png',
        dialogTitle: `Share my ${card.title}`,
        UTI: 'public.png',
      };

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(imageUri, shareOptions);
      } else {
        console.log('Sharing not available on this device');
      }
    } catch (error) {
      console.error('Error sharing card:', error);
    }
  };

  const getShareMessage = (card: ProgressCard): string => {
    switch (card.type) {
      case 'streak':
        return `🔥 ${card.title} Just completed another day of mindful breathing! Building consistency one breath at a time. #BreathingApp #Mindfulness #Wellness`;
      
      case 'level':
        return `🎯 ${card.title}! Leveled up through dedicated breathing practice. The journey to inner peace continues! #BreathingMaster #LevelUp #Mindfulness`;
      
      case 'achievement':
        return `🏆 Achievement Unlocked: ${card.subtitle}! Every breath brings me closer to inner calm and focus. #Achievement #Breathing #Wellness`;
      
      case 'milestone':
        return `🌟 ${card.title}! Reached a major milestone in my breathing journey. Consistency pays off! #Milestone #BreathingJourney #Mindfulness`;
      
      case 'weekly_summary':
        return `📊 Weekly Breathing Summary! Another week of mindful practice in the books. Small steps, big progress! #WeeklySummary #Breathing #Progress`;
      
      default:
        return `🧘‍♀️ Sharing my breathing journey progress! Every session brings more peace and focus. #BreathingApp #Mindfulness`;
    }
  };

  const generateAndShare = async (cardRef: any, card: ProgressCard) => {
    const imageUri = await generateShareableImage(cardRef, card);
    if (imageUri) {
      await shareCard(imageUri, card);
    }
  };

  return {
    isGenerating,
    lastSharedCard,
    createStreakCard,
    createLevelCard,
    createAchievementCard,
    createMilestoneCard,
    createWeeklySummaryCard,
    generateShareableImage,
    shareCard,
    getShareMessage,
    generateAndShare
  };
}