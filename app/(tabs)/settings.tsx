import React, { useState } from 'react';
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
import { Save, Info, Volume2, CircleCheck as CheckCircle } from 'lucide-react-native';
import { useBreathingPatterns } from '@/hooks/useBreathingPatterns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { savePattern } = useBreathingPatterns();
  const [patternName, setPatternName] = useState('');
  const [inhale, setInhale] = useState('4');
  const [hold1, setHold1] = useState('4');
  const [exhale, setExhale] = useState('4');
  const [hold2, setHold2] = useState('4');
  const [cycles, setCycles] = useState('5');
  const [isSaving, setIsSaving] = useState(false);

  const saveCustomPattern = async () => {
    // Validate inputs
    const values = [inhale, hold1, exhale, hold2];
    const isValid = values.every(val => {
      const num = parseInt(val);
      return !isNaN(num) && num >= 0 && num <= 20;
    });

    if (!isValid) {
      Alert.alert(
        'Invalid Input',
        'Please enter valid numbers between 0 and 20 for all timing fields.'
      );
      return;
    }

    if (!patternName.trim()) {
      Alert.alert(
        'Pattern Name Required',
        'Please enter a name for your custom breathing pattern.'
      );
      return;
    }

    setIsSaving(true);
    try {
      const ratio: [number, number, number, number] = [
        parseInt(inhale),
        parseInt(hold1),
        parseInt(exhale),
        parseInt(hold2)
      ];

      await savePattern(patternName.trim(), ratio);
      
      Alert.alert(
        'Pattern Saved!',
        `Your custom breathing pattern "${patternName}" has been saved and is now available on the main screen.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setPatternName('');
              setInhale('4');
              setHold1('4');
              setExhale('4');
              setHold2('4');
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert(
        'Save Failed',
        'There was an error saving your pattern. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    setPatternName('');
    setInhale('4');
    setHold1('4');
    setExhale('4');
    setHold2('4');
    setCycles('5');
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
          <Text style={styles.subtitle}>Create your custom breathing patterns</Text>
        </View>

        {/* Custom Pattern Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Create Custom Pattern</Text>
          <Text style={styles.sectionDescription}>
            Design your own breathing pattern with custom timing and save it for future use
          </Text>

          <View style={styles.inputContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Pattern Name</Text>
              <TextInput
                style={styles.input}
                value={patternName}
                onChangeText={setPatternName}
                placeholder="e.g., My Relaxing Pattern"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Inhale (seconds)</Text>
              <TextInput
                style={styles.input}
                value={inhale}
                onChangeText={setInhale}
                keyboardType="numeric"
                placeholder="4"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Hold after inhale (seconds)</Text>
              <TextInput
                style={styles.input}
                value={hold1}
                onChangeText={setHold1}
                keyboardType="numeric"
                placeholder="4"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Exhale (seconds)</Text>
              <TextInput
                style={styles.input}
                value={exhale}
                onChangeText={setExhale}
                keyboardType="numeric"
                placeholder="4"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Hold after exhale (seconds)</Text>
              <TextInput
                style={styles.input}
                value={hold2}
                onChangeText={setHold2}
                keyboardType="numeric"
                placeholder="4"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
              />
            </View>
          </View>

          <View style={styles.patternPreview}>
            <Text style={styles.previewLabel}>Pattern Preview:</Text>
            <Text style={styles.previewText}>
              {patternName || 'Unnamed Pattern'} • {inhale}:{hold1}:{exhale}:{hold2}
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.primaryButton, isSaving && styles.disabledButton]} 
              onPress={saveCustomPattern}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Text style={styles.buttonText}>Saving...</Text>
                </>
              ) : (
                <>
                  <Save size={20} color="white" />
                  <Text style={styles.buttonText}>Save Custom Pattern</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={resetToDefaults}>
              <Text style={styles.secondaryButtonText}>Clear Form</Text>
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
});