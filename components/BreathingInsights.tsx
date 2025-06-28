import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, TrendingDown, Minus, Brain, Heart, Zap } from 'lucide-react-native';

interface InsightData {
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
  color: string;
}

interface BreathingInsightsProps {
  visible: boolean;
  onClose: () => void;
  insights: InsightData[];
}

export default function BreathingInsights({ 
  visible, 
  onClose, 
  insights 
}: BreathingInsightsProps) {
  if (!visible) return null;

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp size={16} color="#10b981" />;
      case 'down': return <TrendingDown size={16} color="#ef4444" />;
      case 'stable': return <Minus size={16} color="#6b7280" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return '#10b981';
      case 'down': return '#ef4444';
      case 'stable': return '#6b7280';
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
          <View style={styles.header}>
            <Text style={styles.title}>Breathing Insights</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.insightsGrid}>
              {insights.map((insight, index) => (
                <View key={index} style={styles.insightCard}>
                  <LinearGradient
                    colors={[insight.color, `${insight.color}80`]}
                    style={styles.insightGradient}
                  >
                    <View style={styles.insightHeader}>
                      {insight.icon}
                      <View style={styles.trendContainer}>
                        {getTrendIcon(insight.trend)}
                        <Text style={[
                          styles.changeText,
                          { color: getTrendColor(insight.trend) }
                        ]}>
                          {insight.change > 0 ? '+' : ''}{insight.change}%
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={styles.insightValue}>{insight.value}</Text>
                    <Text style={styles.insightTitle}>{insight.title}</Text>
                  </LinearGradient>
                </View>
              ))}
            </View>

            <View style={styles.summarySection}>
              <Text style={styles.summaryTitle}>Weekly Summary</Text>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryText}>
                  Your breathing practice has improved by 15% this week. 
                  You're building excellent consistency and your stress levels 
                  are trending downward. Keep up the amazing work!
                </Text>
              </View>
            </View>

            <View style={styles.recommendationsSection}>
              <Text style={styles.recommendationsTitle}>Personalized Recommendations</Text>
              
              <View style={styles.recommendationCard}>
                <Brain size={20} color="#8b5cf6" />
                <View style={styles.recommendationContent}>
                  <Text style={styles.recommendationTitle}>Try Morning Sessions</Text>
                  <Text style={styles.recommendationText}>
                    Your stress levels are highest in the morning. A 5-minute session could help.
                  </Text>
                </View>
              </View>

              <View style={styles.recommendationCard}>
                <Heart size={20} color="#ef4444" />
                <View style={styles.recommendationContent}>
                  <Text style={styles.recommendationTitle}>Focus on 4-7-8 Pattern</Text>
                  <Text style={styles.recommendationText}>
                    This pattern shows the best results for your stress reduction goals.
                  </Text>
                </View>
              </View>

              <View style={styles.recommendationCard}>
                <Zap size={20} color="#f59e0b" />
                <View style={styles.recommendationContent}>
                  <Text style={styles.recommendationTitle}>Extend Session Length</Text>
                  <Text style={styles.recommendationText}>
                    You're ready for 8-10 minute sessions to maximize benefits.
                  </Text>
                </View>
              </View>
            </View>
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
    width: '90%',
    maxHeight: '85%',
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
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  insightCard: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  insightGradient: {
    padding: 16,
    minHeight: 120,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  insightValue: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  insightTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  summarySection: {
    padding: 20,
    paddingTop: 30,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  summaryText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  recommendationsSection: {
    padding: 20,
    paddingTop: 0,
  },
  recommendationsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
  },
  recommendationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 16,
  },
});