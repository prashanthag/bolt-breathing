import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Play, Pause, Square, RotateCcw, Trash2 } from 'lucide-react-native';
import { useBreathingPatterns, BreathingPattern } from '@/hooks/useBreathingPatterns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';

const { width, height } = Dimensions.get('window');

type BreathingPhase = 'inhale' | 'hold1' | 'exhale' | 'hold2';

interface BreathingState {
  phase: BreathingPhase;
  count: number;
  cycle: number;
  isActive: boolean;
  isPaused: boolean;
}

export default function BreathingScreen() {
  const insets = useSafeAreaInsets();
  const { patterns, loading, deletePattern } = useBreathingPatterns();
  const [selectedPattern, setSelectedPattern] = useState<BreathingPattern | null>(null);
  const [totalCycles, setTotalCycles] = useState(5);
  const [state, setState] = useState<BreathingState>({
    phase: 'inhale',
    count: 0,
    cycle: 0,
    isActive: false,
    isPaused: false,
  });

  const circleScale = useSharedValue(0.3);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasSpokenPhaseRef = useRef(false);

  // Set default pattern when patterns load
  useEffect(() => {
    if (!loading && patterns.length > 0 && !selectedPattern) {
      setSelectedPattern(patterns[0]); // Default to first pattern (Box Breathing)
    }
  }, [patterns, loading, selectedPattern]);

  // Universal voice synthesis function
  const speak = (text: string) => {
    if (Platform.OS === 'web' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 0.7;
      speechSynthesis.speak(utterance);
    } else {
      // Use expo-speech for mobile platforms
      Speech.speak(text, {
        rate: 0.8,
        pitch: 1,
        volume: 0.7,
      });
    }
  };

  const getPhaseText = (phase: BreathingPhase) => {
    switch (phase) {
      case 'inhale': return 'Inhale';
      case 'hold1': return 'Hold';
      case 'exhale': return 'Exhale';
      case 'hold2': return 'Hold';
    }
  };

  const getCountText = (count: number) => {
    const numbers = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
    return numbers[count] || count.toString();
  };

  const animateCircle = (phase: BreathingPhase, duration: number) => {
    const targetScale = phase === 'inhale' ? 1 : phase === 'exhale' ? 0.3 : circleScale.value;
    
    circleScale.value = withTiming(targetScale, {
      duration: duration * 1000,
      easing: Easing.inOut(Easing.ease),
    });
  };

  const nextPhase = () => {
    setState(prevState => {
      const phases: BreathingPhase[] = ['inhale', 'hold1', 'exhale', 'hold2'];
      const currentIndex = phases.indexOf(prevState.phase);
      const nextIndex = (currentIndex + 1) % phases.length;
      const nextPhase = phases[nextIndex];
      
      // Reset the phase spoken flag for new phase
      hasSpokenPhaseRef.current = false;
      
      // If completing a full cycle
      const nextCycle = nextPhase === 'inhale' ? prevState.cycle + 1 : prevState.cycle;
      
      // Check if we've completed all cycles
      if (nextCycle >= totalCycles && nextPhase === 'inhale') {
        return {
          ...prevState,
          isActive: false,
          isPaused: false,
          phase: 'inhale',
          count: 0,
          cycle: 0,
        };
      }
      
      return {
        ...prevState,
        phase: nextPhase,
        count: 0,
        cycle: nextCycle,
      };
    });
  };

  const tick = () => {
    setState(prevState => {
      if (!prevState.isActive || prevState.isPaused || !selectedPattern) return prevState;
      
      const phaseIndex = ['inhale', 'hold1', 'exhale', 'hold2'].indexOf(prevState.phase);
      const phaseDuration = selectedPattern.ratio[phaseIndex];
      
      if (phaseDuration === 0) {
        runOnJS(nextPhase)();
        return prevState;
      }
      
      // Speak phase name only once at the beginning
      if (!hasSpokenPhaseRef.current) {
        runOnJS(speak)(getPhaseText(prevState.phase));
        hasSpokenPhaseRef.current = true;
        return prevState; // Don't increment count yet, just speak the phase
      }
      
      const newCount = prevState.count + 1;
      
      // Speak the count number
      runOnJS(speak)(getCountText(newCount));
      
      if (newCount >= phaseDuration) {
        runOnJS(nextPhase)();
        return prevState;
      }
      
      return {
        ...prevState,
        count: newCount,
      };
    });
  };

  useEffect(() => {
    if (state.isActive && !state.isPaused && selectedPattern) {
      const phaseIndex = ['inhale', 'hold1', 'exhale', 'hold2'].indexOf(state.phase);
      const phaseDuration = selectedPattern.ratio[phaseIndex];
      
      if (phaseDuration > 0) {
        animateCircle(state.phase, phaseDuration);
        intervalRef.current = setInterval(tick, 1000);
      } else {
        nextPhase();
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.phase, state.isActive, state.isPaused, selectedPattern]);

  const startBreathing = () => {
    hasSpokenPhaseRef.current = false;
    setState(prev => ({
      ...prev,
      isActive: true,
      isPaused: false,
      phase: 'inhale',
      count: 0,
      cycle: 0,
    }));
  };

  const pauseBreathing = () => {
    setState(prev => ({
      ...prev,
      isPaused: !prev.isPaused,
    }));
  };

  const stopBreathing = () => {
    hasSpokenPhaseRef.current = false;
    setState({
      phase: 'inhale',
      count: 0,
      cycle: 0,
      isActive: false,
      isPaused: false,
    });
    circleScale.value = withTiming(0.3);
  };

  const selectPattern = (pattern: BreathingPattern) => {
    setSelectedPattern(pattern);
    stopBreathing();
  };

  const handleDeletePattern = async (pattern: BreathingPattern) => {
    if (!pattern.isCustom) return;
    
    try {
      await deletePattern(pattern.id);
      // If the deleted pattern was selected, switch to the first available pattern
      if (selectedPattern?.id === pattern.id) {
        const remainingPatterns = patterns.filter(p => p.id !== pattern.id);
        setSelectedPattern(remainingPatterns[0] || null);
      }
    } catch (error) {
      console.error('Failed to delete pattern:', error);
    }
  };

  const circleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: circleScale.value }],
    };
  });

  const progress = state.cycle / totalCycles;

  if (loading || !selectedPattern) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[
          styles.scrollContent,
          { 
            paddingTop: insets.top + 20,
            paddingBottom: Platform.select({
              ios: insets.bottom > 0 ? insets.bottom + 90 : 90,
              android: 120,
              default: 90,
            })
          }
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Breathe</Text>
          <Text style={styles.subtitle}>Find your calm rhythm</Text>
        </View>

        {/* Pattern Selection */}
        <View style={styles.patternsContainer}>
          <Text style={styles.sectionTitle}>Choose Your Pattern</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.patternsScroll}
          >
            {patterns.map((pattern) => (
              <View key={pattern.id} style={styles.patternCard}>
                <TouchableOpacity
                  style={[
                    styles.patternButton,
                    selectedPattern.id === pattern.id && styles.activePattern
                  ]}
                  onPress={() => selectPattern(pattern)}
                >
                  <Text style={styles.patternName}>{pattern.name}</Text>
                  <Text style={styles.patternRatio}>{pattern.ratio.join(':')}</Text>
                  {pattern.isCustom && (
                    <Text style={styles.customLabel}>Custom</Text>
                  )}
                </TouchableOpacity>
                {pattern.isCustom && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeletePattern(pattern)}
                  >
                    <Trash2 size={16} color="rgba(255, 255, 255, 0.7)" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Breathing Circle */}
        <View style={styles.circleContainer}>
          <Animated.View style={[styles.circle, circleStyle]}>
            <View style={styles.circleInner}>
              <Text style={styles.phaseText}>{getPhaseText(state.phase)}</Text>
              {state.isActive && (
                <Text style={styles.countText}>
                  {selectedPattern.ratio[['inhale', 'hold1', 'exhale', 'hold2'].indexOf(state.phase)] > 0 
                    ? `${state.count}` 
                    : ''}
                </Text>
              )}
            </View>
          </Animated.View>
        </View>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Cycle {state.cycle + 1} of {totalCycles}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {!state.isActive ? (
            <TouchableOpacity style={styles.primaryButton} onPress={startBreathing}>
              <Play size={24} color="white" />
              <Text style={styles.buttonText}>Start</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.activeControls}>
              <TouchableOpacity 
                style={styles.secondaryButton} 
                onPress={pauseBreathing}
              >
                {state.isPaused ? (
                  <Play size={20} color="#667eea" />
                ) : (
                  <Pause size={20} color="#667eea" />
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.secondaryButton} 
                onPress={stopBreathing}
              >
                <Square size={20} color="#667eea" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.secondaryButton} 
                onPress={() => {
                  stopBreathing();
                  setTimeout(startBreathing, 100);
                }}
              >
                <RotateCcw size={20} color="#667eea" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Current Settings */}
        <View style={styles.settingsDisplay}>
          <Text style={styles.settingsTitle}>Current Pattern</Text>
          <Text style={styles.settingsValue}>
            {selectedPattern.name} • {selectedPattern.ratio.join(':')} • {totalCycles} cycles
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '500',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '400',
  },
  patternsContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 15,
    textAlign: 'center',
  },
  patternsScroll: {
    paddingHorizontal: 10,
  },
  patternCard: {
    position: 'relative',
    marginHorizontal: 5,
  },
  patternButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 120,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activePattern: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  patternName: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  patternRatio: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textAlign: 'center',
  },
  customLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  deleteButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 40,
    height: Math.min(width * 0.6, 240),
  },
  circle: {
    width: Math.min(width * 0.6, 240),
    height: Math.min(width * 0.6, 240),
    borderRadius: Math.min(width * 0.3, 120),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  circleInner: {
    alignItems: 'center',
  },
  phaseText: {
    fontSize: 24,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  countText: {
    fontSize: 48,
    fontWeight: '300',
    color: 'white',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  progressText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  progressBar: {
    width: '80%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
  },
  controls: {
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  activeControls: {
    flexDirection: 'row',
    gap: 15,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsDisplay: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  settingsTitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingsValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});