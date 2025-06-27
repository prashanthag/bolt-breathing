import React, { forwardRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProgressCard } from '@/hooks/useSocialSharing';

const { width } = Dimensions.get('window');

interface ShareableCardProps {
  card: ProgressCard;
}

const ShareableCard = forwardRef<View, ShareableCardProps>(({ card }, ref) => {
  const renderStatItem = (stat: any, index: number) => (
    <View key={index} style={styles.statItem}>
      <Text style={styles.statIcon}>{stat.icon}</Text>
      <View style={styles.statContent}>
        <Text style={styles.statLabel}>{stat.label}</Text>
        <Text style={styles.statValue}>{stat.value}</Text>
      </View>
    </View>
  );

  const renderAchievement = (achievement: any) => (
    <View key={achievement.id} style={styles.achievementBadge}>
      <Text style={styles.achievementIcon}>{achievement.icon}</Text>
      <View style={styles.achievementInfo}>
        <Text style={styles.achievementTitle}>{achievement.title}</Text>
        <Text style={styles.achievementDescription}>{achievement.description}</Text>
      </View>
      <View style={styles.rarityBadge}>
        <Text style={styles.rarityText}>{achievement.rarity.toUpperCase()}</Text>
      </View>
    </View>
  );

  return (
    <View ref={ref} style={styles.cardContainer}>
      <LinearGradient
        colors={card.gradient}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{card.title}</Text>
          <Text style={styles.subtitle}>{card.subtitle}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          {card.stats.map((stat, index) => renderStatItem(stat, index))}
        </View>

        {/* Achievements Section (if present) */}
        {card.achievements && card.achievements.length > 0 && (
          <View style={styles.achievementsSection}>
            {card.achievements.map(renderAchievement)}
          </View>
        )}

        {/* Special Content for Different Card Types */}
        {card.type === 'streak' && (
          <View style={styles.streakVisualization}>
            <Text style={styles.streakText}>
              {parseInt(card.stats.find(s => s.label === 'Current Streak')?.value as string) > 0 
                ? '🔥'.repeat(Math.min(parseInt(card.stats.find(s => s.label === 'Current Streak')?.value as string), 10))
                : '💪 Start your streak today!'}
            </Text>
          </View>
        )}

        {card.type === 'weekly_summary' && (
          <View style={styles.weeklyProgress}>
            <Text style={styles.weeklyTitle}>Weekly Progress</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '85%' }]} />
            </View>
            <Text style={styles.progressText}>Great week of mindful breathing! 🌟</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.appBranding}>
            <Text style={styles.appName}>🧘‍♀️ Breathing Master</Text>
            <Text style={styles.appTagline}>Your mindful breathing companion</Text>
          </View>
          <View style={styles.timestamp}>
            <Text style={styles.timestampText}>
              {new Date().toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </Text>
          </View>
        </View>

        {/* Decorative Elements */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.decorativeCircle3} />
      </LinearGradient>
    </View>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    width: 400,
    height: 600,
    backgroundColor: 'transparent',
  },
  card: {
    flex: 1,
    borderRadius: 24,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 18,
    color: 'white',
    fontWeight: '700',
  },
  achievementsSection: {
    marginBottom: 24,
  },
  achievementBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  achievementIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    color: 'white',
    fontWeight: '700',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  rarityBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.5)',
  },
  rarityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  streakVisualization: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  streakText: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
  },
  weeklyProgress: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  weeklyTitle: {
    fontSize: 16,
    color: 'white',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 'auto',
  },
  appBranding: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    color: 'white',
    fontWeight: '700',
    marginBottom: 2,
  },
  appTagline: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  timestamp: {
    alignItems: 'flex-end',
  },
  timestampText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  decorativeCircle3: {
    position: 'absolute',
    top: 100,
    left: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
});

export default ShareableCard;