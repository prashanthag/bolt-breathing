# Bolt Breathing 🫁

A React Native breathing exercise app built with Expo Router and TypeScript. Practice various breathing techniques with guided animations and voice instructions to improve mindfulness and reduce stress.

## Features ✨

- **Guided Breathing Animations**: Smooth, circular animations that guide your breathing rhythm
- **Voice Instructions**: Cross-platform speech synthesis providing audio cues for inhale, hold, and exhale
- **Multiple Breathing Patterns**:
  - **Box Breathing** (4:4:4:4) - Equal timing for all phases, great for focus and calm
  - **4-7-8 Relaxing** (4:7:8:0) - Stress-reducing technique for better sleep
  - **Coherent Breathing** (5:0:5:0) - Heart rate variability optimization
  - **Energizing** (4:4:6:2) - Boost energy and alertness
- **Custom Patterns**: Create and save your own breathing patterns
- **Cross-Platform**: Works on iOS, Android, and Web
- **Persistent Storage**: Your custom patterns are saved locally
- **Tab-Based Navigation**: Easy access to breathing exercises, device preview, and settings

## Screenshots

*Coming soon - screenshots will be added after UI improvements*

## Getting Started 🚀

### Prerequisites

- Node.js (v16 or higher)
- Yarn package manager
- Expo CLI
- For mobile development:
  - iOS: Xcode and iOS Simulator
  - Android: Android Studio and Android emulator

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/prashanthag/bolt-breathing.git
   cd bolt-breathing
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Start the development server**
   ```bash
   yarn dev
   ```

### Running the App

#### Web Browser
- Press `w` in the terminal or visit http://localhost:8081
- Works immediately without additional setup

#### iOS Simulator
- Press `i` in the terminal
- Requires Xcode to be installed

#### Android Emulator
- Press `a` in the terminal
- Requires Android Studio and an AVD (Android Virtual Device)

#### Physical Device
- Install Expo Go app from App Store/Play Store
- Scan the QR code displayed in terminal

## Usage 📱

### Basic Breathing Exercise
1. Open the app and navigate to the main breathing screen
2. Select a breathing pattern from the horizontal scroll list
3. Tap the animated circle to start the exercise
4. Follow the visual animation and audio cues:
   - Circle expands = Inhale
   - Circle holds = Hold breath
   - Circle contracts = Exhale
   - Circle pauses = Hold empty (if applicable)
5. Tap again to stop the exercise

### Creating Custom Patterns
1. Scroll to the end of the pattern list
2. Tap "Create Custom Pattern"
3. Set your desired timing for each phase:
   - **Inhale**: Breathing in duration (seconds)
   - **Hold 1**: Hold breath with air duration (seconds)
   - **Exhale**: Breathing out duration (seconds) 
   - **Hold 2**: Hold breath empty duration (seconds)
4. Save your custom pattern for future use

### Settings
- Navigate to the Settings tab to configure app preferences
- Adjust voice guidance settings
- Manage custom breathing patterns

## Project Structure 🏗️

```
breathing/
├── app/                          # Expo Router file-based navigation
│   ├── (tabs)/                   # Tab group layout
│   │   ├── index.tsx            # Main breathing exercise screen
│   │   ├── device-preview.tsx   # Device preview functionality
│   │   ├── settings.tsx         # App settings
│   │   └── _layout.tsx          # Tab navigation layout
│   ├── _layout.tsx              # Root layout
│   └── +not-found.tsx           # 404 page
├── hooks/                        # Custom React hooks
│   ├── useBreathingPatterns.ts  # Breathing pattern management
│   └── useFrameworkReady.ts     # Web compatibility hook
├── assets/                       # Images and static assets
└── package.json                 # Dependencies and scripts
```

## Available Scripts 📋

- **`yarn dev`** - Start the Expo development server with telemetry disabled
- **`yarn build:web`** - Export the app for web platform deployment
- **`yarn lint`** - Run Expo's linting checks for code quality

## Technology Stack 🛠️

- **React Native** (0.79.4) - Cross-platform mobile framework
- **Expo SDK** (53.0.12) - Development platform and tooling
- **Expo Router** (5.1.0) - File-based navigation system
- **TypeScript** - Type-safe JavaScript development
- **React Native Reanimated** - High-performance animations
- **Expo Speech** - Text-to-speech functionality
- **AsyncStorage** - Local data persistence
- **Lucide React Native** - Beautiful icons

## Architecture Details 🏛️

### Breathing State Management
The app uses a complex state machine to manage breathing phases:
- **Phase Tracking**: Cycles through inhale → hold1 → exhale → hold2
- **Timer Logic**: Precise interval-based counting with smooth transitions
- **Animation Sync**: React Native Reanimated synchronized with breathing phases

### Cross-Platform Speech
- **Web**: Uses browser's native `speechSynthesis` API
- **Mobile**: Uses `expo-speech` for iOS and Android
- **Fallback**: Graceful degradation when speech is unavailable

### Data Persistence
- Custom breathing patterns stored using AsyncStorage
- Automatic loading and saving of user preferences
- Migration support for future data structure changes

## Contributing 🤝

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting 🔧

### Common Issues

**Navigation Error on Android/Web**
- This was fixed by removing conflicting React Navigation packages
- If you encounter similar issues, ensure only Expo Router navigation is used

**Speech Not Working**
- Check device volume and speech settings
- On web, ensure browser supports Speech Synthesis API
- On mobile, verify app has microphone permissions if required

**App Won't Start**
- Clear Metro cache: `npx expo start --clear`
- Reinstall dependencies: `rm -rf node_modules && yarn install`
- Check Node.js version compatibility

**Custom Patterns Not Saving**
- Ensure app has proper storage permissions
- Check AsyncStorage availability on your platform

## Future Enhancements 🚧

- [ ] Breathing session history and statistics
- [ ] Background breathing reminders
- [ ] Integration with health apps (Apple Health, Google Fit)
- [ ] More breathing techniques (Wim Hof, Pranayama variants)
- [ ] Dark mode support
- [ ] Sound effects and ambient music options
- [ ] Social features and challenges
- [ ] Apple Watch and wearable support

## License 📄

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments 🙏

- Built with [Claude Code](https://claude.ai/code) AI assistance
- Inspired by mindfulness and breathing exercise practices
- Thanks to the Expo and React Native communities

---

**Start your mindful breathing journey today!** 🧘‍♀️✨