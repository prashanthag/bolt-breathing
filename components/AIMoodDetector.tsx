import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Dimensions,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Brain, 
  Mic, 
  X, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Heart,
  Zap,
  Target,
  Activity
} from 'lucide-react-native';
import { MoodAnalysis, useMoodDetection } from '@/hooks/useMoodDetection';

const { width, height } = Dimensions.get('window');

interface AIMoodDetectorProps {
  visible: boolean;
  onClose: () => void;
  onMoodDetected: (analysis: MoodAnalysis) => void;
}

export default function AIMoodDetector({ 
  visible, 
  onClose, 
  onMoodDetected 
}: AIMoodDetectorProps) {
  const {
    currentMood,
    isAnalyzing,
    voiceInput,
    aiCoachMessage,
    quickMoodPresets,
    setVoiceInput,
    performMoodAnalysis,
    getMoodTrend,
    getMoodInsights
  } = useMoodDetection();

  const [showQuickPresets, setShowQuickPresets] = useState(true);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    if (isAnalyzing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isAnalyzing]);

  useEffect(() => {
    if (currentMood) {
      setShowAnalysis(true);
      onMoodDetected(currentMood);
    }
  }, [currentMood]);

  if (!visible) return null;

  const handleQuickMood = (preset: any) => {
    setVoiceInput(preset.text);
    setShowQuickPresets(false);
    performMoodAnalysis(preset.text);
  };

  const handleAnalyze = () => {
    if (voiceInput.trim()) {
      setShowQuickPresets(false);
      performMoodAnalysis(voiceInput.trim());
    }
  };

  const getMoodColor = (mood: string) => {
    const colors = {
      calm: '#10b981',
      stressed: '#ef4444',
      anxious: '#f59e0b',
      energetic: '#8b5cf6',
      tired: '#6b7280',
      focused: '#3b82f6',
      overwhelmed: '#dc2626'
    };
    return colors[mood as keyof typeof colors] || '#6b7280';
  };

  const getMoodEmoji = (mood: string) => {
    const emojis = {
      calm: '😌',
      stressed: '😰',
      anxious: '😟',
      energetic: '⚡',
      tired: '😴',
      focused: '🎯',
      overwhelmed: '🌪️'
    };
    return emojis[mood as keyof typeof emojis] || '😐';
  };

  const renderMetricBar = (label: string, value: number, color: string, icon: React.ReactNode) => (
    <View style={styles.metricContainer}>
      <View style={styles.metricHeader}>
        {icon}
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{Math.round(value * 100)}%</Text>
      </View>
      <View style={styles.metricBarContainer}>
        <View style={[styles.metricBar, { width: `${value * 100}%`, backgroundColor: color }]} />
      </View>
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
              <Brain size={24} color="white" />
              <Text style={styles.title}>AI Mood Coach</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* AI Coach Message */}
            {aiCoachMessage && (
              <View style={styles.coachMessage}>
                <Sparkles size={20} color="#fbbf24" />
                <Text style={styles.coachText}>{aiCoachMessage}</Text>
              </View>
            )}

            {/* Quick Mood Presets */}
            {showQuickPresets && !isAnalyzing && !showAnalysis && (
              <View style={styles.presetsSection}>
                <Text style={styles.sectionTitle}>How are you feeling right now?</Text>
                <Text style={styles.sectionSubtitle}>
                  Choose what resonates with you, or describe it in your own words
                </Text>
                
                <View style={styles.presetGrid}>
                  {quickMoodPresets.map((preset, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.presetButton}
                      onPress={() => handleQuickMood(preset)}
                    >
                      <Text style={styles.presetEmoji}>{preset.emoji}</Text>
                      <Text style={styles.presetText}>{preset.text}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.customInputSection}>
                  <Text style={styles.inputLabel}>Or describe in your own words:</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Tell me how you're feeling today..."
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={voiceInput}
                    onChangeText={setVoiceInput}
                    multiline
                    numberOfLines={3}
                  />
                  <TouchableOpacity 
                    style={[styles.analyzeButton, !voiceInput.trim() && styles.disabledButton]}
                    onPress={handleAnalyze}
                    disabled={!voiceInput.trim()}
                  >
                    <Brain size={20} color="white" />
                    <Text style={styles.analyzeButtonText}>Analyze My Mood</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Analyzing State */}
            {isAnalyzing && (
              <View style={styles.analyzingSection}>
                <Animated.View style={[styles.analyzingIcon, { transform: [{ scale: pulseAnim }] }]}>
                  <Brain size={48} color="white" />
                </Animated.View>
                <Text style={styles.analyzingTitle}>AI is analyzing your mood...</Text>
                <Text style={styles.analyzingSubtitle}>
                  Processing voice patterns, emotional indicators, and contextual cues
                </Text>
                <View style={styles.analyzingSteps}>
                  <Text style={styles.analyzingStep}>✓ Voice pattern analysis</Text>
                  <Text style={styles.analyzingStep}>✓ Emotional keyword detection</Text>
                  <Text style={styles.analyzingStep}>⚡ Generating personalized recommendations</Text>
                </View>
              </View>
            )}

            {/* Mood Analysis Results */}
            {showAnalysis && currentMood && !isAnalyzing && (
              <View style={styles.analysisSection}>
                <View style={styles.moodResult}>
                  <View style={styles.moodHeader}>
                    <Text style={styles.moodEmoji}>{getMoodEmoji(currentMood.primaryMood)}</Text>
                    <View style={styles.moodInfo}>
                      <Text style={styles.moodName}>
                        {currentMood.primaryMood.charAt(0).toUpperCase() + currentMood.primaryMood.slice(1)}
                      </Text>
                      <Text style={styles.confidenceText}>
                        {Math.round(currentMood.confidence * 100)}% confidence
                      </Text>
                    </View>
                  </View>

                  {/* Mood Metrics */}
                  <View style={styles.metricsSection}>
                    {renderMetricBar(
                      'Energy Level', 
                      currentMood.energy, 
                      '#f59e0b',
                      <Zap size={16} color="#f59e0b" />
                    )}
                    {renderMetricBar(
                      'Stress Level', 
                      currentMood.stress, 
                      '#ef4444',
                      <Activity size={16} color="#ef4444" />
                    )}
                    {renderMetricBar(
                      'Focus Level', 
                      currentMood.focus, 
                      '#3b82f6',
                      <Target size={16} color="#3b82f6" />
                    )}
                  </View>

                  {/* AI Recommendations */}
                  <View style={styles.recommendationsSection}>
                    <Text style={styles.recommendationsTitle}>
                      🎯 Personalized Recommendations
                    </Text>
                    
                    <View style={styles.recommendationCard}>
                      <Text style={styles.recommendationLabel}>Recommended Pattern:</Text>
                      <Text style={styles.recommendationValue}>{currentMood.recommendedPattern}</Text>
                    </View>

                    <View style={styles.recommendationCard}>
                      <Text style={styles.recommendationLabel}>Best Environment:</Text>
                      <Text style={styles.recommendationValue}>{currentMood.recommendedEnvironment}</Text>
                    </View>

                    <View style={styles.insightsSection}>
                      <Text style={styles.insightsTitle}>💡 AI Insights</Text>
                      {getMoodInsights().map((insight, index) => (
                        <View key={index} style={styles.insightItem}>
                          <Text style={styles.insightBullet}>•</Text>
                          <Text style={styles.insightText}>{insight}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={styles.startSessionButton}
                      onPress={() => {
                        onClose();
                        // This will be handled by parent to start recommended session
                      }}
                    >
                      <Heart size={20} color="white" />
                      <Text style={styles.startSessionText}>Start Recommended Session</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.reanalyzeButton}
                      onPress={() => {
                        setShowAnalysis(false);
                        setShowQuickPresets(true);
                        setVoiceInput('');
                      }}
                    >
                      <Text style={styles.reanalyzeText}>Analyze Again</Text>
                    </TouchableOpacity>
                  </View>
                </View>
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
    maxHeight: height * 0.9,
  },
  modal: {
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
  coachMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
  },
  coachText: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  presetsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 20,
  },
  presetGrid: {
    gap: 12,
    marginBottom: 25,
  },
  presetButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  presetEmoji: {
    fontSize: 24,
  },
  presetText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  customInputSection: {
    gap: 12,
  },
  inputLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    color: 'white',
    fontSize: 14,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  analyzeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 15,
    borderRadius: 12,
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
  analyzeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  analyzingSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  analyzingIcon: {
    marginBottom: 20,
  },
  analyzingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  analyzingSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 25,
  },
  analyzingSteps: {
    gap: 8,
  },
  analyzingStep: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    textAlign: 'center',
  },
  analysisSection: {
    gap: 20,
  },
  moodResult: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  moodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 20,
  },
  moodEmoji: {
    fontSize: 48,
  },
  moodInfo: {
    flex: 1,
  },
  moodName: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  confidenceText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  metricsSection: {
    gap: 15,
    marginBottom: 20,
  },
  metricContainer: {
    gap: 8,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricLabel: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  metricValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  metricBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  metricBar: {
    height: '100%',
    borderRadius: 3,
  },
  recommendationsSection: {
    gap: 15,
    marginBottom: 20,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  recommendationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
  },
  recommendationLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  recommendationValue: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  insightsSection: {
    gap: 8,
  },
  insightsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  insightItem: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  insightBullet: {
    color: '#fbbf24',
    fontSize: 14,
    fontWeight: '600',
  },
  insightText: {
    flex: 1,
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    lineHeight: 18,
  },
  actionButtons: {
    gap: 12,
  },
  startSessionButton: {
    backgroundColor: '#10b981',
    paddingVertical: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startSessionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  reanalyzeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  reanalyzeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});