import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BreathingPattern {
  id: string;
  name: string;
  ratio: [number, number, number, number];
  isCustom: boolean;
  createdAt: string;
}

const DEFAULT_PATTERNS: BreathingPattern[] = [
  {
    id: 'box',
    name: 'Box Breathing',
    ratio: [4, 4, 4, 4],
    isCustom: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '4-7-8',
    name: '4-7-8 Relaxing',
    ratio: [4, 7, 8, 0],
    isCustom: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'coherent',
    name: 'Coherent Breathing',
    ratio: [5, 0, 5, 0],
    isCustom: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'energizing',
    name: 'Energizing',
    ratio: [4, 2, 6, 2],
    isCustom: false,
    createdAt: new Date().toISOString(),
  },
];

const STORAGE_KEY = '@breathing_patterns';

export function useBreathingPatterns() {
  const [patterns, setPatterns] = useState<BreathingPattern[]>(DEFAULT_PATTERNS);
  const [loading, setLoading] = useState(true);

  // Load patterns from storage
  useEffect(() => {
    loadPatterns();
  }, []);

  const loadPatterns = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const customPatterns = JSON.parse(stored);
        setPatterns([...DEFAULT_PATTERNS, ...customPatterns]);
      }
    } catch (error) {
      console.error('Error loading patterns:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePattern = async (name: string, ratio: [number, number, number, number]) => {
    try {
      const newPattern: BreathingPattern = {
        id: `custom_${Date.now()}`,
        name,
        ratio,
        isCustom: true,
        createdAt: new Date().toISOString(),
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
      const updatedPatterns = patterns.filter(p => p.id !== id);
      const customPatterns = updatedPatterns.filter(p => p.isCustom);
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(customPatterns));
      setPatterns(updatedPatterns);
    } catch (error) {
      console.error('Error deleting pattern:', error);
      throw error;
    }
  };

  return {
    patterns,
    loading,
    savePattern,
    deletePattern,
    refreshPatterns: loadPatterns,
  };
}