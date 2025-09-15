import { IStorage } from '../storage.js';
import type { MedianPrice } from '../../shared/schema.js';

export interface ResampledPoint {
  date: string;
  value: number;
  quality: 'observed' | 'interpolated' | 'aggregated';
}

export interface ResamplingMetadata {
  observedCount: number;
  interpolatedCount: number;
  earliestObserved: string;
  latestObserved: string;
}

export interface ResampledSeries {
  data: ResampledPoint[];
  metadata: ResamplingMetadata;
}

export class ResamplingService {
  constructor(private storage: IStorage) {}

  async getResampledSeries(
    collectibleId: string,
    startDate: Date,
    endDate: Date,
    targetFrequency: 'day' | 'week' | 'month' | 'year' = 'day',
    includeEstimates: boolean = true,
    maxPoints: number = 720
  ): Promise<ResampledSeries> {
    // Get observed data from both granularities
    const dailyData = await this.storage.getMedianPricesRange(
      collectibleId, 
      startDate, 
      endDate, 
      'day'
    );
    
    const yearlyData = await this.storage.getMedianPricesRange(
      collectibleId, 
      startDate, 
      endDate, 
      'year'
    );

    // Combine and sort all observed data points
    const allObserved = [...dailyData, ...yearlyData]
      .map(point => ({
        date: new Date(point.date).getTime(),
        value: parseFloat(point.medianPrice),
        original: point
      }))
      .sort((a, b) => a.date - b.date);

    if (allObserved.length === 0) {
      return {
        data: [],
        metadata: {
          observedCount: 0,
          interpolatedCount: 0,
          earliestObserved: '',
          latestObserved: ''
        }
      };
    }

    // Convert observed points to resampled format
    let resampledPoints: ResampledPoint[] = allObserved.map(point => ({
      date: new Date(point.date).toISOString(),
      value: point.value,
      quality: 'observed' as const
    }));

    // Add interpolated points if requested and gaps exist
    if (includeEstimates) {
      resampledPoints = this.interpolateGaps(resampledPoints, targetFrequency);
    }

    // Downsample if too many points
    if (resampledPoints.length > maxPoints) {
      resampledPoints = this.downsample(resampledPoints, maxPoints);
    }

    // Filter to requested date range
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    resampledPoints = resampledPoints.filter(point => {
      const pointTime = new Date(point.date).getTime();
      return pointTime >= startTime && pointTime <= endTime;
    });

    // Calculate metadata
    const observedPoints = resampledPoints.filter(p => p.quality === 'observed');
    const interpolatedPoints = resampledPoints.filter(p => p.quality === 'interpolated');

    return {
      data: resampledPoints,
      metadata: {
        observedCount: observedPoints.length,
        interpolatedCount: interpolatedPoints.length,
        earliestObserved: observedPoints.length > 0 ? observedPoints[0].date : '',
        latestObserved: observedPoints.length > 0 ? observedPoints[observedPoints.length - 1].date : ''
      }
    };
  }

  private interpolateGaps(points: ResampledPoint[], targetFrequency: 'day' | 'week' | 'month' | 'year'): ResampledPoint[] {
    if (points.length < 2) return points;

    const result: ResampledPoint[] = [];
    const targetInterval = this.getTargetInterval(targetFrequency);

    for (let i = 0; i < points.length; i++) {
      result.push(points[i]);

      // If there's a next point, check if we need to interpolate
      if (i < points.length - 1) {
        const currentTime = new Date(points[i].date).getTime();
        const nextTime = new Date(points[i + 1].date).getTime();
        const gap = nextTime - currentTime;

        // If gap is larger than target interval, add interpolated points
        if (gap > targetInterval * 2) {
          const interpolatedPoints = this.createInterpolatedPoints(
            points[i],
            points[i + 1],
            targetInterval
          );
          result.push(...interpolatedPoints);
        }
      }
    }

    return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private createInterpolatedPoints(start: ResampledPoint, end: ResampledPoint, targetInterval: number): ResampledPoint[] {
    const startTime = new Date(start.date).getTime();
    const endTime = new Date(end.date).getTime();
    const startValue = start.value;
    const endValue = end.value;
    
    const interpolatedPoints: ResampledPoint[] = [];
    let currentTime = startTime + targetInterval;

    while (currentTime < endTime) {
      // Linear interpolation
      const progress = (currentTime - startTime) / (endTime - startTime);
      const interpolatedValue = startValue + (endValue - startValue) * progress;

      interpolatedPoints.push({
        date: new Date(currentTime).toISOString(),
        value: Math.round(interpolatedValue * 100) / 100, // Round to 2 decimal places
        quality: 'interpolated'
      });

      currentTime += targetInterval;
    }

    return interpolatedPoints;
  }

  private downsample(points: ResampledPoint[], maxPoints: number): ResampledPoint[] {
    if (points.length <= maxPoints) return points;

    const step = Math.ceil(points.length / maxPoints);
    const downsampled: ResampledPoint[] = [];

    for (let i = 0; i < points.length; i += step) {
      // For downsampling, prefer observed points when available
      const chunk = points.slice(i, Math.min(i + step, points.length));
      const observedInChunk = chunk.filter(p => p.quality === 'observed');
      
      if (observedInChunk.length > 0) {
        // Use first observed point in chunk
        downsampled.push(observedInChunk[0]);
      } else {
        // Use first point in chunk if no observed points
        downsampled.push(chunk[0]);
      }
    }

    return downsampled;
  }

  private getTargetInterval(frequency: 'day' | 'week' | 'month' | 'year'): number {
    const oneDay = 24 * 60 * 60 * 1000; // milliseconds
    switch (frequency) {
      case 'day': return oneDay;
      case 'week': return oneDay * 7;
      case 'month': return oneDay * 30.44; // Average days per month
      case 'year': return oneDay * 365.25;
      default: return oneDay;
    }
  }
}