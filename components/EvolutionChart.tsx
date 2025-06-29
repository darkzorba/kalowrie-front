import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { useLocalization } from '../contexts/LocalizationContext';
import { useTheme } from '../contexts/ThemeContext';
import { WorkoutSession } from '../types/workout';
import { formatDataForChart } from '../utils/chartUtils';
import { StyledText } from './StyledText';

interface EvolutionChartProps {
  sessions: WorkoutSession[];
  exerciseName: string;
  onDataPointPress?: (session: WorkoutSession) => void;
}

interface TooltipData {
  visible: boolean;
  x: number;
  y: number;
  session: WorkoutSession | null;
  type: 'volume' | 'e1rm';
}

const screenWidth = Dimensions.get('window').width;

export const EvolutionChart: React.FC<EvolutionChartProps> = ({
  sessions,
  exerciseName,
  onDataPointPress
}) => {
  const { colors } = useTheme();
  const { t } = useLocalization();
  const [tooltip, setTooltip] = useState<TooltipData>({
    visible: false,
    x: 0,
    y: 0,
    session: null,
    type: 'volume'
  });

  if (sessions.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <View style={styles.header}>
          <StyledText style={[styles.title, { color: colors.text }]}>
            {t('exerciseEvolution')}
          </StyledText>
          <View style={styles.exerciseInfo}>
            <Ionicons name="fitness" size={16} color={colors.primary} />
            <StyledText style={[styles.exerciseName, { color: colors.primary }]}>
              {exerciseName}
            </StyledText>
          </View>
        </View>
        <View style={styles.noDataContainer}>
          <Ionicons name="analytics-outline" size={48} color={colors.placeholderText} />
          <StyledText style={[styles.noDataText, { color: colors.placeholderText }]}>
            {t('noEvolutionData')}
          </StyledText>
        </View>
      </View>
    );
  }

  const chartData = formatDataForChart(sessions, colors.primary);

  const showTooltip = (session: WorkoutSession, type: 'volume' | 'e1rm', x: number, y: number) => {
    setTooltip({
      visible: true,
      x,
      y,
      session,
      type
    });
  };

  const hideTooltip = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  const formatTooltipValue = (session: WorkoutSession, type: 'volume' | 'e1rm') => {
    const date = new Date(session.date).toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit' 
    });
    
    if (type === 'volume') {
      return `${date}: ${session.metrics.total_volume.toFixed(1)} kg de Volume`;
    } else {
      return `${date}: ${session.metrics.max_e1rm.toFixed(1)} kg de E1RM`;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <StyledText style={[styles.title, { color: colors.text }]}>
          {t('exerciseEvolution')}
        </StyledText>
        <View style={styles.exerciseInfo}>
          <Ionicons name="fitness" size={16} color={colors.primary} />
          <StyledText style={[styles.exerciseName, { color: colors.primary }]}>
            {exerciseName}
          </StyledText>
        </View>
      </View>
      
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.barSample, { backgroundColor: colors.primary }]} />
          <StyledText style={[styles.legendText, { color: colors.text }]}>
            {t('volume')} (kg)
          </StyledText>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.lineSample}>
            <View style={[styles.linePath, { backgroundColor: '#FF6B6B' }]} />
            <View style={[styles.linePoint, { backgroundColor: '#FF6B6B' }]} />
          </View>
          <StyledText style={[styles.legendText, { color: colors.text }]}>
            {t('e1rm')} (kg)
          </StyledText>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <View style={styles.yAxisContainer}>
          <StyledText style={[styles.yAxisLabel, { color: colors.placeholderText }]}>
            Volume (kg)
          </StyledText>
        </View>
        
        <View style={styles.mainChart}>
          <BarChart
            data={chartData.barData}
            width={screenWidth - 120}
            height={220}
            barWidth={Math.max(20, (screenWidth - 120) / chartData.barData.length * 0.6)}
            spacing={Math.max(10, (screenWidth - 120) / chartData.barData.length * 0.4)}
            roundedTop
            roundedBottom
            hideRules={false}
            rulesColor={colors.border + '40'}
            xAxisThickness={1}
            yAxisThickness={1}
            xAxisColor={colors.border}
            yAxisColor={colors.border}
            yAxisTextStyle={{ 
              color: colors.placeholderText, 
              fontSize: 10,
              fontWeight: '400'
            }}
            xAxisLabelTextStyle={{ 
              color: colors.placeholderText, 
              fontSize: 10,
              fontWeight: '400'
            }}
            maxValue={chartData.maxVolume * 1.15}
            noOfSections={5}
            onPress={(item: any, index: number) => {
              if (onDataPointPress) {
                onDataPointPress(sessions[index]);
              }
              showTooltip(sessions[index], 'volume', 0, 0);
            }}
          />
          
          <View style={styles.lineChartOverlay}>
            <LineChart
              data={chartData.lineData}
              width={screenWidth - 120}
              height={220}
              color="#FF6B6B"
              thickness={3}
              dataPointsColor="#FF6B6B"
              dataPointsRadius={6}
              curved
              hideDataPoints={false}
              textColor={colors.text}
              textFontSize={9}
              maxValue={chartData.maxE1rm * 1.15}
              onPress={(item: any, index: number) => {
                if (onDataPointPress) {
                  onDataPointPress(sessions[index]);
                }
                showTooltip(sessions[index], 'e1rm', 0, 0);
              }}
            />
          </View>
        </View>

        <View style={styles.secondaryYAxisContainer}>
          <StyledText style={[styles.yAxisLabel, { color: '#FF6B6B' }]}>
            E1RM (kg)
          </StyledText>
        </View>
      </View>

      <View style={styles.xAxisContainer}>
        <StyledText style={[styles.xAxisLabel, { color: colors.placeholderText }]}>
          Período
        </StyledText>
      </View>


      {tooltip.visible && tooltip.session && (
        <View style={[styles.tooltip, { 
          backgroundColor: colors.appBackground,
          borderColor: colors.border,
        }]}>
          <StyledText style={[styles.tooltipText, { color: colors.text }]}>
            {formatTooltipValue(tooltip.session, tooltip.type)}
          </StyledText>
        </View>
      )}
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  exerciseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '600',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barSample: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  lineSample: {
    width: 20,
    height: 12,
    position: 'relative',
    justifyContent: 'center',
  },
  linePath: {
    width: 20,
    height: 2,
    borderRadius: 1,
  },
  linePoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    right: 2,
    top: 3,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  yAxisContainer: {
    width: 50,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yAxisLabel: {
    fontSize: 10,
    fontWeight: '500',
    transform: [{ rotate: '-90deg' }],
    width: 80,
    textAlign: 'center',
  },
  mainChart: {
    flex: 1,
    position: 'relative',
  },
  lineChartOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  secondaryYAxisContainer: {
    width: 50,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  xAxisContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  xAxisLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  noDataText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  tooltip: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 1000,
  },
  tooltipText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default EvolutionChart; 