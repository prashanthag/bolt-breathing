import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Users, 
  X, 
  Crown, 
  Zap, 
  Moon, 
  Target, 
  Heart,
  Edit,
  UserPlus,
  Wifi,
  WifiOff
} from 'lucide-react-native';
import { BreathingRoom, User, useSocialBreathing } from '@/hooks/useSocialBreathing';

const { width, height } = Dimensions.get('window');

interface SocialBreathingRoomsProps {
  visible: boolean;
  onClose: () => void;
  onJoinRoom: (room: BreathingRoom) => void;
}

export default function SocialBreathingRooms({ 
  visible, 
  onClose, 
  onJoinRoom 
}: SocialBreathingRoomsProps) {
  const {
    rooms,
    currentRoom,
    roomUsers,
    userName,
    userAvatar,
    isConnected,
    loading,
    joinRoom,
    leaveRoom,
    saveUserProfile,
    getCategoryColor,
    getDifficultyColor,
    getPopularRooms,
    getRoomsByCategory
  } = useSocialBreathing();

  const [selectedCategory, setSelectedCategory] = useState<'all' | 'popular' | 'meditation' | 'energy' | 'sleep' | 'focus'>('popular');
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [editName, setEditName] = useState(userName);
  const [editAvatar, setEditAvatar] = useState(userAvatar);

  if (!visible) return null;

  const handleJoinRoom = (room: BreathingRoom) => {
    if (room.currentUsers >= room.maxUsers) {
      Alert.alert('Room Full', 'This breathing room is currently at capacity. Please try another room.');
      return;
    }

    const success = joinRoom(room.id);
    if (success) {
      onJoinRoom(room);
      onClose();
    }
  };

  const handleSaveProfile = async () => {
    if (editName.trim().length < 2) {
      Alert.alert('Invalid Name', 'Please enter a name with at least 2 characters.');
      return;
    }

    await saveUserProfile(editName.trim(), editAvatar);
    setShowProfileEdit(false);
  };

  const getFilteredRooms = () => {
    switch (selectedCategory) {
      case 'popular':
        return getPopularRooms();
      case 'all':
        return rooms;
      default:
        return getRoomsByCategory(selectedCategory as any);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'popular': return Crown;
      case 'meditation': return Heart;
      case 'energy': return Zap;
      case 'sleep': return Moon;
      case 'focus': return Target;
      default: return Users;
    }
  };

  const avatarOptions = ['😊', '🌟', '🦋', '🌸', '🍃', '☀️', '🌙', '💫', '🔥', '💎', '🌊', '🌈'];

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
            <View style={styles.headerLeft}>
              <Users size={24} color="white" />
              <Text style={styles.title}>Breathing Rooms</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity 
                style={styles.profileButton}
                onPress={() => setShowProfileEdit(true)}
              >
                <Text style={styles.avatarText}>{userAvatar}</Text>
                <Edit size={16} color="white" />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Connection Status */}
          <View style={styles.statusBar}>
            {isConnected ? (
              <View style={styles.connectedStatus}>
                <Wifi size={16} color="#10b981" />
                <Text style={styles.statusText}>Connected to {currentRoom?.name}</Text>
                <TouchableOpacity onPress={leaveRoom} style={styles.leaveButton}>
                  <Text style={styles.leaveButtonText}>Leave</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.disconnectedStatus}>
                <WifiOff size={16} color="rgba(255, 255, 255, 0.6)" />
                <Text style={styles.statusText}>Choose a room to join</Text>
              </View>
            )}
          </View>

          {/* Category Filter */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryContainer}
          >
            {['popular', 'all', 'meditation', 'energy', 'sleep', 'focus'].map((category) => {
              const IconComponent = getCategoryIcon(category);
              return (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category && styles.activeCategoryButton
                  ]}
                  onPress={() => setSelectedCategory(category as any)}
                >
                  <IconComponent size={18} color="white" />
                  <Text style={styles.categoryButtonText}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Rooms List */}
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.roomsList}
          >
            {getFilteredRooms().map((room) => (
              <TouchableOpacity
                key={room.id}
                style={[
                  styles.roomCard,
                  currentRoom?.id === room.id && styles.activeRoomCard
                ]}
                onPress={() => handleJoinRoom(room)}
                disabled={room.currentUsers >= room.maxUsers}
              >
                <LinearGradient
                  colors={[
                    getCategoryColor(room.category),
                    `${getCategoryColor(room.category)}80`
                  ]}
                  style={styles.roomCardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.roomHeader}>
                    <View style={styles.roomTitleContainer}>
                      <Text style={styles.roomEmoji}>{room.emoji}</Text>
                      <View>
                        <Text style={styles.roomName}>{room.name}</Text>
                        <Text style={styles.roomPattern}>{room.pattern}</Text>
                      </View>
                    </View>
                    <View style={styles.roomStats}>
                      <Text style={styles.userCount}>
                        {room.currentUsers}/{room.maxUsers}
                      </Text>
                      <UserPlus size={16} color="rgba(255, 255, 255, 0.8)" />
                    </View>
                  </View>

                  <Text style={styles.roomDescription}>{room.description}</Text>

                  <View style={styles.roomFooter}>
                    <View style={styles.roomTags}>
                      <View style={[styles.difficultyTag, { backgroundColor: getDifficultyColor(room.difficulty) }]}>
                        <Text style={styles.tagText}>{room.difficulty}</Text>
                      </View>
                      <View style={styles.phaseTag}>
                        <Text style={styles.phaseText}>
                          {room.phase} • Cycle {room.cycleCount}
                        </Text>
                      </View>
                    </View>
                    
                    {room.currentUsers >= room.maxUsers && (
                      <Text style={styles.fullText}>FULL</Text>
                    )}
                  </View>

                  {currentRoom?.id === room.id && (
                    <View style={styles.activeIndicator}>
                      <Text style={styles.activeText}>ACTIVE</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Current Room Users */}
          {isConnected && roomUsers.length > 0 && (
            <View style={styles.usersSection}>
              <Text style={styles.usersTitle}>Breathing Together ({roomUsers.length})</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.usersList}
              >
                {roomUsers.map((user) => (
                  <View key={user.id} style={styles.userCard}>
                    <Text style={styles.userAvatar}>{user.avatar}</Text>
                    <Text style={styles.userNameText} numberOfLines={1}>
                      {user.name}
                    </Text>
                    <Text style={styles.userLevel}>Lv.{user.level}</Text>
                    {user.isBreathing && (
                      <View style={styles.breathingIndicator} />
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </LinearGradient>
      </View>

      {/* Profile Edit Modal */}
      {showProfileEdit && (
        <View style={styles.profileModal}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.profileContent}
          >
            <Text style={styles.profileTitle}>Edit Profile</Text>
            
            <View style={styles.avatarSection}>
              <Text style={styles.sectionLabel}>Choose Avatar</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.avatarGrid}
              >
                {avatarOptions.map((avatar) => (
                  <TouchableOpacity
                    key={avatar}
                    style={[
                      styles.avatarOption,
                      editAvatar === avatar && styles.selectedAvatar
                    ]}
                    onPress={() => setEditAvatar(avatar)}
                  >
                    <Text style={styles.avatarOptionText}>{avatar}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.nameSection}>
              <Text style={styles.sectionLabel}>Display Name</Text>
              <TextInput
                style={styles.nameInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your name"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                maxLength={20}
              />
            </View>

            <View style={styles.profileActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowProfileEdit(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleSaveProfile}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      )}
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
    height: height * 0.9,
  },
  modal: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 15,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 6,
  },
  avatarText: {
    fontSize: 16,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBar: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  connectedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  disconnectedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    flex: 1,
  },
  leaveButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  leaveButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    gap: 8,
  },
  categoryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeCategoryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  categoryButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  roomsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  roomCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  activeRoomCard: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  roomCardGradient: {
    padding: 16,
    position: 'relative',
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  roomTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  roomEmoji: {
    fontSize: 24,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
  },
  roomPattern: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  roomStats: {
    alignItems: 'center',
    gap: 4,
  },
  userCount: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  roomDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
    lineHeight: 18,
  },
  roomFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomTags: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  phaseTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  phaseText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '500',
  },
  fullText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '700',
  },
  usersSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 15,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  usersTitle: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    marginBottom: 10,
  },
  usersList: {
    gap: 8,
  },
  userCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 8,
    borderRadius: 12,
    width: 60,
    position: 'relative',
  },
  userAvatar: {
    fontSize: 20,
    marginBottom: 2,
  },
  userNameText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '500',
    textAlign: 'center',
  },
  userLevel: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  breathingIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  profileModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileContent: {
    width: width - 80,
    borderRadius: 20,
    padding: 20,
  },
  profileTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  avatarSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    marginBottom: 10,
  },
  avatarGrid: {
    gap: 8,
  },
  avatarOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedAvatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 2,
    borderColor: 'white',
  },
  avatarOptionText: {
    fontSize: 20,
  },
  nameSection: {
    marginBottom: 20,
  },
  nameInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: 'white',
  },
  profileActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: 'white',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '700',
  },
});