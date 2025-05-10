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

const SupportPage = () => {
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');

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

  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <Button title="Create Ticket" onPress={() => setCreateModalVisible(true)} />
      <FlatList
        data={tickets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => openChat(item)}
            style={styles.ticketItem}
          >
            <Text style={{ fontWeight: 'bold' }}>{item.subject}</Text>
            <Text>Status: {item.status}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Create Ticket Modal */}
      <Modal visible={createModalVisible} animationType="slide">
        <View style={styles.modalContent}>
          <Text style={styles.title}>New Ticket</Text>
          <TextInput
            placeholder="Subject"
            value={subject}
            onChangeText={setSubject}
            style={styles.input}
          />
          <TextInput
            placeholder="Message"
            value={message}
            onChangeText={setMessage}
            style={[styles.input, { height: 100 }]}
            multiline
          />
          <View style={styles.rowButtons}>
            <Button title="Submit" onPress={createTicket} />
            <View style={{ width: 10 }} />
            <Button title="Cancel" onPress={() => setCreateModalVisible(false)} color="red" />
          </View>
        </View>
      </Modal>

      {/* Chat Modal */}
      <Modal visible={chatModalVisible} animationType="slide">
        <View style={styles.modalContent}>
          <Text style={styles.title}>Chat: {selectedTicket?.subject}</Text>
          <FlatList
            data={messages}
            keyExtractor={(_, idx) => idx.toString()}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.chatMessage,
                  item.sender === 'user'
                    ? styles.chatRight
                    : styles.chatLeft,
                ]}
              >
                <Text>{item.text}</Text>
                <Text style={styles.chatTime}>
                  {item.createdAt?.toDate().toLocaleString()}
                </Text>
              </View>
            )}
          />
          <TextInput
            placeholder="Type your message"
            value={chatInput}
            onChangeText={setChatInput}
            style={styles.input}
          />
          <View style={styles.rowButtons}>
            <Button title="Send" onPress={sendMessage} />
            <View style={{ width: 10 }} />
            {selectedTicket?.status === 'active' && (
              <Button title="Close Ticket" onPress={closeTicket} color="red" />
            )}
            <View style={{ width: 10 }} />
            <Button title="Back" onPress={() => setChatModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default SupportPage;

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    marginVertical: 8,
  },
  modalContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  rowButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  ticketItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  chatMessage: {
    borderRadius: 10,
    padding: 10,
    marginVertical: 4,
    maxWidth: '80%',
  },
  chatRight: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
  },
  chatLeft: {
    alignSelf: 'flex-start',
    backgroundColor: '#EAEAEA',
  },
  chatTime: {
    fontSize: 10,
    color: '#777',
    marginTop: 4,
  },
});
