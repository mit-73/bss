"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import * as Tone from "tone";
import { Button } from "./ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";


interface BilateralStimulationProps {
  durationInSeconds: number;
  periodInSeconds: number;
  direction: string;
  sound: string;
  color: string;
  shape: string;
}

const sounds: { [key: string]: () => any } = {
  ting: () => new Tone.MetalSynth({
    frequency: 200,
    envelope: { attack: 0.001, decay: 0.1, release: 0.05 },
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 4000,
    octaves: 1.5
  }),
  beep: () => new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.005, decay: 0.1, sustain: 0.1, release: 0.1 }
  }),
  heartbeat: () => new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 2,
    oscillator: { type: "sine" },
    envelope: { attack: 0.01, decay: 0.4, sustain: 0.01, release: 0.1, attackCurve: "exponential" }
  }),
  woodblock: () => new Tone.PluckSynth({
    attackNoise: 1,
    dampening: 4000,
    resonance: 0.9
  }),
  tonal: () => new Tone.FMSynth({
    harmonicity: 3.1,
    modulationIndex: 10,
    envelope: {
      attack: 0.01,
      decay: 0.2
    }
  }),
};

export function BilateralStimulation({
  durationInSeconds,
  periodInSeconds,
  direction,
  sound,
  color,
  shape,
}: BilateralStimulationProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"ready" | "countdown" | "running" | "stopping" | "done">("ready");
  const [countdown, setCountdown] = useState(3);
  const [timeRemaining, setTimeRemaining] = useState(durationInSeconds);

  const containerRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number>();
  const synthRef = useRef<any>(null);
  const pannerRef = useRef<Tone.Panner | null>(null);
  const sessionIntervalRef = useRef<NodeJS.Timeout>();
  const lastPanDirection = useRef(0);
  const stopTimestamp = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const period = periodInSeconds * 1000;

  const cleanup = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    if (sessionIntervalRef.current) {
      clearInterval(sessionIntervalRef.current);
    }
    
    synthRef.current?.dispose();
    synthRef.current = null;
    pannerRef.current?.dispose();
    pannerRef.current = null;
    
    setTimeout(() => {
      if (Tone.context.state !== 'closed') {
        if (Tone.Transport.state === 'started') {
          Tone.Transport.stop();
          Tone.Transport.cancel();
        }
      }
    }, 100);

  }, []);

  const handleStop = useCallback(() => {
    setStatus("stopping");
    stopTimestamp.current = performance.now();
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  useEffect(() => {
    if (status === "countdown" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (status === "countdown" && countdown === 0) {
      setStatus("running");
    }
  }, [status, countdown]);

  useEffect(() => {
    if (status === "running") {
      setTimeRemaining(durationInSeconds);
      sessionIntervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(sessionIntervalRef.current!);
            handleStop();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      if (Tone.context.state === 'running' && !synthRef.current) {
        synthRef.current = sounds[sound] ? sounds[sound]() : sounds.ting();
        pannerRef.current = new Tone.Panner(0).toDestination();
        synthRef.current.connect(pannerRef.current);
      }

      startTimeRef.current = performance.now();
      
      const animate = (currentTime: number) => {
        if (!containerRef.current || !ballRef.current) {
          animationFrameId.current = requestAnimationFrame(animate);
          return;
        }

        const elapsedTime = currentTime - startTimeRef.current;
        let progress = (elapsedTime % period) / period; // 0 to 1

        const { width, height } = containerRef.current.getBoundingClientRect();
        const ballSize = 50;
        const xMax = width - ballSize;
        const yMax = height - ballSize;

        let x = xMax / 2;
        let y = yMax / 2;
        let pan = 0;

        switch (direction) {
          case "vertical":
            y = yMax / 2 + (yMax / 2) * Math.sin(progress * 2 * Math.PI);
            break;
          case "circular":
            x = xMax / 2 + (xMax / 2) * Math.cos(progress * 2 * Math.PI);
            y = yMax / 2 + (yMax / 2) * Math.sin(progress * 2 * Math.PI);
            pan = Math.cos(progress * 2 * Math.PI);
            break;
          case "figure-eight":
            x = xMax / 2 + (xMax / 2) * Math.sin(progress * 2 * Math.PI);
            y = yMax / 2 + (yMax / 2) * Math.sin(progress * 4 * Math.PI);
            pan = Math.sin(progress * 2 * Math.PI);
            break;
           case "infinity-loop":
            x = xMax / 2 + (xMax / 2) * Math.sin(progress * 2 * Math.PI);
            y = yMax / 2 + (yMax / 2) * Math.cos(progress * 2 * Math.PI) * Math.sin(progress * 2 * Math.PI);
            pan = Math.sin(progress * 2 * Math.PI);
            break;
          case "diagonal":
            const diagonalProgress = Math.sin(progress * 2 * Math.PI);
            x = xMax / 2 + (xMax / 2) * diagonalProgress;
            y = yMax / 2 + (yMax / 2) * diagonalProgress;
            pan = diagonalProgress;
            break;
          case "diagonal-reverse":
            const diagonalRevProgress = Math.sin(progress * 2 * Math.PI);
            x = xMax / 2 - (xMax / 2) * diagonalRevProgress;
            y = yMax / 2 + (yMax / 2) * diagonalRevProgress;
            pan = -diagonalRevProgress; // Invert pan for reverse
            break;
          case "horizontal":
          default:
            x = xMax / 2 + (xMax / 2) * Math.sin(progress * 2 * Math.PI);
            pan = Math.sin(progress * 2 * Math.PI);
            break;
        }
        
        if (ballRef.current) {
            ballRef.current.style.transform = `translate(${x}px, ${y}px)`;
        }
        
        if (pannerRef.current) {
          pannerRef.current.pan.value = pan;
        }

        if (synthRef.current) {
          const currentPanDirection = Math.sign(pan);
          if (Math.abs(pan) > 0.98 && currentPanDirection !== lastPanDirection.current && currentPanDirection !== 0) {
              if (synthRef.current instanceof Tone.MembraneSynth) {
                synthRef.current.triggerAttackRelease("C1", "8n");
              } else if (synthRef.current instanceof Tone.PluckSynth) {
                synthRef.current.triggerAttack("C4");
              } else if (synthRef.current instanceof Tone.Synth || synthRef.current instanceof Tone.MetalSynth || synthRef.current instanceof Tone.FMSynth) {
                synthRef.current.triggerAttackRelease("C4", "8n");
              }
              lastPanDirection.current = currentPanDirection;
          } else if (Math.abs(pan) < 0.1) {
              lastPanDirection.current = 0;
          }
        }

        animationFrameId.current = requestAnimationFrame(animate);
      };
      
      animationFrameId.current = requestAnimationFrame(animate);
    } else if (status === "stopping") {
        if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current);

        const stopDuration = 3000;
        const startOfStop = stopTimestamp.current!;
        const timeAtStop = startOfStop - startTimeRef.current;
        const initialVolume = synthRef.current?.volume.value ?? 0;
        
        const animateStop = (currentTime: number) => {
            const timeSinceStop = currentTime - startOfStop;
            const stopProgress = Math.min(timeSinceStop / stopDuration, 1);
            const easing = 1 - Math.pow(1 - stopProgress, 3); // easeOutCubic

            const deceleration = 1 - easing;
            const slowedElapsedTime = timeAtStop + (timeSinceStop * deceleration);

            let progress = (slowedElapsedTime % period) / period;
            
            if (!containerRef.current || !ballRef.current) {
                if (stopProgress < 1) animationFrameId.current = requestAnimationFrame(animateStop);
                else setStatus("done");
                return;
            }

            const { width, height } = containerRef.current.getBoundingClientRect();
            const ballSize = 50;
            const xMax = width - ballSize;
            const yMax = height - ballSize;

            let x = xMax / 2;
            let y = yMax / 2;

            switch (direction) {
              case "vertical":
                y = yMax / 2 + (yMax / 2) * Math.sin(progress * 2 * Math.PI);
                break;
              case "circular":
                x = xMax / 2 + (xMax / 2) * Math.cos(progress * 2 * Math.PI);
                y = yMax / 2 + (yMax / 2) * Math.sin(progress * 2 * Math.PI);
                break;
              case "figure-eight":
                x = xMax / 2 + (xMax / 2) * Math.sin(progress * 2 * Math.PI);
                y = yMax / 2 + (yMax / 2) * Math.sin(progress * 4 * Math.PI);
                break;
             case "infinity-loop":
                x = xMax / 2 + (xMax / 2) * Math.sin(progress * 2 * Math.PI);
                y = yMax / 2 + (yMax / 2) * Math.cos(progress * 2 * Math.PI) * Math.sin(progress * 2 * Math.PI);
                break;
              case "diagonal":
                const diagonalProgress = Math.sin(progress * 2 * Math.PI);
                x = xMax / 2 + (xMax / 2) * diagonalProgress;
                y = yMax / 2 + (yMax / 2) * diagonalProgress;
                break;
              case "diagonal-reverse":
                const diagonalRevProgress = Math.sin(progress * 2 * Math.PI);
                x = xMax / 2 - (xMax / 2) * diagonalRevProgress;
                y = yMax / 2 + (yMax / 2) * diagonalRevProgress;
                break;
              case "horizontal":
              default:
                x = xMax / 2 + (xMax / 2) * Math.sin(progress * 2 * Math.PI);
                break;
            }
            
            const ball = ballRef.current;
            if (ball) {
                ball.style.transform = `translate(${x}px, ${y}px)`;
                ball.style.opacity = `${1 - stopProgress}`;
            }

            if (synthRef.current?.volume) {
                synthRef.current.volume.value = initialVolume - (initialVolume + 40) * stopProgress;
            }
            
            if (stopProgress >= 1) {
                setStatus("done");
            } else {
                animationFrameId.current = requestAnimationFrame(animateStop);
            }
        };
        animationFrameId.current = requestAnimationFrame(animateStop);
    }
  }, [status, direction, sound, durationInSeconds, handleStop, period]);
  
  useEffect(() => {
    if (status === 'done') {
      const finishSession = async () => {
        cleanup();
        if (document.fullscreenElement) {
          await document.exitFullscreen().catch(err => console.error("Failed to exit fullscreen:", err));
        }
        router.push("/");
      };
      finishSession();
    }
  }, [status, cleanup, router]);


  const handleStartClick = async () => {
    try {
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }
      if (containerRef.current && document.fullscreenEnabled) {
          if (!document.fullscreenElement) {
            await containerRef.current.requestFullscreen();
          }
      }
      setStatus("countdown");
    } catch (err) {
      console.error("Could not start fullscreen session:", err);
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const safeHandleStop = () => {
    handleStop();
  }

  const ballClasses = cn(
    "absolute top-0 left-0 h-[50px] w-[50px] shadow-lg",
    {
      "bg-primary": color === "primary",
      "bg-accent": color === "accent",
    },
    {
      "rounded-full": shape === "circle",
      "rounded-md": shape === "square",
      "bg-transparent border-l-[25px] border-l-transparent border-r-[25px] border-r-transparent border-b-[50px]": shape === "triangle",
    }
  );

  const triangleColorClass = {
    primary: 'border-b-primary',
    accent: 'border-b-accent',
  }[color] || 'border-b-primary';

  return (
    <div
      ref={containerRef}
      className="h-screen w-screen bg-background flex items-center justify-center relative overflow-hidden"
    >
      {status === "ready" && (
        <div className="text-center p-4">
          <h1 className="text-4xl font-bold mb-8 font-headline">Ready to Begin?</h1>
          <Button onClick={handleStartClick} size="lg" className="text-xl px-12 py-8">
            Click to Start
          </Button>
          <p className="text-muted-foreground mt-4">This will start in fullscreen mode.</p>
        </div>
      )}

      {status === "countdown" && (
        <div className="text-9xl font-bold text-primary animate-ping-once" style={{animationIterationCount: 1}} key={countdown}>
          {countdown > 0 ? countdown : ''}
        </div>
      )}

      {(status === "running" || status === "stopping") && (
        <>
            <div
                ref={ballRef}
                data-id="ball"
                className={cn(ballClasses, {
                    [triangleColorClass]: shape === "triangle",
                    "bg-transparent": shape === "triangle"
                })}
                style={shape === 'triangle' ? {
                    width: 0,
                    height: 0,
                    backgroundColor: 'transparent'
                } : {}}
            ></div>
           {status === "running" && (<>
             <div className="absolute top-4 right-4 bg-black/20 text-white px-4 py-2 rounded-lg text-lg font-mono backdrop-blur-sm">
                {formatTime(timeRemaining)}
            </div>
            <Button onClick={safeHandleStop} variant="ghost" size="icon" className="absolute top-4 left-4 h-12 w-12 bg-black/20 hover:bg-black/40 text-white hover:text-white backdrop-blur-sm">
                <span className="sr-only">Stop Session</span>
                <X className="h-6 w-6" />
            </Button>
           </>)}
        </>
      )}
    </div>
  );
}
