import React, { useState, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
import { Play, Pause, Square, RotateCcw, Plus, X, Edit3 } from 'lucide-react-native';
import { useBreathingPatterns, BreathingPattern } from '@/hooks/useBreathingPatterns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

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
  });

  // Create pattern modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [patternName, setPatternName] = useState('');
  const [inhale, setInhale] = useState('4');
  const [hold1, setHold1] = useState('4');
  const [exhale, setExhale] = useState('4');
  const [hold2, setHold2] = useState('4');
  const [repetitions, setRepetitions] = useState('5');
  const [voiceInhale, setVoiceInhale] = useState('Inhale');
  const [voiceHold1, setVoiceHold1] = useState('Hold');
  const [voiceExhale, setVoiceExhale] = useState('Exhale');
  const [voiceHold2, setVoiceHold2] = useState('Hold');
  const [editingVoice, setEditingVoice] = useState<string | null>(null);
  const [countDirection, setCountDirection] = useState<'up' | 'down'>('down');

  const circleScale = useSharedValue(0.3);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasSpokenPhaseRef = useRef(false);

  // Set default pattern when patterns load  
  useEffect(() => {
    if (!loading && patterns.length > 0) {
      console.log('Setting default pattern:', patterns[0].name);
      setSelectedPattern(patterns[0]);
    }
  }, [patterns, loading]);

  // Debug logging and loading timeout
  useEffect(() => {
    console.log('Patterns loaded:', patterns.length, 'Loading:', loading);
    if (patterns.length > 0) {
      console.log('First pattern:', patterns[0]);
    }
    
    // Emergency fallback if loading takes too long
    if (loading) {
      const timeout = setTimeout(() => {
        console.warn('Loading timeout - forcing default patterns');
        if (patterns.length === 0) {
          // Force load default patterns if still empty
          console.log('No patterns loaded, using defaults');
        }
      }, 5000);
      
      return () => clearTimeout(timeout);
    }
  }, [patterns, loading]);

  // Load custom labels from settings
  useEffect(() => {
    loadCustomLabels();
    loadCountDirection();
  }, []);

  // Reload settings when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadCountDirection();
    }, [])
  );

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
        setCountDirection(savedDirection as 'up' | 'down');
      }
    } catch (error) {
      console.log('Error loading count direction:', error);
    }
  };

  // Voice synthesis function
  const speak = (text: string) => {
    if (Platform.OS === 'web' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    } else {
      Speech.speak(text, { rate: 0.8 });
    }
  };

  // Haptic feedback function
  const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' | 'success') => {
    if (Platform.OS !== 'web') {
      switch (type) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
      }
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
      
      hasSpokenPhaseRef.current = false;
      const nextCycle = nextPhase === 'inhale' ? prevState.cycle + 1 : prevState.cycle;
      const maxCycles = selectedPattern?.repetitions || 5;
      
      if (nextCycle >= maxCycles && nextPhase === 'inhale') {
        runOnJS(triggerHapticFeedback)('success');
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
      
      if (!hasSpokenPhaseRef.current) {
        runOnJS(speak)(getPhaseText(prevState.phase));
        runOnJS(triggerHapticFeedback)(prevState.phase === 'inhale' ? 'medium' : 'light');
        hasSpokenPhaseRef.current = true;
        return prevState;
      }
      
      const newCount = prevState.count + 1;
      
      // Speak the count number based on direction preference
      if (countDirection === 'up') {
        runOnJS(speak)(newCount.toString());
      } else {
        const remainingCount = phaseDuration - newCount + 1;
        runOnJS(speak)(remainingCount.toString());
      }
      
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
    triggerHapticFeedback('medium');
    setState(prev => ({
      ...prev,
      isActive: true,
      isPaused: false,
      phase: 'inhale',
      count: 0,
      cycle: 0,
    }));
  };

  const togglePause = () => {
    setState(prev => ({ ...prev, isPaused: !prev.isPaused }));
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
      inhale: voiceInhale.trim() || 'Inhale',
      hold1: voiceHold1.trim() || 'Hold',
      exhale: voiceExhale.trim() || 'Exhale',
      hold2: voiceHold2.trim() || 'Hold',
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
      setVoiceInhale('Inhale');
      setVoiceHold1('Hold');
      setVoiceExhale('Exhale');
      setVoiceHold2('Hold');
    } catch (error) {
      Alert.alert('Error', 'Failed to create pattern');
    }
  };

  const handlePatternLongPress = (pattern: BreathingPattern) => {
    console.log('Long press on pattern:', pattern.id, pattern.name, 'isCustom:', pattern.isCustom);
    
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
              console.log('Deleting pattern:', pattern.id, pattern.name);
              await deletePattern(pattern.id);
              console.log('Pattern deleted successfully');
              
              // If the deleted pattern was selected, switch to first available pattern
              if (selectedPattern?.id === pattern.id) {
                const remainingPatterns = patterns.filter(p => p.id !== pattern.id);
                console.log('Remaining patterns after deletion:', remainingPatterns.length);
                if (remainingPatterns.length > 0) {
                  setSelectedPattern(remainingPatterns[0]);
                  console.log('Switched to pattern:', remainingPatterns[0].name);
                }
              }
            } catch (error) {
              console.error('Delete pattern error:', error);
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
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
        <View style={[styles.content, { paddingTop: insets.top + 10, paddingBottom: Platform.select({ android: 130, default: 90 }) }]}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Breathe</Text>
          </View>

          {/* Pattern Selection - Recent 4 patterns only */}
          <View style={styles.patternSection}>
            <View style={styles.patternRow}>
              {patterns.slice(-4).map((pattern) => {
                console.log('Rendering pattern:', pattern.id, pattern.name, pattern.isCustom);
                return (
                <TouchableOpacity
                  key={pattern.id}
                  style={[
                    styles.patternChip,
                    selectedPattern.id === pattern.id && styles.activeChip,
                    pattern.isCustom ? styles.customPatternChip : styles.defaultPatternChip
                  ]}
                  onPress={() => { setSelectedPattern(pattern); stopBreathing(); }}
                  onLongPress={() => handlePatternLongPress(pattern)}
                  delayLongPress={500}
                >
                  <View style={styles.patternChipContent}>
                    <Text style={styles.patternChipText} numberOfLines={1}>
                      {pattern.name}
                    </Text>
                    <Text style={[styles.patternIndicator, pattern.isCustom ? styles.customIndicator : styles.defaultIndicator]}>
                      {pattern.isCustom ? '●' : '○'}
                    </Text>
                  </View>
                </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Breathing Circle - Larger */}
          <View style={styles.circleContainer}>
            <Animated.View style={[styles.circle, circleStyle]}>
              <View style={styles.circleInner}>
                <Text style={styles.phaseText}>{getPhaseText(state.phase)}</Text>
                {state.isActive && selectedPattern.ratio[['inhale', 'hold1', 'exhale', 'hold2'].indexOf(state.phase)] > 0 && (
                  <Text style={styles.countText}>
                    {countDirection === 'up' 
                      ? state.count 
                      : selectedPattern.ratio[['inhale', 'hold1', 'exhale', 'hold2'].indexOf(state.phase)] - state.count + 1
                    }
                  </Text>
                )}
              </View>
            </Animated.View>
          </View>

          {/* Progress & Controls Combined */}
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

          {/* Create Custom Pattern - Bottom Row */}
          <View style={styles.bottomSection}>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => {
                console.log('Create button pressed, modal state:', showCreateModal);
                setShowCreateModal(true);
              }}
            >
              <Plus size={20} color="white" />
              <Text style={styles.createButtonText}>Create Custom Pattern</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Create Pattern Modal - Fixed position overlay */}
      {showCreateModal && (
        <View style={styles.modalFixedOverlay}>
          <View style={styles.modalBackground}>
            <TouchableOpacity 
              style={styles.modalBackdrop}
              activeOpacity={1}
              onPress={() => setShowCreateModal(false)}
            />
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Create Custom Pattern</Text>
                  <TouchableOpacity onPress={() => {
                    console.log('Modal close pressed');
                    setShowCreateModal(false);
                  }}>
                    <X size={24} color="#333" />
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
                    placeholderTextColor="#999"
                  />
                  
                  {/* Two Column Layout */}
                  <View style={styles.twoColumnContainer}>
                    
                    {/* Left Column - Timing */}
                    <View style={styles.leftColumn}>
                      <Text style={styles.columnTitle}>Timing (seconds)</Text>
                      
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
                          placeholderTextColor="#999"
                          maxLength={3}
                        />
                      </View>
                    </View>
                    
                    {/* Right Column - Voice Prompts */}
                    <View style={styles.rightColumn}>
                      <Text style={styles.columnTitle}>Voice Prompts</Text>
                      
                      <View style={styles.voicePrompts}>
                        {[
                          { key: 'inhale', label: 'Inhale', value: voiceInhale, setter: setVoiceInhale },
                          { key: 'hold1', label: 'Hold', value: voiceHold1, setter: setVoiceHold1 },
                          { key: 'exhale', label: 'Exhale', value: voiceExhale, setter: setVoiceExhale },
                          { key: 'hold2', label: 'Hold', value: voiceHold2, setter: setVoiceHold2 },
                        ].map(({ key, label, value, setter }) => (
                          <View key={key} style={styles.voicePromptItem}>
                            <Text style={styles.voiceLabel}>{label}:</Text>
                            {editingVoice === key ? (
                              <TextInput
                                style={styles.voiceInput}
                                value={value}
                                onChangeText={setter}
                                onBlur={() => setEditingVoice(null)}
                                autoFocus
                                placeholder={`Say "${label.toLowerCase()}"`}
                                placeholderTextColor="#999"
                              />
                            ) : (
                              <TouchableOpacity 
                                style={styles.voiceDisplay}
                                onPress={() => setEditingVoice(key)}
                              >
                                <Text style={styles.voiceText} numberOfLines={1}>{value}</Text>
                                <Edit3 size={14} color="#666" />
                              </TouchableOpacity>
                            )}
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                  
                  <TouchableOpacity style={styles.createPatternButton} onPress={createCustomPattern}>
                    <Text style={styles.createPatternButtonText}>Create Pattern</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </View>
        </View>
      )}
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
  
  header: { alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '700', color: 'white' },
  
  patternSection: { marginBottom: width < 450 ? 15 : 20 },
  patternRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: width < 450 ? 12 : 15 
  },
  patternChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: width < 450 ? 10 : 12,
    paddingVertical: width < 450 ? 6 : 8,
    borderRadius: 20,
    flex: 1,
    marginHorizontal: width < 450 ? 1 : 2,
    alignItems: 'center',
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
  patternChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patternChipText: { 
    color: 'white', 
    fontSize: width < 450 ? 11 : 12, 
    fontWeight: '600' 
  },
  patternIndicator: { 
    fontSize: 8, 
    marginLeft: 2,
    lineHeight: 12 
  },
  customIndicator: { 
    color: 'rgba(255, 255, 255, 0.9)', 
  },
  defaultIndicator: { 
    color: 'rgba(255, 255, 255, 0.6)', 
  },
  
  createButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  createButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  
  circleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    marginVertical: width < 450 ? 10 : 20, // Better Galaxy Fold support
  },
  circle: {
    width: Math.min(width * (width < 450 ? 0.6 : 0.7), width < 450 ? 220 : 280), // Smaller on Galaxy Fold
    height: Math.min(width * (width < 450 ? 0.6 : 0.7), width < 450 ? 220 : 280),
    borderRadius: Math.min(width * (width < 450 ? 0.3 : 0.35), width < 450 ? 110 : 140),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  circleInner: { alignItems: 'center' },
  phaseText: { 
    fontSize: width < 450 ? 20 : 24, 
    fontWeight: '600', 
    color: 'white', 
    marginBottom: width < 450 ? 6 : 8 
  },
  countText: { 
    fontSize: width < 450 ? 36 : 42, 
    fontWeight: '300', 
    color: 'white' 
  },
  
  controlsSection: { alignItems: 'center', paddingBottom: 20 },
  progressText: { color: 'white', fontSize: 16, fontWeight: '500', marginBottom: 15 },
  controls: { marginBottom: 15 },
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
    paddingTop: 10,
    paddingBottom: 10,
  },
  
  // Modal styles
  modalFixedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10000,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContainer: {
    width: width - 40,
    height: height * 0.85,
    zIndex: 10001,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    height: '100%',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  modalForm: {
    flex: 1,
  },
  modalFormContent: {
    paddingBottom: 20,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
    marginBottom: 12,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  twoColumnContainer: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    marginBottom: 12,
  },
  leftColumn: {
    flex: 0.46,
  },
  rightColumn: {
    flex: 0.54,
  },
  columnTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  timingGrid: {
    gap: 5,
  },
  timingRow: {
    flexDirection: 'row',
    gap: 5,
  },
  timingItem: {
    flex: 1,
    alignItems: 'center',
  },
  timingLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#666',
    marginBottom: 3,
  },
  timingInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    backgroundColor: '#f9f9f9',
    minHeight: 35,
  },
  repsContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  repsInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    backgroundColor: '#f9f9f9',
    width: 80,
    minHeight: 40,
  },
  voicePrompts: {
    gap: 8,
  },
  voicePromptItem: {
    gap: 4,
  },
  voiceLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  voiceDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    minHeight: 35,
  },
  voiceText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  voiceInput: {
    borderWidth: 1,
    borderColor: '#667eea',
    borderRadius: 6,
    padding: 8,
    fontSize: 13,
    color: '#333',
    backgroundColor: 'white',
    minHeight: 35,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    color: '#333',
  },
  createPatternButton: {
    backgroundColor: '#667eea',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  createPatternButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});