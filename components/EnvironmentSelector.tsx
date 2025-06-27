import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, Star } from 'lucide-react-native';
import { AREnvironment } from '@/hooks/useAREnvironments';

const { width } = Dimensions.get('window');

interface EnvironmentSelectorProps {
  visible: boolean;
  environments: AREnvironment[];
  selectedEnvironment: AREnvironment;
  unlockedEnvironments: string[];
  userLevel: number;
  onSelect: (environmentId: string) => void;
  onClose: () => void;
}

export default function EnvironmentSelector({
  visible,
  environments,
  selectedEnvironment,
  unlockedEnvironments,
  userLevel,
  onSelect,
  onClose,
}: EnvironmentSelectorProps) {
  if (!visible) return null;

  const isUnlocked = (env: AREnvironment) => {
    return unlockedEnvironments.includes(env.id) || 
           (!env.premium && userLevel >= env.unlockLevel);
  };

  const canUnlock = (env: AREnvironment) => {
    return !env.premium && userLevel >= env.unlockLevel;
  };

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
          <View style={styles.header}>
            <Text style={styles.title}>Choose Environment</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.grid}>
              {environments.map((env) => {
                const unlocked = isUnlocked(env);
                const selected = selectedEnvironment.id === env.id;
                const needsLevel = !unlocked && !env.premium && userLevel < env.unlockLevel;
                
                return (
                  <TouchableOpacity
                    key={env.id}
                    style={[
                      styles.environmentCard,
                      selected && styles.selectedCard,
                      !unlocked && styles.lockedCard
                    ]}
                    onPress={() => {
                      if (unlocked) {
                        onSelect(env.id);
                        onClose();
                      }
                    }}
                    disabled={!unlocked}
                  >
                    <LinearGradient
                      colors={unlocked ? env.colors : ['#404040', '#606060']}
                      style={styles.cardGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.cardContent}>
                        <Text style={styles.environmentIcon}>{env.icon}</Text>
                        <Text style={[
                          styles.environmentName,
                          !unlocked && styles.lockedText
                        ]}>
                          {env.name}
                        </Text>
                        <Text style={[
                          styles.environmentDescription,
                          !unlocked && styles.lockedText
                        ]}>
                          {env.description}
                        </Text>
                        
                        {/* Lock/Premium indicators */}
                        <View style={styles.indicators}>
                          {!unlocked && (
                            <View style={styles.lockContainer}>
                              <Lock size={16} color="rgba(255, 255, 255, 0.7)" />
                              {env.premium ? (
                                <Text style={styles.lockText}>Premium</Text>
                              ) : (
                                <Text style={styles.lockText}>Level {env.unlockLevel}</Text>
                              )}
                            </View>
                          )}
                          
                          {env.premium && unlocked && (
                            <View style={styles.premiumBadge}>
                              <Star size={14} color="#fbbf24" fill="#fbbf24" />
                              <Text style={styles.premiumText}>Premium</Text>
                            </View>
                          )}
                          
                          {selected && (
                            <View style={styles.selectedBadge}>
                              <Text style={styles.selectedText}>Active</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      
                      {!unlocked && (
                        <View style={styles.lockedOverlay} />
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>
            
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Unlock more environments by leveling up through breathing practice
              </Text>
              <Text style={styles.levelText}>
                Current Level: {userLevel}
              </Text>
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
    maxHeight: '85%',
  },
  modal: {
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
  closeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  environmentCard: {
    width: (width - 80 - 12) / 2,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  selectedCard: {
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  lockedCard: {
    opacity: 0.7,
  },
  cardGradient: {
    flex: 1,
    position: 'relative',
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  environmentIcon: {
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 4,
  },
  environmentName: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 4,
  },
  environmentDescription: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 14,
    flex: 1,
  },
  lockedText: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  indicators: {
    alignItems: 'center',
    gap: 4,
  },
  lockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lockText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  premiumText: {
    fontSize: 10,
    color: '#fbbf24',
    fontWeight: '600',
  },
  selectedBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectedText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '700',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  footerText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  levelText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
});