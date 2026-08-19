import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { AppText as Text } from '@/components/app/Typography';
import { SafeAreaView } from 'react-native-safe-area-context';

import { completeOnboarding } from '@/features/onboarding/onboardingService';
import type { OnboardingAnswers } from '@/features/onboarding/types';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;
type AnswerField = keyof OnboardingAnswers;

type Option = {
  value: string | number;
  title: string;
  description: string;
  detail?: string;
  icon: IconName;
};

type Step = {
  eyebrow: string;
  title: string;
  subtitle: string;
  field: AnswerField;
  icon: IconName;
  options: Option[];
};

const steps: Step[] = [
  {
    eyebrow: 'YOUR JOURNEY',
    title: 'Welcome to Koino.',
    subtitle: 'Tell us where you are today so your first plan meets you there.',
    field: 'journeyDescription',
    icon: 'sprout-outline',
    options: [
      { value: 'NEW_TO_FAITH', title: 'Just starting out', description: 'New to the Bible and ready to learn', icon: 'clock-outline' },
      { value: 'DEEPEN_UNDERSTANDING', title: 'Deepen my understanding', description: 'Build on what I already know', icon: 'trending-up' },
      { value: 'BUILD_READING_HABIT', title: 'Build a daily habit', description: 'Create a consistent reading rhythm', icon: 'calendar-month-outline' },
    ],
  },
  {
    eyebrow: 'STARTING POINT',
    title: 'Where would you like to begin?',
    subtitle: 'Choose the part of Scripture that will open your first plan.',
    field: 'preferredStartingPoint',
    icon: 'book-open-page-variant-outline',
    options: [
      { value: 'GOSPELS', title: 'The Gospels', description: 'Life and teachings of Jesus', detail: 'Begin with the story at the heart of the Christian faith.', icon: 'book-open-outline' },
      { value: 'OLD_TESTAMENT', title: 'The Old Testament', description: 'Foundations, history, and wisdom', detail: 'Explore the promises and stories that shape our faith.', icon: 'bookshelf' },
      { value: 'NEW_TESTAMENT', title: 'The New Testament', description: 'Letters and the early Church', detail: 'Discover Christian life and the beginning of the Church.', icon: 'book-outline' },
    ],
  },
  {
    eyebrow: 'DAILY RHYTHM',
    title: 'When do you read best?',
    subtitle: 'Choose the moment when you are most likely to find some peace.',
    field: 'dailyRhythm',
    icon: 'weather-sunset-up',
    options: [
      { value: 'MORNING', title: 'Early morning', description: 'Begin the day with a clear mind', icon: 'weather-sunset-up' },
      { value: 'AFTERNOON', title: 'During the day', description: 'Pause, read, and reset', icon: 'white-balance-sunny' },
      { value: 'EVENING', title: 'In the evening', description: 'Close the day with reflection', icon: 'weather-night' },
    ],
  },
  {
    eyebrow: 'YOUR SCHEDULE',
    title: 'What is your typical work pace?',
    subtitle: 'Your daily routine helps us place reading where it can last.',
    field: 'workPace',
    icon: 'calendar-month-outline',
    options: [
      { value: 'STEADY_NINE_TO_FIVE', title: 'Steady 9-to-5', description: 'A regular schedule with predictable hours', icon: 'briefcase-outline' },
      { value: 'FLEXIBLE', title: 'I have a flexible schedule', description: 'My hours vary from day to day', icon: 'sync' },
    ],
  },
  {
    eyebrow: 'READING CAPACITY',
    title: 'How much time can you set aside?',
    subtitle: 'Choose an honest daily target. You can always adjust it later.',
    field: 'dailyCapacityMinutes',
    icon: 'gauge',
    options: [
      { value: 10, title: '10 minutes', description: 'A gentle daily commitment', icon: 'feather' },
      { value: 20, title: '20 minutes', description: 'A steady amount of focused time', icon: 'gauge' },
      { value: 30, title: '30+ minutes', description: 'Room to read and reflect more deeply', icon: 'creation-outline' },
    ],
  },
];

const initialAnswers: OnboardingAnswers = {
  journeyDescription: 'NEW_TO_FAITH',
  preferredStartingPoint: 'GOSPELS',
  dailyRhythm: 'MORNING',
  workPace: 'FLEXIBLE',
  dailyCapacityMinutes: 10,
};

function StepProgress({ current }: { current: number }) {
  return (
    <View style={styles.progress} accessibilityLabel={`Step ${current + 1} of ${steps.length}`}>
      {steps.map((step, index) => {
        const complete = index < current;
        const active = index === current;
        return (
          <View key={step.field} style={styles.progressPart}>
            {index > 0 ? <View style={[styles.progressLine, index <= current && styles.progressLineActive]} /> : null}
            <View style={[styles.progressCircle, (complete || active) && styles.progressCircleActive]}>
              {complete ? (
                <MaterialCommunityIcons name="check" size={15} color="#fff" />
              ) : (
                <Text style={[styles.progressNumber, active && styles.progressNumberActive]}>{index + 1}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function ChoiceCard({ option, selected, onPress }: { option: Option; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.choice, selected && styles.choiceSelected, pressed && styles.choicePressed]}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <MaterialCommunityIcons name="check" size={14} color="#fff" /> : null}
      </View>
      <View style={[styles.optionIcon, selected && styles.optionIconSelected]}>
        <MaterialCommunityIcons name={option.icon} size={24} color="#303943" />
      </View>
      <View style={styles.optionCopy}>
        <Text style={styles.optionTitle}>{option.title}</Text>
        <Text style={styles.optionDescription}>{option.description}</Text>
        {option.detail ? <Text style={styles.optionDetail}>{option.detail}</Text> : null}
      </View>
    </Pressable>
  );
}

export default function OnboardingScreen() {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState(initialAnswers);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const step = steps[stepIndex];
  const last = stepIndex === steps.length - 1;

  function choose(value: string | number) {
    setAnswers((current) => ({ ...current, [step.field]: value } as OnboardingAnswers));
  }

  async function continueFlow() {
    if (!last) {
      setError('');
      setStepIndex((current) => current + 1);
      return;
    }

    setSubmitting(true);
    setError('');
    const started = Date.now();
    try {
      await completeOnboarding(answers);
      const delay = Math.max(0, 650 - (Date.now() - started));
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
      router.replace('/onboarding-complete');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to create your plan. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Previous step"
          hitSlop={12}
          disabled={stepIndex === 0 || submitting}
          onPress={() => setStepIndex((current) => Math.max(0, current - 1))}
          style={[styles.headerAction, stepIndex === 0 && styles.invisible]}
        >
          <MaterialCommunityIcons name="chevron-left" size={30} color="#56606b" />
        </Pressable>
        <Pressable disabled={last || submitting} onPress={continueFlow} style={[styles.skip, last && styles.invisible]}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      <StepProgress current={stepIndex} />

      <ScrollView
        key={step.field}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name={step.icon} size={31} color="#303943" />
          </View>
          <Text style={styles.eyebrow}>{step.eyebrow}</Text>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.subtitle}>{step.subtitle}</Text>
        </View>

        <View accessibilityRole="radiogroup" style={styles.choices}>
          {step.options.map((option) => (
            <ChoiceCard
              key={String(option.value)}
              option={option}
              selected={answers[step.field] === option.value}
              onPress={() => choose(option.value)}
            />
          ))}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          disabled={submitting}
          onPress={continueFlow}
          style={({ pressed }) => [styles.continueButton, submitting && styles.buttonDisabled, pressed && styles.buttonPressed]}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : (
            <>
              <Text style={styles.continueLabel}>{last ? 'Finish' : 'Continue'}</Text>
              <MaterialCommunityIcons name={last ? 'check' : 'arrow-right'} size={21} color="#fff" />
            </>
          )}
        </Pressable>
        <View style={styles.dots}>
          {steps.map((item, index) => <View key={item.field} style={[styles.dot, index === stepIndex && styles.dotActive]} />)}
        </View>
      </View>

      <Modal visible={submitting} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <ActivityIndicator color="#c6811d" size="large" />
            </View>
            <Text style={styles.modalTitle}>Creating your plan</Text>
            <Text style={styles.modalText}>Personalizing your first Koino reading journey…</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: { height: 42, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerAction: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  skip: { minWidth: 44, paddingVertical: 8, alignItems: 'flex-end' },
  skipText: { color: '#737b86', fontSize: 13, fontWeight: '600' },
  invisible: { opacity: 0 },
  progress: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  progressPart: { flexDirection: 'row', alignItems: 'center' },
  progressLine: { width: 20, height: 1, marginHorizontal: 5, backgroundColor: '#dfe2e6' },
  progressLineActive: { backgroundColor: '#e99b24' },
  progressCircle: { width: 25, height: 25, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#d9dde2', backgroundColor: '#fff' },
  progressCircleActive: { borderColor: '#eb9b22', backgroundColor: '#eb9b22' },
  progressNumber: { color: '#9299a3', fontSize: 11, fontWeight: '600' },
  progressNumberActive: { color: '#fff' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 14 },
  hero: { alignItems: 'center', paddingTop: 10 },
  heroIcon: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fbf4ea' },
  eyebrow: { marginTop: 16, color: '#7f8792', fontSize: 10, lineHeight: 14, fontWeight: '700', letterSpacing: 0.45 },
  title: { marginTop: 7, maxWidth: 330, color: '#101820', fontSize: 27, lineHeight: 34, fontWeight: '800', textAlign: 'center' },
  subtitle: { marginTop: 9, maxWidth: 315, color: '#777f8b', fontSize: 13, lineHeight: 20, textAlign: 'center' },
  choices: { gap: 9, marginTop: 22 },
  choice: { minHeight: 82, paddingHorizontal: 13, paddingVertical: 12, borderRadius: 13, borderWidth: 1, borderColor: '#e0e3e7', flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff' },
  choiceSelected: { borderColor: '#e9a13a', backgroundColor: '#fffaf3' },
  choicePressed: { opacity: 0.78 },
  radio: { width: 21, height: 21, borderRadius: 11, borderWidth: 1, borderColor: '#b8bec7', alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: '#eca12e', backgroundColor: '#eca12e' },
  optionIcon: { width: 48, height: 48, marginLeft: 13, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f5' },
  optionIconSelected: { backgroundColor: '#fff5e5' },
  optionCopy: { flex: 1, marginLeft: 14 },
  optionTitle: { color: '#171c23', fontSize: 14, lineHeight: 19, fontWeight: '700' },
  optionDescription: { marginTop: 2, color: '#737b87', fontSize: 12, lineHeight: 17 },
  optionDetail: { marginTop: 3, color: '#9197a0', fontSize: 10.5, lineHeight: 15 },
  error: { marginTop: 10, color: '#b83434', fontSize: 12, lineHeight: 17, textAlign: 'center' },
  footer: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 10, backgroundColor: '#fff' },
  continueButton: { height: 54, borderRadius: 11, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eda12c' },
  continueLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
  buttonDisabled: { opacity: 0.55 },
  buttonPressed: { opacity: 0.82 },
  dots: { height: 24, paddingTop: 13, flexDirection: 'row', justifyContent: 'center', gap: 12 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#e1e4e7' },
  dotActive: { backgroundColor: '#e99b24' },
  modalBackdrop: { flex: 1, paddingHorizontal: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(16,24,32,0.28)' },
  modalCard: { width: '100%', maxWidth: 360, paddingHorizontal: 28, paddingVertical: 32, borderRadius: 20, alignItems: 'center', backgroundColor: '#fff' },
  modalIcon: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff6e8' },
  modalTitle: { marginTop: 18, color: '#151c24', fontSize: 23, fontWeight: '800' },
  modalText: { marginTop: 9, color: '#777f89', fontSize: 13, lineHeight: 20, textAlign: 'center' },
});
