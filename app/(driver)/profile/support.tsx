import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Modal,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Linking,
  ScrollView,
} from 'react-native';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
  updateDoc,
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../../../firebaseConfig';
import Typography from '../../../components/ui/Typography';
import GoldButton from '../../../components/ui/GoldButton';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { ACCENT1_LIGHT, ACCENT2_LIGHT, BACKGROUND1_LIGHT, WHITE } from '../../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

const SupportPage = () => {
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [newTicket, setNewTicket] = useState({ title: '', description: '' });

  const auth = getAuth();

  // Create ticket
  const createTicket = async () => {
    const user = auth.currentUser;
    if (!user || !subject.trim() || !message.trim()) return;

    const ticketRef = await addDoc(collection(db, 'support'), {
      subject,
      status: 'active',
      userId: user.uid,
      createdAt: Timestamp.now(),
    });

    await addDoc(collection(db, 'support', ticketRef.id, 'messages'), {
      text: message,
      sender: 'user',
      createdAt: Timestamp.now(),
    });

    setCreateModalVisible(false);
    setSubject('');
    setMessage('');
  };

  // Load tickets for current user
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) return;

      const q = query(
        collection(db, 'support'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
        setTickets(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      });

      return () => unsubscribeSnapshot();
    });

    return () => unsubscribeAuth();
  }, []);

  // Open chat
  const openChat = async (ticket: any) => {
    setSelectedTicket(ticket);
    setChatModalVisible(true);

    const msgsRef = collection(db, 'support', ticket.id, 'messages');
    const q = query(msgsRef, orderBy('createdAt', 'asc'));

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => d.data()));
    });

    return unsub;
  };

  // Send message
  const sendMessage = async () => {
    if (!chatInput.trim() || !selectedTicket) return;

    await addDoc(collection(db, 'support', selectedTicket.id, 'messages'), {
      text: chatInput,
      sender: 'user',
      createdAt: Timestamp.now(),
    });

    setChatInput('');
  };

  // Close ticket
  const closeTicket = async () => {
    if (!selectedTicket) return;

    await updateDoc(doc(db, 'support', selectedTicket.id), {
      status: 'closed',
    });

    setSelectedTicket((prev: any) => ({ ...prev, status: 'closed' }));
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleEmailPress = () => {
    Linking.openURL("mailto:support@adqwest.com");
  };

  const handlePhonePress = () => {
    Linking.openURL("tel:+1234567890");
  };

  const handleWhatsAppPress = () => {
    Linking.openURL("https://wa.me/1234567890");
  };

  const handleCreateTicket = async () => {
    // Implementation of handleCreateTicket function
  };

  const handleTicketPress = (item: any) => {
    // Implementation of handleTicketPress function
  };

  const getStatusColor = (status: string) => {
    // Implementation of getStatusColor function
    return ACCENT2_LIGHT;
  };

  const handleSendMessage = async () => {
    // Implementation of handleSendMessage function
  };

  return (
    <View style={{ flex: 1 }}>
      <Svg height="100%" width="100%" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }}>
        <Defs>
          <LinearGradient id="bgGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#02010C" />
            <Stop offset="100%" stopColor="#08061A" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#bgGradient)" />
      </Svg>

      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Typography variant="h4" style={styles.title}>Support</Typography>
          <GoldButton
            title="Create Ticket"
            onPress={() => setCreateModalVisible(true)}
            style={styles.createButton}
          />
        </View>

        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.ticketItem}
              onPress={() => handleTicketPress(item)}
            >
              <View style={styles.ticketHeader}>
                <Typography variant="h6" style={styles.ticketTitle}>
                  {item.title}
                </Typography>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                  <Typography variant="caption" style={styles.statusText}>
                    {item.status}
                  </Typography>
                </View>
              </View>
              <Typography variant="body2" style={styles.ticketDescription}>
                {item.description}
              </Typography>
            </TouchableOpacity>
          )}
        />

        <Modal
          visible={createModalVisible}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Typography variant="h5" style={styles.modalTitle}>Create New Ticket</Typography>
              
              <TextInput
                style={styles.input}
                placeholder="Title"
                placeholderTextColor={WHITE}
                value={newTicket.title}
                onChangeText={(text) => setNewTicket({ ...newTicket, title: text })}
              />
              
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description"
                placeholderTextColor={WHITE}
                multiline
                value={newTicket.description}
                onChangeText={(text) => setNewTicket({ ...newTicket, description: text })}
              />

              <View style={styles.modalButtons}>
                <GoldButton
                  title="Cancel"
                  onPress={() => setCreateModalVisible(false)}
                  style={styles.modalButton}
                />
                <GoldButton
                  title="Create"
                  onPress={handleCreateTicket}
                  style={styles.modalButton}
                />
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={chatModalVisible}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.chatHeader}>
                <Typography variant="h5" style={styles.chatTitle}>
                  {selectedTicket?.title}
                </Typography>
                <TouchableOpacity onPress={() => setChatModalVisible(false)}>
                  <Ionicons name="close" size={24} color={ACCENT2_LIGHT} />
                </TouchableOpacity>
              </View>

              <FlatList
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={[
                    styles.messageContainer,
                    item.sender === 'user' ? styles.userMessage : styles.supportMessage
                  ]}>
                    <Typography variant="body2" style={styles.messageText}>
                      {item.text}
                    </Typography>
                  </View>
                )}
              />

              <View style={styles.chatInputContainer}>
                <TextInput
                  style={styles.chatInput}
                  placeholder="Type your message..."
                  placeholderTextColor={WHITE}
                  value={chatInput}
                  onChangeText={setChatInput}
                />
                <GoldButton
                  title="Send"
                  onPress={handleSendMessage}
                  style={styles.sendButton}
                />
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: WHITE,
  },
  createButton: {
    minWidth: 120,
  },
  ticketItem: {
    backgroundColor: BACKGROUND1_LIGHT,
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: ACCENT2_LIGHT,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ticketTitle: {
    color: ACCENT1_LIGHT,
    flex: 1,
    marginRight: 10,
  },
  ticketDescription: {
    color: WHITE,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    color: BACKGROUND1_LIGHT,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: BACKGROUND1_LIGHT,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: ACCENT2_LIGHT,
  },
  modalTitle: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    color: WHITE,
    borderWidth: 1,
    borderColor: ACCENT2_LIGHT,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'column',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    minWidth: 100,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chatTitle: {
    color: WHITE,
  },
  messageContainer: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    maxWidth: '80%',
  },
  userMessage: {
    backgroundColor: ACCENT2_LIGHT,
    alignSelf: 'flex-end',
  },
  supportMessage: {
    backgroundColor: BACKGROUND1_LIGHT,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: ACCENT2_LIGHT,
  },
  messageText: {
    color: BACKGROUND1_LIGHT,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 10,
  },
  chatInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    color: WHITE,
    borderWidth: 1,
    borderColor: ACCENT2_LIGHT,
  },
  sendButton: {
    minWidth: 80,
  },
});

export default SupportPage;
