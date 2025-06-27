import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Save, Info, Volume2, CircleCheck as CheckCircle, Languages } from 'lucide-react-native';
import { useBreathingPatterns } from '@/hooks/useBreathingPatterns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'english' | 'kannada' | 'hindi';

interface LanguageLabels {
  english: { inhale: string; hold: string; exhale: string; };
  kannada: { inhale: string; hold: string; exhale: string; };
  hindi: { inhale: string; hold: string; exhale: string; };
}

const LANGUAGE_LABELS: LanguageLabels = {
  english: { inhale: 'Inhale', hold: 'Hold', exhale: 'Exhale' },
  kannada: { inhale: 'ಶ್ವಾಸ ತೆಗೆ', hold: 'ಹಿಡಿ', exhale: 'ಶ್ವಾಸ ಬಿಡು' },
  hindi: { inhale: 'सांस लें', hold: 'रोकें', exhale: 'सांस छोड़ें' }
};

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('english');
  const [customLabels, setCustomLabels] = useState({
    inhale: 'Inhale',
    hold: 'Hold', 
    exhale: 'Exhale'
  });
  const [countDirection, setCountDirection] = useState<'up' | 'down'>('down');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('selectedLanguage');
      const savedLabels = await AsyncStorage.getItem('customLabels');
      const savedDirection = await AsyncStorage.getItem('countDirection');
      
      if (savedLanguage) {
        setSelectedLanguage(savedLanguage as Language);
      }
      if (savedLabels) {
        setCustomLabels(JSON.parse(savedLabels));
      }
      if (savedDirection) {
        setCountDirection(savedDirection as 'up' | 'down');
      }
    } catch (error) {
      console.log('Error loading settings:', error);
    }
  };

  const saveLanguageSettings = async () => {
    setIsSaving(true);
    try {
      await AsyncStorage.setItem('selectedLanguage', selectedLanguage);
      await AsyncStorage.setItem('customLabels', JSON.stringify(customLabels));
      await AsyncStorage.setItem('countDirection', countDirection);
      
      Alert.alert(
        'Settings Saved!',
        'Your preferences have been saved.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Save Failed',
        'There was an error saving your settings. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const selectLanguage = (language: Language) => {
    setSelectedLanguage(language);
    setCustomLabels(LANGUAGE_LABELS[language]);
  };

  const resetToDefaults = () => {
    setSelectedLanguage('english');
    setCustomLabels(LANGUAGE_LABELS.english);
    setCountDirection('down');
  };

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
              android: 90,
              default: 90,
            })
          }
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Customize your breathing experience</Text>
        </View>

        {/* Count Direction Section */}
        <View style={styles.section}>
          <View style={styles.infoHeader}>
            <Text style={styles.sectionTitle}>Count Direction</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Choose how numbers are counted during breathing phases
          </Text>

          <View style={styles.optionRow}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                countDirection === 'up' && styles.selectedOption
              ]}
              onPress={() => setCountDirection('up')}
            >
              <Text style={[
                styles.optionText,
                countDirection === 'up' && styles.selectedOptionText
              ]}>
                Count Up (1, 2, 3, 4)
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.optionButton,
                countDirection === 'down' && styles.selectedOption
              ]}
              onPress={() => setCountDirection('down')}
            >
              <Text style={[
                styles.optionText,
                countDirection === 'down' && styles.selectedOptionText
              ]}>
                Count Down (4, 3, 2, 1)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Language Support Section */}
        <View style={styles.section}>
          <View style={styles.infoHeader}>
            <Languages size={20} color="white" />
            <Text style={styles.sectionTitle}>Language Support</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Choose your preferred language for voice guidance during breathing exercises
          </Text>

          <View style={styles.languageContainer}>
            {Object.entries(LANGUAGE_LABELS).map(([key, labels]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.languageOption,
                  selectedLanguage === key && styles.selectedLanguage
                ]}
                onPress={() => selectLanguage(key as Language)}
              >
                <View style={styles.languageInfo}>
                  <Text style={styles.languageName}>
                    {key === 'english' ? 'English' : key === 'kannada' ? 'ಕನ್ನಡ (Kannada)' : 'हिंदी (Hindi)'}
                  </Text>
                  <Text style={styles.languageExample}>
                    {labels.inhale} • {labels.hold} • {labels.exhale}
                  </Text>
                </View>
                {selectedLanguage === key && (
                  <CheckCircle size={20} color="white" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle} style={{marginTop: 25, marginBottom: 8}}>Custom Voice Prompts</Text>
          <Text style={styles.sectionDescription}>
            Customize what the app says during each breathing phase
          </Text>

          <View style={styles.inputContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Inhale Prompt</Text>
              <TextInput
                style={styles.input}
                value={customLabels.inhale}
                onChangeText={(text) => setCustomLabels(prev => ({...prev, inhale: text}))}
                placeholder="e.g., Inhale through left nose"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Hold Prompt</Text>
              <TextInput
                style={styles.input}
                value={customLabels.hold}
                onChangeText={(text) => setCustomLabels(prev => ({...prev, hold: text}))}
                placeholder="e.g., Hold gently"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Exhale Prompt</Text>
              <TextInput
                style={styles.input}
                value={customLabels.exhale}
                onChangeText={(text) => setCustomLabels(prev => ({...prev, exhale: text}))}
                placeholder="e.g., Exhale slowly through mouth"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.primaryButton, isSaving && styles.disabledButton]} 
              onPress={saveLanguageSettings}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Text style={styles.buttonText}>Saving...</Text>
                </>
              ) : (
                <>
                  <Save size={20} color="white" />
                  <Text style={styles.buttonText}>Save Language Settings</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={resetToDefaults}>
              <Text style={styles.secondaryButtonText}>Reset to English</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Information Section */}
        <View style={styles.section}>
          <View style={styles.infoHeader}>
            <Info size={20} color="white" />
            <Text style={styles.sectionTitle}>Breathing Techniques</Text>
          </View>

          <View style={styles.techniqueCard}>
            <Text style={styles.techniqueName}>4-7-8 Breathing</Text>
            <Text style={styles.techniqueDescription}>
              Inhale for 4, hold for 7, exhale for 8. Great for relaxation and sleep.
            </Text>
          </View>

          <View style={styles.techniqueCard}>
            <Text style={styles.techniqueName}>Box Breathing</Text>
            <Text style={styles.techniqueDescription}>
              Equal timing for all phases (4:4:4:4). Used by Navy SEALs for focus and calm.
            </Text>
          </View>

          <View style={styles.techniqueCard}>
            <Text style={styles.techniqueName}>Coherent Breathing</Text>
            <Text style={styles.techniqueDescription}>
              5 seconds in, 5 seconds out. Promotes heart rate variability and balance.
            </Text>
          </View>

          <View style={styles.techniqueCard}>
            <Text style={styles.techniqueName}>Custom Patterns</Text>
            <Text style={styles.techniqueDescription}>
              Create your own patterns based on your needs. Try shorter holds for energy or longer exhales for relaxation.
            </Text>
          </View>
        </View>

        {/* Audio Settings */}
        <View style={styles.section}>
          <View style={styles.infoHeader}>
            <Volume2 size={20} color="white" />
            <Text style={styles.sectionTitle}>Audio Guidance</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Voice prompts will guide you through each phase of your breathing exercise. 
            Make sure your device volume is turned up for the best experience.
          </Text>
        </View>

        {/* Tips Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tips for Better Practice</Text>
          
          <View style={styles.tipItem}>
            <Text style={styles.tipNumber}>1</Text>
            <Text style={styles.tipText}>
              Find a quiet, comfortable space where you won't be disturbed
            </Text>
          </View>

          <View style={styles.tipItem}>
            <Text style={styles.tipNumber}>2</Text>
            <Text style={styles.tipText}>
              Sit or lie down with your spine straight and shoulders relaxed
            </Text>
          </View>

          <View style={styles.tipItem}>
            <Text style={styles.tipNumber}>3</Text>
            <Text style={styles.tipText}>
              Breathe through your nose when possible, focusing on your diaphragm
            </Text>
          </View>

          <View style={styles.tipItem}>
            <Text style={styles.tipNumber}>4</Text>
            <Text style={styles.tipText}>
              Start with shorter sessions and gradually increase duration
            </Text>
          </View>

          <View style={styles.tipItem}>
            <Text style={styles.tipNumber}>5</Text>
            <Text style={styles.tipText}>
              Save custom patterns that work well for you and use them regularly
            </Text>
          </View>
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
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputContainer: {
    gap: 16,
    marginBottom: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: 'white',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  patternPreview: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  previewText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  techniqueCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  techniqueName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 6,
  },
  techniqueDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  tipNumber: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
  },
  languageContainer: {
    gap: 12,
    marginBottom: 20,
  },
  languageOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  selectedLanguage: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  languageExample: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  optionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  optionButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  selectedOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  selectedOptionText: {
    color: 'white',
    fontWeight: '600',
  },
});