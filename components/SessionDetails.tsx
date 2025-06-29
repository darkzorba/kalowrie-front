import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useLocalization } from '../contexts/LocalizationContext';
import { useTheme } from '../contexts/ThemeContext';
import { WorkoutSession } from '../types/workout';
import { formatDateForDisplay, sanitizeSessionData } from '../utils/chartUtils';
import { StyledText } from './StyledText';

interface SessionDetailsProps {
  session: WorkoutSession;
}

export const SessionDetails: React.FC<SessionDetailsProps> = ({ session }) => {
  const { colors } = useTheme();
  const { t } = useLocalization();


  const sanitizedSession = sanitizeSessionData(session);

  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Hoje • ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 2) {
      return 'Ontem • ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else {
      return formatDateForDisplay(dateString);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="analytics" size={20} color={colors.primary} />
          <StyledText style={[styles.title, { color: colors.text }]}>
            {t('sessionDetails')}
          </StyledText>
        </View>
        <StyledText style={[styles.dateText, { color: colors.placeholderText }]}>
          {formatDateDisplay(sanitizedSession.date)}
        </StyledText>
      </View>

      <View style={styles.metricsContainer}>
        <View style={[styles.metricCard, { backgroundColor: colors.appBackground }]}>
          <View style={styles.metricHeader}>
            <Ionicons name="barbell" size={18} color={colors.primary} />
            <StyledText style={[styles.metricLabel, { color: colors.placeholderText }]}>
              {t('totalVolume')}
            </StyledText>
          </View>
          <StyledText style={[styles.metricValue, { color: colors.text }]}>
            {sanitizedSession.metrics.total_volume.toFixed(1)}
            <StyledText style={[styles.metricUnit, { color: colors.placeholderText }]}>
              {' '}kg
            </StyledText>
          </StyledText>
          <View style={[styles.metricIndicator, { backgroundColor: colors.primary }]} />
        </View>
        
        <View style={[styles.metricCard, { backgroundColor: colors.appBackground }]}>
          <View style={styles.metricHeader}>
            <Ionicons name="trophy" size={18} color="#FF6B6B" />
            <StyledText style={[styles.metricLabel, { color: colors.placeholderText }]}>
              {t('maxE1rm')}
            </StyledText>
          </View>
          <StyledText style={[styles.metricValue, { color: colors.text }]}>
            {sanitizedSession.metrics.max_e1rm.toFixed(1)}
            <StyledText style={[styles.metricUnit, { color: colors.placeholderText }]}>
              {' '}kg
            </StyledText>
          </StyledText>
          <View style={[styles.metricIndicator, { backgroundColor: '#FF6B6B' }]} />
        </View>
      </View>

      <View style={styles.tableSection}>
        <View style={styles.tableTitleContainer}>
          <Ionicons name="list" size={16} color={colors.text} />
          <StyledText style={[styles.tableTitle, { color: colors.text }]}>
            Detalhes das Séries
          </StyledText>
        </View>

        <View style={[styles.tableContainer, { backgroundColor: colors.appBackground }]}>
          <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
            <StyledText style={[styles.headerText, { color: colors.text }]}>
              Série
            </StyledText>
            <StyledText style={[styles.headerText, { color: colors.text }]}>
              Peso (kg)
            </StyledText>
            <StyledText style={[styles.headerText, { color: colors.text }]}>
              Reps
            </StyledText>
            <StyledText style={[styles.headerText, { color: colors.text }]}>
              RIR
            </StyledText>
          </View>

          <ScrollView style={styles.tableBody} showsVerticalScrollIndicator={false}>
            {sanitizedSession.sets.map((set, index) => (
              <View 
                key={index} 
                style={[
                  styles.tableRow, 
                  { 
                    backgroundColor: index % 2 === 0 ? 'transparent' : colors.card + '40',
                  }
                ]}
              >
                <View style={styles.cellContainer}>
                  <StyledText style={[styles.cellText, { color: colors.text }]}>
                    {set.set_number}
                  </StyledText>
                </View>
                <View style={styles.cellContainer}>
                  <StyledText style={[styles.cellText, { color: colors.text }]}>
                    {set.weight}
                  </StyledText>
                </View>
                <View style={styles.cellContainer}>
                  <StyledText style={[styles.cellText, { color: colors.text }]}>
                    {set.reps_done}
                  </StyledText>
                </View>
                <View style={styles.cellContainer}>
                  <View style={styles.rirContainer}>
                    <StyledText style={[styles.cellText, { color: colors.text }]}>
                      {set.reps_in_reserve}
                    </StyledText>
                    {set.reps_in_reserve <= 2 && (
                      <Ionicons 
                        name="flame" 
                        size={12} 
                        color="#FF6B6B" 
                        style={styles.intensityIcon}
                      />
                    )}
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'black',
    lineHeight: 28,
  },
  metricUnit: {
    fontSize: 14,
    fontWeight: '500',
  },
  metricIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  tableSection: {
    gap: 12,
  },
  tableTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  tableContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  headerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableBody: {
    maxHeight: 200,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  cellContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  rirContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  intensityIcon: {
    marginLeft: 2,
  },
});

export default SessionDetails; 