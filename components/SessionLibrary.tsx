import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Clock, User, Star, Filter, Search } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface SessionLibraryProps {
  visible: boolean;
  onClose: () => void;
  onSelectSession: (session: any) => void;
}

const GUIDED_SESSIONS = [
  {
    id: 'morning-energy',
    title: 'Morning Energy Boost',
    instructor: 'Dr. Sarah Chen',
    duration: 8,
    description: 'Start your day with energizing breath work to boost alertness and vitality.',
    difficulty: 'beginner',
    category: 'energy',
    rating: 4.8,
    completions: 1247,
    thumbnail: '🌅'
  },
  {
    id: 'stress-relief',
    title: 'Deep Stress Relief',
    instructor: 'Michael Rodriguez',
    duration: 12,
    description: 'Release tension and find calm with this comprehensive stress-relief session.',
    difficulty: 'intermediate',
    category: 'stress-relief',
    rating: 4.9,
    completions: 2156,
    thumbnail: '🧘‍♀️'
  },
  {
    id: 'sleep-preparation',
    title: 'Sleep Preparation',
    instructor: 'Luna Williams',
    duration: 15,
    description: 'Gentle breathing techniques to prepare your body and mind for restful sleep.',
    difficulty: 'beginner',
    category: 'sleep',
    rating: 4.7,
    completions: 3421,
    thumbnail: '🌙'
  },
  {
    id: 'focus-enhancement',
    title: 'Focus Enhancement',
    instructor: 'Dr. James Park',
    duration: 10,
    description: 'Sharpen your concentration and mental clarity with targeted breathing exercises.',
    difficulty: 'intermediate',
    category: 'focus',
    rating: 4.6,
    completions: 987,
    thumbnail: '🎯'
  },
  {
    id: 'anxiety-relief',
    title: 'Anxiety Relief',
    instructor: 'Emma Thompson',
    duration: 14,
    description: 'Calm your nervous system and reduce anxiety with proven breathing techniques.',
    difficulty: 'beginner',
    category: 'anxiety',
    rating: 4.9,
    completions: 1876,
    thumbnail: '🕊️'
  },
  {
    id: 'advanced-pranayama',
    title: 'Advanced Pranayama',
    instructor: 'Yogi Krishnan',
    duration: 20,
    description: 'Traditional yogic breathing practices for experienced practitioners.',
    difficulty: 'advanced',
    category: 'spiritual',
    rating: 4.8,
    completions: 543,
    thumbnail: '🕉️'
  }
];

export default function SessionLibrary({ 
  visible, 
  onClose, 
  onSelectSession 
}: SessionLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  if (!visible) return null;

  const categories = ['all', 'energy', 'stress-relief', 'sleep', 'focus', 'anxiety', 'spiritual'];
  const difficulties = ['all', 'beginner', 'intermediate', 'advanced'];

  const filteredSessions = GUIDED_SESSIONS.filter(session => {
    const categoryMatch = selectedCategory === 'all' || session.category === selectedCategory;
    const difficultyMatch = selectedDifficulty === 'all' || session.difficulty === selectedDifficulty;
    return categoryMatch && difficultyMatch;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#10b981';
      case 'intermediate': return '#f59e0b';
      case 'advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'energy': return '#f59e0b';
      case 'stress-relief': return '#8b5cf6';
      case 'sleep': return '#3b82f6';
      case 'focus': return '#10b981';
      case 'anxiety': return '#ef4444';
      case 'spiritual': return '#6366f1';
      default: return '#6b7280';
    }
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
            <Text style={styles.title}>Guided Sessions</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Filters */}
          <View style={styles.filtersSection}>
            <Text style={styles.filterTitle}>Category</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterContainer}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.filterChip,
                    selectedCategory === category && styles.activeFilterChip
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={[
                    styles.filterChipText,
                    selectedCategory === category && styles.activeFilterChipText
                  ]}>
                    {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.filterTitle}>Difficulty</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterContainer}
            >
              {difficulties.map((difficulty) => (
                <TouchableOpacity
                  key={difficulty}
                  style={[
                    styles.filterChip,
                    selectedDifficulty === difficulty && styles.activeFilterChip
                  ]}
                  onPress={() => setSelectedDifficulty(difficulty)}
                >
                  <Text style={[
                    styles.filterChipText,
                    selectedDifficulty === difficulty && styles.activeFilterChipText
                  ]}>
                    {difficulty === 'all' ? 'All' : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Sessions List */}
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sessionsList}
          >
            {filteredSessions.map((session) => (
              <TouchableOpacity
                key={session.id}
                style={styles.sessionCard}
                onPress={() => {
                  onSelectSession(session);
                  onClose();
                }}
              >
                <View style={styles.sessionThumbnail}>
                  <Text style={styles.thumbnailEmoji}>{session.thumbnail}</Text>
                </View>
                
                <View style={styles.sessionInfo}>
                  <View style={styles.sessionHeader}>
                    <Text style={styles.sessionTitle}>{session.title}</Text>
                    <View style={styles.sessionRating}>
                      <Star size={12} color="#fbbf24" fill="#fbbf24" />
                      <Text style={styles.ratingText}>{session.rating}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.sessionMeta}>
                    <View style={styles.metaItem}>
                      <User size={12} color="rgba(255, 255, 255, 0.7)" />
                      <Text style={styles.metaText}>{session.instructor}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Clock size={12} color="rgba(255, 255, 255, 0.7)" />
                      <Text style={styles.metaText}>{session.duration} min</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.sessionDescription} numberOfLines={2}>
                    {session.description}
                  </Text>
                  
                  <View style={styles.sessionFooter}>
                    <View style={styles.badges}>
                      <View style={[styles.badge, { backgroundColor: getDifficultyColor(session.difficulty) }]}>
                        <Text style={styles.badgeText}>{session.difficulty}</Text>
                      </View>
                      <View style={[styles.badge, { backgroundColor: getCategoryColor(session.category) }]}>
                        <Text style={styles.badgeText}>{session.category}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.playButton}>
                      <Play size={16} color="white" />
                    </View>
                  </View>
                  
                  <Text style={styles.completionsText}>
                    {session.completions.toLocaleString()} completions
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
    maxHeight: '90%',
  },
  modal: {
    borderRadius: 20,
    overflow: 'hidden',
    maxHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  filtersSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
    marginTop: 12,
  },
  filterContainer: {
    paddingRight: 20,
  },
  filterChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  filterChipText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  activeFilterChipText: {
    color: 'white',
    fontWeight: '600',
  },
  sessionsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sessionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    gap: 12,
  },
  sessionThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailEmoji: {
    fontSize: 24,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    flex: 1,
  },
  sessionRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  sessionMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  sessionDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 16,
    marginBottom: 8,
  },
  sessionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 9,
    color: 'white',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  playButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionsText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});