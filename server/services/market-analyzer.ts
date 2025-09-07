interface MarketTrend {
  category: string;
  trendDirection: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  volatility: number;
  momentum: number;
  supportLevel: number;
  resistanceLevel: number;
}

interface PriceAlert {
  type: 'breakout' | 'breakdown' | 'support' | 'resistance' | 'volume_spike';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: Date;
}

export class MarketAnalyzer {
  
  /**
   * Analyze price trends using technical indicators
   */
  static analyzeTrends(priceData: number[], volumes: number[] = []): MarketTrend {
    if (priceData.length < 20) {
      return {
        category: 'insufficient_data',
        trendDirection: 'neutral',
        confidence: 0,
        volatility: 0,
        momentum: 0,
        supportLevel: 0,
        resistanceLevel: 0
      };
    }

    // Calculate moving averages
    const shortMA = this.calculateSMA(priceData, 5);
    const longMA = this.calculateSMA(priceData, 20);
    
    // Determine trend direction
    const currentShort = shortMA[shortMA.length - 1];
    const currentLong = longMA[longMA.length - 1];
    const prevShort = shortMA[shortMA.length - 2];
    const prevLong = longMA[longMA.length - 2];
    
    let trendDirection: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let confidence = 0;
    
    if (currentShort > currentLong && prevShort <= prevLong) {
      trendDirection = 'bullish';
      confidence = 0.8;
    } else if (currentShort < currentLong && prevShort >= prevLong) {
      trendDirection = 'bearish';
      confidence = 0.8;
    } else if (currentShort > currentLong) {
      trendDirection = 'bullish';
      confidence = 0.6;
    } else if (currentShort < currentLong) {
      trendDirection = 'bearish';
      confidence = 0.6;
    }

    // Calculate volatility (standard deviation)
    const volatility = this.calculateVolatility(priceData);
    
    // Calculate momentum (rate of change)
    const momentum = this.calculateMomentum(priceData, 10);
    
    // Calculate support and resistance levels
    const supportLevel = Math.min(...priceData.slice(-20));
    const resistanceLevel = Math.max(...priceData.slice(-20));

    return {
      category: 'trend_analysis',
      trendDirection,
      confidence,
      volatility,
      momentum,
      supportLevel,
      resistanceLevel
    };
  }

  /**
   * Generate price alerts based on market conditions
   */
  static generateAlerts(
    currentPrice: number, 
    priceHistory: number[], 
    volume: number = 0,
    avgVolume: number = 0
  ): PriceAlert[] {
    const alerts: PriceAlert[] = [];
    
    if (priceHistory.length < 10) return alerts;

    // Support and resistance levels
    const recent20 = priceHistory.slice(-20);
    const support = Math.min(...recent20);
    const resistance = Math.max(...recent20);
    const midpoint = (support + resistance) / 2;

    // Breakout alert
    if (currentPrice > resistance * 1.02) {
      alerts.push({
        type: 'breakout',
        severity: 'high',
        message: `Price broke above resistance level of $${resistance.toLocaleString()}`,
        timestamp: new Date()
      });
    }

    // Breakdown alert
    if (currentPrice < support * 0.98) {
      alerts.push({
        type: 'breakdown',
        severity: 'high',
        message: `Price broke below support level of $${support.toLocaleString()}`,
        timestamp: new Date()
      });
    }

    // Volume spike alert
    if (volume > avgVolume * 2 && avgVolume > 0) {
      alerts.push({
        type: 'volume_spike',
        severity: 'medium',
        message: `Unusual volume spike detected: ${Math.round((volume / avgVolume) * 100)}% above average`,
        timestamp: new Date()
      });
    }

    // Support level test
    if (currentPrice <= support * 1.05 && currentPrice > support) {
      alerts.push({
        type: 'support',
        severity: 'medium',
        message: `Price approaching support level at $${support.toLocaleString()}`,
        timestamp: new Date()
      });
    }

    // Resistance level test
    if (currentPrice >= resistance * 0.95 && currentPrice < resistance) {
      alerts.push({
        type: 'resistance',
        severity: 'medium',
        message: `Price approaching resistance level at $${resistance.toLocaleString()}`,
        timestamp: new Date()
      });
    }

    return alerts;
  }

  /**
   * Calculate Simple Moving Average
   */
  private static calculateSMA(data: number[], period: number): number[] {
    const result: number[] = [];
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val, 0);
      result.push(sum / period);
    }
    return result;
  }

  /**
   * Calculate price volatility (standard deviation)
   */
  private static calculateVolatility(data: number[]): number {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const squaredDiffs = data.map(val => Math.pow(val - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / data.length;
    return Math.sqrt(avgSquaredDiff) / mean; // Relative volatility
  }

  /**
   * Calculate momentum (rate of change)
   */
  private static calculateMomentum(data: number[], period: number): number {
    if (data.length < period) return 0;
    const current = data[data.length - 1];
    const past = data[data.length - period];
    return ((current - past) / past) * 100;
  }

  /**
   * Predict short-term price direction
   */
  static predictPriceDirection(
    priceHistory: number[], 
    volumes: number[] = []
  ): { direction: 'up' | 'down' | 'sideways', confidence: number, targetPrice: number } {
    
    const trend = this.analyzeTrends(priceHistory, volumes);
    const currentPrice = priceHistory[priceHistory.length - 1];
    
    let direction: 'up' | 'down' | 'sideways' = 'sideways';
    let confidence = 0.5;
    let targetPrice = currentPrice;

    if (trend.trendDirection === 'bullish' && trend.momentum > 5) {
      direction = 'up';
      confidence = Math.min(trend.confidence + 0.2, 0.9);
      targetPrice = currentPrice * (1 + (trend.momentum / 100) * 0.5);
    } else if (trend.trendDirection === 'bearish' && trend.momentum < -5) {
      direction = 'down';
      confidence = Math.min(trend.confidence + 0.2, 0.9);
      targetPrice = currentPrice * (1 + (trend.momentum / 100) * 0.5);
    }

    // Adjust based on volatility
    if (trend.volatility > 0.2) {
      confidence *= 0.8; // Reduce confidence in high volatility
    }

    return { direction, confidence, targetPrice };
  }

  /**
   * Calculate market correlation between items
   */
  static calculateCorrelation(priceData1: number[], priceData2: number[]): number {
    const minLength = Math.min(priceData1.length, priceData2.length);
    if (minLength < 10) return 0;

    const data1 = priceData1.slice(-minLength);
    const data2 = priceData2.slice(-minLength);

    const mean1 = data1.reduce((sum, val) => sum + val, 0) / data1.length;
    const mean2 = data2.reduce((sum, val) => sum + val, 0) / data2.length;

    let numerator = 0;
    let sum1Sq = 0;
    let sum2Sq = 0;

    for (let i = 0; i < data1.length; i++) {
      const diff1 = data1[i] - mean1;
      const diff2 = data2[i] - mean2;
      numerator += diff1 * diff2;
      sum1Sq += diff1 * diff1;
      sum2Sq += diff2 * diff2;
    }

    const denominator = Math.sqrt(sum1Sq * sum2Sq);
    return denominator === 0 ? 0 : numerator / denominator;
  }
}