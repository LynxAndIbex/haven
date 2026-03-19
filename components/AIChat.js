import React from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, ScrollView, KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';
import { colors, radius, spacing } from '../theme';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'meta-llama/llama-3.2-3b-instruct:free';

export default function AIChat({ visible, onClose, scenario, roomName, weatherContext }) {
  const [messages, setMessages] = React.useState([{
    role: 'assistant',
    text: `Hi — I'm looking at your ${roomName} right now. The air quality is currently ${scenario?.statusText?.toLowerCase()}. What would you like to know?`,
  }]);
  const [input, setInput]     = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const scrollRef             = React.useRef(null);

  React.useEffect(() => {
    setMessages([{
      role: 'assistant',
      text: `Hi — I'm looking at your ${roomName} right now. The air quality is currently ${scenario?.statusText?.toLowerCase()}. What would you like to know?`,
    }]);
  }, [scenario, roomName]);

  const buildSystemPrompt = () => {
    const readings = scenario.metrics
      .map(m => `${m.name}: ${m.val} ${m.unit} (${m.status})`)
      .join(', ');
    return (
      `You are Haven AI, an expert environmental health assistant built into the Haven home air quality app. ` +
      `You are currently monitoring the ${roomName}. ` +
      `Current sensor readings: ${readings}. ` +
      `Overall status: ${scenario.statusText}. ` +
      `${weatherContext ? 'Outdoor context: ' + weatherContext : ''} ` +
      `Answer the user's questions concisely in 2-4 sentences. ` +
      `Use plain language. Be direct about health concerns. ` +
      `No markdown, no bullet points, just plain conversational sentences.`
    );
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    const userMsg = { role: 'user', text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);

    try {
      const res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: buildSystemPrompt() },
            ...updated.map(m => ({ role: m.role, content: m.text })),
          ],
        }),
      });

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content
        || "I couldn't get a response — try again.";
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);

    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: "Connection error — check your internet and try again.",
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const QUICK_PROMPTS = [
    'Is this safe?',
    'What should I do?',
    'Why is this happening?',
    'How urgent is this?',
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.sheet}
        >
          <Pressable onPress={e => e.stopPropagation()} style={{ flex: 1 }}>

            <View style={styles.handle} />

            {/* HEADER */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.avatar}>
                  <View style={styles.avatarDot} />
                </View>
                <View>
                  <Text style={styles.headerName}>Haven AI</Text>
                  <Text style={styles.headerSub}>
                    {roomName} · {scenario?.badge}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* MESSAGES */}
            <ScrollView
              ref={scrollRef}
              style={styles.messages}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() =>
                scrollRef.current?.scrollToEnd({ animated: true })
              }
            >
              {messages.map((msg, i) => (
                <View
                  key={i}
                  style={[
                    styles.bubble,
                    msg.role === 'user' ? styles.bubbleUser : styles.bubbleAI,
                  ]}
                >
                  <Text style={[
                    styles.bubbleText,
                    msg.role === 'user'
                      ? styles.bubbleTextUser
                      : styles.bubbleTextAI,
                  ]}>
                    {msg.text}
                  </Text>
                </View>
              ))}
              {loading && (
                <View style={[styles.bubble, styles.bubbleAI]}>
                  <Text style={styles.bubbleTextAI}>Thinking…</Text>
                </View>
              )}
            </ScrollView>

            {/* QUICK PROMPTS */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickPrompts}
            >
              {QUICK_PROMPTS.map(qp => (
                <TouchableOpacity
                  key={qp}
                  style={styles.quickPrompt}
                  onPress={() => setInput(qp)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quickPromptText}>{qp}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* INPUT ROW */}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Ask about your air quality…"
                placeholderTextColor={colors.hint}
                onSubmitEditing={sendMessage}
                returnKeyType="send"
                editable={!loading}
              />
              <TouchableOpacity
                style={[styles.sendBtn, loading && styles.sendBtnDisabled]}
                onPress={sendMessage}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.sendBtnText}>Send</Text>
              </TouchableOpacity>
            </View>

          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  sheet:           { backgroundColor: colors.white, borderTopLeftRadius: radius.xl,
                     borderTopRightRadius: radius.xl, height: '80%' },

  handle:          { width: 36, height: 4, backgroundColor: colors.border,
                     borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },

  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                     backgroundColor: colors.green, padding: spacing.lg },
  headerLeft:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar:          { width: 34, height: 34, borderRadius: 17,
                     backgroundColor: 'rgba(255,255,255,0.15)',
                     alignItems: 'center', justifyContent: 'center' },
  avatarDot:       { width: 12, height: 12, borderRadius: 6,
                     backgroundColor: 'rgba(255,255,255,0.9)' },
  headerName:      { fontSize: 14, fontWeight: '600', color: colors.white },
  headerSub:       { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 1 },
  closeBtn:        { width: 30, height: 30, borderRadius: 15,
                     backgroundColor: 'rgba(255,255,255,0.15)',
                     alignItems: 'center', justifyContent: 'center' },
  closeBtnText:    { color: colors.white, fontSize: 13, fontWeight: '500' },

  messages:        { flex: 1 },
  messagesContent: { padding: spacing.lg, gap: spacing.md },

  bubble:          { maxWidth: '85%', padding: spacing.md, borderRadius: radius.lg },
  bubbleUser:      { backgroundColor: colors.cream2, alignSelf: 'flex-end',
                     borderBottomRightRadius: 4 },
  bubbleAI:        { backgroundColor: colors.green, alignSelf: 'flex-start',
                     borderBottomLeftRadius: 4 },
  bubbleText:      { fontSize: 14, lineHeight: 21 },
  bubbleTextUser:  { color: colors.text },
  bubbleTextAI:    { color: 'rgba(255,255,255,0.92)' },

  quickPrompts:    { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: 8 },
  quickPrompt:     { paddingHorizontal: 14, paddingVertical: 7,
                     borderRadius: 20, borderWidth: 1.5, borderColor: colors.border,
                     backgroundColor: colors.white, alignSelf: 'flex-start' },
  quickPromptText: { fontSize: 12, color: colors.text, fontWeight: '500' },

  inputRow:        { flexDirection: 'row', gap: 8, padding: spacing.lg,
                     borderTopWidth: 1, borderTopColor: colors.border,
                     backgroundColor: colors.cream },
  input:           { flex: 1, backgroundColor: colors.white, borderRadius: radius.sm,
                     borderWidth: 1.5, borderColor: colors.border,
                     paddingHorizontal: 14, paddingVertical: 9,
                     fontSize: 14, color: colors.text },
  sendBtn:         { backgroundColor: colors.green, borderRadius: radius.sm,
                     paddingHorizontal: 18, paddingVertical: 9, justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.6 },
  sendBtnText:     { color: colors.white, fontSize: 13, fontWeight: '600' },
});