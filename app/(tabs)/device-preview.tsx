import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Smartphone, Tablet, Monitor, ChevronDown } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Device {
  id: string;
  name: string;
  width: number;
  height: number;
  category: 'phone' | 'tablet' | 'desktop';
  brand: string;
  icon: React.ComponentType<any>;
}

const DEVICES: Device[] = [
  // Phones
  {
    id: 'galaxy-z-fold-6',
    name: 'Galaxy Z Fold 6',
    width: 374,
    height: 832,
    category: 'phone',
    brand: 'Samsung',
    icon: Smartphone,
  },
  {
    id: 'galaxy-z-fold-6-unfolded',
    name: 'Galaxy Z Fold 6 (Unfolded)',
    width: 673,
    height: 832,
    category: 'tablet',
    brand: 'Samsung',
    icon: Tablet,
  },
  {
    id: 'iphone-15-pro',
    name: 'iPhone 15 Pro',
    width: 393,
    height: 852,
    category: 'phone',
    brand: 'Apple',
    icon: Smartphone,
  },
  {
    id: 'pixel-8-pro',
    name: 'Pixel 8 Pro',
    width: 412,
    height: 915,
    category: 'phone',
    brand: 'Google',
    icon: Smartphone,
  },
  {
    id: 'galaxy-s24-ultra',
    name: 'Galaxy S24 Ultra',
    width: 412,
    height: 915,
    category: 'phone',
    brand: 'Samsung',
    icon: Smartphone,
  },
  // Tablets
  {
    id: 'ipad-pro-12',
    name: 'iPad Pro 12.9"',
    width: 1024,
    height: 1366,
    category: 'tablet',
    brand: 'Apple',
    icon: Tablet,
  },
  {
    id: 'galaxy-tab-s9',
    name: 'Galaxy Tab S9',
    width: 800,
    height: 1280,
    category: 'tablet',
    brand: 'Samsung',
    icon: Tablet,
  },
  // Desktop
  {
    id: 'desktop-1080p',
    name: 'Desktop 1080p',
    width: 1920,
    height: 1080,
    category: 'desktop',
    brand: 'Generic',
    icon: Monitor,
  },
  {
    id: 'desktop-4k',
    name: 'Desktop 4K',
    width: 3840,
    height: 2160,
    category: 'desktop',
    brand: 'Generic',
    icon: Monitor,
  },
];

export default function DevicePreviewScreen() {
  const insets = useSafeAreaInsets();
  const [selectedDevice, setSelectedDevice] = useState<Device>(DEVICES[0]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'phone' | 'tablet' | 'desktop'>('all');

  const filteredDevices = DEVICES.filter(device => 
    selectedCategory === 'all' || device.category === selectedCategory
  );

  const getScaleFactor = () => {
    const maxWidth = screenWidth - 40; // Account for padding
    const maxHeight = screenHeight - 300; // Account for header and controls
    
    const scaleX = maxWidth / selectedDevice.width;
    const scaleY = maxHeight / selectedDevice.height;
    
    return Math.min(scaleX, scaleY, 1); // Don't scale up beyond 1
  };

  const scaleFactor = getScaleFactor();
  const previewWidth = selectedDevice.width * scaleFactor;
  const previewHeight = selectedDevice.height * scaleFactor;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'phone': return Smartphone;
      case 'tablet': return Tablet;
      case 'desktop': return Monitor;
      default: return Smartphone;
    }
  };

  const getBrandColor = (brand: string) => {
    switch (brand) {
      case 'Samsung': return '#1f8ef1';
      case 'Apple': return '#007aff';
      case 'Google': return '#4285f4';
      default: return '#6b7280';
    }
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { 
            paddingTop: insets.top + 20,
            paddingBottom: Platform.select({
              ios: insets.bottom > 0 ? insets.bottom + 90 : 90,
              android: 90,
              default: 90,
            })
          }
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Device Preview</Text>
          <Text style={styles.subtitle}>Test your app on different devices</Text>
        </View>

        {/* Category Filter */}
        <View style={styles.categoryContainer}>
          <Text style={styles.sectionTitle}>Device Category</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {(['all', 'phone', 'tablet', 'desktop'] as const).map((category) => {
              const Icon = category === 'all' ? Monitor : getCategoryIcon(category);
              return (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category && styles.activeCategoryButton
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Icon size={20} color="white" />
                  <Text style={styles.categoryButtonText}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Device Selector */}
        <View style={styles.selectorContainer}>
          <Text style={styles.sectionTitle}>Select Device</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <View style={styles.dropdownContent}>
              <View style={styles.deviceInfo}>
                <View style={[styles.brandDot, { backgroundColor: getBrandColor(selectedDevice.brand) }]} />
                <Text style={styles.deviceName}>{selectedDevice.name}</Text>
                <Text style={styles.deviceSpecs}>
                  {selectedDevice.width} × {selectedDevice.height}
                </Text>
              </View>
              <ChevronDown 
                size={20} 
                color="white" 
                style={[
                  styles.chevron,
                  showDropdown && styles.chevronRotated
                ]}
              />
            </View>
          </TouchableOpacity>

          {showDropdown && (
            <View style={styles.dropdownList}>
              <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                {filteredDevices.map((device) => {
                  const Icon = device.icon;
                  return (
                    <TouchableOpacity
                      key={device.id}
                      style={[
                        styles.dropdownItem,
                        selectedDevice.id === device.id && styles.activeDropdownItem
                      ]}
                      onPress={() => {
                        setSelectedDevice(device);
                        setShowDropdown(false);
                      }}
                    >
                      <Icon size={18} color="white" />
                      <View style={styles.deviceDetails}>
                        <View style={styles.deviceHeader}>
                          <Text style={styles.dropdownDeviceName}>{device.name}</Text>
                          <View style={[styles.brandDot, { backgroundColor: getBrandColor(device.brand) }]} />
                        </View>
                        <Text style={styles.dropdownDeviceSpecs}>
                          {device.width} × {device.height} • {device.brand}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Device Preview */}
        <View style={styles.previewContainer}>
          <Text style={styles.sectionTitle}>Preview</Text>
          <View style={styles.previewWrapper}>
            <View 
              style={[
                styles.deviceFrame,
                {
                  width: previewWidth,
                  height: previewHeight,
                }
              ]}
            >
              <View style={styles.deviceScreen}>
                {/* Simulated App Content */}
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.appContent}
                >
                  <View style={styles.appHeader}>
                    <Text style={styles.appTitle}>Breathe</Text>
                    <Text style={styles.appSubtitle}>Find your calm rhythm</Text>
                  </View>
                  
                  <View style={styles.breathingCircle}>
                    <View style={styles.circleInner}>
                      <Text style={styles.phaseText}>Inhale</Text>
                    </View>
                  </View>
                  
                  <View style={styles.appControls}>
                    <View style={styles.controlButton}>
                      <Text style={styles.controlButtonText}>Start</Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </View>
            
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceInfoText}>
                {selectedDevice.name} • Scale: {Math.round(scaleFactor * 100)}%
              </Text>
              <Text style={styles.deviceInfoSubtext}>
                {selectedDevice.width} × {selectedDevice.height} pixels
              </Text>
            </View>
          </View>
        </View>

        {/* Device Specifications */}
        <View style={styles.specsContainer}>
          <Text style={styles.sectionTitle}>Device Specifications</Text>
          <View style={styles.specsGrid}>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Resolution</Text>
              <Text style={styles.specValue}>
                {selectedDevice.width} × {selectedDevice.height}
              </Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Aspect Ratio</Text>
              <Text style={styles.specValue}>
                {(selectedDevice.width / selectedDevice.height).toFixed(2)}:1
              </Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Category</Text>
              <Text style={styles.specValue}>
                {selectedDevice.category.charAt(0).toUpperCase() + selectedDevice.category.slice(1)}
              </Text>
            </View>
            <View style={styles.specItem}>
              <Text style={styles.specLabel}>Brand</Text>
              <Text style={styles.specValue}>{selectedDevice.brand}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '400',
    textAlign: 'center',
  },
  categoryContainer: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 15,
  },
  categoryScroll: {
    paddingHorizontal: 5,
  },
  categoryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 5,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeCategoryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  categoryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  selectorContainer: {
    marginBottom: 25,
    position: 'relative',
    zIndex: 10,
  },
  dropdown: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  deviceName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  deviceSpecs: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  chevron: {
    transform: [{ rotate: '0deg' }],
  },
  chevronRotated: {
    transform: [{ rotate: '180deg' }],
  },
  dropdownList: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeDropdownItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  deviceDetails: {
    flex: 1,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  dropdownDeviceName: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  dropdownDeviceSpecs: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  previewContainer: {
    marginBottom: 25,
  },
  previewWrapper: {
    alignItems: 'center',
  },
  deviceFrame: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  deviceScreen: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  appContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  appHeader: {
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  breathingCircle: {
    alignSelf: 'center',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  circleInner: {
    alignItems: 'center',
  },
  phaseText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  appControls: {
    alignItems: 'center',
  },
  controlButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  controlButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  deviceInfoText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 15,
    textAlign: 'center',
  },
  deviceInfoSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
  specsContainer: {
    marginBottom: 20,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  specItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    flex: 1,
    minWidth: '45%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  specLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  specValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});