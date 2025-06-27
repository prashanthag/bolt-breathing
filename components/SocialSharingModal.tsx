import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  X, 
  Share, 
  Download, 
  Trophy, 
  TrendingUp, 
  Calendar,
  Target,
  Zap,
  Star
} from 'lucide-react-native';
import ShareableCard from './ShareableCard';
import { ProgressCard, useSocialSharing } from '@/hooks/useSocialSharing';

const { width, height } = Dimensions.get('window');

interface SocialSharingModalProps {
  visible: boolean;
  onClose: () => void;
  stats: any;
  streakData: any;
  achievements: any[];
  weeklyStats?: any;
}

export default function SocialSharingModal({
  visible,
  onClose,
  stats,
  streakData,
  achievements,
  weeklyStats
}: SocialSharingModalProps) {
  const {
    isGenerating,
    createStreakCard,
    createLevelCard,
    createAchievementCard,
    createMilestoneCard,
    createWeeklySummaryCard,
    generateAndShare,
    getShareMessage
  } = useSocialSharing();

  const [selectedCardType, setSelectedCardType] = useState<string>('streak');
  const [previewCard, setPreviewCard] = useState<ProgressCard | null>(null);
  const cardRef = useRef<View>(null);

  React.useEffect(() => {
    if (visible) {
      generatePreviewCard('streak');
    }
  }, [visible]);

  const generatePreviewCard = (cardType: string) => {
    let card: ProgressCard;
    
    switch (cardType) {
      case 'streak':
        card = createStreakCard(streakData);
        break;
      case 'level':
        card = createLevelCard(stats);
        break;
      case 'achievement':
        const latestAchievement = achievements.filter(a => a.unlockedAt).slice(-1)[0];
        if (!latestAchievement) {
          Alert.alert('No Achievements', 'Complete some breathing sessions to unlock achievements!');
          return;
        }
        card = createAchievementCard(latestAchievement);
        break;
      case 'milestone':
        const unlockedMilestones = streakData.milestones.filter((m: any) => m.unlocked);
        const latestMilestone = unlockedMilestones.slice(-1)[0];
        if (!latestMilestone) {
          Alert.alert('No Milestones', 'Build your streak to unlock milestone rewards!');
          return;
        }
        card = createMilestoneCard(latestMilestone, streakData);
        break;
      case 'weekly':
        const defaultWeeklyStats = {
          sessions: stats.sessionsCompleted || 0,
          totalMinutes: Math.round((stats.totalBreathingTime || 0) / 60),
          streakDays: Math.min(streakData.currentStreak, 7),
          xpEarned: Math.round(stats.xp * 0.3) || 150,
          patternsUsed: 4,
          bestDay: 'Today'
        };
        card = createWeeklySummaryCard(weeklyStats || defaultWeeklyStats);
        break;
      default:
        card = createStreakCard(streakData);
    }
    
    setPreviewCard(card);
    setSelectedCardType(cardType);
  };

  const handleShare = async () => {
    if (!previewCard) return;
    
    try {
      await generateAndShare(cardRef, previewCard);
    } catch (error) {
      console.error('Error sharing card:', error);
      Alert.alert('Share Error', 'Unable to share card. Please try again.');
    }
  };

  const cardTypes = [
    {
      id: 'streak',
      title: 'Streak',
      icon: <Zap size={20} color="white" />,
      description: 'Share your consistency',
      available: true
    },
    {
      id: 'level',
      title: 'Level',
      icon: <TrendingUp size={20} color="white" />,
      description: 'Show your progress',
      available: true
    },
    {
      id: 'achievement',
      title: 'Achievement',
      icon: <Trophy size={20} color="white" />,
      description: 'Celebrate milestones',
      available: achievements.filter(a => a.unlockedAt).length > 0
    },
    {
      id: 'milestone',
      title: 'Milestone',
      icon: <Target size={20} color="white" />,
      description: 'Streak rewards',
      available: streakData.milestones.some((m: any) => m.unlocked)
    },
    {
      id: 'weekly',
      title: 'Weekly',
      icon: <Calendar size={20} color="white" />,
      description: 'Week summary',
      available: true
    }
  ];

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.gradient}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Share size={24} color="white" />
              <Text style={styles.title}>Share Progress</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Card Type Selector */}
            <View style={styles.selectorSection}>
              <Text style={styles.sectionTitle}>Choose Card Type</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.cardTypeContainer}
              >
                {cardTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.cardTypeButton,
                      selectedCardType === type.id && styles.selectedCardType,
                      !type.available && styles.disabledCardType
                    ]}
                    onPress={() => type.available && generatePreviewCard(type.id)}
                    disabled={!type.available}
                  >
                    {type.icon}
                    <Text style={[
                      styles.cardTypeText,
                      !type.available && styles.disabledText
                    ]}>
                      {type.title}
                    </Text>
                    <Text style={[
                      styles.cardTypeDescription,
                      !type.available && styles.disabledText
                    ]}>
                      {type.description}
                    </Text>
                    {!type.available && (
                      <View style={styles.lockOverlay}>
                        <Text style={styles.lockText}>🔒</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Card Preview */}
            {previewCard && (
              <View style={styles.previewSection}>
                <Text style={styles.sectionTitle}>Preview</Text>
                <View style={styles.cardPreview}>
                  <ShareableCard ref={cardRef} card={previewCard} />
                </View>
                
                {/* Share Message Preview */}
                <View style={styles.messagePreview}>
                  <Text style={styles.messageTitle}>Share Message:</Text>
                  <Text style={styles.messageText}>
                    {getShareMessage(previewCard)}
                  </Text>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.shareButton, isGenerating && styles.disabledButton]}
                onPress={handleShare}
                disabled={isGenerating || !previewCard}
              >
                <Share size={20} color="white" />
                <Text style={styles.shareButtonText}>
                  {isGenerating ? 'Generating...' : 'Share Now'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tips Section */}
            <View style={styles.tipsSection}>
              <Text style={styles.tipsTitle}>💡 Sharing Tips</Text>
              <View style={styles.tipsList}>
                <Text style={styles.tipItem}>• Share your progress to inspire others</Text>
                <Text style={styles.tipItem}>• Tag friends to join your breathing journey</Text>
                <Text style={styles.tipItem}>• Post during morning or evening for better engagement</Text>
                <Text style={styles.tipItem}>• Use hashtags like #MindfulBreathing #Wellness</Text>
              </View>
            </View>
          </ScrollView>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 15,
  },
  cardTypeContainer: {
    paddingRight: 20,
  },
  cardTypeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    width: 120,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
  },
  selectedCardType: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  disabledCardType: {
    opacity: 0.5,
  },
  cardTypeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  cardTypeDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  disabledText: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  lockOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  lockText: {
    fontSize: 12,
  },
  previewSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  cardPreview: {
    alignItems: 'center',
    marginBottom: 20,
    transform: [{ scale: 0.8 }],
  },
  messagePreview: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  messageTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  messageText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    lineHeight: 18,
  },
  actionButtons: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  shareButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  disabledButton: {
    opacity: 0.5,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  tipsSection: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
  },
  tipsList: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tipItem: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 4,
  },
});