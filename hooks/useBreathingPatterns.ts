import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BreathingPattern {
  id: string;
  name: string;
  ratio: [number, number, number, number];
  isCustom: boolean;
  createdAt: string;
  repetitions?: number;
  voicePrompts?: {
    inhale: string;
    hold1: string;
    exhale: string;
    hold2: string;
  };
}

const DEFAULT_PATTERNS: BreathingPattern[] = [
  {
    id: 'box',
    name: 'Box Breathing',
    ratio: [4, 4, 4, 4],
    isCustom: false,
    createdAt: new Date().toISOString(),
    repetitions: 5,
    voicePrompts: {
      inhale: 'Inhale',
      hold1: 'Hold',
      exhale: 'Exhale',
      hold2: 'Hold',
    },
  },
  {
    id: '4-7-8',
    name: '4-7-8 Relaxing',
    ratio: [4, 7, 8, 0],
    isCustom: false,
    createdAt: new Date().toISOString(),
    repetitions: 5,
    voicePrompts: {
      inhale: 'Inhale slowly',
      hold1: 'Hold gently',
      exhale: 'Exhale completely',
      hold2: 'Rest',
    },
  },
  {
    id: 'coherent',
    name: 'Coherent Breathing',
    ratio: [5, 0, 5, 0],
    isCustom: false,
    createdAt: new Date().toISOString(),
    repetitions: 5,
    voicePrompts: {
      inhale: 'Breathe in',
      hold1: 'Hold',
      exhale: 'Breathe out',
      hold2: 'Hold',
    },
  },
  {
    id: 'energizing',
    name: 'Energizing',
    ratio: [4, 2, 6, 2],
    isCustom: false,
    createdAt: new Date().toISOString(),
    repetitions: 5,
    voicePrompts: {
      inhale: 'Power inhale',
      hold1: 'Brief hold',
      exhale: 'Strong exhale',
      hold2: 'Pause',
    },
  },
];

const STORAGE_KEY = '@breathing_patterns';

export function useBreathingPatterns() {
  const [patterns, setPatterns] = useState<BreathingPattern[]>([]);
  const [loading, setLoading] = useState(true);

  // Load patterns from storage
  useEffect(() => {
    loadPatterns();
  }, []);

  const loadPatterns = async () => {
    console.log('loadPatterns called');
    try {
      // Load custom patterns
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const rawCustomPatterns = stored ? JSON.parse(stored) : [];
      console.log('Raw custom patterns:', rawCustomPatterns.length);
      
      // Add backward compatibility for existing patterns
      const customPatterns = rawCustomPatterns.map((pattern: any) => ({
        ...pattern,
        repetitions: pattern.repetitions || 5,
        voicePrompts: pattern.voicePrompts || {
          inhale: 'Inhale',
          hold1: 'Hold',
          exhale: 'Exhale',
          hold2: 'Hold',
        },
      }));
      console.log('Processed custom patterns:', customPatterns.length);
      
      // Load deleted default pattern IDs
      const deletedDefaults = await AsyncStorage.getItem('@deleted_default_patterns');
      const deletedIds = deletedDefaults ? JSON.parse(deletedDefaults) : [];
      console.log('Deleted default IDs:', deletedIds);
      
      // Check if all default patterns are deleted - if so, reset the deleted list
      const availableDefaultPatterns = DEFAULT_PATTERNS.filter(p => !deletedIds.includes(p.id));
      console.log('Available default patterns:', availableDefaultPatterns.length);
      
      // If no default patterns available and no custom patterns, reset deleted list
      if (availableDefaultPatterns.length === 0 && customPatterns.length === 0) {
        console.log('All patterns deleted, resetting to show default patterns');
        await AsyncStorage.removeItem('@deleted_default_patterns');
        const resetDefaultPatterns = DEFAULT_PATTERNS;
        console.log('Reset to default patterns:', resetDefaultPatterns.length);
        setPatterns(resetDefaultPatterns);
        return;
      }
      
      const finalPatterns = [...availableDefaultPatterns, ...customPatterns];
      console.log('Final patterns to set:', finalPatterns.length);
      
      setPatterns(finalPatterns);
    } catch (error) {
      console.error('Error loading patterns:', error);
      // Fallback to just default patterns if loading fails
      console.log('Using fallback default patterns');
      setPatterns(DEFAULT_PATTERNS);
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const savePattern = async (
    name: string, 
    ratio: [number, number, number, number],
    repetitions: number = 5,
    voicePrompts?: {
      inhale: string;
      hold1: string;
      exhale: string;
      hold2: string;
    }
  ) => {
    try {
      const newPattern: BreathingPattern = {
        id: `custom_${Date.now()}`,
        name,
        ratio,
        isCustom: true,
        createdAt: new Date().toISOString(),
        repetitions,
        voicePrompts: voicePrompts || {
          inhale: 'Inhale',
          hold1: 'Hold',
          exhale: 'Exhale',
          hold2: 'Hold',
        },
      };

      const customPatterns = patterns.filter(p => p.isCustom);
      const updatedCustomPatterns = [...customPatterns, newPattern];
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCustomPatterns));
      setPatterns([...DEFAULT_PATTERNS, ...updatedCustomPatterns]);
      
      return newPattern;
    } catch (error) {
      console.error('Error saving pattern:', error);
      throw error;
    }
  };

  const deletePattern = async (id: string) => {
    try {
      console.log('deletePattern called with id:', id);
      console.log('Current patterns:', patterns.map(p => ({ id: p.id, name: p.name, isCustom: p.isCustom })));
      
      const patternToDelete = patterns.find(p => p.id === id);
      if (!patternToDelete) {
        throw new Error('Pattern not found');
      }
      
      const updatedPatterns = patterns.filter(p => p.id !== id);
      
      if (patternToDelete.isCustom) {
        // For custom patterns, save the remaining custom patterns to AsyncStorage
        const customPatterns = updatedPatterns.filter(p => p.isCustom);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(customPatterns));
      } else {
        // For default patterns, save the list of deleted default pattern IDs
        const deletedDefaults = await AsyncStorage.getItem('@deleted_default_patterns');
        const deletedIds = deletedDefaults ? JSON.parse(deletedDefaults) : [];
        deletedIds.push(id);
        await AsyncStorage.setItem('@deleted_default_patterns', JSON.stringify(deletedIds));
        
        // Also update custom patterns storage
        const customPatterns = updatedPatterns.filter(p => p.isCustom);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(customPatterns));
      }
      
      console.log('Updated patterns after filter:', updatedPatterns.map(p => ({ id: p.id, name: p.name, isCustom: p.isCustom })));
      
      setPatterns(updatedPatterns);
      
      console.log('Pattern deletion completed successfully');
    } catch (error) {
      console.error('Error deleting pattern:', error);
      throw error;
    }
  };

  const resetDeletedPatterns = async () => {
    try {
      await AsyncStorage.removeItem('@deleted_default_patterns');
      console.log('Cleared deleted patterns list');
      await loadPatterns();
    } catch (error) {
      console.error('Error resetting deleted patterns:', error);
    }
  };

  return {
    patterns,
    loading,
    savePattern,
    deletePattern,
    refreshPatterns: loadPatterns,
    resetDeletedPatterns,
  };
}