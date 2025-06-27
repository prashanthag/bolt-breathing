import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BreathingRoom {
  id: string;
  name: string;
  description: string;
  currentUsers: number;
  maxUsers: number;
  isActive: boolean;
  pattern: string;
  phase: 'inhale' | 'hold1' | 'exhale' | 'hold2';
  cycleCount: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: 'meditation' | 'energy' | 'sleep' | 'focus';
  emoji: string;
  createdAt: Date;
}

export interface User {
  id: string;
  name: string;
  level: number;
  avatar: string;
  isBreathing: boolean;
}

// Simulated real-time data (in production, this would connect to WebSocket/Socket.io)
const DEMO_ROOMS: BreathingRoom[] = [
  {
    id: 'global-morning',
    name: 'Global Morning Calm',
    description: 'Start your day with breathing practice alongside thousands',
    currentUsers: 2847,
    maxUsers: 5000,
    isActive: true,
    pattern: 'Box Breathing (4:4:4:4)',
    phase: 'inhale',
    cycleCount: 3,
    difficulty: 'beginner',
    category: 'meditation',
    emoji: '🌅',
    createdAt: new Date()
  },
  {
    id: 'stress-relief',
    name: 'Stress Relief Circle',
    description: 'Quick stress relief session for busy professionals',
    currentUsers: 1234,
    maxUsers: 2000,
    isActive: true,
    pattern: '4-7-8 Relaxing',
    phase: 'exhale',
    cycleCount: 1,
    difficulty: 'intermediate',
    category: 'meditation',
    emoji: '😌',
    createdAt: new Date()
  },
  {
    id: 'evening-wind-down',
    name: 'Evening Wind Down',
    description: 'Peaceful breathing to prepare for sleep',
    currentUsers: 892,
    maxUsers: 1500,
    isActive: true,
    pattern: 'Deep Sleep (6:2:8:2)',
    phase: 'hold1',
    cycleCount: 2,
    difficulty: 'beginner',
    category: 'sleep',
    emoji: '🌙',
    createdAt: new Date()
  },
  {
    id: 'focus-boost',
    name: 'Focus Boost Session',
    description: 'Energizing breath work for mental clarity',
    currentUsers: 567,
    maxUsers: 1000,
    isActive: true,
    pattern: 'Energizing (4:1:4:1)',
    phase: 'inhale',
    cycleCount: 4,
    difficulty: 'advanced',
    category: 'focus',
    emoji: '⚡',
    createdAt: new Date()
  },
  {
    id: 'beginner-circle',
    name: 'Beginner\'s Circle',
    description: 'Safe space for new practitioners to learn together',
    currentUsers: 156,
    maxUsers: 500,
    isActive: true,
    pattern: 'Simple (3:3:3:3)',
    phase: 'exhale',
    cycleCount: 1,
    difficulty: 'beginner',
    category: 'meditation',
    emoji: '🌱',
    createdAt: new Date()
  }
];

export function useSocialBreathing() {
  const [rooms, setRooms] = useState<BreathingRoom[]>(DEMO_ROOMS);
  const [currentRoom, setCurrentRoom] = useState<BreathingRoom | null>(null);
  const [roomUsers, setRoomUsers] = useState<User[]>([]);
  const [userName, setUserName] = useState<string>('');
  const [userAvatar, setUserAvatar] = useState<string>('😊');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadUserProfile();
    startRoomUpdates();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const loadUserProfile = async () => {
    try {
      const [savedName, savedAvatar] = await Promise.all([
        AsyncStorage.getItem('socialUserName'),
        AsyncStorage.getItem('socialUserAvatar')
      ]);

      if (savedName) setUserName(savedName);
      else setUserName(`User${Math.floor(Math.random() * 9999)}`);

      if (savedAvatar) setUserAvatar(savedAvatar);
    } catch (error) {
      console.log('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveUserProfile = async (name: string, avatar: string) => {
    try {
      await Promise.all([
        AsyncStorage.setItem('socialUserName', name),
        AsyncStorage.setItem('socialUserAvatar', avatar)
      ]);
      setUserName(name);
      setUserAvatar(avatar);
    } catch (error) {
      console.log('Error saving user profile:', error);
    }
  };

  const startRoomUpdates = () => {
    // Simulate real-time updates
    intervalRef.current = setInterval(() => {
      setRooms(prevRooms => 
        prevRooms.map(room => ({
          ...room,
          currentUsers: Math.max(1, room.currentUsers + Math.floor(Math.random() * 20 - 10)),
          phase: getNextPhase(room.phase),
          cycleCount: room.phase === 'inhale' ? room.cycleCount + 1 : room.cycleCount
        }))
      );

      // Update current room users
      if (currentRoom) {
        generateRoomUsers();
      }
    }, 8000); // Update every 8 seconds to match breathing rhythm
  };

  const getNextPhase = (currentPhase: BreathingRoom['phase']): BreathingRoom['phase'] => {
    const phases: BreathingRoom['phase'][] = ['inhale', 'hold1', 'exhale', 'hold2'];
    const currentIndex = phases.indexOf(currentPhase);
    return phases[(currentIndex + 1) % phases.length];
  };

  const generateRoomUsers = () => {
    const avatars = ['😊', '🌟', '🦋', '🌸', '🍃', '☀️', '🌙', '💫', '🔥', '💎'];
    const userCount = Math.min(12, Math.max(3, Math.floor(Math.random() * 15)));
    
    const users: User[] = Array.from({ length: userCount }, (_, i) => ({
      id: `user-${i}`,
      name: i === 0 ? userName : `Breathe${Math.floor(Math.random() * 999)}`,
      level: Math.floor(Math.random() * 20) + 1,
      avatar: i === 0 ? userAvatar : avatars[Math.floor(Math.random() * avatars.length)],
      isBreathing: Math.random() > 0.3
    }));

    setRoomUsers(users);
  };

  const joinRoom = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room || room.currentUsers >= room.maxUsers) return false;

    setCurrentRoom(room);
    setIsConnected(true);
    generateRoomUsers();

    // Update room user count
    setRooms(prevRooms =>
      prevRooms.map(r =>
        r.id === roomId ? { ...r, currentUsers: r.currentUsers + 1 } : r
      )
    );

    return true;
  };

  const leaveRoom = () => {
    if (!currentRoom) return;

    // Update room user count
    setRooms(prevRooms =>
      prevRooms.map(r =>
        r.id === currentRoom.id ? { ...r, currentUsers: Math.max(0, r.currentUsers - 1) } : r
      )
    );

    setCurrentRoom(null);
    setIsConnected(false);
    setRoomUsers([]);
  };

  const sendHeartbeat = () => {
    // Simulate sending breathing activity to other users
    if (currentRoom && isConnected) {
      console.log('Sending heartbeat to room:', currentRoom.name);
    }
  };

  const getCategoryColor = (category: BreathingRoom['category']) => {
    switch (category) {
      case 'meditation': return '#8b5cf6';
      case 'energy': return '#f59e0b';
      case 'sleep': return '#3b82f6';
      case 'focus': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getDifficultyColor = (difficulty: BreathingRoom['difficulty']) => {
    switch (difficulty) {
      case 'beginner': return '#10b981';
      case 'intermediate': return '#f59e0b';
      case 'advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getPopularRooms = () => {
    return [...rooms].sort((a, b) => b.currentUsers - a.currentUsers).slice(0, 3);
  };

  const getRoomsByCategory = (category: BreathingRoom['category']) => {
    return rooms.filter(room => room.category === category);
  };

  return {
    rooms,
    currentRoom,
    roomUsers,
    userName,
    userAvatar,
    isConnected,
    loading,
    joinRoom,
    leaveRoom,
    sendHeartbeat,
    saveUserProfile,
    getCategoryColor,
    getDifficultyColor,
    getPopularRooms,
    getRoomsByCategory
  };
}