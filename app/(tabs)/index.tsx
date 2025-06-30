import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  TextInput,
  Alert,
  Modal,
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
import { Play, Pause, Square, RotateCcw, Plus, X } from 'lucide-react-native';
import { useBreathingPatterns, BreathingPattern } from '@/hooks/useBreathingPatterns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

type BreathingPhase = 'inhale' | 'hold1' | 'exhale' | 'hold2';

interface BreathingState {
  phase: BreathingPhase;
  count: number;
  cycle: number;
  isActive: boolean;
  isPaused: boolean;
  hasSpokenPhase: boolean;
}

export default function BreathingScreen() {
  const insets = useSafeAreaInsets();
  const { patterns, loading, savePattern, deletePattern, resetDeletedPatterns } = useBreathingPatterns();
  const [selectedPattern, setSelectedPattern] = useState<BreathingPattern | null>(null);
  const [customLabels, setCustomLabels] = useState({
    inhale: 'Inhale',
    hold: 'Hold',
    exhale: 'Exhale'
  });
  const [state, setState] = useState<BreathingState>({
    phase: 'inhale',
    count: 0,
    cycle: 0,
    isActive: false,
    isPaused: false,
    hasSpokenPhase: false,
  });

  // Create pattern modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [patternName, setPatternName] = useState('');
  const [inhale, setInhale] = useState('4');
  const [hold1, setHold1] = useState('4');
  const [exhale, setExhale] = useState('4');
  const [hold2, setHold2] = useState('4');
  const [repetitions, setRepetitions] = useState('5');
  const [countDirection, setCountDirection] = useState<'up' | 'down'>('down');

  const circleScale = useSharedValue(0.3);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countDirectionRef = useRef<'up' | 'down'>('down');

  // Set default pattern when patterns load  
  useEffect(() => {
    if (!loading && patterns.length > 0) {
      console.log('Setting default pattern:', patterns[0].name);
      setSelectedPattern(patterns[0]);
    }
  }, [patterns, loading]);

  // Load custom labels from settings
  useEffect(() => {
    loadCustomLabels();
    loadCountDirection();
  }, []);

  // Keep ref in sync with state
  useEffect(() => {
    countDirectionRef.current = countDirection;
  }, [countDirection]);

  const loadCustomLabels = async () => {
    try {
      const savedLabels = await AsyncStorage.getItem('customLabels');
      if (savedLabels) {
        setCustomLabels(JSON.parse(savedLabels));
      }
    } catch (error) {
      console.log('Error loading custom labels:', error);
    }
  };

  const loadCountDirection = async () => {
    try {
      const savedDirection = await AsyncStorage.getItem('countDirection');
      if (savedDirection) {
        const direction = savedDirection as 'up' | 'down';
        setCountDirection(direction);
        countDirectionRef.current = direction;
      }
    } catch (error) {
      console.log('Error loading count direction:', error);
    }
  };

  // Voice synthesis function with platform check
  const speak = (text: string) => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.8;
        window.speechSynthesis.speak(utterance);
      } else if (Platform.OS !== 'web') {
        Speech.speak(text, { rate: 0.8 });
      }
    } catch (error) {
      console.log('Speech error:', error);
    }
  };

  const getPhaseText = (phase: BreathingPhase) => {
    if (selectedPattern?.voicePrompts) {
      switch (phase) {
        case 'inhale': return selectedPattern.voicePrompts.inhale;
        case 'hold1': return selectedPattern.voicePrompts.hold1;
        case 'exhale': return selectedPattern.voicePrompts.exhale;
        case 'hold2': return selectedPattern.voicePrompts.hold2;
      }
    }
    
    // Fallback to custom labels or defaults
    switch (phase) {
      case 'inhale': return customLabels.inhale;
      case 'hold1': return customLabels.hold;
      case 'exhale': return customLabels.exhale;
      case 'hold2': return customLabels.hold;
    }
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
      
      const nextCycle = nextPhase === 'inhale' ? prevState.cycle + 1 : prevState.cycle;
      const maxCycles = selectedPattern?.repetitions || 5;
      
      if (nextCycle >= maxCycles && nextPhase === 'inhale') {
        return {
          ...prevState,
          isActive: false,
          isPaused: false,
          phase: 'inhale',
          count: 0,
          cycle: 0,
          hasSpokenPhase: false,
        };
      }
      
      return {
        ...prevState,
        phase: nextPhase,
        count: 0,
        cycle: nextCycle,
        hasSpokenPhase: false,
      };
    });
  };

  const tick = () => {
    setState(prevState => {
      if (!prevState.isActive || prevState.isPaused || !selectedPattern) return prevState;
      
      const phaseIndex = ['inhale', 'hold1', 'exhale', 'hold2'].indexOf(prevState.phase);
      const phaseDuration = selectedPattern.ratio[phaseIndex];
      
      // Skip phases with 0 duration
      if (phaseDuration === 0) {
        runOnJS(nextPhase)();
        return prevState;
      }
      
      // Speak phase name on first tick
      if (!prevState.hasSpokenPhase) {
        runOnJS(speak)(getPhaseText(prevState.phase));
        return {
          ...prevState,
          hasSpokenPhase: true,
          count: 1,
        };
      }
      
      // Speak count
      const currentCount = prevState.count;
      if (countDirectionRef.current === 'up') {
        runOnJS(speak)(currentCount.toString());
      } else {
        const remainingCount = phaseDuration - currentCount + 1;
        runOnJS(speak)(remainingCount.toString());
      }
      
      // Check if phase is complete
      if (currentCount >= phaseDuration) {
        runOnJS(nextPhase)();
        return prevState;
      }
      
      return {
        ...prevState,
        count: currentCount + 1,
      };
    });
  };

  // Get display count for UI
  const getDisplayCount = () => {
    if (!state.isActive || !selectedPattern) return null;
    
    const phaseIndex = ['inhale', 'hold1', 'exhale', 'hold2'].indexOf(state.phase);
    const phaseDuration = selectedPattern.ratio[phaseIndex];
    
    // Don't show count for phases with 0 duration or before phase is spoken
    if (phaseDuration === 0 || !state.hasSpokenPhase) return null;
    
    if (countDirection === 'up') {
      return state.count;
    } else {
      return phaseDuration - state.count + 1;
    }
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
    setState(prev => ({
      ...prev,
      isActive: true,
      isPaused: false,
      phase: 'inhale',
      count: 0,
      cycle: 0,
      hasSpokenPhase: false,
    }));
  };

  const togglePause = () => {
    setState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const stopBreathing = () => {
    setState({
      phase: 'inhale',
      count: 0,
      cycle: 0,
      isActive: false,
      isPaused: false,
      hasSpokenPhase: false,
    });
    circleScale.value = withTiming(0.3);
  };

  const createCustomPattern = async () => {
    if (!patternName.trim()) {
      Alert.alert('Error', 'Please enter a pattern name');
      return;
    }

    const ratio: [number, number, number, number] = [
      parseInt(inhale) || 0,
      parseInt(hold1) || 0,
      parseInt(exhale) || 0,
      parseInt(hold2) || 0,
    ];

    const reps = parseInt(repetitions) || 5;

    if (ratio.some(val => val < 0 || val > 200)) {
      Alert.alert('Error', 'Please enter timing values between 0 and 200');
      return;
    }

    if (reps < 1 || reps > 200) {
      Alert.alert('Error', 'Please enter repetitions between 1 and 200');
      return;
    }

    const voicePrompts = {
      inhale: 'Inhale',
      hold1: 'Hold',
      exhale: 'Exhale',
      hold2: 'Hold',
    };

    try {
      const newPattern = await savePattern(patternName, ratio, reps, voicePrompts);
      setSelectedPattern(newPattern);
      setShowCreateModal(false);
      
      // Reset form
      setPatternName('');
      setInhale('4');
      setHold1('4');
      setExhale('4');
      setHold2('4');
      setRepetitions('5');
    } catch (error) {
      Alert.alert('Error', 'Failed to create pattern');
    }
  };

  const handlePatternLongPress = (pattern: BreathingPattern) => {
    if (!pattern.isCustom) return; // Only allow deleting custom patterns
    
    Alert.alert(
      'Delete Pattern',
      `Are you sure you want to delete "${pattern.name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePattern(pattern.id);
              
              // If the deleted pattern was selected, switch to first available pattern
              if (selectedPattern?.id === pattern.id) {
                const remainingPatterns = patterns.filter(p => p.id !== pattern.id);
                if (remainingPatterns.length > 0) {
                  setSelectedPattern(remainingPatterns[0]);
                }
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete pattern');
            }
          },
        },
      ]
    );
  };

  const circleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: circleScale.value }],
    };
  });

  if (loading) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (patterns.length === 0) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>No patterns available</Text>
          <TouchableOpacity 
            style={styles.resetButton}
            onPress={resetDeletedPatterns}
          >
            <Text style={styles.resetButtonText}>Reset Default Patterns</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  if (!selectedPattern) {
    return (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Initializing...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <>
      <LinearGradient 
        colors={['#667eea', '#764ba2']} 
        style={styles.container}
      >
        <View style={[styles.content, { 
          paddingTop: insets.top + 20, 
          paddingBottom: Platform.select({ 
            android: 120, 
            ios: 90,
            default: 90 
          }) 
        }]}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Breathe</Text>
          </View>

          {/* Pattern Selection */}
          <View style={styles.patternSection}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.patternScrollContent}
            >
              {patterns.map((pattern) => (
                <TouchableOpacity
                  key={pattern.id}
                  style={[
                    styles.patternChip,
                    selectedPattern.id === pattern.id && styles.activeChip,
                    pattern.isCustom ? styles.customPatternChip : styles.defaultPatternChip
                  ]}
                  onPress={() => { 
                    setSelectedPattern(pattern); 
                    stopBreathing();
                  }}
                  onLongPress={() => handlePatternLongPress(pattern)}
                  delayLongPress={500}
                >
                  <Text style={styles.patternChipText} numberOfLines={1}>
                    {pattern.name}
                  </Text>
                  <Text style={[styles.patternIndicator, pattern.isCustom ? styles.customIndicator : styles.defaultIndicator]}>
                    {pattern.isCustom ? '●' : '○'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Breathing Circle */}
          <View style={styles.circleContainer}>
            <Animated.View style={[styles.circle, circleStyle]}>
              <View style={styles.circleInner}>
                <Text style={styles.phaseText}>{getPhaseText(state.phase)}</Text>
                {state.isActive && selectedPattern.ratio[['inhale', 'hold1', 'exhale', 'hold2'].indexOf(state.phase)] > 0 && (
                  <Text style={styles.countText}>
                    {getDisplayCount()}
                  </Text>
                )}
              </View>
            </Animated.View>
          </View>

          {/* Progress & Controls */}
          <View style={styles.controlsSection}>
            <Text style={styles.progressText}>Cycle {state.cycle + 1} of {selectedPattern?.repetitions || 5}</Text>
            
            <View style={styles.controls}>
              {!state.isActive ? (
                <TouchableOpacity style={styles.primaryButton} onPress={startBreathing}>
                  <Play size={28} color="white" />
                </TouchableOpacity>
              ) : (
                <View style={styles.activeControls}>
                  <TouchableOpacity style={styles.controlButton} onPress={togglePause}>
                    {state.isPaused ? <Play size={24} color="#667eea" /> : <Pause size={24} color="#667eea" />}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.controlButton} onPress={stopBreathing}>
                    <Square size={24} color="#667eea" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.controlButton} onPress={() => { stopBreathing(); setTimeout(startBreathing, 100); }}>
                    <RotateCcw size={24} color="#667eea" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
            
            <Text style={styles.patternInfo}>
              {selectedPattern.name} • {selectedPattern.ratio.join(':')}
            </Text>
          </View>

          {/* Create Pattern Button */}
          <View style={styles.bottomSection}>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Plus size={20} color="white" />
              <Text style={styles.createButtonText}>Create Pattern</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Create Pattern Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalContainer}>
          <LinearGradient colors={['#667eea', '#764ba2']} style={styles.modalGradient}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Custom Pattern</Text>
                <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                  <X size={24} color="white" />
                </TouchableOpacity>
              </View>
              
              <ScrollView 
                style={styles.modalForm}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalFormContent}
              >
                {/* Pattern Name */}
                <TextInput
                  style={styles.nameInput}
                  placeholder="Pattern Name"
                  value={patternName}
                  onChangeText={setPatternName}
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                />
                
                {/* Timing Inputs */}
                <View style={styles.timingContainer}>
                  <Text style={styles.sectionTitle}>Timing (seconds)</Text>
                  
                  <View style={styles.timingGrid}>
                    <View style={styles.timingRow}>
                      <View style={styles.timingItem}>
                        <Text style={styles.timingLabel}>Inhale</Text>
                        <TextInput
                          style={styles.timingInput}
                          value={inhale}
                          onChangeText={setInhale}
                          keyboardType="numeric"
                          maxLength={3}
                        />
                      </View>
                      <View style={styles.timingItem}>
                        <Text style={styles.timingLabel}>Hold</Text>
                        <TextInput
                          style={styles.timingInput}
                          value={hold1}
                          onChangeText={setHold1}
                          keyboardType="numeric"
                          maxLength={3}
                        />
                      </View>
                    </View>
                    
                    <View style={styles.timingRow}>
                      <View style={styles.timingItem}>
                        <Text style={styles.timingLabel}>Exhale</Text>
                        <TextInput
                          style={styles.timingInput}
                          value={exhale}
                          onChangeText={setExhale}
                          keyboardType="numeric"
                          maxLength={3}
                        />
                      </View>
                      <View style={styles.timingItem}>
                        <Text style={styles.timingLabel}>Hold</Text>
                        <TextInput
                          style={styles.timingInput}
                          value={hold2}
                          onChangeText={setHold2}
                          keyboardType="numeric"
                          maxLength={3}
                        />
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.repsContainer}>
                    <Text style={styles.timingLabel}>Repetitions</Text>
                    <TextInput
                      style={styles.repsInput}
                      value={repetitions}
                      onChangeText={setRepetitions}
                      keyboardType="numeric"
                      placeholder="5"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      maxLength={3}
                    />
                  </View>
                </View>
                
                <TouchableOpacity style={styles.createPatternButton} onPress={createCustomPattern}>
                  <Text style={styles.createPatternButtonText}>Create Pattern</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: 'white', fontSize: 18, fontWeight: '500', marginBottom: 20 },
  resetButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  resetButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  
  header: { 
    alignItems: 'center',
    marginBottom: 30,
  },
  title: { fontSize: 32, fontWeight: '700', color: 'white' },
  
  patternSection: { marginBottom: 30 },
  patternScrollContent: { paddingHorizontal: 10 },
  patternChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginHorizontal: 6,
    alignItems: 'center',
    minWidth: 120,
  },
  activeChip: { backgroundColor: 'rgba(255, 255, 255, 0.4)' },
  customPatternChip: { 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.4)' 
  },
  defaultPatternChip: { 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.2)' 
  },
  patternChipText: { 
    color: 'white', 
    fontSize: 14, 
    fontWeight: '600',
    textAlign: 'center',
  },
  patternIndicator: { 
    fontSize: 8, 
    marginTop: 4,
  },
  customIndicator: { 
    color: 'rgba(255, 255, 255, 0.9)', 
  },
  defaultIndicator: { 
    color: 'rgba(255, 255, 255, 0.6)', 
  },
  
  circleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    marginVertical: 40,
  },
  circle: {
    width: Math.min(width * 0.7, 280),
    height: Math.min(width * 0.7, 280),
    borderRadius: Math.min(width * 0.35, 140),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  circleInner: { alignItems: 'center' },
  phaseText: { 
    fontSize: 24, 
    fontWeight: '600', 
    color: 'white', 
    marginBottom: 8 
  },
  countText: { 
    fontSize: 42, 
    fontWeight: '300', 
    color: 'white' 
  },
  
  controlsSection: { alignItems: 'center', paddingBottom: 20 },
  progressText: { color: 'white', fontSize: 16, fontWeight: '500', marginBottom: 20 },
  controls: { marginBottom: 20 },
  primaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeControls: { flexDirection: 'row', gap: 20 },
  controlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 55,
    height: 55,
    borderRadius: 27.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  patternInfo: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 14, textAlign: 'center' },
  
  bottomSection: {
    paddingBottom: 20,
  },
  createButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  createButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalGradient: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    padding: 20,
    paddingTop: Platform.select({ ios: 60, android: 40, default: 40 }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  modalTitle: { fontSize: 24, fontWeight: '700', color: 'white' },
  modalForm: {
    flex: 1,
  },
  modalFormContent: {
    paddingBottom: 40,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    marginBottom: 30,
    color: 'white',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  timingContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  timingGrid: {
    gap: 15,
    marginBottom: 25,
  },
  timingRow: {
    flexDirection: 'row',
    gap: 15,
  },
  timingItem: {
    flex: 1,
    alignItems: 'center',
  },
  timingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
    marginBottom: 8,
  },
  timingInput: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    padding: 12,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 45,
    width: '100%',
  },
  repsContainer: {
    alignItems: 'center',
  },
  repsInput: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    padding: 12,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: 100,
    minHeight: 45,
  },
  createPatternButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  createPatternButtonText: { color: 'white', fontSize: 18, fontWeight: '600' },
});