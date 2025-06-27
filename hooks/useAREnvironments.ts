import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AREnvironment {
  id: string;
  name: string;
  description: string;
  colors: string[];
  particleType: 'floating' | 'flowing' | 'pulsing' | 'orbiting';
  soundscape?: string;
  unlockLevel: number;
  premium: boolean;
  icon: string;
}

const AR_ENVIRONMENTS: AREnvironment[] = [
  {
    id: 'cosmic_void',
    name: 'Cosmic Void',
    description: 'Float among the stars in infinite space',
    colors: ['#0f0f23', '#1a1a2e', '#16213e', '#0f3460'],
    particleType: 'floating',
    unlockLevel: 1,
    premium: false,
    icon: '🌌'
  },
  {
    id: 'ocean_depths',
    name: 'Ocean Depths',
    description: 'Breathe underwater with gentle currents',
    colors: ['#001e3c', '#003d82', '#0074b7', '#00a8cc'],
    particleType: 'flowing',
    unlockLevel: 3,
    premium: false,
    icon: '🌊'
  },
  {
    id: 'forest_sanctuary',
    name: 'Forest Sanctuary',
    description: 'Find peace among ancient trees',
    colors: ['#1b4332', '#2d5a3d', '#40916c', '#52b788'],
    particleType: 'floating',
    unlockLevel: 5,
    premium: false,
    icon: '🌲'
  },
  {
    id: 'crystal_cave',
    name: 'Crystal Cave',
    description: 'Meditate surrounded by glowing crystals',
    colors: ['#240046', '#3c096c', '#5a189a', '#7209b7'],
    particleType: 'pulsing',
    unlockLevel: 7,
    premium: true,
    icon: '💎'
  },
  {
    id: 'sunset_peak',
    name: 'Sunset Peak',
    description: 'Watch the sunrise from a mountain top',
    colors: ['#ff6b35', '#f7931e', '#ffd60a', '#ffe66d'],
    particleType: 'floating',
    unlockLevel: 10,
    premium: true,
    icon: '🏔️'
  },
  {
    id: 'aurora_field',
    name: 'Aurora Field',
    description: 'Dance with the northern lights',
    colors: ['#001122', '#003366', '#00ffcc', '#66ffaa'],
    particleType: 'flowing',
    unlockLevel: 15,
    premium: true,
    icon: '🌌'
  },
  {
    id: 'zen_garden',
    name: 'Zen Garden',
    description: 'Traditional Japanese garden serenity',
    colors: ['#2a2a2a', '#4a5c6a', '#b8c5d6', '#ffffff'],
    particleType: 'floating',
    unlockLevel: 20,
    premium: true,
    icon: '🪴'
  }
];

export function useAREnvironments() {
  const [selectedEnvironment, setSelectedEnvironment] = useState<AREnvironment>(AR_ENVIRONMENTS[0]);
  const [unlockedEnvironments, setUnlockedEnvironments] = useState<string[]>(['cosmic_void']);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEnvironmentSettings();
  }, []);

  const loadEnvironmentSettings = async () => {
    try {
      const [savedEnvironment, savedUnlocked] = await Promise.all([
        AsyncStorage.getItem('selectedEnvironment'),
        AsyncStorage.getItem('unlockedEnvironments')
      ]);

      if (savedEnvironment) {
        const env = AR_ENVIRONMENTS.find(e => e.id === savedEnvironment);
        if (env) setSelectedEnvironment(env);
      }

      if (savedUnlocked) {
        setUnlockedEnvironments(JSON.parse(savedUnlocked));
      }
    } catch (error) {
      console.log('Error loading environment settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectEnvironment = async (environmentId: string) => {
    const environment = AR_ENVIRONMENTS.find(e => e.id === environmentId);
    if (!environment) return;

    setSelectedEnvironment(environment);
    try {
      await AsyncStorage.setItem('selectedEnvironment', environmentId);
    } catch (error) {
      console.log('Error saving selected environment:', error);
    }
  };

  const unlockEnvironment = async (environmentId: string) => {
    if (unlockedEnvironments.includes(environmentId)) return;

    const newUnlocked = [...unlockedEnvironments, environmentId];
    setUnlockedEnvironments(newUnlocked);
    
    try {
      await AsyncStorage.setItem('unlockedEnvironments', JSON.stringify(newUnlocked));
    } catch (error) {
      console.log('Error saving unlocked environments:', error);
    }
  };

  const checkLevelUnlocks = async (currentLevel: number) => {
    const newUnlocks: AREnvironment[] = [];
    
    for (const env of AR_ENVIRONMENTS) {
      if (currentLevel >= env.unlockLevel && !unlockedEnvironments.includes(env.id) && !env.premium) {
        await unlockEnvironment(env.id);
        newUnlocks.push(env);
      }
    }
    
    return newUnlocks;
  };

  const getAvailableEnvironments = () => {
    return AR_ENVIRONMENTS.filter(env => 
      unlockedEnvironments.includes(env.id) || !env.premium
    );
  };

  const getLockedEnvironments = () => {
    return AR_ENVIRONMENTS.filter(env => 
      !unlockedEnvironments.includes(env.id)
    );
  };

  return {
    selectedEnvironment,
    unlockedEnvironments,
    availableEnvironments: getAvailableEnvironments(),
    lockedEnvironments: getLockedEnvironments(),
    allEnvironments: AR_ENVIRONMENTS,
    loading,
    selectEnvironment,
    unlockEnvironment,
    checkLevelUnlocks
  };
}