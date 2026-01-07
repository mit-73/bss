"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BilateralStimulation } from '@/components/BilateralStimulation';
import { Loader2 } from 'lucide-react';

function SessionPageContent() {
  const searchParams = useSearchParams();
  const duration = searchParams.get('duration');
  const period = searchParams.get('period');
  const direction = searchParams.get('direction');
  const sound = searchParams.get('sound');
  const color = searchParams.get('color');
  const shape = searchParams.get('shape');

  const durationInSeconds = duration ? parseInt(duration, 10) : 45;
  const periodInSeconds = period ? parseFloat(period) : 4;
  const stimulationDirection = direction || 'horizontal';
  const stimulationSound = sound || 'click';
  const stimulusColor = color || 'primary';
  const stimulusShape = shape || 'circle';

  return (
    <BilateralStimulation
      durationInSeconds={durationInSeconds}
      periodInSeconds={periodInSeconds}
      direction={stimulationDirection}
      sound={stimulationSound}
      color={stimulusColor}
      shape={stimulusShape}
    />
  );
}

export default function SessionPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <SessionPageContent />
    </Suspense>
  );
}

    