import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Mic, 
  MicOff, 
  X, 
  Volume2, 
  VolumeX, 
  Send, 
  Settings,
  HelpCircle,
  MessageCircle,
  Zap,
  Brain
} from 'lucide-react-native';
import { useVoiceAssistant, VoiceResponse } from '@/hooks/useVoiceAssistant';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface VoiceAssistantModalProps {
  visible: boolean;
  onClose: () => void;
  onCommand: (action: string, parameters?: any) => void;
}

export default function VoiceAssistantModal({
  visible,
  onClose,
  onCommand
}: VoiceAssistantModalProps) {
  const {
    isListening,
    isProcessing,
    context,
    lastResponse,
    conversationHistory,
    startListening,
    stopListening,
    handleVoiceCommand,
    changePersonality,
    getCommandsByCategory,
    speak
  } = useVoiceAssistant();

  const [textInput, setTextInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{
    type: 'user' | 'assistant';
    message: string;
    timestamp: Date;
  }>>([]);

  useEffect(() => {
    if (visible && chatHistory.length === 0) {
      const welcomeMessage = {
        type: 'assistant' as const,
        message: getPersonalityGreeting(),
        timestamp: new Date()
      };
      setChatHistory([welcomeMessage]);
    }
  }, [visible]);

  useEffect(() => {
    if (lastResponse) {
      const assistantMessage = {
        type: 'assistant' as const,
        message: lastResponse.message,
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, assistantMessage]);

      // Execute the command in the main app
      if (lastResponse.success && lastResponse.action) {
        onCommand(lastResponse.action, lastResponse.parameters);
      }
    }
  }, [lastResponse]);

  if (!visible) return null;

  const getPersonalityGreeting = () => {
    const greetings = {
      calm: "Hello 🧘‍♀️ I'm your peaceful breathing guide. How can I help you find your center today?",
      energetic: "Hey there! 🚀 I'm your energetic breathing coach! Ready to power up your practice?",
      focused: "Greetings 🎯 I'm your precision breathing assistant. How can I optimize your session?",
      friendly: "Hi friend! 😊 I'm so excited to help you with your breathing journey today!"
    };
    return greetings[context.userPreferences.personality];
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;

    const userMessage = {
      type: 'user' as const,
      message: textInput,
      timestamp: new Date()
    };
    
    setChatHistory(prev => [...prev, userMessage]);
    
    await handleVoiceCommand(textInput);
    setTextInput('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
      // Simulate voice input for demo - in real app would use speech recognition
      Alert.alert(
        'Voice Input', 
        'Voice recognition would be active here. For demo, use text input below.',
        [{ text: 'OK', onPress: () => stopListening() }]
      );
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const quickCommands = [
    { text: 'Start breathing', icon: '🧘‍♀️' },
    { text: 'Box breathing', icon: '🟦' },
    { text: 'Ocean environment', icon: '🌊' },
    { text: 'Show my stats', icon: '📊' },
    { text: 'Join social room', icon: '👥' },
    { text: 'Help', icon: '❓' }
  ];

  const personalityOptions = [
    { key: 'calm', name: 'Calm', icon: '🧘‍♀️', description: 'Peaceful and zen' },
    { key: 'energetic', name: 'Energetic', icon: '⚡', description: 'Upbeat and motivating' },
    { key: 'focused', name: 'Focused', icon: '🎯', description: 'Precise and direct' },
    { key: 'friendly', name: 'Friendly', icon: '😊', description: 'Warm and encouraging' }
  ];

  const renderChatMessage = (item: any, index: number) => (
    <View key={index} style={[
      styles.chatMessage,
      item.type === 'user' ? styles.userMessage : styles.assistantMessage
    ]}>
      <View style={[
        styles.messageBubble,
        item.type === 'user' ? styles.userBubble : styles.assistantBubble
      ]}>
        <Text style={[
          styles.messageText,
          item.type === 'user' ? styles.userText : styles.assistantText
        ]}>
          {item.message}
        </Text>
        <Text style={styles.timestamp}>
          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );

  const renderSettings = () => (
    <View style={styles.settingsContainer}>
      <Text style={styles.settingsTitle}>Voice Assistant Settings</Text>
      
      {/* Voice Toggle */}
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Voice Responses</Text>
          <Text style={styles.settingDescription}>Enable spoken responses</Text>
        </View>
        <Switch
          value={context.userPreferences.voice.enabled}
          onValueChange={(value) => {
            // This would call the voice toggle command
            handleVoiceCommand(value ? 'enable voice' : 'disable voice');
          }}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={context.userPreferences.voice.enabled ? '#f5dd4b' : '#f4f3f4'}
        />
      </View>

      {/* Personality Selection */}
      <View style={styles.settingSection}>
        <Text style={styles.settingLabel}>Assistant Personality</Text>
        <View style={styles.personalityGrid}>
          {personalityOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.personalityOption,
                context.userPreferences.personality === option.key && styles.selectedPersonality
              ]}
              onPress={() => changePersonality(option.key as any)}
            >
              <Text style={styles.personalityIcon}>{option.icon}</Text>
              <Text style={styles.personalityName}>{option.name}</Text>
              <Text style={styles.personalityDescription}>{option.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Voice Speed */}
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>Speech Speed</Text>
          <Text style={styles.settingDescription}>
            {context.userPreferences.voice.speed}x speed
          </Text>
        </View>
      </View>
    </View>
  );

  const renderHelp = () => {
    const categories = ['session', 'pattern', 'environment', 'social', 'general'];
    
    return (
      <View style={styles.helpContainer}>
        <Text style={styles.helpTitle}>Voice Commands</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {categories.map((category) => {
            const commands = getCommandsByCategory(category);
            if (commands.length === 0) return null;
            
            return (
              <View key={category} style={styles.helpCategory}>
                <Text style={styles.helpCategoryTitle}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
                {commands.slice(0, 3).map((command, index) => (
                  <View key={index} style={styles.helpCommand}>
                    <Text style={styles.helpCommandText}>
                      "{command.patterns[0]}"
                    </Text>
                    <Text style={styles.helpCommandDescription}>
                      {command.description}
                    </Text>
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
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
            <View style={styles.headerLeft}>
              <Brain size={24} color="white" />
              <Text style={styles.title}>AI Voice Assistant</Text>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                onPress={() => setShowHelp(!showHelp)}
                style={styles.headerButton}
              >
                <HelpCircle size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setShowSettings(!showSettings)}
                style={styles.headerButton}
              >
                <Settings size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          {showSettings ? renderSettings() : 
           showHelp ? renderHelp() : (
            <>
              {/* Chat History */}
              <View style={styles.chatContainer}>
                <ScrollView 
                  style={styles.chatHistory}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.chatContent}
                >
                  {chatHistory.map(renderChatMessage)}
                  {isProcessing && (
                    <View style={styles.processingMessage}>
                      <Text style={styles.processingText}>🤔 Thinking...</Text>
                    </View>
                  )}
                </ScrollView>
              </View>

              {/* Quick Commands */}
              <View style={styles.quickCommandsSection}>
                <Text style={styles.quickCommandsTitle}>Quick Commands</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.quickCommands}
                >
                  {quickCommands.map((command, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.quickCommand}
                      onPress={() => setTextInput(command.text)}
                    >
                      <Text style={styles.quickCommandIcon}>{command.icon}</Text>
                      <Text style={styles.quickCommandText}>{command.text}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Input Section */}
              <View style={styles.inputSection}>
                <View style={styles.textInputContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Type your command or question..."
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={textInput}
                    onChangeText={setTextInput}
                    onSubmitEditing={handleTextSubmit}
                    multiline
                    maxLength={200}
                  />
                  <TouchableOpacity 
                    style={styles.sendButton}
                    onPress={handleTextSubmit}
                    disabled={!textInput.trim()}
                  >
                    <Send size={20} color="white" />
                  </TouchableOpacity>
                </View>

                <View style={styles.voiceControls}>
                  <TouchableOpacity
                    style={[
                      styles.voiceButton,
                      isListening && styles.listeningButton
                    ]}
                    onPress={toggleListening}
                  >
                    {isListening ? (
                      <MicOff size={24} color="white" />
                    ) : (
                      <Mic size={24} color="white" />
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.volumeButton}
                    onPress={() => handleVoiceCommand('toggle voice')}
                  >
                    {context.userPreferences.voice.enabled ? (
                      <Volume2 size={20} color="white" />
                    ) : (
                      <VolumeX size={20} color="white" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
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
    height: height * 0.85,
  },
  modal: {
    flex: 1,
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  chatHistory: {
    flex: 1,
  },
  chatContent: {
    paddingVertical: 10,
  },
  chatMessage: {
    marginBottom: 12,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  assistantMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
  },
  userBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  userText: {
    color: 'white',
  },
  assistantText: {
    color: 'rgba(255, 255, 255, 0.95)',
  },
  timestamp: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    alignSelf: 'flex-end',
  },
  processingMessage: {
    alignItems: 'center',
    marginVertical: 8,
  },
  processingText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontStyle: 'italic',
  },
  quickCommandsSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  quickCommandsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 10,
  },
  quickCommands: {
    paddingRight: 20,
  },
  quickCommand: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginRight: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  quickCommandIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  quickCommandText: {
    fontSize: 11,
    color: 'white',
    textAlign: 'center',
    fontWeight: '500',
  },
  inputSection: {
    padding: 20,
    paddingTop: 15,
  },
  textInputContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    maxHeight: 80,
    marginRight: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  voiceButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  listeningButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  volumeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsContainer: {
    flex: 1,
    padding: 20,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 20,
  },
  settingSection: {
    marginBottom: 24,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  personalityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  personalityOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    width: '48%',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  selectedPersonality: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  personalityIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  personalityName: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  personalityDescription: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  helpContainer: {
    flex: 1,
    padding: 20,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 20,
  },
  helpCategory: {
    marginBottom: 20,
  },
  helpCategoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  helpCommand: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  helpCommandText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  helpCommandDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});