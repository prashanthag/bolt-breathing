import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Pause, SkipForward, Volume2, X, Clock, User } from 'lucide-react-native';
import * as Speech from 'expo-speech';

const { width, height } = Dimensions.get('window');

interface GuidedSession {
  id: string;
  title: string;
  instructor: string;
  duration: number; // in minutes
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: 'stress-relief' | 'sleep' | 'focus' | 'energy' | 'anxiety';
  steps: SessionStep[];
  backgroundMusic?: string;
}

interface SessionStep {
  type: 'instruction' | 'breathing' | 'pause' | 'reflection';
  duration: number; // in seconds
  text: string;
  breathingPattern?: [number, number, number, number];
  voiceText?: string;
}

interface GuidedSessionModalProps {
  visible: boolean;
  onClose: () => void;
  session: GuidedSession | null;
}

const SAMPLE_SESSIONS: GuidedSession[] = [
  {
    id: 'morning-energy',
    title: 'Morning Energy Boost',
    instructor: 'Dr. Sarah Chen',
    duration: 8,
    description: 'Start your day with energizing breath work to boost alertness and vitality.',
    difficulty: 'beginner',
    category: 'energy',
    steps: [
      {
        type: 'instruction',
        duration: 30,
        text: 'Welcome to your morning energy session. Find a comfortable seated position.',
        voiceText: 'Welcome to your morning energy session. Find a comfortable seated position with your spine straight and shoulders relaxed.'
      },
      {
        type: 'breathing',
        duration: 180,
        text: 'Energizing Breath - 4:1:4:1',
        breathingPattern: [4, 1, 4, 1],
        voiceText: 'Now we\'ll begin with energizing breath. Inhale for 4, brief hold, exhale for 4, brief pause.'
      },
      {
        type: 'instruction',
        duration: 20,
        text: 'Notice the energy building in your body.',
        voiceText: 'Notice how the energy is building in your body with each breath.'
      },
      {
        type: 'breathing',
        duration: 240,
        text: 'Power Breathing - 6:2:6:2',
        breathingPattern: [6, 2, 6, 2],
        voiceText: 'Now let\'s increase the intensity. Inhale for 6, hold for 2, exhale for 6, hold for 2.'
      },
      {
        type: 'reflection',
        duration: 60,
        text: 'Take a moment to feel the vitality flowing through your body.',
        voiceText: 'Take a moment to feel the vitality and alertness flowing through your entire body. You\'re ready for an amazing day.'
      }
    ]
  },
  {
    id: 'stress-relief',
    title: 'Deep Stress Relief',
    instructor: 'Michael Rodriguez',
    duration: 12,
    description: 'Release tension and find calm with this comprehensive stress-relief session.',
    difficulty: 'intermediate',
    category: 'stress-relief',
    steps: [
      {
        type: 'instruction',
        duration: 45,
        text: 'Welcome to deep stress relief. Let\'s begin by acknowledging any tension you\'re holding.',
        voiceText: 'Welcome to your deep stress relief session. Take a moment to acknowledge any tension or stress you\'re holding in your body.'
      },
      {
        type: 'breathing',
        duration: 300,
        text: 'Calming Breath - 4:7:8',
        breathingPattern: [4, 7, 8, 0],
        voiceText: 'We\'ll start with the calming 4-7-8 breath. Inhale for 4, hold for 7, exhale slowly for 8.'
      },
      {
        type: 'pause',
        duration: 30,
        text: 'Rest and observe the shift in your nervous system.',
        voiceText: 'Rest here and observe how your nervous system is beginning to shift into a calmer state.'
      },
      {
        type: 'breathing',
        duration: 360,
        text: 'Extended Exhale - 4:4:8:2',
        breathingPattern: [4, 4, 8, 2],
        voiceText: 'Now we\'ll focus on extended exhales to activate your relaxation response. Inhale for 4, hold for 4, long exhale for 8, pause for 2.'
      },
      {
        type: 'reflection',
        duration: 90,
        text: 'Feel the stress melting away with each breath.',
        voiceText: 'Feel how the stress and tension are melting away with each breath. You are safe, calm, and at peace.'
      }
    ]
  }
];

export default function GuidedSessionModal({ 
  visible, 
  onClose, 
  session 
}: GuidedSessionModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepTimeRemaining, setStepTimeRemaining] = useState(0);
  const [totalTimeElapsed, setTotalTimeElapsed] = useState(0);

  useEffect(() => {
    if (session && visible) {
      setCurrentStepIndex(0);
      setStepTimeRemaining(session.steps[0]?.duration || 0);
      setTotalTimeElapsed(0);
      setIsPlaying(false);
    }
  }, [session, visible]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && session && stepTimeRemaining > 0) {
      interval = setInterval(() => {
        setStepTimeRemaining(prev => {
          if (prev <= 1) {
            // Move to next step
            const nextIndex = currentStepIndex + 1;
            if (nextIndex < session.steps.length) {
              setCurrentStepIndex(nextIndex);
              return session.steps[nextIndex].duration;
            } else {
              // Session complete
              setIsPlaying(false);
              return 0;
            }
          }
          return prev - 1;
        });
        setTotalTimeElapsed(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, stepTimeRemaining, currentStepIndex, session]);

  // Speak step instructions
  useEffect(() => {
    if (isPlaying && session && stepTimeRemaining === session.steps[currentStepIndex]?.duration) {
      const currentStep = session.steps[currentStepIndex];
      if (currentStep.voiceText) {
        Speech.speak(currentStep.voiceText, { rate: 0.8 });
      }
    }
  }, [currentStepIndex, isPlaying, session, stepTimeRemaining]);

  if (!visible || !session) return null;

  const currentStep = session.steps[currentStepIndex];
  const totalDuration = session.steps.reduce((sum, step) => sum + step.duration, 0);
  const progress = totalTimeElapsed / totalDuration;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#10b981';
      case 'intermediate': return '#f59e0b';
      case 'advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'stress-relief': return '#8b5cf6';
      case 'sleep': return '#3b82f6';
      case 'focus': return '#10b981';
      case 'energy': return '#f59e0b';
      case 'anxiety': return '#ef4444';
      default: return '#6b7280';
    }
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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <Text style={styles.title}>{session.title}</Text>
              <View style={styles.sessionMeta}>
                <View style={styles.metaItem}>
                  <User size={14} color="rgba(255, 255, 255, 0.8)" />
                  <Text style={styles.metaText}>{session.instructor}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Clock size={14} color="rgba(255, 255, 255, 0.8)" />
                  <Text style={styles.metaText}>{session.duration} min</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {formatTime(totalTimeElapsed)} / {formatTime(totalDuration)}
            </Text>
          </View>

          {/* Current Step */}
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepType}>
                {currentStep?.type.charAt(0).toUpperCase() + currentStep?.type.slice(1)}
              </Text>
              <Text style={styles.stepTime}>
                {formatTime(stepTimeRemaining)}
              </Text>
            </View>
            
            <Text style={styles.stepText}>{currentStep?.text}</Text>
            
            {currentStep?.breathingPattern && (
              <View style={styles.patternDisplay}>
                <Text style={styles.patternText}>
                  Pattern: {currentStep.breathingPattern.join(':')}
                </Text>
              </View>
            )}
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={() => {
                if (currentStepIndex > 0) {
                  setCurrentStepIndex(prev => prev - 1);
                  setStepTimeRemaining(session.steps[currentStepIndex - 1].duration);
                }
              }}
              disabled={currentStepIndex === 0}
            >
              <SkipForward size={24} color="white" style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.playButton}
              onPress={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <Pause size={32} color="white" />
              ) : (
                <Play size={32} color="white" />
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.controlButton}
              onPress={() => {
                if (currentStepIndex < session.steps.length - 1) {
                  setCurrentStepIndex(prev => prev + 1);
                  setStepTimeRemaining(session.steps[currentStepIndex + 1].duration);
                }
              }}
              disabled={currentStepIndex === session.steps.length - 1}
            >
              <SkipForward size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Session Info */}
          <View style={styles.sessionInfo}>
            <View style={styles.badges}>
              <View style={[styles.badge, { backgroundColor: getDifficultyColor(session.difficulty) }]}>
                <Text style={styles.badgeText}>{session.difficulty}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: getCategoryColor(session.category) }]}>
                <Text style={styles.badgeText}>{session.category}</Text>
              </View>
            </View>
            
            <Text style={styles.description}>{session.description}</Text>
          </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
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
    maxHeight: height * 0.85,
  },
  modal: {
    borderRadius: 20,
    overflow: 'hidden',
    maxHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 15,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  sessionMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  stepContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepType: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stepTime: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  stepText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  patternDisplay: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  patternText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionInfo: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
});