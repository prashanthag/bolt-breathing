import { useState, useEffect, useRef } from 'react';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface VoiceCommand {
  command: string;
  patterns: string[];
  action: string;
  parameters?: any;
  description: string;
  category: 'session' | 'pattern' | 'environment' | 'settings' | 'social' | 'general';
}

export interface VoiceResponse {
  message: string;
  action?: string;
  parameters?: any;
  success: boolean;
}

export interface ConversationContext {
  lastCommand?: string;
  sessionActive: boolean;
  currentPattern?: string;
  currentEnvironment?: string;
  waitingForConfirmation?: string;
  userPreferences: {
    voice: {
      enabled: boolean;
      speed: number;
      pitch: number;
      language: string;
    };
    personality: 'calm' | 'energetic' | 'focused' | 'friendly';
    verbosity: 'minimal' | 'normal' | 'detailed';
  };
}

const VOICE_COMMANDS: VoiceCommand[] = [
  // Session Control
  {
    command: 'start_session',
    patterns: ['start breathing', 'begin session', 'start meditation', 'let\'s breathe', 'start now'],
    action: 'START_SESSION',
    description: 'Start a breathing session',
    category: 'session'
  },
  {
    command: 'stop_session',
    patterns: ['stop breathing', 'end session', 'pause', 'stop now', 'finish'],
    action: 'STOP_SESSION',
    description: 'Stop the current session',
    category: 'session'
  },
  {
    command: 'resume_session',
    patterns: ['resume', 'continue', 'keep going', 'resume breathing'],
    action: 'RESUME_SESSION',
    description: 'Resume a paused session',
    category: 'session'
  },

  // Pattern Control
  {
    command: 'change_pattern',
    patterns: ['change pattern', 'switch to', 'use pattern', 'try pattern'],
    action: 'CHANGE_PATTERN',
    description: 'Change breathing pattern',
    category: 'pattern'
  },
  {
    command: 'box_breathing',
    patterns: ['box breathing', 'four four four four', '4-4-4-4', 'square breathing'],
    action: 'SET_PATTERN',
    parameters: { pattern: 'box' },
    description: 'Switch to box breathing pattern',
    category: 'pattern'
  },
  {
    command: 'relaxing_breathing',
    patterns: ['relaxing', '4-7-8', 'four seven eight', 'calm breathing'],
    action: 'SET_PATTERN',
    parameters: { pattern: 'relaxing' },
    description: 'Switch to 4-7-8 relaxing pattern',
    category: 'pattern'
  },
  {
    command: 'coherent_breathing',
    patterns: ['coherent', 'five five', '5-5', 'balanced breathing'],
    action: 'SET_PATTERN',
    parameters: { pattern: 'coherent' },
    description: 'Switch to coherent breathing pattern',
    category: 'pattern'
  },

  // Environment Control
  {
    command: 'change_environment',
    patterns: ['change environment', 'switch scene', 'new environment'],
    action: 'CHANGE_ENVIRONMENT',
    description: 'Change the AR environment',
    category: 'environment'
  },
  {
    command: 'ocean_environment',
    patterns: ['ocean', 'water', 'sea', 'ocean depths'],
    action: 'SET_ENVIRONMENT',
    parameters: { environment: 'ocean_depths' },
    description: 'Switch to ocean environment',
    category: 'environment'
  },
  {
    command: 'forest_environment',
    patterns: ['forest', 'trees', 'nature', 'woods'],
    action: 'SET_ENVIRONMENT',
    parameters: { environment: 'forest_sanctuary' },
    description: 'Switch to forest environment',
    category: 'environment'
  },
  {
    command: 'space_environment',
    patterns: ['space', 'cosmos', 'stars', 'cosmic void'],
    action: 'SET_ENVIRONMENT',
    parameters: { environment: 'cosmic_void' },
    description: 'Switch to cosmic environment',
    category: 'environment'
  },

  // Social Features
  {
    command: 'join_social_room',
    patterns: ['join room', 'social breathing', 'breathe together', 'find others'],
    action: 'SHOW_SOCIAL_ROOMS',
    description: 'Open social breathing rooms',
    category: 'social'
  },
  {
    command: 'share_progress',
    patterns: ['share progress', 'share achievement', 'post progress', 'share stats'],
    action: 'SHOW_SHARING',
    description: 'Share your breathing progress',
    category: 'social'
  },

  // General Commands
  {
    command: 'show_stats',
    patterns: ['show stats', 'my progress', 'my journey', 'statistics'],
    action: 'SHOW_STATS',
    description: 'View your breathing statistics',
    category: 'general'
  },
  {
    command: 'show_challenges',
    patterns: ['challenges', 'daily goals', 'my goals', 'tasks'],
    action: 'SHOW_CHALLENGES',
    description: 'View daily challenges',
    category: 'general'
  },
  {
    command: 'mood_check',
    patterns: ['how am i feeling', 'mood check', 'analyze mood', 'check mood'],
    action: 'MOOD_CHECK',
    description: 'Analyze your current mood',
    category: 'general'
  },
  {
    command: 'help',
    patterns: ['help', 'what can you do', 'voice commands', 'how to use'],
    action: 'SHOW_HELP',
    description: 'Show available voice commands',
    category: 'general'
  },

  // Settings
  {
    command: 'enable_voice',
    patterns: ['enable voice', 'turn on voice', 'voice on'],
    action: 'TOGGLE_VOICE',
    parameters: { enabled: true },
    description: 'Enable voice responses',
    category: 'settings'
  },
  {
    command: 'disable_voice',
    patterns: ['disable voice', 'turn off voice', 'voice off', 'be quiet'],
    action: 'TOGGLE_VOICE',
    parameters: { enabled: false },
    description: 'Disable voice responses',
    category: 'settings'
  }
];

const AI_PERSONALITIES = {
  calm: {
    greeting: "Hello, I'm here to guide your peaceful breathing journey.",
    sessionStart: "Let's find your center together. Take a deep breath and relax.",
    sessionEnd: "Beautiful session. You've nurtured your inner peace.",
    encouragement: "You're doing wonderfully. Each breath brings more calm.",
    error: "That's okay, let's try something else. What would you like to do?"
  },
  energetic: {
    greeting: "Hey there! Ready to power up your breathing practice?",
    sessionStart: "Let's energize your day with some amazing breathing! Here we go!",
    sessionEnd: "Fantastic work! You've charged up your energy beautifully!",
    encouragement: "You're crushing it! Keep that momentum going!",
    error: "No worries! Let's pivot and try something awesome!"
  },
  focused: {
    greeting: "I'm your breathing coach. Let's optimize your practice.",
    sessionStart: "Session initiated. Focus on your breath and follow my guidance.",
    sessionEnd: "Session complete. Excellent focus and technique achieved.",
    encouragement: "Maintaining good form. Continue with precision.",
    error: "Command unclear. Please specify your request."
  },
  friendly: {
    greeting: "Hi friend! I'm so excited to breathe with you today!",
    sessionStart: "Yay! Let's have an amazing breathing session together!",
    sessionEnd: "That was wonderful! You did such a great job!",
    encouragement: "You're amazing! I love breathing with you!",
    error: "Oops! That's totally fine - what would you like to try instead?"
  }
};

export function useVoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [context, setContext] = useState<ConversationContext>({
    sessionActive: false,
    userPreferences: {
      voice: {
        enabled: true,
        speed: 0.8,
        pitch: 1.0,
        language: 'en-US'
      },
      personality: 'calm',
      verbosity: 'normal'
    }
  });
  const [lastResponse, setLastResponse] = useState<VoiceResponse | null>(null);
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);

  useEffect(() => {
    loadVoicePreferences();
    initializeAssistant();
  }, []);

  const loadVoicePreferences = async () => {
    try {
      const saved = await AsyncStorage.getItem('voiceAssistantPreferences');
      if (saved) {
        const preferences = JSON.parse(saved);
        setContext(prev => ({
          ...prev,
          userPreferences: { ...prev.userPreferences, ...preferences }
        }));
      }
    } catch (error) {
      console.log('Error loading voice preferences:', error);
    }
  };

  const saveVoicePreferences = async (preferences: any) => {
    try {
      await AsyncStorage.setItem('voiceAssistantPreferences', JSON.stringify(preferences));
    } catch (error) {
      console.log('Error saving voice preferences:', error);
    }
  };

  const initializeAssistant = () => {
    const personality = AI_PERSONALITIES[context.userPreferences.personality];
    if (context.userPreferences.voice.enabled) {
      speak(personality.greeting);
    }
  };

  const speak = (text: string, options?: any) => {
    if (!context.userPreferences.voice.enabled) return;

    const voiceOptions = {
      rate: context.userPreferences.voice.speed,
      pitch: context.userPreferences.voice.pitch,
      language: context.userPreferences.voice.language,
      ...options
    };

    Speech.speak(text, voiceOptions);
  };

  const processVoiceInput = async (input: string): Promise<VoiceResponse> => {
    setIsProcessing(true);
    
    try {
      const lowerInput = input.toLowerCase().trim();
      const matchedCommand = findMatchingCommand(lowerInput);

      if (!matchedCommand) {
        return handleUnrecognizedCommand(lowerInput);
      }

      return await executeCommand(matchedCommand, lowerInput);
    } catch (error) {
      console.error('Voice processing error:', error);
      return {
        message: "I'm having trouble processing that. Could you try again?",
        success: false
      };
    } finally {
      setIsProcessing(false);
    }
  };

  const findMatchingCommand = (input: string): VoiceCommand | null => {
    // Direct pattern matching
    for (const command of VOICE_COMMANDS) {
      for (const pattern of command.patterns) {
        if (input.includes(pattern)) {
          return command;
        }
      }
    }

    // Fuzzy matching for common variations
    if (input.includes('breath') && (input.includes('start') || input.includes('begin'))) {
      return VOICE_COMMANDS.find(cmd => cmd.command === 'start_session') || null;
    }

    if (input.includes('stop') || input.includes('end')) {
      return VOICE_COMMANDS.find(cmd => cmd.command === 'stop_session') || null;
    }

    return null;
  };

  const executeCommand = async (command: VoiceCommand, input: string): Promise<VoiceResponse> => {
    const personality = AI_PERSONALITIES[context.userPreferences.personality];
    
    updateContext({ lastCommand: command.command });
    addToHistory(input);

    switch (command.action) {
      case 'START_SESSION':
        updateContext({ sessionActive: true });
        return {
          message: personality.sessionStart,
          action: 'START_SESSION',
          success: true
        };

      case 'STOP_SESSION':
        updateContext({ sessionActive: false });
        return {
          message: personality.sessionEnd,
          action: 'STOP_SESSION',
          success: true
        };

      case 'RESUME_SESSION':
        if (!context.sessionActive) {
          updateContext({ sessionActive: true });
          return {
            message: "Resuming your breathing session. Welcome back!",
            action: 'RESUME_SESSION',
            success: true
          };
        } else {
          return {
            message: "Your session is already active. Keep breathing!",
            success: true
          };
        }

      case 'SET_PATTERN':
        const patternName = command.parameters?.pattern || 'box';
        updateContext({ currentPattern: patternName });
        return {
          message: `Switching to ${patternName} breathing pattern. This will help you ${getPatternBenefit(patternName)}.`,
          action: 'SET_PATTERN',
          parameters: command.parameters,
          success: true
        };

      case 'SET_ENVIRONMENT':
        const envName = command.parameters?.environment || 'ocean_depths';
        updateContext({ currentEnvironment: envName });
        return {
          message: `Changing to ${getEnvironmentName(envName)} environment. Perfect for ${getEnvironmentMood(envName)}.`,
          action: 'SET_ENVIRONMENT',
          parameters: command.parameters,
          success: true
        };

      case 'SHOW_STATS':
        return {
          message: "Opening your breathing journey statistics. You've made amazing progress!",
          action: 'SHOW_STATS',
          success: true
        };

      case 'SHOW_CHALLENGES':
        return {
          message: "Here are your daily breathing challenges. You're doing great!",
          action: 'SHOW_CHALLENGES',
          success: true
        };

      case 'SHOW_SOCIAL_ROOMS':
        return {
          message: "Opening social breathing rooms. Find others to breathe with!",
          action: 'SHOW_SOCIAL_ROOMS',
          success: true
        };

      case 'SHOW_SHARING':
        return {
          message: "Let's share your amazing progress with the world!",
          action: 'SHOW_SHARING',
          success: true
        };

      case 'MOOD_CHECK':
        return {
          message: "Let me analyze your current mood and find the perfect breathing practice for you.",
          action: 'MOOD_CHECK',
          success: true
        };

      case 'SHOW_HELP':
        return {
          message: generateHelpMessage(),
          success: true
        };

      case 'TOGGLE_VOICE':
        const enabled = command.parameters?.enabled ?? true;
        const newPreferences = {
          ...context.userPreferences,
          voice: { ...context.userPreferences.voice, enabled }
        };
        updateContext({ userPreferences: newPreferences });
        await saveVoicePreferences(newPreferences);
        
        if (enabled) {
          return {
            message: "Voice responses enabled. I'm here to guide you!",
            success: true
          };
        } else {
          // This will be the last spoken message
          return {
            message: "Voice responses disabled. I'll work silently now.",
            success: true
          };
        }

      default:
        return {
          message: personality.error,
          success: false
        };
    }
  };

  const handleUnrecognizedCommand = (input: string): VoiceResponse => {
    const personality = AI_PERSONALITIES[context.userPreferences.personality];
    
    // Try to provide helpful suggestions
    if (input.includes('pattern') || input.includes('breathing')) {
      return {
        message: "I can help you with breathing patterns! Try saying 'box breathing', '4-7-8 breathing', or 'coherent breathing'.",
        success: false
      };
    }

    if (input.includes('environment') || input.includes('scene')) {
      return {
        message: "I can change your environment! Try 'ocean', 'forest', or 'space' for different atmospheres.",
        success: false
      };
    }

    return {
      message: `${personality.error} Try saying 'help' to see what I can do!`,
      success: false
    };
  };

  const getPatternBenefit = (pattern: string): string => {
    const benefits = {
      box: 'reduce anxiety and improve focus',
      relaxing: 'calm your nervous system and reduce stress',
      coherent: 'balance your heart rate and emotions',
      energizing: 'boost energy and alertness'
    };
    return benefits[pattern as keyof typeof benefits] || 'improve your wellbeing';
  };

  const getEnvironmentName = (env: string): string => {
    const names = {
      ocean_depths: 'Ocean Depths',
      forest_sanctuary: 'Forest Sanctuary',
      cosmic_void: 'Cosmic Void',
      zen_garden: 'Zen Garden',
      sunset_peak: 'Sunset Peak',
      crystal_cave: 'Crystal Cave'
    };
    return names[env as keyof typeof names] || 'peaceful';
  };

  const getEnvironmentMood = (env: string): string => {
    const moods = {
      ocean_depths: 'deep relaxation',
      forest_sanctuary: 'natural grounding',
      cosmic_void: 'transcendent meditation',
      zen_garden: 'mindful presence',
      sunset_peak: 'energizing focus',
      crystal_cave: 'mental clarity'
    };
    return moods[env as keyof typeof moods] || 'mindful breathing';
  };

  const generateHelpMessage = (): string => {
    const categorizedCommands = VOICE_COMMANDS.reduce((acc, cmd) => {
      if (!acc[cmd.category]) acc[cmd.category] = [];
      acc[cmd.category].push(cmd);
      return acc;
    }, {} as Record<string, VoiceCommand[]>);

    let helpText = "Here's what I can help you with:\n\n";
    
    Object.entries(categorizedCommands).forEach(([category, commands]) => {
      helpText += `${category.toUpperCase()}:\n`;
      commands.slice(0, 2).forEach(cmd => {
        helpText += `• "${cmd.patterns[0]}" - ${cmd.description}\n`;
      });
      helpText += "\n";
    });

    return helpText;
  };

  const updateContext = (updates: Partial<ConversationContext>) => {
    setContext(prev => ({ ...prev, ...updates }));
  };

  const addToHistory = (input: string) => {
    setConversationHistory(prev => [...prev.slice(-10), input]); // Keep last 10 commands
  };

  const startListening = () => {
    setIsListening(true);
    // In a real implementation, this would integrate with speech recognition
    // For now, we'll simulate with text input
  };

  const stopListening = () => {
    setIsListening(false);
  };

  const handleVoiceCommand = async (voiceInput: string) => {
    const response = await processVoiceInput(voiceInput);
    setLastResponse(response);
    
    if (response.success && response.message) {
      speak(response.message);
    }
    
    return response;
  };

  const changePersonality = async (personality: ConversationContext['userPreferences']['personality']) => {
    const newPreferences = {
      ...context.userPreferences,
      personality
    };
    updateContext({ userPreferences: newPreferences });
    await saveVoicePreferences(newPreferences);
    
    const newPersonalityGreeting = AI_PERSONALITIES[personality].greeting;
    speak(`Personality changed! ${newPersonalityGreeting}`);
  };

  const getAvailableCommands = () => VOICE_COMMANDS;

  const getCommandsByCategory = (category: string) => 
    VOICE_COMMANDS.filter(cmd => cmd.category === category);

  return {
    isListening,
    isProcessing,
    context,
    lastResponse,
    conversationHistory,
    startListening,
    stopListening,
    handleVoiceCommand,
    processVoiceInput,
    changePersonality,
    getAvailableCommands,
    getCommandsByCategory,
    speak
  };
}