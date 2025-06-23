# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Development**: `yarn dev` - Start the Expo development server with telemetry disabled
- **Build Web**: `yarn build:web` - Export the app for web platform
- **Lint**: `yarn lint` - Run Expo's linting checks

## Architecture

This is a React Native breathing exercise app built with **Expo Router** and **TypeScript**. The app helps users practice various breathing techniques with guided animations and voice instructions.

### Key Components

- **Expo Router File-based Navigation**: Uses `app/` directory with `(tabs)` group for tab-based navigation
- **Tab Structure**: 
  - `index.tsx` - Main breathing exercise screen
  - `device-preview.tsx` - Device preview functionality  
  - `settings.tsx` - App settings
- **Custom Hooks**:
  - `useBreathingPatterns` - Manages breathing patterns with AsyncStorage persistence
  - `useFrameworkReady` - Web compatibility hook for framework initialization

### Breathe Screen (`app/(tabs)/index.tsx`)

The main breathing exercise interface featuring:
- **Animated Circle**: Uses `react-native-reanimated` for smooth breathing animations
- **Voice Guidance**: Cross-platform speech synthesis (Web SpeechSynthesis API + expo-speech)
- **Pattern Selection**: Horizontal scrollable pattern picker with custom pattern support
- **State Management**: Complex breathing state with phases (inhale, hold1, exhale, hold2)
- **Timer Logic**: Precise interval-based counting with phase transitions

### Breathing Patterns System

Patterns are defined as `[inhale, hold1, exhale, hold2]` ratios:
- **Default Patterns**: Box Breathing (4:4:4:4), 4-7-8 Relaxing, Coherent Breathing, Energizing
- **Custom Patterns**: User-created patterns stored in AsyncStorage
- **Pattern Management**: Create, delete, and switch between patterns

### Cross-Platform Considerations

- **Speech Synthesis**: Conditional logic for web (`speechSynthesis`) vs mobile (`expo-speech`)
- **Safe Area**: Platform-specific insets handling for iOS notch/home indicator
- **Styling**: Responsive design with screen dimension calculations

### Dependencies Note

Uses Expo SDK 53 with React Native 0.74.6. Key libraries:
- `react-native-reanimated` for animations  
- `expo-speech` for mobile voice synthesis
- `@react-native-async-storage/async-storage` for data persistence
- `lucide-react-native` for icons
- `expo-linear-gradient` for visual effects