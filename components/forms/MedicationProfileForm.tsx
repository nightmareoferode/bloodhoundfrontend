import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { z } from 'zod';

// ─── Schema ─────────────────────────────────────────────────────────────────

const medicationEntrySchema = z.object({
  medicationName: z.string().min(1, 'Medication name is required'),
  potency: z
    .string()
    .optional()
    .refine((v) => !v || (/^\d+(\.\d+)?$/.test(v) && parseFloat(v) > 0), {
      message: 'Potency must be a positive number',
    }),
  productType: z.enum(['Tablet', 'Capsule', 'Liquid', 'Injection', 'Topical'], {
    error: 'Please select a product type',
  }),
  methodOfIntake: z.enum(['Oral', 'Intravenous', 'Sublingual', 'Inhalation'], {
    error: 'Please select a method of intake',
  }),
  courseDuration: z
    .string()
    .min(1, 'Duration is required')
    .refine((v) => /^\d+$/.test(v) && parseInt(v, 10) > 0, {
      message: 'Duration must be a positive number',
    }),
  courseDurationUnit: z.enum(['days', 'weeks', 'months']),
  timesPerDay: z
    .string()
    .min(1, 'Frequency is required')
    .refine((v) => /^\d+$/.test(v) && parseInt(v, 10) > 0, {
      message: 'Must be at least 1',
    }),
  firstDoseTime: z
    .string()
    .regex(/^([01]?\d|2[0-3]):[0-5]\d$/, 'Use HH:MM format (e.g. 08:00)'),
  doctorName: z.string().optional(),
  doctorNumber: z.string().optional(),
});

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z
    .string()
    .min(1, 'Age is required')
    .refine((v) => /^\d+$/.test(v) && parseInt(v, 10) > 0, {
      message: 'Age must be a positive number',
    }),
  sex: z.enum(['Male', 'Female', 'Other'], {
    error: 'Please select a sex',
  }),
  medications: z.array(medicationEntrySchema).min(1),
});

type MedicationEntryData = z.infer<typeof medicationEntrySchema>;
type FormData = z.infer<typeof schema>;

// ─── Types ───────────────────────────────────────────────────────────────────

type SelectOption = { label: string; value: string };

interface SelectFieldProps {
  label: string;
  value: string;
  options: SelectOption[];
  placeholder: string;
  onSelect: (val: string) => void;
  error?: string;
}

interface MedicationProfileFormProps {
  onSubmit: (data: FormData) => void;
  initialValues?: Partial<FormData>;
}

// ─── Empty medication defaults ───────────────────────────────────────────────

const EMPTY_MEDICATION: MedicationEntryData = {
  medicationName: '',
  potency: '',
  productType: undefined as any,
  methodOfIntake: undefined as any,
  courseDuration: '',
  courseDurationUnit: 'days',
  timesPerDay: '',
  firstDoseTime: '',
  doctorName: '',
  doctorNumber: '',
};

// ─── Select Modal ─────────────────────────────────────────────────────────────

function SelectField({ label, value, options, placeholder, onSelect, error }: SelectFieldProps) {
  const [visible, setVisible] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.selectButton, error ? styles.inputError : null]}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.selectButtonText, !selected && styles.placeholderText]}>
          {selected ? selected.label : placeholder}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.optionItem, item.value === value && styles.optionItemSelected]}
                  onPress={() => {
                    onSelect(item.value);
                    setVisible(false);
                  }}
                >
                  <Text style={[styles.optionText, item.value === value && styles.optionTextSelected]}>
                    {item.label}
                  </Text>
                  {item.value === value && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MedicationProfileForm({ onSubmit, initialValues }: MedicationProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialValues?.name ?? '',
      age: initialValues?.age ?? '',
      sex: initialValues?.sex,
      medications: initialValues?.medications?.length
        ? initialValues.medications
        : [{ ...EMPTY_MEDICATION }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'medications',
  });

  const handleFormSubmit = (data: FormData) => {
    setIsSubmitting(true);
    onSubmit(data);
    setIsSubmitting(false);
  };

  const handleReset = () => {
    reset();
  };

  const medicationErrors = errors.medications;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>Rx</Text>
          </View>
          <Text style={styles.headerTitle}>Medication Profile</Text>
          <Text style={styles.headerSubtitle}>Smart Drugs Detector</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Section: Patient Info */}
          <Text style={styles.sectionTitle}>Patient Information</Text>
          <View style={styles.divider} />

          {/* Name */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Full Name</Text>
            <Controller
              control={control}
              name="name"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  style={[styles.input, errors.name ? styles.inputError : null]}
                  placeholder="Enter your full name"
                  placeholderTextColor={COLORS.placeholder}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              )}
            />
            {errors.name ? <Text style={styles.errorText}>{errors.name.message}</Text> : null}
          </View>

          {/* Age */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Age</Text>
            <Controller
              control={control}
              name="age"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  style={[styles.input, errors.age ? styles.inputError : null]}
                  placeholder="e.g. 28"
                  placeholderTextColor={COLORS.placeholder}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="number-pad"
                  returnKeyType="next"
                />
              )}
            />
            {errors.age ? <Text style={styles.errorText}>{errors.age.message}</Text> : null}
          </View>

          {/* Sex */}
          <Controller
            control={control}
            name="sex"
            render={({ field: { value, onChange } }) => (
              <SelectField
                label="Sex"
                value={value ?? ''}
                options={SEX_OPTIONS}
                placeholder="Select sex"
                onSelect={onChange}
                error={errors.sex?.message}
              />
            )}
          />
        </View>

        {/* Medications */}
        {fields.map((field, index) => {
          const medErrors = Array.isArray(medicationErrors) ? medicationErrors[index] : undefined;

          return (
            <View key={field.id} style={styles.medicationCard}>
              {/* Medication card header */}
              <View style={styles.medicationCardHeader}>
                <Text style={styles.medicationCardTitle}>
                  Medication {fields.length > 1 ? index + 1 : ''}
                </Text>
                {fields.length > 1 && (
                  <TouchableOpacity onPress={() => remove(index)} activeOpacity={0.7} style={styles.removeButton}>
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Medication Details */}
              <Text style={styles.sectionTitle}>Medication Details</Text>
              <View style={styles.divider} />

              {/* Medication Name */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Medication Name</Text>
                <Controller
                  control={control}
                  name={`medications.${index}.medicationName`}
                  render={({ field: { value, onChange, onBlur } }) => (
                    <TextInput
                      style={[styles.input, medErrors?.medicationName ? styles.inputError : null]}
                      placeholder="e.g. Amoxicillin"
                      placeholderTextColor={COLORS.placeholder}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoCapitalize="words"
                      returnKeyType="next"
                    />
                  )}
                />
                {medErrors?.medicationName ? (
                  <Text style={styles.errorText}>{medErrors.medicationName.message}</Text>
                ) : null}
              </View>

              {/* Potency */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>
                  Potency <Text style={styles.optionalTag}>(optional)</Text>
                </Text>
                <View style={styles.inputRow}>
                  <Controller
                    control={control}
                    name={`medications.${index}.potency`}
                    render={({ field: { value, onChange, onBlur } }) => (
                      <TextInput
                        style={[styles.input, styles.inputFlex, medErrors?.potency ? styles.inputError : null]}
                        placeholder="e.g. 500"
                        placeholderTextColor={COLORS.placeholder}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        keyboardType="decimal-pad"
                        returnKeyType="next"
                      />
                    )}
                  />
                  <View style={styles.unitBadge}>
                    <Text style={styles.unitText}>mg</Text>
                  </View>
                </View>
                {medErrors?.potency ? <Text style={styles.errorText}>{medErrors.potency.message}</Text> : null}
              </View>

              {/* Product Type */}
              <Controller
                control={control}
                name={`medications.${index}.productType`}
                render={({ field: { value, onChange } }) => (
                  <SelectField
                    label="Product Type"
                    value={value ?? ''}
                    options={PRODUCT_TYPE_OPTIONS}
                    placeholder="Select product type"
                    onSelect={onChange}
                    error={medErrors?.productType?.message}
                  />
                )}
              />

              {/* Method of Intake */}
              <Controller
                control={control}
                name={`medications.${index}.methodOfIntake`}
                render={({ field: { value, onChange } }) => (
                  <SelectField
                    label="Method of Intake"
                    value={value ?? ''}
                    options={INTAKE_METHOD_OPTIONS}
                    placeholder="Select method"
                    onSelect={onChange}
                    error={medErrors?.methodOfIntake?.message}
                  />
                )}
              />

              {/* Course & Schedule */}
              <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Course & Schedule</Text>
              <View style={styles.divider} />

              {/* Course Duration */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Course Duration</Text>
                <View style={styles.inputRow}>
                  <Controller
                    control={control}
                    name={`medications.${index}.courseDuration`}
                    render={({ field: { value, onChange, onBlur } }) => (
                      <TextInput
                        style={[styles.input, styles.inputFlex, medErrors?.courseDuration ? styles.inputError : null]}
                        placeholder="e.g. 7"
                        placeholderTextColor={COLORS.placeholder}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        keyboardType="number-pad"
                        returnKeyType="next"
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name={`medications.${index}.courseDurationUnit`}
                    render={({ field: { value, onChange } }) => (
                      <View style={styles.durationUnitRow}>
                        {(['days', 'weeks', 'months'] as const).map((unit) => (
                          <TouchableOpacity
                            key={unit}
                            style={[styles.durationUnitBtn, value === unit && styles.durationUnitBtnActive]}
                            onPress={() => onChange(unit)}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.durationUnitBtnText, value === unit && styles.durationUnitBtnTextActive]}>
                              {unit.charAt(0).toUpperCase() + unit.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  />
                </View>
                {medErrors?.courseDuration ? (
                  <Text style={styles.errorText}>{medErrors.courseDuration.message}</Text>
                ) : null}
              </View>

              {/* Times Per Day */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Frequency</Text>
                <View style={styles.inputRow}>
                  <Controller
                    control={control}
                    name={`medications.${index}.timesPerDay`}
                    render={({ field: { value, onChange, onBlur } }) => (
                      <TextInput
                        style={[styles.input, styles.inputFlex, medErrors?.timesPerDay ? styles.inputError : null]}
                        placeholder="e.g. 3"
                        placeholderTextColor={COLORS.placeholder}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        keyboardType="number-pad"
                        returnKeyType="next"
                      />
                    )}
                  />
                  <View style={styles.unitBadge}>
                    <Text style={styles.unitText}>times/day</Text>
                  </View>
                </View>
                {medErrors?.timesPerDay ? <Text style={styles.errorText}>{medErrors.timesPerDay.message}</Text> : null}
              </View>

              {/* First Dose Time */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>First Dose Time</Text>
                <View style={styles.inputRow}>
                  <Controller
                    control={control}
                    name={`medications.${index}.firstDoseTime`}
                    render={({ field: { value, onChange, onBlur } }) => (
                      <TextInput
                        style={[styles.input, styles.inputFlex, medErrors?.firstDoseTime ? styles.inputError : null]}
                        placeholder="HH:MM  (e.g. 08:00)"
                        placeholderTextColor={COLORS.placeholder}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        keyboardType="numbers-and-punctuation"
                        returnKeyType="done"
                        maxLength={5}
                      />
                    )}
                  />
                  <View style={styles.unitBadge}>
                    <Text style={styles.unitText}>24h</Text>
                  </View>
                </View>
                {medErrors?.firstDoseTime ? (
                  <Text style={styles.errorText}>{medErrors.firstDoseTime.message}</Text>
                ) : null}
              </View>

              {/* Doctor Information */}
              <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>Doctor Information</Text>
              <View style={styles.divider} />

              {/* Doctor Name */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>
                  Doctor Name <Text style={styles.optionalTag}>(optional)</Text>
                </Text>
                <Controller
                  control={control}
                  name={`medications.${index}.doctorName`}
                  render={({ field: { value, onChange, onBlur } }) => (
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Dr. Smith"
                      placeholderTextColor={COLORS.placeholder}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoCapitalize="words"
                      returnKeyType="next"
                    />
                  )}
                />
              </View>

              {/* Doctor Number */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>
                  Doctor Number <Text style={styles.optionalTag}>(optional)</Text>
                </Text>
                <Controller
                  control={control}
                  name={`medications.${index}.doctorNumber`}
                  render={({ field: { value, onChange, onBlur } }) => (
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. +1 234 567 8900"
                      placeholderTextColor={COLORS.placeholder}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType="phone-pad"
                      returnKeyType="done"
                    />
                  )}
                />
              </View>
            </View>
          );
        })}

        {/* Add Medication Button */}
        <TouchableOpacity
          style={styles.addMedicationButton}
          onPress={() => append({ ...EMPTY_MEDICATION })}
          activeOpacity={0.7}
        >
          <Text style={styles.addMedicationIcon}>+</Text>
          <Text style={styles.addMedicationText}>Add Medication</Text>
        </TouchableOpacity>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleReset}
            activeOpacity={0.7}
            disabled={isSubmitting}
          >
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit(handleFormSubmit)}
            activeOpacity={0.8}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Save Profile</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footerNote}>
          ⚕ All data is processed securely and never stored without consent.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Options ─────────────────────────────────────────────────────────────────

const SEX_OPTIONS: SelectOption[] = [
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
  { label: 'Other', value: 'Other' },
];

const PRODUCT_TYPE_OPTIONS: SelectOption[] = [
  { label: 'Tablet', value: 'Tablet' },
  { label: 'Capsule', value: 'Capsule' },
  { label: 'Liquid', value: 'Liquid' },
  { label: 'Injection', value: 'Injection' },
  { label: 'Topical', value: 'Topical' },
];

const INTAKE_METHOD_OPTIONS: SelectOption[] = [
  { label: 'Oral', value: 'Oral' },
  { label: 'Intravenous', value: 'Intravenous' },
  { label: 'Sublingual', value: 'Sublingual' },
  { label: 'Inhalation', value: 'Inhalation' },
];

// ─── Theme ────────────────────────────────────────────────────────────────────

const COLORS = {
  background: '#F0F4F8',
  card: '#FFFFFF',
  primary: '#1A73E8',
  primaryDark: '#1557B0',
  success: '#34A853',
  error: '#D93025',
  label: '#1C2B3A',
  sublabel: '#5F6B78',
  placeholder: '#A8B4BF',
  border: '#D9E2EC',
  borderFocus: '#1A73E8',
  inputBg: '#F8FAFC',
  divider: '#E8EEF4',
  badgeBg: '#EAF2FF',
  badgeText: '#1A73E8',
  unitBg: '#EAF2FF',
  unitText: '#1A73E8',
  white: '#FFFFFF',
  shadow: '#1A2B4B',
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 48,
    gap: 16,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  headerBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  headerBadgeText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.label,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.sublabel,
    marginTop: 3,
    letterSpacing: 0.5,
  },

  // Card (patient info)
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 24,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },

  // Medication card
  medicationCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 24,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  medicationCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  medicationCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.label,
  },
  removeButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.error,
  },
  removeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.error,
  },

  // Add medication button
  addMedicationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    backgroundColor: COLORS.badgeBg,
  },
  addMedicationIcon: {
    fontSize: 20,
    color: COLORS.primary,
    fontWeight: '600',
    lineHeight: 22,
  },
  addMedicationText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Section
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  sectionTitleSpaced: {
    marginTop: 24,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginBottom: 16,
  },

  // Field
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.label,
    marginBottom: 6,
    letterSpacing: 0.1,
  },

  // Input
  input: {
    height: 48,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: COLORS.label,
  },
  inputError: {
    borderColor: COLORS.error,
    backgroundColor: '#FFF5F5',
  },

  // Input row
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputFlex: { flex: 1 },
  unitBadge: {
    height: 48,
    paddingHorizontal: 14,
    backgroundColor: COLORS.unitBg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.unitText,
  },

  // Select button
  selectButton: {
    height: 48,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectButtonText: {
    fontSize: 15,
    color: COLORS.label,
    flex: 1,
  },
  placeholderText: {
    color: COLORS.placeholder,
  },
  chevron: {
    fontSize: 16,
    color: COLORS.sublabel,
    marginLeft: 8,
  },

  // Error text
  errorText: {
    marginTop: 5,
    fontSize: 12,
    color: COLORS.error,
    fontWeight: '500',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10,20,40,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.label,
  },
  modalClose: {
    fontSize: 18,
    color: COLORS.sublabel,
    padding: 4,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  optionItemSelected: {
    backgroundColor: COLORS.badgeBg,
  },
  optionText: {
    fontSize: 15,
    color: COLORS.label,
  },
  optionTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '700',
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  resetButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.sublabel,
  },
  submitButton: {
    flex: 2,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.3,
  },

  // Duration unit segment
  durationUnitRow: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  durationUnitBtn: {
    paddingHorizontal: 10,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.inputBg,
  },
  durationUnitBtnActive: {
    backgroundColor: COLORS.primary,
  },
  durationUnitBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.sublabel,
  },
  durationUnitBtnTextActive: {
    color: COLORS.white,
  },

  optionalTag: {
    fontSize: 12,
    fontWeight: '400',
    color: COLORS.sublabel,
  },

  // Footer
  footerNote: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.sublabel,
    letterSpacing: 0.2,
    lineHeight: 16,
  },
});
