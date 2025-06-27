import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Target, 
  X, 
  Calendar, 
  Clock, 
  Award, 
  TrendingUp,
  Star,
  Gift,
  Flame,
  CheckCircle
} from 'lucide-react-native';
import { Challenge, StreakData, useBreathingChallenges } from '@/hooks/useBreathingChallenges';

const { width, height } = Dimensions.get('window');

interface ChallengesPanelProps {
  visible: boolean;
  onClose: () => void;
  onChallengeComplete: (reward: any) => void;
}

export default function ChallengesPanel({ 
  visible, 
  onClose, 
  onChallengeComplete 
}: ChallengesPanelProps) {
  const {
    challenges,
    streakData,
    loading,
    claimChallengeReward,
    getStreakMotivation,
    getNextMilestone,
    getDifficultyColor,
    getCategoryIcon
  } = useBreathingChallenges();

  const [selectedTab, setSelectedTab] = useState<'challenges' | 'streaks'>('challenges');

  if (!visible) return null;

  const handleClaimReward = async (challengeId: string) => {
    const reward = await claimChallengeReward(challengeId);
    if (reward) {
      onChallengeComplete(reward);
    }
  };

  const motivation = getStreakMotivation();
  const nextMilestone = getNextMilestone();

  const renderChallengeCard = (challenge: Challenge) => (
    <View key={challenge.id} style={styles.challengeCard}>
      <LinearGradient
        colors={[
          getDifficultyColor(challenge.difficulty),
          `${getDifficultyColor(challenge.difficulty)}80`
        ]}
        style={styles.challengeGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.challengeHeader}>
          <Text style={styles.challengeIcon}>{challenge.icon}</Text>
          <View style={styles.challengeInfo}>
            <Text style={styles.challengeTitle}>{challenge.title}</Text>
            <Text style={styles.challengeDescription}>{challenge.description}</Text>
          </View>
          <View style={styles.challengeMeta}>
            <Text style={styles.categoryIcon}>{getCategoryIcon(challenge.category)}</Text>
            <Text style={styles.difficultyText}>{challenge.difficulty.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(challenge.progress / challenge.target) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {challenge.progress}/{challenge.target}
          </Text>
        </View>

        <View style={styles.challengeFooter}>
          <View style={styles.rewardInfo}>
            <Star size={14} color="#fbbf24" />
            <Text style={styles.rewardText}>{challenge.reward.xp} XP</Text>
            {challenge.reward.badge && (
              <>
                <Award size={14} color="#fbbf24" />
                <Text style={styles.rewardText}>{challenge.reward.badge}</Text>
              </>
            )}
          </View>
          
          {challenge.completed ? (
            <TouchableOpacity 
              style={styles.claimButton}
              onPress={() => handleClaimReward(challenge.id)}
            >
              <Gift size={16} color="white" />
              <Text style={styles.claimButtonText}>Claim</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.progressBadge}>
              <Text style={styles.progressBadgeText}>
                {Math.round((challenge.progress / challenge.target) * 100)}%
              </Text>
            </View>
          )}
        </View>

        {challenge.type === 'daily' && challenge.expiresAt && (
          <View style={styles.expiryInfo}>
            <Clock size={12} color="rgba(255, 255, 255, 0.8)" />
            <Text style={styles.expiryText}>
              Expires in {Math.ceil((challenge.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60))}h
            </Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );

  const renderStreakCard = () => (
    <View style={styles.streakMainCard}>
      <LinearGradient
        colors={[motivation.color, `${motivation.color}80`]}
        style={styles.streakGradient}
      >
        <View style={styles.streakHeader}>
          <Flame size={32} color="white" />
          <View style={styles.streakInfo}>
            <Text style={styles.streakNumber}>{streakData.currentStreak}</Text>
            <Text style={styles.streakLabel}>Day Streak</Text>
          </View>
          <View style={styles.streakStats}>
            <Text style={styles.streakStatText}>Best: {streakData.longestStreak}</Text>
            <Text style={styles.streakStatText}>Total: {streakData.totalDays}</Text>
          </View>
        </View>

        <Text style={styles.motivationText}>{motivation.message}</Text>

        <View style={styles.weeklyProgress}>
          <Text style={styles.weeklyTitle}>This Week</Text>
          <View style={styles.weeklyDots}>
            {Array.from({ length: 7 }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.weeklyDot,
                  index < streakData.weeklyProgress && styles.weeklyDotActive
                ]}
              />
            ))}
          </View>
          <Text style={styles.weeklyText}>
            {streakData.weeklyProgress}/{streakData.weeklyGoal} days
          </Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderMilestones = () => (
    <View style={styles.milestonesSection}>
      <Text style={styles.milestonesTitle}>🏆 Streak Milestones</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.milestonesContainer}>
          {streakData.milestones.map((milestone, index) => (
            <View 
              key={milestone.days} 
              style={[
                styles.milestoneCard,
                milestone.unlocked && styles.milestoneUnlocked,
                !milestone.unlocked && 
                nextMilestone?.days === milestone.days && 
                styles.milestoneNext
              ]}
            >
              <Text style={styles.milestoneIcon}>{milestone.icon}</Text>
              <Text style={styles.milestoneDays}>{milestone.days}</Text>
              <Text style={styles.milestoneTitle}>{milestone.title}</Text>
              <Text style={styles.milestoneReward}>{milestone.reward}</Text>
              
              {milestone.unlocked && (
                <View style={styles.milestoneCheck}>
                  <CheckCircle size={16} color="#10b981" />
                </View>
              )}
              
              {!milestone.unlocked && nextMilestone?.days === milestone.days && (
                <View style={styles.milestoneProgress}>
                  <Text style={styles.milestoneProgressText}>
                    {streakData.currentStreak}/{milestone.days}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );

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
          style={styles.modal}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Target size={24} color="white" />
              <Text style={styles.title}>Daily Goals</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'challenges' && styles.activeTab]}
              onPress={() => setSelectedTab('challenges')}
            >
              <Target size={18} color="white" />
              <Text style={styles.tabText}>Challenges</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'streaks' && styles.activeTab]}
              onPress={() => setSelectedTab('streaks')}
            >
              <Flame size={18} color="white" />
              <Text style={styles.tabText}>Streaks</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {selectedTab === 'challenges' && (
              <View style={styles.challengesSection}>
                <Text style={styles.sectionTitle}>
                  Active Challenges ({challenges.filter(c => !c.completed).length})
                </Text>
                {challenges.filter(c => !c.completed).map(renderChallengeCard)}
                
                {challenges.filter(c => c.completed).length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>
                      🎉 Completed ({challenges.filter(c => c.completed).length})
                    </Text>
                    {challenges.filter(c => c.completed).map(renderChallengeCard)}
                  </>
                )}
              </View>
            )}

            {selectedTab === 'streaks' && (
              <View style={styles.streaksSection}>
                {renderStreakCard()}
                {renderMilestones()}
              </View>
            )}
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
    height: height * 0.85,
  },
  modal: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 15,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 15,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 15,
    marginTop: 10,
  },
  challengesSection: {
    gap: 12,
  },
  challengeCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  challengeGradient: {
    padding: 16,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  challengeIcon: {
    fontSize: 24,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
  },
  challengeMeta: {
    alignItems: 'center',
    gap: 4,
  },
  categoryIcon: {
    fontSize: 16,
  },
  difficultyText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rewardText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  claimButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  claimButtonText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  progressBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  progressBadgeText: {
    fontSize: 11,
    color: 'white',
    fontWeight: '600',
  },
  expiryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  expiryText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  streaksSection: {
    gap: 20,
  },
  streakMainCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  streakGradient: {
    padding: 20,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 15,
  },
  streakInfo: {
    flex: 1,
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: 'white',
    lineHeight: 40,
  },
  streakLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  streakStats: {
    alignItems: 'flex-end',
  },
  streakStatText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  motivationText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  weeklyProgress: {
    alignItems: 'center',
    gap: 8,
  },
  weeklyTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  weeklyDots: {
    flexDirection: 'row',
    gap: 8,
  },
  weeklyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  weeklyDotActive: {
    backgroundColor: 'white',
  },
  weeklyText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  milestonesSection: {
    gap: 15,
  },
  milestonesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  milestonesContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 20,
  },
  milestoneCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    width: 100,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
  },
  milestoneUnlocked: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10b981',
  },
  milestoneNext: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    borderColor: '#fbbf24',
  },
  milestoneIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  milestoneDays: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
  },
  milestoneTitle: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  milestoneReward: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  milestoneCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  milestoneProgress: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  milestoneProgressText: {
    fontSize: 8,
    color: 'white',
    fontWeight: '600',
  },
});