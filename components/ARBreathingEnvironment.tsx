import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AREnvironment } from '@/hooks/useAREnvironments';

const { width, height } = Dimensions.get('window');

interface Particle {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
  rotation: Animated.Value;
}

interface ARBreathingEnvironmentProps {
  environment: AREnvironment;
  breathingPhase: 'inhale' | 'hold1' | 'exhale' | 'hold2';
  isActive: boolean;
  intensity?: number; // 0-1 for breathing intensity
}

export default function ARBreathingEnvironment({ 
  environment, 
  breathingPhase, 
  isActive,
  intensity = 0.5 
}: ARBreathingEnvironmentProps) {
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Initialize particles
  useEffect(() => {
    const particleCount = environment.particleType === 'orbiting' ? 8 : 15;
    particlesRef.current = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(Math.random() * height),
      scale: new Animated.Value(0.1 + Math.random() * 0.5),
      opacity: new Animated.Value(0.3 + Math.random() * 0.4),
      rotation: new Animated.Value(0),
    }));
  }, [environment.id]);

  // Animate particles based on breathing phase
  useEffect(() => {
    if (!isActive) return;

    const particles = particlesRef.current;
    const animations: Animated.CompositeAnimation[] = [];

    particles.forEach((particle, index) => {
      let animation: Animated.CompositeAnimation;
      
      switch (environment.particleType) {
        case 'floating':
          animation = createFloatingAnimation(particle, breathingPhase, intensity, index);
          break;
        case 'flowing':
          animation = createFlowingAnimation(particle, breathingPhase, intensity, index);
          break;
        case 'pulsing':
          animation = createPulsingAnimation(particle, breathingPhase, intensity, index);
          break;
        case 'orbiting':
          animation = createOrbitingAnimation(particle, breathingPhase, intensity, index);
          break;
        default:
          animation = createFloatingAnimation(particle, breathingPhase, intensity, index);
      }
      
      animations.push(animation);
    });

    // Stop previous animations
    if (animationRef.current) {
      animationRef.current.stop();
    }

    // Start new animations
    animationRef.current = Animated.parallel(animations);
    animationRef.current.start();

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [breathingPhase, isActive, intensity, environment.particleType]);

  const createFloatingAnimation = (
    particle: Particle, 
    phase: string, 
    intensity: number, 
    index: number
  ): Animated.CompositeAnimation => {
    const isInhale = phase === 'inhale';
    const duration = isInhale ? 4000 : 6000;
    const delay = index * 100;

    return Animated.parallel([
      Animated.timing(particle.y, {
        toValue: isInhale 
          ? Math.random() * height * 0.3 
          : height * 0.7 + Math.random() * height * 0.3,
        duration,
        delay,
        useNativeDriver: false,
      }),
      Animated.timing(particle.scale, {
        toValue: isInhale ? 0.8 + intensity * 0.5 : 0.2 + intensity * 0.3,
        duration,
        delay,
        useNativeDriver: false,
      }),
      Animated.timing(particle.opacity, {
        toValue: isInhale ? 0.8 : 0.3,
        duration,
        delay,
        useNativeDriver: false,
      }),
    ]);
  };

  const createFlowingAnimation = (
    particle: Particle, 
    phase: string, 
    intensity: number, 
    index: number
  ): Animated.CompositeAnimation => {
    const isInhale = phase === 'inhale';
    const duration = 3000;
    const delay = index * 150;

    return Animated.parallel([
      Animated.timing(particle.x, {
        toValue: isInhale 
          ? width * 0.5 + (Math.random() - 0.5) * width * 0.3
          : Math.random() * width,
        duration,
        delay,
        useNativeDriver: false,
      }),
      Animated.timing(particle.y, {
        toValue: isInhale 
          ? height * 0.5 + (Math.random() - 0.5) * height * 0.3
          : Math.random() * height,
        duration,
        delay,
        useNativeDriver: false,
      }),
      Animated.timing(particle.scale, {
        toValue: isInhale ? 0.6 + intensity * 0.4 : 0.2,
        duration,
        delay,
        useNativeDriver: false,
      }),
    ]);
  };

  const createPulsingAnimation = (
    particle: Particle, 
    phase: string, 
    intensity: number, 
    index: number
  ): Animated.CompositeAnimation => {
    const isInhale = phase === 'inhale';
    const duration = 2000;
    const delay = index * 50;

    return Animated.parallel([
      Animated.timing(particle.scale, {
        toValue: isInhale ? 1.2 + intensity * 0.8 : 0.3,
        duration,
        delay,
        useNativeDriver: false,
      }),
      Animated.timing(particle.opacity, {
        toValue: isInhale ? 0.9 : 0.2,
        duration,
        delay,
        useNativeDriver: false,
      }),
      Animated.timing(particle.rotation, {
        toValue: isInhale ? 360 : 0,
        duration: duration * 2,
        delay,
        useNativeDriver: false,
      }),
    ]);
  };

  const createOrbitingAnimation = (
    particle: Particle, 
    phase: string, 
    intensity: number, 
    index: number
  ): Animated.CompositeAnimation => {
    const centerX = width * 0.5;
    const centerY = height * 0.5;
    const radius = phase === 'inhale' ? 120 + intensity * 80 : 60;
    const angle = (index / particlesRef.current.length) * 2 * Math.PI;
    
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    
    const duration = 4000;

    return Animated.parallel([
      Animated.timing(particle.x, {
        toValue: x,
        duration,
        useNativeDriver: false,
      }),
      Animated.timing(particle.y, {
        toValue: y,
        duration,
        useNativeDriver: false,
      }),
      Animated.timing(particle.scale, {
        toValue: phase === 'inhale' ? 0.8 : 0.4,
        duration,
        useNativeDriver: false,
      }),
    ]);
  };

  const getParticleColor = (index: number) => {
    const colors = environment.colors;
    return colors[index % colors.length];
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={environment.colors}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Particle System */}
      <View style={styles.particlesContainer}>
        {particlesRef.current.map((particle, index) => (
          <Animated.View
            key={particle.id}
            style={[
              styles.particle,
              {
                left: particle.x,
                top: particle.y,
                transform: [
                  { scale: particle.scale },
                  { 
                    rotate: particle.rotation.interpolate({
                      inputRange: [0, 360],
                      outputRange: ['0deg', '360deg']
                    }) 
                  }
                ],
                opacity: particle.opacity,
                backgroundColor: getParticleColor(index),
              },
            ]}
          />
        ))}
      </View>

      {/* Environment-specific overlays */}
      {environment.id === 'ocean_depths' && (
        <View style={styles.waveOverlay}>
          <LinearGradient
            colors={['transparent', 'rgba(0, 168, 204, 0.1)', 'transparent']}
            style={styles.wave}
          />
        </View>
      )}

      {environment.id === 'forest_sanctuary' && (
        <View style={styles.forestOverlay}>
          {Array.from({ length: 5 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.tree,
                {
                  left: `${20 + i * 15}%`,
                  height: 100 + Math.random() * 50,
                  opacity: 0.1 + Math.random() * 0.1,
                }
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  background: {
    flex: 1,
  },
  particlesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowColor: '#fff',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  waveOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  wave: {
    flex: 1,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
  },
  forestOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  tree: {
    position: 'absolute',
    bottom: 0,
    width: 20,
    backgroundColor: 'rgba(64, 145, 108, 0.3)',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
});