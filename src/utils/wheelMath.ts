import { WheelItem } from '../types';

export interface SliceSlice {
  item: WheelItem;
  startAngle: number; // in radians [0, 2PI]
  endAngle: number;
  sweepAngle: number;
  percentage: number;
  centerAngle: number;
}

export const PRESET_PALETTES: { name: string; colors: string[] }[] = [
  {
    name: 'Classic Rainbow',
    colors: ['#EA4335', '#FB8C00', '#F4B400', '#34A853', '#00ACC1', '#4285F4', '#7E57C2', '#EC407A'],
  },
  {
    name: 'Carnival Festival',
    colors: ['#E53935', '#FFB300', '#43A047', '#1E88E5', '#8E24AA', '#F4511E', '#00897B'],
  },
  {
    name: 'Ocean & Sky',
    colors: ['#0284C7', '#0EA5E9', '#38BDF8', '#0D9488', '#14B8A6', '#2DD4BF', '#6366F1'],
  },
  {
    name: 'Sunset Horizon',
    colors: ['#E11D48', '#F43F5E', '#FB7185', '#F97316', '#FB923C', '#FBBF24', '#C026D3'],
  },
  {
    name: 'Emerald Forest',
    colors: ['#059669', '#10B981', '#34D399', '#84CC16', '#65A30D', '#047857', '#14B8A6'],
  },
  {
    name: 'Sweet Pastel',
    colors: ['#F87171', '#FB923C', '#FBBF24', '#4ADE80', '#22D3EE', '#818CF8', '#F472B6'],
  },
];

export const DEFAULT_ITEMS: WheelItem[] = [
  { id: '1', name: 'Alice', color: '#EA4335', weight: 20, enabled: true },
  { id: '2', name: 'Bob', color: '#FB8C00', weight: 20, enabled: true },
  { id: '3', name: 'Charlie', color: '#F4B400', weight: 20, enabled: true },
  { id: '4', name: 'Diana', color: '#34A853', weight: 20, enabled: true },
  { id: '5', name: 'Ethan', color: '#4285F4', weight: 20, enabled: true },
  { id: '6', name: 'Fiona', color: '#7E57C2', weight: 20, enabled: true },
];

export const PRESET_TEMPLATES: { name: string; description: string; items: Omit<WheelItem, 'id'>[] }[] = [
  {
    name: 'Yes / No / Maybe',
    description: 'Weighted decision maker (high Yes chance)',
    items: [
      { name: 'YES! 🎉', color: '#10B981', weight: 50, enabled: true },
      { name: 'NO ❌', color: '#EF4444', weight: 30, enabled: true },
      { name: 'MAYBE 🤔', color: '#F59E0B', weight: 20, enabled: true },
    ],
  },
  {
    name: 'Lucky Raffle (1-10)',
    description: '10 numbered tickets with equal probability',
    items: Array.from({ length: 10 }, (_, i) => ({
      name: `Ticket #${i + 1}`,
      color: PRESET_PALETTES[0].colors[i % PRESET_PALETTES[0].colors.length],
      weight: 10,
      enabled: true,
    })),
  },
  {
    name: 'What to Eat for Lunch?',
    description: 'Weighted meal picker',
    items: [
      { name: 'Pizza 🍕', color: '#EF4444', weight: 30, enabled: true },
      { name: 'Sushi 🍣', color: '#06B6D4', weight: 25, enabled: true },
      { name: 'Tacos 🌮', color: '#F59E0B', weight: 20, enabled: true },
      { name: 'Salad 🥗', color: '#10B981', weight: 10, enabled: true },
      { name: 'Burger 🍔', color: '#8B5CF6', weight: 15, enabled: true },
    ],
  },
  {
    name: 'Team Meeting Icebreaker',
    description: 'Who shares first?',
    items: [
      { name: 'Sarah', color: '#EC4899', weight: 20, enabled: true },
      { name: 'Marcus', color: '#3B82F6', weight: 20, enabled: true },
      { name: 'Elena', color: '#10B981', weight: 20, enabled: true },
      { name: 'Liam', color: '#F59E0B', weight: 20, enabled: true },
      { name: 'Sophia', color: '#8B5CF6', weight: 20, enabled: true },
    ],
  },
];

/**
 * Calculates slices from active items based on their weights.
 * When equalSliceVisuals is true, all slices have identical visual sweep angles,
 * allowing weight/probability to be boosted without expanding the slice's visual color width.
 */
export function calculateSlices(items: WheelItem[], equalSliceVisuals: boolean = true): SliceSlice[] {
  const activeItems = items.filter((item) => item.enabled && item.weight > 0);
  if (activeItems.length === 0) return [];

  const totalWeight = activeItems.reduce((sum, item) => sum + item.weight, 0);
  const count = activeItems.length;
  let currentAngle = 0;

  return activeItems.map((item) => {
    const percentage = (item.weight / totalWeight) * 100;
    const sweepAngle = equalSliceVisuals
      ? (2 * Math.PI) / count
      : (item.weight / totalWeight) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sweepAngle;
    const centerAngle = startAngle + sweepAngle / 2;

    currentAngle = endAngle;

    return {
      item,
      startAngle,
      endAngle,
      sweepAngle,
      percentage,
      centerAngle,
    };
  });
}

/**
 * Given current wheel rotation angle, finds the slice under the top needle (angle 1.5 * PI)
 */
export function getSliceAtNeedle(slices: SliceSlice[], currentRotation: number): SliceSlice | null {
  if (slices.length === 0) return null;

  // Needle is at top: 270 deg or 1.5 * Math.PI
  const needleAngle = 1.5 * Math.PI;
  // Normalized relative angle inside wheel coordinate system
  let relativeAngle = (needleAngle - currentRotation) % (2 * Math.PI);
  if (relativeAngle < 0) {
    relativeAngle += 2 * Math.PI;
  }

  for (const slice of slices) {
    // Check if relativeAngle falls between slice start and end
    if (relativeAngle >= slice.startAngle && relativeAngle < slice.endAngle) {
      return slice;
    }
  }

  // Fallback edge case at 2 * Math.PI
  return slices[slices.length - 1];
}

/**
 * Determines text color (white or dark) based on background hex luminance
 */
export function getContrastColor(hexColor: string): '#FFFFFF' | '#0F172A' {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;

  // Perceptive luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#0F172A' : '#FFFFFF';
}

/**
 * Calculates a target stop angle that guarantees a winner picked with exact probability
 */
export function pickRandomWinner(slices: SliceSlice[]): { winner: SliceSlice; targetAngle: number } {
  if (slices.length === 0) {
    throw new Error('No active slices on wheel');
  }

  // Pick random float in [0, 1)
  const rand = Math.random();
  let cumulative = 0;
  let selectedSlice = slices[0];

  for (const slice of slices) {
    cumulative += slice.percentage / 100;
    if (rand <= cumulative) {
      selectedSlice = slice;
      break;
    }
  }

  // Place landing point safely inside the chosen slice (e.g. between 15% and 85% of slice to avoid border knife-edge)
  const innerMargin = 0.15 * selectedSlice.sweepAngle;
  const randomWithinSlice =
    selectedSlice.sweepAngle > 0.1
      ? selectedSlice.startAngle + innerMargin + Math.random() * (selectedSlice.sweepAngle - 2 * innerMargin)
      : selectedSlice.centerAngle;

  // We want the needle (at 1.5 * PI) to point to randomWithinSlice
  // Needle relative angle is (1.5 * PI - targetRotation) % 2PI = randomWithinSlice
  // targetRotation % 2PI = 1.5 * PI - randomWithinSlice
  let targetAngleInCycle = (1.5 * Math.PI - randomWithinSlice) % (2 * Math.PI);
  if (targetAngleInCycle < 0) {
    targetAngleInCycle += 2 * Math.PI;
  }

  return {
    winner: selectedSlice,
    targetAngle: targetAngleInCycle,
  };
}
