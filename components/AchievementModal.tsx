import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, X, Trophy, Award, Crown, Zap } from 'lucide-react-native';
import { Achievement } from '@/hooks/useGamification';

const { width, height } = Dimensions.get('window');

interface AchievementModalProps {
  visible: boolean;
  achievements: Achievement[];
  onClose: () => void;
}

const getRarityColors = (rarity: Achievement['rarity']) => {
  switch (rarity) {
    case 'common':
      return ['#6b7280', '#9ca3af'];
    case 'rare':
      return ['#3b82f6', '#60a5fa'];
    case 'epic':
      return ['#8b5cf6', '#a78bfa'];
    case 'legendary':
      return ['#f59e0b', '#fbbf24'];
    default:
      return ['#6b7280', '#9ca3af'];
  }
};

const getRarityIcon = (rarity: Achievement['rarity']) => {
  switch (rarity) {
    case 'common':
      return Star;
    case 'rare':
      return Award;
    case 'epic':
      return Trophy;
    case 'legendary':
      return Crown;
    default:
      return Star;
  }
};

export default function AchievementModal({ visible, achievements, onClose }: AchievementModalProps) {
  if (!visible || achievements.length === 0) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <View style={styles.container}>
          {achievements.map((achievement, index) => {
            const colors = getRarityColors(achievement.rarity);
            const IconComponent = getRarityIcon(achievement.rarity);
            
            return (
              <LinearGradient
                key={achievement.id}
                colors={colors}
                style={[styles.achievementCard, { marginBottom: index < achievements.length - 1 ? 20 : 0 }]}
              >
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <X size={24} color="white" />
                </TouchableOpacity>
                
                <View style={styles.content}>
                  <View style={styles.iconContainer}>
                    <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                    <View style={styles.rarityBadge}>
                      <IconComponent size={16} color="white" />
                    </View>
                  </View>
                  
                  <View style={styles.textContainer}>
                    <Text style={styles.rarityText}>
                      {achievement.rarity.toUpperCase()} ACHIEVEMENT
                    </Text>
                    <Text style={styles.title}>{achievement.title}</Text>
                    <Text style={styles.description}>{achievement.description}</Text>
                  </View>
                  
                  <View style={styles.celebration}>
                    <Zap size={20} color="white" style={styles.spark} />
                    <Text style={styles.unlockedText}>UNLOCKED!</Text>
                    <Zap size={20} color="white" style={styles.spark} />
                  </View>
                </View>
              </LinearGradient>
            );
          })}
          
          <TouchableOpacity style={styles.continueButton} onPress={onClose}>
            <Text style={styles.continueButtonText}>Continue Breathing</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
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
    maxHeight: height * 0.8,
    alignItems: 'center',
  },
  achievementCard: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  achievementIcon: {
    fontSize: 60,
    textAlign: 'center',
  },
  rarityBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  rarityText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  celebration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  spark: {
    opacity: 0.8,
  },
  unlockedText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  continueButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    marginTop: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});