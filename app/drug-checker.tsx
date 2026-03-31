import { useState } from 'react';
import { Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';

const BOX_SIZE = (Dimensions.get('window').width - 24 * 2 - 20 * 2 - 12) / 2;

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

export default function DrugCheckerScreen() {
  const [drug1, setDrug1] = useState('');
  const [drug2, setDrug2] = useState('');
  const [hour1, setHour1] = useState('00');
  const [min1, setMin1] = useState('00');
  const [hour2, setHour2] = useState('00');
  const [min2, setMin2] = useState('00');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner}>

        <Text style={styles.header}>QR · Enter Medicines to assess risks</Text>

        <View style={styles.card}>
          {/* Drug input fields */}
          <TextInput
            style={styles.drugInput}
            placeholder="Enter drug 1 / describe medicine"
            placeholderTextColor="#A0AEC0"
            value={drug1}
            onChangeText={setDrug1}
            multiline
          />

          <TextInput
            style={styles.drugInput}
            placeholder="Enter drug 2 / describe medicine"
            placeholderTextColor="#A0AEC0"
            value={drug2}
            onChangeText={setDrug2}
            multiline
          />

          {/* Time taken pickers */}
          <View style={styles.timeRow}>
            <View style={styles.timeBox}>
              <Text style={styles.timeLabel}>Medication 1 time taken</Text>
              <Text style={styles.timeDisplay}>{hour1}:{min1}</Text>
              <View style={styles.pickerRow}>
                <Picker
                  selectedValue={hour1}
                  onValueChange={setHour1}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  {HOURS.map(h => <Picker.Item key={h} label={h} value={h} />)}
                </Picker>
                <Text style={styles.pickerColon}>:</Text>
                <Picker
                  selectedValue={min1}
                  onValueChange={setMin1}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  {MINUTES.map(m => <Picker.Item key={m} label={m} value={m} />)}
                </Picker>
              </View>
            </View>

            <View style={styles.timeBox}>
              <Text style={styles.timeLabel}>Medication 2 time taken</Text>
              <Text style={styles.timeDisplay}>{hour2}:{min2}</Text>
              <View style={styles.pickerRow}>
                <Picker
                  selectedValue={hour2}
                  onValueChange={setHour2}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  {HOURS.map(h => <Picker.Item key={h} label={h} value={h} />)}
                </Picker>
                <Text style={styles.pickerColon}>:</Text>
                <Picker
                  selectedValue={min2}
                  onValueChange={setMin2}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  {MINUTES.map(m => <Picker.Item key={m} label={m} value={m} />)}
                </Picker>
              </View>
            </View>
          </View>

          {/* Start Analysis button */}
          <TouchableOpacity style={styles.analyseButton}>
            <Text style={styles.analyseButtonText}>Start Analysis</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  inner: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: 'center',
  },
  header: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 32,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    gap: 16,
  },
  drugInput: {
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 16,
    fontSize: 15,
    color: '#1A202C',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeBox: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E0',
    borderRadius: 10,
    padding: 12,
    overflow: 'hidden',
  },
  timeLabel: {
    fontSize: 10,
    color: '#718096',
    fontWeight: '600',
    marginBottom: 4,
  },
  timeDisplay: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2B6CB0',
    textAlign: 'center',
    marginBottom: 4,
  },
  pickerRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  picker: {
    flex: 1,
    height: '100%',
  },
  pickerItem: {
    fontSize: 14,
    height: 80,
  },
  pickerColon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4A5568',
  },
  analyseButton: {
    backgroundColor: '#2B6CB0',
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  analyseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
