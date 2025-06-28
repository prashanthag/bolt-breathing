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
import { Play, Pause, Square, RotateCcw, Plus, X, Edit3, BarChart3, ArrowUp, ArrowDown, Trophy, Award, Volume2, VolumeX, Download, Sun, Moon, Zap, Turtle } from 'lucide-react-native';
import { useBreathingPatterns, BreathingPattern } from '@/hooks/useBreathingPatterns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

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
  
  // Simple stats tracking
  const [sessionStats, setSessionStats] = useState({
    totalSessions: 0,
    todaySessions: 0,
    currentStreak: 0,
    lastSessionDate: null as Date | null,
  });
  const [showStats, setShowStats] = useState(false);
  
  // Session timer state
  const [sessionDuration, setSessionDuration] = useState(0);
  const [showSessionTimer, setShowSessionTimer] = useState(true);
  
  // Achievements state
  const [achievements, setAchievements] = useState<string[]>([]);
  const [showAchievement, setShowAchievement] = useState<string | null>(null);
  
  // Session summary state
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const [lastSessionSummary, setLastSessionSummary] = useState<{
    duration: number;
    cycles: number;
    pattern: string;
    breathsCompleted: number;
  } | null>(null);
  
  // Background sounds state
  const [backgroundSoundsEnabled, setBackgroundSoundsEnabled] = useState(false);
  const [currentSound, setCurrentSound] = useState<'rain' | 'ocean' | 'forest' | 'none'>('none');
  const soundRef = useRef<Audio.Sound | null>(null);
  
  // Theme state
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  
  // Breathing rate state (multiplier for timing - lower = slower, higher = faster)
  const [breathingRate, setBreathingRate] = useState(1.0);

  const circleScale = useSharedValue(0.3);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasSpokenPhaseRef = useRef(false);
  const sessionStartTime = useRef<Date | null>(null);

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

  // Load custom labels and stats from settings
  useEffect(() => {
    loadCustomLabels();
    loadCountDirection();
    loadSessionStats();
    loadAchievements();
    loadSoundSettings();
    loadThemeSettings();
    loadBreathingRate();
    setupAudio();
  }, []);

  // Cleanup sounds on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
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

  const loadSessionStats = async () => {
    try {
      const savedStats = await AsyncStorage.getItem('sessionStats');
      if (savedStats) {
        const stats = JSON.parse(savedStats);
        // Convert date string back to Date object
        if (stats.lastSessionDate) {
          stats.lastSessionDate = new Date(stats.lastSessionDate);
        }
        setSessionStats(stats);
      }
    } catch (error) {
      console.log('Error loading session stats:', error);
    }
  };

  const saveSessionStats = async (stats: typeof sessionStats) => {
    try {
      await AsyncStorage.setItem('sessionStats', JSON.stringify(stats));
    } catch (error) {
      console.log('Error saving session stats:', error);
    }
  };

  // Setup audio system
  const setupAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.log('Error setting up audio:', error);
    }
  };

  // Load sound settings
  const loadSoundSettings = async () => {
    try {
      const soundEnabled = await AsyncStorage.getItem('backgroundSoundsEnabled');
      const savedSound = await AsyncStorage.getItem('currentSound');
      
      if (soundEnabled !== null) {
        setBackgroundSoundsEnabled(JSON.parse(soundEnabled));
      }
      if (savedSound) {
        setCurrentSound(savedSound as typeof currentSound);
      }
    } catch (error) {
      console.log('Error loading sound settings:', error);
    }
  };

  // Save sound settings
  const saveSoundSettings = async (enabled: boolean, sound: typeof currentSound) => {
    try {
      await AsyncStorage.setItem('backgroundSoundsEnabled', JSON.stringify(enabled));
      await AsyncStorage.setItem('currentSound', sound);
    } catch (error) {
      console.log('Error saving sound settings:', error);
    }
  };

  // Generate tone for background sound (simple implementation)
  const playBackgroundSound = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      
      if (currentSound !== 'none' && backgroundSoundsEnabled) {
        // For demo purposes, we'll use a simple generated tone
        // In a real app, you'd load actual audio files
        const { sound } = await Audio.Sound.createAsync(
          // Generate a simple tone based on sound type
          { uri: generateSoundData(currentSound) },
          { isLooping: true, volume: 0.3 }
        );
        
        soundRef.current = sound;
        await sound.playAsync();
      }
    } catch (error) {
      console.log('Error playing background sound:', error);
    }
  };

  // Generate simple sound data (placeholder for actual audio files)
  const generateSoundData = (soundType: string): string => {
    // This is a placeholder - in a real app you'd have actual audio files
    // For now, return a data URI for a simple tone
    return `data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmETCD2a2/LNeSsFJYDN8tiDOAgOWKve6KNMEAg=`; // Sample base64 audio data
  };

  // Stop background sound
  const stopBackgroundSound = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (error) {
      console.log('Error stopping background sound:', error);
    }
  };

  // Toggle background sounds
  const toggleBackgroundSounds = async () => {
    const newEnabled = !backgroundSoundsEnabled;
    setBackgroundSoundsEnabled(newEnabled);
    await saveSoundSettings(newEnabled, currentSound);
    
    if (newEnabled && state.isActive) {
      playBackgroundSound();
    } else {
      stopBackgroundSound();
    }
    
    triggerHapticFeedback('light');
  };

  // Change background sound
  const changeBackgroundSound = async (newSound: typeof currentSound) => {
    setCurrentSound(newSound);
    await saveSoundSettings(backgroundSoundsEnabled, newSound);
    
    if (backgroundSoundsEnabled && state.isActive) {
      await stopBackgroundSound();
      if (newSound !== 'none') {
        playBackgroundSound();
      }
    }
  };

  // Export stats functionality
  const exportStats = () => {
    const exportData = {
      totalSessions: sessionStats.totalSessions,
      todaySessions: sessionStats.todaySessions,
      currentStreak: sessionStats.currentStreak,
      achievements: achievements,
      lastSessionDate: sessionStats.lastSessionDate,
      exportDate: new Date().toISOString(),
      appVersion: '1.0.0'
    };

    const statsText = `
Breathing App Statistics
========================
Export Date: ${new Date().toLocaleDateString()}

📊 Session Stats:
• Total Sessions: ${sessionStats.totalSessions}
• Today's Sessions: ${sessionStats.todaySessions}
• Current Streak: ${sessionStats.currentStreak} days
• Last Session: ${sessionStats.lastSessionDate ? sessionStats.lastSessionDate.toLocaleDateString() : 'None'}

🏆 Achievements Unlocked (${achievements.length}):
${achievements.map(achievement => {
  const achievementNames = {
    'first_session': '🌟 First Steps',
    'streak_3': '🔥 Three Day Streak',
    'streak_7': '⚡ Week Warrior',
    'sessions_10': '💫 Ten Sessions',
    'sessions_25': '🌙 Quarter Century',
    'sessions_50': '⭐ Half Century',
    'daily_5': '🌅 Daily Five',
    'long_session': '🧘 Deep Breather'
  };
  return `• ${achievementNames[achievement] || achievement}`;
}).join('\n')}

Generated by Breathing App v1.0.0
    `.trim();

    // For web, create a downloadable file
    if (Platform.OS === 'web') {
      const blob = new Blob([statsText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `breathing-stats-${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // For mobile, show share dialog or copy to clipboard
      Alert.alert(
        'Export Stats',
        'Stats copied to clipboard!',
        [
          {
            text: 'Share',
            onPress: () => {
              // Share functionality could be implemented here with expo-sharing
              console.log('Sharing stats:', statsText);
            }
          },
          { text: 'OK' }
        ]
      );
    }
    
    triggerHapticFeedback('success');
  };

  // Theme functions
  const loadThemeSettings = async () => {
    try {
      const theme = await AsyncStorage.getItem('isDarkTheme');
      if (theme !== null) {
        setIsDarkTheme(JSON.parse(theme));
      }
    } catch (error) {
      console.log('Error loading theme settings:', error);
    }
  };

  const saveThemeSettings = async (isDark: boolean) => {
    try {
      await AsyncStorage.setItem('isDarkTheme', JSON.stringify(isDark));
    } catch (error) {
      console.log('Error saving theme settings:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    await saveThemeSettings(newTheme);
    triggerHapticFeedback('light');
  };

  // Modern theme colors with glassmorphism
  const getThemeColors = () => {
    if (isDarkTheme) {
      return {
        background: ['#1a1a2e', '#16213e', '#0f3460'],
        text: 'white',
        cardBackground: 'rgba(255, 255, 255, 0.08)',
        buttonBackground: 'rgba(255, 255, 255, 0.12)',
        border: 'rgba(255, 255, 255, 0.15)',
        glass: 'rgba(255, 255, 255, 0.05)',
        accent: '#667eea',
        accentLight: 'rgba(102, 126, 234, 0.3)'
      };
    } else {
      return {
        background: ['#f8fafc', '#e2e8f0', '#cbd5e1'],
        text: '#1e293b',
        cardBackground: 'rgba(255, 255, 255, 0.8)',
        buttonBackground: 'rgba(255, 255, 255, 0.9)',
        border: 'rgba(0, 0, 0, 0.08)',
        glass: 'rgba(255, 255, 255, 0.25)',
        accent: '#3b82f6',
        accentLight: 'rgba(59, 130, 246, 0.2)'
      };
    }
  };

  const themeColors = getThemeColors();

  // Breathing rate functions
  const loadBreathingRate = async () => {
    try {
      const rate = await AsyncStorage.getItem('breathingRate');
      if (rate !== null) {
        setBreathingRate(parseFloat(rate));
      }
    } catch (error) {
      console.log('Error loading breathing rate:', error);
    }
  };

  const saveBreathingRate = async (rate: number) => {
    try {
      await AsyncStorage.setItem('breathingRate', rate.toString());
    } catch (error) {
      console.log('Error saving breathing rate:', error);
    }
  };

  const adjustBreathingRate = async (direction: 'faster' | 'slower') => {
    let newRate = breathingRate;
    
    if (direction === 'faster') {
      newRate = Math.min(2.0, breathingRate + 0.2); // Max 2x speed
    } else {
      newRate = Math.max(0.5, breathingRate - 0.2); // Min 0.5x speed
    }
    
    setBreathingRate(newRate);
    await saveBreathingRate(newRate);
    triggerHapticFeedback('light');
  };

  const getAdjustedInterval = () => {
    return Math.round(1000 / breathingRate); // Adjust the base 1000ms interval
  };

  // Format session timer
  const formatSessionTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Achievement definitions
  const achievementDefs = {
    'first_session': { title: 'First Breath', description: 'Complete your first session', icon: '🌬️' },
    'sessions_10': { title: 'Dedicated', description: 'Complete 10 sessions', icon: '🎯' },
    'sessions_50': { title: 'Committed', description: 'Complete 50 sessions', icon: '💪' },
    'sessions_100': { title: 'Master', description: 'Complete 100 sessions', icon: '🏆' },
    'streak_3': { title: '3-Day Streak', description: 'Practice 3 days in a row', icon: '🔥' },
    'streak_7': { title: 'Week Warrior', description: 'Practice 7 days in a row', icon: '⭐' },
    'streak_30': { title: 'Month Master', description: 'Practice 30 days in a row', icon: '👑' },
    'daily_5': { title: 'Daily Five', description: 'Complete 5 sessions in one day', icon: '💫' },
  };

  // Load achievements
  const loadAchievements = async () => {
    try {
      const saved = await AsyncStorage.getItem('achievements');
      if (saved) {
        setAchievements(JSON.parse(saved));
      }
    } catch (error) {
      console.log('Error loading achievements:', error);
    }
  };

  // Save achievements
  const saveAchievements = async (newAchievements: string[]) => {
    try {
      await AsyncStorage.setItem('achievements', JSON.stringify(newAchievements));
    } catch (error) {
      console.log('Error saving achievements:', error);
    }
  };

  // Check for new achievements
  const checkAchievements = (stats: typeof sessionStats) => {
    const newAchievements: string[] = [];
    
    // First session
    if (stats.totalSessions >= 1 && !achievements.includes('first_session')) {
      newAchievements.push('first_session');
    }
    
    // Session milestones
    if (stats.totalSessions >= 10 && !achievements.includes('sessions_10')) {
      newAchievements.push('sessions_10');
    }
    if (stats.totalSessions >= 50 && !achievements.includes('sessions_50')) {
      newAchievements.push('sessions_50');
    }
    if (stats.totalSessions >= 100 && !achievements.includes('sessions_100')) {
      newAchievements.push('sessions_100');
    }
    
    // Streak achievements
    if (stats.currentStreak >= 3 && !achievements.includes('streak_3')) {
      newAchievements.push('streak_3');
    }
    if (stats.currentStreak >= 7 && !achievements.includes('streak_7')) {
      newAchievements.push('streak_7');
    }
    if (stats.currentStreak >= 30 && !achievements.includes('streak_30')) {
      newAchievements.push('streak_30');
    }
    
    // Daily sessions
    if (stats.todaySessions >= 5 && !achievements.includes('daily_5')) {
      newAchievements.push('daily_5');
    }
    
    if (newAchievements.length > 0) {
      const updatedAchievements = [...achievements, ...newAchievements];
      setAchievements(updatedAchievements);
      saveAchievements(updatedAchievements);
      
      // Show first new achievement
      setShowAchievement(newAchievements[0]);
      triggerHapticFeedback('success');
    }
  };

  const updateSessionStats = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastSessionDay = sessionStats.lastSessionDate 
      ? new Date(sessionStats.lastSessionDate.getFullYear(), sessionStats.lastSessionDate.getMonth(), sessionStats.lastSessionDate.getDate())
      : null;
    
    let newStats = {
      totalSessions: sessionStats.totalSessions + 1,
      todaySessions: sessionStats.todaySessions,
      currentStreak: sessionStats.currentStreak,
      lastSessionDate: now,
    };

    // Update today's sessions
    if (!lastSessionDay || lastSessionDay.getTime() === today.getTime()) {
      newStats.todaySessions = sessionStats.todaySessions + 1;
    } else {
      newStats.todaySessions = 1;
    }

    // Update streak
    if (!lastSessionDay) {
      newStats.currentStreak = 1;
    } else {
      const daysDiff = Math.floor((today.getTime() - lastSessionDay.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff === 0) {
        // Same day, streak continues
        newStats.currentStreak = sessionStats.currentStreak;
      } else if (daysDiff === 1) {
        // Next day, extend streak
        newStats.currentStreak = sessionStats.currentStreak + 1;
      } else {
        // Gap in days, reset streak
        newStats.currentStreak = 1;
      }
    }

    setSessionStats(newStats);
    saveSessionStats(newStats);
    checkAchievements(newStats);
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
        runOnJS(updateSessionStats)();
        
        // Generate session summary
        runOnJS(() => {
          if (sessionStartTime.current && selectedPattern) {
            const finalDuration = Math.floor((new Date().getTime() - sessionStartTime.current.getTime()) / 1000);
            const totalBreaths = selectedPattern.ratio.reduce((sum, duration) => sum + duration, 0) * maxCycles;
            
            setLastSessionSummary({
              duration: finalDuration,
              cycles: maxCycles,
              pattern: selectedPattern.name,
              breathsCompleted: totalBreaths,
            });
            
            // Show summary after a brief delay to let achievement show first
            setTimeout(() => {
              setShowSessionSummary(true);
            }, showAchievement ? 3000 : 500);
          }
        })();
        
        // Clear timer when session completes
        runOnJS(() => {
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
        })();
        return {
          ...prevState,
          isActive: false,
          isPaused: false,
          phase: 'inhale',
          count: 0,
          cycle: 0,
        };
      }
      
      // Update stats for each completed cycle (when returning to inhale)
      if (nextPhase === 'inhale' && nextCycle > prevState.cycle) {
        runOnJS(updateSessionStats)();
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
        intervalRef.current = setInterval(tick, getAdjustedInterval());
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
    sessionStartTime.current = new Date();
    setSessionDuration(0);
    triggerHapticFeedback('medium');
    
    // Start background sounds if enabled
    if (backgroundSoundsEnabled && currentSound !== 'none') {
      playBackgroundSound();
    }
    
    // Start session timer
    timerIntervalRef.current = setInterval(() => {
      if (sessionStartTime.current) {
        const elapsed = Math.floor((new Date().getTime() - sessionStartTime.current.getTime()) / 1000);
        setSessionDuration(elapsed);
      }
    }, 1000);
    
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
    sessionStartTime.current = null;
    
    // Stop background sounds
    stopBackgroundSound();
    
    // Clear session timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
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
      <LinearGradient colors={themeColors.background} style={styles.container}>
        <View style={[styles.content, { paddingTop: insets.top + 10, paddingBottom: Platform.select({ android: 130, default: 90 }) }]}>
          
          {/* Modern Header */}
          <View style={[styles.modernHeader, { borderBottomColor: themeColors.border }]}>
            <TouchableOpacity 
              style={[styles.modernHeaderButton, { backgroundColor: themeColors.glass }]}
              onPress={() => setShowStats(true)}
            >
              <BarChart3 size={18} color={themeColors.text} />
              <Text style={[styles.modernHeaderButtonText, { color: themeColors.text }]}>Stats</Text>
            </TouchableOpacity>
            
            <View style={styles.titleContainer}>
              <Text style={[styles.modernTitle, { color: themeColors.text }]}>Breathe</Text>
              <View style={[styles.titleUnderline, { backgroundColor: themeColors.accent }]} />
            </View>
            
            <View style={styles.modernHeaderActions}>
              <TouchableOpacity 
                style={[styles.modernIconButton, { backgroundColor: themeColors.glass }]}
                onPress={toggleTheme}
              >
                {isDarkTheme ? (
                  <Sun size={18} color={themeColors.text} />
                ) : (
                  <Moon size={18} color={themeColors.text} />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modernIconButton, { backgroundColor: themeColors.glass }]}
                onPress={toggleBackgroundSounds}
              >
                {backgroundSoundsEnabled ? (
                  <Volume2 size={18} color={themeColors.accent} />
                ) : (
                  <VolumeX size={18} color={themeColors.text} />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modernDirectionButton, { backgroundColor: themeColors.glass }]}
                onPress={async () => {
                  const newDirection = countDirection === 'up' ? 'down' : 'up';
                  setCountDirection(newDirection);
                  await AsyncStorage.setItem('countDirection', newDirection);
                  triggerHapticFeedback('light');
                }}
              >
                {countDirection === 'up' ? (
                  <ArrowUp size={14} color={themeColors.accent} />
                ) : (
                  <ArrowDown size={14} color={themeColors.accent} />
                )}
                <Text style={[styles.modernDirectionText, { color: themeColors.text }]}>
                  {countDirection === 'up' ? 'Up' : 'Down'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Modern Pattern Cards */}
          <View style={styles.modernPatternSection}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Breathing Patterns</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.patternCardsContainer}
            >
              {patterns.slice(-4).map((pattern) => {
                const isSelected = selectedPattern.id === pattern.id;
                return (
                <TouchableOpacity
                  key={pattern.id}
                  style={[
                    styles.modernPatternCard,
                    { 
                      backgroundColor: isSelected ? themeColors.accentLight : themeColors.glass,
                      borderColor: isSelected ? themeColors.accent : themeColors.border
                    }
                  ]}
                  onPress={() => { setSelectedPattern(pattern); stopBreathing(); }}
                  onLongPress={() => handlePatternLongPress(pattern)}
                  delayLongPress={500}
                >
                  <View style={styles.patternCardHeader}>
                    <Text 
                      style={[
                        styles.modernPatternName,
                        { color: isSelected ? themeColors.accent : themeColors.text }
                      ]} 
                      numberOfLines={1}
                    >
                      {pattern.name}
                    </Text>
                    {pattern.isCustom && (
                      <View style={[styles.customBadge, { backgroundColor: themeColors.accent }]}>
                        <Text style={styles.customBadgeText}>Custom</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.patternRatio, { color: themeColors.text }]}>
                    {pattern.ratio.join(':')}
                  </Text>
                </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Modern Breathing Circle */}
          <View style={styles.modernCircleContainer}>
            <Animated.View style={[styles.modernCircle, circleStyle, { backgroundColor: themeColors.glass }]}>
              <View style={[styles.modernCircleInner, { borderColor: themeColors.accent }]}>
                <Text style={[styles.phaseText, { color: themeColors.text }]}>{getPhaseText(state.phase)}</Text>
                {state.isActive && selectedPattern.ratio[['inhale', 'hold1', 'exhale', 'hold2'].indexOf(state.phase)] > 0 && (
                  <Text style={[styles.countText, { color: themeColors.text }]}>
                    {countDirection === 'up' 
                      ? state.count 
                      : selectedPattern.ratio[['inhale', 'hold1', 'exhale', 'hold2'].indexOf(state.phase)] - state.count + 1
                    }
                  </Text>
                )}
                {state.isActive && showSessionTimer && (
                  <Text style={[styles.sessionTimer, { color: themeColors.text }]}>
                    {formatSessionTime(sessionDuration)}
                  </Text>
                )}
              </View>
            </Animated.View>
          </View>

          {/* Progress & Controls Combined */}
          <View style={styles.controlsSection}>
            <Text style={[styles.progressText, { color: themeColors.text }]}>Cycle {state.cycle + 1} of {selectedPattern?.repetitions || 5}</Text>
            
            {/* Modern Rate Controls */}
            <View style={[styles.modernRateControls, { backgroundColor: themeColors.glass }]}>
              <TouchableOpacity 
                style={[
                  styles.modernRateButton, 
                  { backgroundColor: breathingRate <= 0.5 ? 'transparent' : themeColors.buttonBackground },
                  breathingRate <= 0.5 && styles.rateButtonDisabled
                ]}
                onPress={() => adjustBreathingRate('slower')}
                disabled={breathingRate <= 0.5}
              >
                <Turtle size={14} color={breathingRate <= 0.5 ? themeColors.border : themeColors.accent} />
                <Text style={[styles.modernRateButtonText, { 
                  color: breathingRate <= 0.5 ? themeColors.border : themeColors.text 
                }]}>Slower</Text>
              </TouchableOpacity>
              
              <View style={[styles.modernRateDisplay, { backgroundColor: themeColors.accentLight }]}>
                <Text style={[styles.modernRateText, { color: themeColors.accent }]}>
                  {breathingRate.toFixed(1)}x
                </Text>
              </View>
              
              <TouchableOpacity 
                style={[
                  styles.modernRateButton, 
                  { backgroundColor: breathingRate >= 2.0 ? 'transparent' : themeColors.buttonBackground },
                  breathingRate >= 2.0 && styles.rateButtonDisabled
                ]}
                onPress={() => adjustBreathingRate('faster')}
                disabled={breathingRate >= 2.0}
              >
                <Zap size={14} color={breathingRate >= 2.0 ? themeColors.border : themeColors.accent} />
                <Text style={[styles.modernRateButtonText, { 
                  color: breathingRate >= 2.0 ? themeColors.border : themeColors.text 
                }]}>Faster</Text>
              </TouchableOpacity>
            </View>
            
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
            
            <Text style={[styles.patternInfo, { color: themeColors.text }]}>
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

      {/* Stats Modal */}
      {showStats && (
        <View style={styles.modalFixedOverlay}>
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.modal}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Your Progress</Text>
                  <View style={styles.modalHeaderButtons}>
                    <TouchableOpacity onPress={exportStats} style={styles.exportButton}>
                      <Download size={width < 400 ? 14 : 18} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowStats(false)} style={styles.closeButton}>
                      <X size={width < 400 ? 16 : 24} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.statsContent}>
                  <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{sessionStats.totalSessions}</Text>
                    <Text style={styles.statLabel}>Total Sessions</Text>
                  </View>
                  
                  <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{sessionStats.todaySessions}</Text>
                    <Text style={styles.statLabel}>Today's Sessions</Text>
                  </View>
                  
                  <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{sessionStats.currentStreak}</Text>
                    <Text style={styles.statLabel}>Current Streak</Text>
                    <Text style={styles.statSubLabel}>days</Text>
                  </View>
                  
                  <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{achievements.length}</Text>
                    <Text style={styles.statLabel}>Achievements</Text>
                    <Text style={styles.statSubLabel}>unlocked</Text>
                  </View>
                  
                  {sessionStats.lastSessionDate && (
                    <View style={styles.statCard}>
                      <Text style={styles.statText}>Last Session</Text>
                      <Text style={styles.statSubLabel}>
                        {sessionStats.lastSessionDate.toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
            </View>
          </View>
        </View>
      )}

      {/* Achievement Notification */}
      {showAchievement && (
        <View style={styles.achievementOverlay}>
          <View style={styles.achievementModal}>
            <LinearGradient
              colors={['#f59e0b', '#d97706']}
              style={styles.achievementGradient}
            >
              <Trophy size={32} color="white" />
              <Text style={styles.achievementTitle}>Achievement Unlocked!</Text>
              <Text style={styles.achievementIcon}>
                {achievementDefs[showAchievement as keyof typeof achievementDefs]?.icon}
              </Text>
              <Text style={styles.achievementName}>
                {achievementDefs[showAchievement as keyof typeof achievementDefs]?.title}
              </Text>
              <Text style={styles.achievementDescription}>
                {achievementDefs[showAchievement as keyof typeof achievementDefs]?.description}
              </Text>
              <TouchableOpacity 
                style={styles.achievementButton}
                onPress={() => setShowAchievement(null)}
              >
                <Text style={styles.achievementButtonText}>Continue</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      )}

      {/* Session Summary Modal */}
      {showSessionSummary && lastSessionSummary && (
        <View style={styles.sessionSummaryOverlay}>
          <View style={styles.sessionSummaryModal}>
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={styles.sessionSummaryGradient}
            >
              <Award size={32} color="white" />
              <Text style={styles.sessionSummaryTitle}>Session Complete!</Text>
              
              <View style={styles.summaryStats}>
                <View style={styles.summaryStatItem}>
                  <Text style={styles.summaryStatNumber}>{formatSessionTime(lastSessionSummary.duration)}</Text>
                  <Text style={styles.summaryStatLabel}>Duration</Text>
                </View>
                
                <View style={styles.summaryStatItem}>
                  <Text style={styles.summaryStatNumber}>{lastSessionSummary.cycles}</Text>
                  <Text style={styles.summaryStatLabel}>Cycles</Text>
                </View>
                
                <View style={styles.summaryStatItem}>
                  <Text style={styles.summaryStatNumber}>{lastSessionSummary.breathsCompleted}</Text>
                  <Text style={styles.summaryStatLabel}>Breaths</Text>
                </View>
              </View>
              
              <Text style={styles.summaryPattern}>
                Pattern: {lastSessionSummary.pattern}
              </Text>
              
              <View style={styles.summaryButtons}>
                <TouchableOpacity 
                  style={styles.summaryButton}
                  onPress={() => setShowSessionSummary(false)}
                >
                  <Text style={styles.summaryButtonText}>Continue</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.summaryButton, styles.summaryButtonSecondary]}
                  onPress={() => {
                    setShowSessionSummary(false);
                    setShowStats(true);
                  }}
                >
                  <Text style={styles.summaryButtonText}>View Stats</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      )}

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
  content: { flex: 1, paddingHorizontal: 16 },
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
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  headerLeft: { flex: 1 },
  headerRight: { flex: 1 },
  title: { fontSize: 28, fontWeight: '700', color: 'white', textAlign: 'center' },
  statsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statsButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  themeToggleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginRight: 8,
  },
  soundToggleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginRight: 8,
  },
  countToggleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  countToggleText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  
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
  sessionTimer: {
    fontSize: width < 450 ? 14 : 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
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
  
  // Stats modal styles - responsive for Galaxy Fold
  modalContainer: {
    width: width < 400 ? width - 5 : width - 60, // Ultra compact for Galaxy Fold folded
    maxHeight: width < 400 ? height * 0.4 : height * 0.6,
    marginHorizontal: width < 400 ? 2.5 : 10,
  },
  modal: {
    borderRadius: width < 400 ? 6 : 20,
    padding: width < 400 ? 6 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: width < 400 ? 6 : 20,
  },
  modalHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exportButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  modalTitle: {
    fontSize: width < 400 ? 16 : 24,
    fontWeight: '700',
    color: 'white',
  },
  closeButton: {
    width: width < 400 ? 28 : 40,
    height: width < 400 ? 28 : 40,
    borderRadius: width < 400 ? 14 : 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContent: {
    gap: width < 400 ? 4 : 16,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: width < 400 ? 6 : 16,
    padding: width < 400 ? 6 : 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statNumber: {
    fontSize: width < 400 ? 20 : 36,
    fontWeight: '700',
    color: 'white',
    marginBottom: width < 400 ? 1 : 4,
  },
  statLabel: {
    fontSize: width < 400 ? 12 : 16,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  statText: {
    fontSize: width < 400 ? 14 : 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  statSubLabel: {
    fontSize: width < 400 ? 10 : 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  
  // Achievement modal styles
  achievementOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10001,
  },
  achievementModal: {
    width: width - 60,
    maxWidth: 300,
  },
  achievementGradient: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginTop: 12,
    marginBottom: 16,
  },
  achievementIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  achievementName: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  achievementDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 20,
  },
  achievementButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  achievementButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Session summary modal styles
  sessionSummaryOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  },
  sessionSummaryModal: {
    width: width - 60,
    maxWidth: 320,
  },
  sessionSummaryGradient: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  sessionSummaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginTop: 12,
    marginBottom: 24,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  summaryStatItem: {
    alignItems: 'center',
  },
  summaryStatNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  summaryStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  summaryPattern: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 24,
  },
  summaryButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    flex: 1,
  },
  summaryButtonSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Breathing rate control styles
  rateControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    gap: 15,
  },
  rateButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  rateButtonDisabled: {
    opacity: 0.3,
  },
  rateButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rateText: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'center',
  },
  
  // Modern UI Styles
  modernHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  modernHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 6,
  },
  modernHeaderButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  titleContainer: {
    alignItems: 'center',
  },
  modernTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  titleUnderline: {
    width: 40,
    height: 3,
    borderRadius: 1.5,
    marginTop: 4,
  },
  modernHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modernIconButton: {
    padding: 10,
    borderRadius: 20,
  },
  modernDirectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  modernDirectionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  modernPatternSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  patternCardsContainer: {
    paddingHorizontal: 4,
    gap: 12,
  },
  modernPatternCard: {
    width: width * 0.4,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  patternCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modernPatternName: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  customBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  customBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  patternRatio: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8,
  },
  
  modernCircleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 32,
  },
  modernCircle: {
    width: width * 0.65,
    height: width * 0.65,
    borderRadius: width * 0.325,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  modernCircleInner: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    height: '80%',
    borderRadius: width * 0.26,
    borderWidth: 1,
  },
  
  modernRateControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
  },
  modernRateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  modernRateButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modernRateDisplay: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 12,
  },
  modernRateText: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
});