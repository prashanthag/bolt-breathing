import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  TrendingUp, 
  Calendar, 
  Clock, 
  Target, 
  Award, 
  Users, 
  Zap,
  Star,
  Trophy,
  Crown,
  Share
} from 'lucide-react-native';
import { UserStats, Achievement } from '@/hooks/useGamification';

const { width } = Dimensions.get('window');

interface StatsCardProps {
  stats: UserStats;
  visible: boolean;
  onClose: () => void;
  onShare?: () => void;
}

const getRarityColor = (rarity: Achievement['rarity']) => {
  switch (rarity) {
    case 'common': return '#9ca3af';
    case 'rare': return '#60a5fa';
    case 'epic': return '#a78bfa';
    case 'legendary': return '#fbbf24';
    default: return '#9ca3af';
  }
};

const getRarityIcon = (rarity: Achievement['rarity']) => {
  switch (rarity) {
    case 'common': return Star;
    case 'rare': return Award;
    case 'epic': return Trophy;
    case 'legendary': return Crown;
    default: return Star;
  }
};

export default function StatsCard({ stats, visible, onClose, onShare }: StatsCardProps) {
  if (!visible) return null;

  const unlockedAchievements = stats.achievements.filter(a => a.unlockedAt);
  const progressAchievements = stats.achievements.filter(a => !a.unlockedAt && a.progress > 0);
  const xpProgress = ((stats.level - 1) * 100 + (100 - stats.xpToNext)) / 100;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity 
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      
      <View style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.card}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Your Journey</Text>
              <View style={styles.headerButtons}>
                {onShare && (
                  <TouchableOpacity onPress={onShare} style={styles.shareButton}>
                    <Share size={18} color="white" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Level & XP */}
            <View style={styles.levelSection}>
              <View style={styles.levelInfo}>
                <Text style={styles.levelText}>Level {stats.level}</Text>
                <Text style={styles.xpText}>{stats.xp} XP</Text>
              </View>
              <View style={styles.xpBar}>
                <View style={[styles.xpProgress, { width: `${xpProgress}%` }]} />
              </View>
              <Text style={styles.xpToNext}>{stats.xpToNext} XP to next level</Text>
            </View>

            {/* Main Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Target size={24} color="white" />
                <Text style={styles.statNumber}>{stats.totalSessions}</Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </View>
              
              <View style={styles.statCard}>
                <Clock size={24} color="white" />
                <Text style={styles.statNumber}>{stats.totalMinutes}</Text>
                <Text style={styles.statLabel}>Minutes</Text>
              </View>
              
              <View style={styles.statCard}>
                <Calendar size={24} color="white" />
                <Text style={styles.statNumber}>{stats.currentStreak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              
              <View style={styles.statCard}>
                <TrendingUp size={24} color="white" />
                <Text style={styles.statNumber}>{stats.breathingMastery}%</Text>
                <Text style={styles.statLabel}>Mastery</Text>
              </View>
            </View>

            {/* Additional Stats */}
            <View style={styles.additionalStats}>
              <View style={styles.additionalStatRow}>
                <Zap size={20} color="rgba(255, 255, 255, 0.8)" />
                <Text style={styles.additionalStatText}>
                  Longest Streak: {stats.longestStreak} days
                </Text>
              </View>
              
              <View style={styles.additionalStatRow}>
                <Users size={20} color="rgba(255, 255, 255, 0.8)" />
                <Text style={styles.additionalStatText}>
                  Social Points: {stats.socialPoints}
                </Text>
              </View>
            </View>

            {/* Achievements Section */}
            <View style={styles.achievementsSection}>
              <Text style={styles.sectionTitle}>
                🏆 Achievements ({unlockedAchievements.length}/{stats.achievements.length})
              </Text>
              
              {/* Unlocked Achievements */}
              {unlockedAchievements.length > 0 && (
                <View style={styles.achievementsList}>
                  {unlockedAchievements.slice(0, 6).map((achievement) => {
                    const IconComponent = getRarityIcon(achievement.rarity);
                    return (
                      <View key={achievement.id} style={styles.achievementItem}>
                        <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                        <View style={styles.achievementInfo}>
                          <Text style={styles.achievementTitle}>{achievement.title}</Text>
                          <View style={styles.rarityContainer}>
                            <IconComponent 
                              size={12} 
                              color={getRarityColor(achievement.rarity)} 
                            />
                            <Text style={[styles.rarityText, { color: getRarityColor(achievement.rarity) }]}>
                              {achievement.rarity}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Progress Achievements */}
              {progressAchievements.length > 0 && (
                <>
                  <Text style={styles.progressTitle}>In Progress</Text>
                  <View style={styles.progressList}>
                    {progressAchievements.slice(0, 3).map((achievement) => (
                      <View key={achievement.id} style={styles.progressItem}>
                        <Text style={styles.progressIcon}>{achievement.icon}</Text>
                        <View style={styles.progressInfo}>
                          <Text style={styles.progressName}>{achievement.title}</Text>
                          <View style={styles.progressBar}>
                            <View 
                              style={[
                                styles.progressFill, 
                                { width: `${(achievement.progress / achievement.target) * 100}%` }
                              ]} 
                            />
                          </View>
                          <Text style={styles.progressText}>
                            {achievement.progress}/{achievement.target}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    width: width - 40,
    maxHeight: '80%',
  },
  card: {
    borderRadius: 20,
    padding: 20,
    maxHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  shareButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  levelSection: {
    alignItems: 'center',
    marginBottom: 25,
  },
  levelInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 8,
  },
  levelText: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
  },
  xpText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  xpBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  xpProgress: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 4,
  },
  xpToNext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  additionalStats: {
    marginBottom: 25,
    gap: 8,
  },
  additionalStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  additionalStatText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  achievementsSection: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 15,
  },
  achievementsList: {
    gap: 12,
    marginBottom: 20,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  achievementIcon: {
    fontSize: 24,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  rarityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rarityText: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  progressList: {
    gap: 10,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressIcon: {
    fontSize: 20,
    opacity: 0.7,
  },
  progressInfo: {
    flex: 1,
  },
  progressName: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});