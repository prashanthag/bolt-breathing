import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';

export interface MoodAnalysis {
  primaryMood: 'calm' | 'stressed' | 'anxious' | 'energetic' | 'tired' | 'focused' | 'overwhelmed';
  confidence: number; // 0-1
  energy: number; // 0-1 (low to high)
  stress: number; // 0-1 (calm to stressed)
  focus: number; // 0-1 (scattered to focused)
  timestamp: Date;
  recommendedPattern: string;
  recommendedEnvironment: string;
  aiInsights: string[];
}

export interface VoiceAnalysis {
  pitch: number;
  speed: number;
  volume: number;
  breathingRate: number;
  stressIndicators: string[];
}

export interface MoodHistory {
  date: string;
  moods: MoodAnalysis[];
  averageMood: string;
  improvement: number;
}

// Simulated AI mood detection (in production, this would use actual voice/ML analysis)
const MOOD_PATTERNS = {
  calm: {
    pitch: { min: 80, max: 150 },
    speed: { min: 0.8, max: 1.2 },
    breathingRate: { min: 12, max: 16 },
    keywords: ['peaceful', 'relaxed', 'good', 'fine', 'okay'],
    recommendations: {
      pattern: 'Coherent Breathing (5:5:5:5)',
      environment: 'zen_garden',
      insights: ['You seem centered today', 'Perfect time for mindful breathing']
    }
  },
  stressed: {
    pitch: { min: 150, max: 220 },
    speed: { min: 1.3, max: 1.8 },
    breathingRate: { min: 18, max: 25 },
    keywords: ['stressed', 'busy', 'overwhelmed', 'pressure', 'deadline'],
    recommendations: {
      pattern: '4-7-8 Relaxing',
      environment: 'ocean_depths',
      insights: ['Deep breathing will help reduce cortisol', 'Focus on extending your exhale']
    }
  },
  anxious: {
    pitch: { min: 160, max: 250 },
    speed: { min: 1.4, max: 2.0 },
    breathingRate: { min: 20, max: 30 },
    keywords: ['worried', 'nervous', 'anxious', 'scared', 'uncertain'],
    recommendations: {
      pattern: 'Box Breathing (4:4:4:4)',
      environment: 'forest_sanctuary',
      insights: ['Box breathing activates your parasympathetic nervous system', 'Grounding techniques work well with this pattern']
    }
  },
  energetic: {
    pitch: { min: 120, max: 200 },
    speed: { min: 1.2, max: 1.6 },
    breathingRate: { min: 14, max: 18 },
    keywords: ['excited', 'energetic', 'motivated', 'ready', 'pumped'],
    recommendations: {
      pattern: 'Energizing (4:1:4:1)',
      environment: 'sunset_peak',
      insights: ['Channel this energy with focused breathing', 'Great time for achievement-focused session']
    }
  },
  tired: {
    pitch: { min: 60, max: 120 },
    speed: { min: 0.6, max: 1.0 },
    breathingRate: { min: 10, max: 14 },
    keywords: ['tired', 'exhausted', 'sleepy', 'drained', 'low'],
    recommendations: {
      pattern: 'Deep Sleep (6:2:8:2)',
      environment: 'cosmic_void',
      insights: ['Slow, deep breathing will help restore energy', 'Focus on longer inhales to energize']
    }
  },
  focused: {
    pitch: { min: 100, max: 160 },
    speed: { min: 0.9, max: 1.3 },
    breathingRate: { min: 14, max: 17 },
    keywords: ['focused', 'clear', 'productive', 'sharp', 'alert'],
    recommendations: {
      pattern: 'Coherent Breathing (5:5:5:5)',
      environment: 'crystal_cave',
      insights: ['Maintain this clarity with rhythmic breathing', 'Perfect mental state for deep practice']
    }
  },
  overwhelmed: {
    pitch: { min: 140, max: 200 },
    speed: { min: 1.3, max: 1.9 },
    breathingRate: { min: 19, max: 28 },
    keywords: ['overwhelmed', 'chaos', 'too much', 'crazy', 'intense'],
    recommendations: {
      pattern: '4-7-8 Relaxing',
      environment: 'zen_garden',
      insights: ['Break the overwhelm cycle with slow exhales', 'One breath at a time brings clarity']
    }
  }
};

export function useMoodDetection() {
  const [currentMood, setCurrentMood] = useState<MoodAnalysis | null>(null);
  const [moodHistory, setMoodHistory] = useState<MoodHistory[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [voiceInput, setVoiceInput] = useState<string>('');
  const [showMoodCheck, setShowMoodCheck] = useState(false);
  const [aiCoachMessage, setAiCoachMessage] = useState<string>('');

  useEffect(() => {
    loadMoodHistory();
    checkDailyMoodPrompt();
  }, []);

  const loadMoodHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem('moodHistory');
      if (savedHistory) {
        setMoodHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.log('Error loading mood history:', error);
    }
  };

  const saveMoodHistory = async (newHistory: MoodHistory[]) => {
    try {
      await AsyncStorage.setItem('moodHistory', JSON.stringify(newHistory));
      setMoodHistory(newHistory);
    } catch (error) {
      console.log('Error saving mood history:', error);
    }
  };

  const checkDailyMoodPrompt = async () => {
    try {
      const lastCheck = await AsyncStorage.getItem('lastMoodCheck');
      const today = new Date().toDateString();
      
      if (lastCheck !== today) {
        setShowMoodCheck(true);
        await AsyncStorage.setItem('lastMoodCheck', today);
      }
    } catch (error) {
      console.log('Error checking daily mood prompt:', error);
    }
  };

  const analyzeMoodFromText = (text: string): MoodAnalysis => {
    const lowerText = text.toLowerCase();
    let detectedMood: keyof typeof MOOD_PATTERNS = 'calm';
    let maxMatches = 0;

    // Analyze text for mood keywords
    Object.entries(MOOD_PATTERNS).forEach(([mood, pattern]) => {
      const matches = pattern.keywords.filter(keyword => 
        lowerText.includes(keyword)
      ).length;
      
      if (matches > maxMatches) {
        maxMatches = matches;
        detectedMood = mood as keyof typeof MOOD_PATTERNS;
      }
    });

    // Simulate voice analysis metrics
    const mockVoiceAnalysis = generateMockVoiceAnalysis(detectedMood);
    
    // Calculate confidence based on keyword matches and voice analysis
    const confidence = Math.min(0.95, 0.6 + (maxMatches * 0.1) + Math.random() * 0.2);
    
    const moodPattern = MOOD_PATTERNS[detectedMood];
    
    return {
      primaryMood: detectedMood,
      confidence,
      energy: calculateEnergyLevel(detectedMood),
      stress: calculateStressLevel(detectedMood),
      focus: calculateFocusLevel(detectedMood),
      timestamp: new Date(),
      recommendedPattern: moodPattern.recommendations.pattern,
      recommendedEnvironment: moodPattern.recommendations.environment,
      aiInsights: moodPattern.recommendations.insights
    };
  };

  const generateMockVoiceAnalysis = (mood: keyof typeof MOOD_PATTERNS): VoiceAnalysis => {
    const pattern = MOOD_PATTERNS[mood];
    
    return {
      pitch: pattern.pitch.min + Math.random() * (pattern.pitch.max - pattern.pitch.min),
      speed: pattern.speed.min + Math.random() * (pattern.speed.max - pattern.speed.min),
      volume: 0.3 + Math.random() * 0.7,
      breathingRate: pattern.breathingRate.min + Math.random() * (pattern.breathingRate.max - pattern.breathingRate.min),
      stressIndicators: mood === 'stressed' || mood === 'anxious' || mood === 'overwhelmed' 
        ? ['rapid speech', 'voice tremor', 'shallow breathing']
        : []
    };
  };

  const calculateEnergyLevel = (mood: keyof typeof MOOD_PATTERNS): number => {
    const energyMap = {
      calm: 0.6,
      stressed: 0.8,
      anxious: 0.7,
      energetic: 0.9,
      tired: 0.2,
      focused: 0.7,
      overwhelmed: 0.8
    };
    return energyMap[mood] + (Math.random() - 0.5) * 0.2;
  };

  const calculateStressLevel = (mood: keyof typeof MOOD_PATTERNS): number => {
    const stressMap = {
      calm: 0.1,
      stressed: 0.9,
      anxious: 0.8,
      energetic: 0.3,
      tired: 0.4,
      focused: 0.2,
      overwhelmed: 0.95
    };
    return stressMap[mood] + (Math.random() - 0.5) * 0.1;
  };

  const calculateFocusLevel = (mood: keyof typeof MOOD_PATTERNS): number => {
    const focusMap = {
      calm: 0.7,
      stressed: 0.3,
      anxious: 0.2,
      energetic: 0.6,
      tired: 0.3,
      focused: 0.9,
      overwhelmed: 0.1
    };
    return focusMap[mood] + (Math.random() - 0.5) * 0.2;
  };

  const performMoodAnalysis = async (textInput: string) => {
    setIsAnalyzing(true);
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const analysis = analyzeMoodFromText(textInput);
    setCurrentMood(analysis);
    
    // Update mood history
    const today = new Date().toDateString();
    const updatedHistory = [...moodHistory];
    const todayIndex = updatedHistory.findIndex(h => h.date === today);
    
    if (todayIndex >= 0) {
      updatedHistory[todayIndex].moods.push(analysis);
    } else {
      updatedHistory.push({
        date: today,
        moods: [analysis],
        averageMood: analysis.primaryMood,
        improvement: 0
      });
    }
    
    await saveMoodHistory(updatedHistory);
    
    // Generate AI coach message
    generateAICoachMessage(analysis);
    
    setIsAnalyzing(false);
    setShowMoodCheck(false);
  };

  const generateAICoachMessage = (analysis: MoodAnalysis) => {
    const messages = {
      calm: [
        "You're in a wonderful headspace! Let's maintain this peaceful energy.",
        "I sense great balance in you today. Perfect time for mindful practice.",
        "Your calm energy is beautiful. Let's deepen this tranquility."
      ],
      stressed: [
        "I can feel the pressure you're under. Let's work together to find relief.",
        "Stress is temporary, but the peace we'll build is lasting. Ready?",
        "Your nervous system needs support right now. I'm here to guide you."
      ],
      anxious: [
        "I hear the worry in your voice. Let's ground you with steady breathing.",
        "Anxiety is just energy that needs direction. We'll channel it together.",
        "You're safe here. Let's slow everything down and find your center."
      ],
      energetic: [
        "I love this vibrant energy! Let's channel it into powerful breathing.",
        "Your enthusiasm is contagious! Perfect time for an energizing session.",
        "This high energy is a gift. Let's use it to build lasting vitality."
      ],
      tired: [
        "I can sense the exhaustion. Let's restore your energy gently.",
        "Your body is asking for renewal. I'll guide you to refreshing breath.",
        "Fatigue is your signal to pause and recharge. Let's begin healing."
      ],
      focused: [
        "Your clarity is impressive! Let's enhance this focused state.",
        "I sense sharp mental energy. Perfect for deepening your practice.",
        "This focused mindset is powerful. Let's amplify it with breath."
      ],
      overwhelmed: [
        "The chaos you're feeling is real, but temporary. Let's find stillness.",
        "When everything feels too much, we return to the one thing: breath.",
        "I'm here to help you rise above the overwhelm. One breath at a time."
      ]
    };
    
    const moodMessages = messages[analysis.primaryMood];
    const message = moodMessages[Math.floor(Math.random() * moodMessages.length)];
    setAiCoachMessage(message);
  };

  const getMoodTrend = () => {
    if (moodHistory.length < 2) return 'neutral';
    
    const recent = moodHistory.slice(-7); // Last 7 days
    const stressLevels = recent.flatMap(day => 
      day.moods.map(mood => mood.stress)
    );
    
    const avgStress = stressLevels.reduce((a, b) => a + b, 0) / stressLevels.length;
    
    if (avgStress < 0.3) return 'improving';
    if (avgStress > 0.7) return 'concerning';
    return 'stable';
  };

  const getMoodInsights = () => {
    if (!currentMood) return [];
    
    const insights = [...currentMood.aiInsights];
    
    // Add personalized insights based on history
    const trend = getMoodTrend();
    if (trend === 'improving') {
      insights.push('Your stress levels have been decreasing - great progress!');
    } else if (trend === 'concerning') {
      insights.push('Consider longer breathing sessions to build resilience');
    }
    
    return insights;
  };

  const quickMoodPresets = [
    { emoji: '😌', text: 'Feeling calm and peaceful today', mood: 'calm' },
    { emoji: '😰', text: 'Stressed with work deadline pressure', mood: 'stressed' },
    { emoji: '😟', text: 'Worried and anxious about upcoming events', mood: 'anxious' },
    { emoji: '⚡', text: 'Energetic and ready to take on the world', mood: 'energetic' },
    { emoji: '😴', text: 'Tired and drained, need to recharge', mood: 'tired' },
    { emoji: '🎯', text: 'Focused and mentally sharp today', mood: 'focused' },
    { emoji: '🌪️', text: 'Overwhelmed with too many responsibilities', mood: 'overwhelmed' },
  ];

  return {
    currentMood,
    moodHistory,
    isAnalyzing,
    voiceInput,
    showMoodCheck,
    aiCoachMessage,
    quickMoodPresets,
    setVoiceInput,
    setShowMoodCheck,
    performMoodAnalysis,
    getMoodTrend,
    getMoodInsights,
    clearCurrentMood: () => setCurrentMood(null)
  };
}