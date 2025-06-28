import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface WeeklyCalendarProps {
  completedDays: boolean[];
  currentStreak: number;
  onDayPress?: (dayIndex: number) => void;
}

export default function WeeklyCalendar({ 
  completedDays, 
  currentStreak,
  onDayPress 
}: WeeklyCalendarProps) {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date().getDay();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>This Week</Text>
      <View style={styles.calendar}>
        {days.map((day, index) => {
          const isCompleted = completedDays[index];
          const isToday = index === today;
          const isFuture = index > today;
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayContainer,
                isToday && styles.todayContainer,
                isCompleted && styles.completedContainer,
                isFuture && styles.futureContainer,
              ]}
              onPress={() => onDayPress?.(index)}
              disabled={isFuture}
            >
              {isCompleted ? (
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  style={styles.dayGradient}
                >
                  <Text style={styles.dayTextCompleted}>{day}</Text>
                  <Text style={styles.checkmark}>✓</Text>
                </LinearGradient>
              ) : (
                <View style={styles.dayContent}>
                  <Text style={[
                    styles.dayText,
                    isToday && styles.todayText,
                    isFuture && styles.futureText,
                  ]}>
                    {day}
                  </Text>
                  {isToday && (
                    <View style={styles.todayDot} />
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      
      <View style={styles.streakInfo}>
        <Text style={styles.streakText}>
          🔥 {currentStreak} day streak
        </Text>
        <Text style={styles.progressText}>
          {completedDays.filter(Boolean).length}/7 this week
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
  },
  calendar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  todayContainer: {
    borderWidth: 2,
    borderColor: '#fbbf24',
  },
  completedContainer: {
    backgroundColor: 'transparent',
  },
  futureContainer: {
    opacity: 0.5,
  },
  dayGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dayContent: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  dayTextCompleted: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  todayText: {
    color: '#fbbf24',
    fontWeight: '700',
  },
  futureText: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
  checkmark: {
    position: 'absolute',
    fontSize: 8,
    color: 'white',
    bottom: 2,
    right: 2,
  },
  todayDot: {
    position: 'absolute',
    bottom: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fbbf24',
  },
  streakInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});