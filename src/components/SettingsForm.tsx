"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Circle, Infinity, MoveHorizontal, MoveVertical, Music2, Scan, Waves, Shuffle, Speaker, AppWindow, Square, Triangle, MoveDiagonal } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Label } from "./ui/label";

const formSchema = z.object({
  duration: z.number().min(30).max(120),
  period: z.number().min(2).max(8),
  direction: z.enum(["random", "horizontal", "vertical", "circular", "figure-eight", "infinity-loop", "diagonal", "diagonal-reverse"]),
  sound: z.enum(["random", "ting", "beep", "heartbeat", "woodblock", "tonal"]),
  color: z.enum(["primary", "accent"]),
  shape: z.enum(["circle", "square", "triangle"]),
});

type FormValues = z.infer<typeof formSchema>;

const directionOptions = [
  { value: "random", label: "Random", icon: Shuffle },
  { value: "horizontal", label: "Horizontal", icon: MoveHorizontal },
  { value: "vertical", label: "Vertical", icon: MoveVertical },
  { value: "circular", label: "Circular", icon: Circle },
  { value: "figure-eight", label: "Figure-Eight", icon: Infinity },
  { value: "infinity-loop", label: "Infinity", icon: Infinity },
  { value: "diagonal", label: "Diagonal", icon: MoveDiagonal },
  { value: "diagonal-reverse", label: "Diagonal Rev.", icon: MoveDiagonal },
];

const soundOptions = [
  { value: "random", label: "Random", icon: Shuffle },
  { value: "ting", label: "Ting", icon: Scan },
  { value: "beep", label: "Beep", icon: Waves },
  { value: "heartbeat", label: "Heartbeat", icon: Music2 },
  { value: "woodblock", label: "Woodblock", icon: AppWindow },
  { value: "tonal", label: "Tonal", icon: Speaker },
];

const colorOptions = [
    { value: "primary", label: "Primary", className: "bg-primary" },
    { value: "accent", label: "Accent", className: "bg-accent" },
];

const shapeOptions = [
    { value: "circle", label: "Circle", icon: Circle },
    { value: "square", label: "Square", icon: Square },
    { value: "triangle", label: "Triangle", icon: Triangle },
];


const SETTINGS_KEY = 'bilateral-stimulation-settings';

const defaultValues: FormValues = {
  duration: 45,
  period: 4,
  direction: "horizontal",
  sound: "ting",
  color: "primary",
  shape: "circle",
};

export function SettingsForm() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
  });

  useEffect(() => {
    setIsClient(true);
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        const result = formSchema.safeParse(parsed);
        if (result.success) {
          form.reset(result.data);
        }
      } catch (e) {
        // Ignore parsing errors and use defaults
      }
    }
  }, [form]);
  
  const watchedValues = form.watch();

  useEffect(() => {
    if (isClient) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(watchedValues));
    }
  }, [watchedValues, isClient]);

  const watchDirection = form.watch("direction");
  const watchSound = form.watch("sound");
  const watchColor = form.watch("color");
  const watchShape = form.watch("shape");


  function onSubmit(values: FormValues) {
    let direction = values.direction;
    if (direction === 'random') {
      const availableDirections = directionOptions.map(d => d.value).filter(d => d !== 'random');
      direction = availableDirections[Math.floor(Math.random() * availableDirections.length)];
    }

    let sound = values.sound;
    if (sound === 'random') {
        const availableSounds = soundOptions.map(s => s.value).filter(s => s !== 'random');
        sound = availableSounds[Math.floor(Math.random() * availableSounds.length)];
    }

    const params = new URLSearchParams({
      duration: String(values.duration),
      period: String(values.period),
      direction,
      sound,
      color: values.color,
      shape: values.shape,
    });
    router.push(`/session?${params.toString()}`);
  }

  if (!isClient) {
    // Render a placeholder or null on the server and initial client render
    return null; // Or a loading skeleton
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <div className="mb-4 flex justify-between items-baseline">
                    <FormLabel>Session Duration</FormLabel>
                    <span className="text-sm font-medium text-primary">{field.value} sec</span>
                  </div>
                  <FormControl>
                    <Slider
                      min={30}
                      max={120}
                      step={5}
                      value={[field.value]}
                      onValueChange={(vals) => field.onChange(vals[0])}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="period"
              render={({ field }) => (
                <FormItem>
                  <div className="mb-4 flex justify-between items-baseline">
                    <FormLabel>Movement Speed</FormLabel>
                    <span className="text-sm font-medium text-primary">{field.value} sec/cycle</span>
                  </div>
                  <FormControl>
                    <Slider
                      min={2}
                      max={8}
                      step={0.5}
                      value={[field.value]}
                      onValueChange={(vals) => field.onChange(vals[0])}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField
                control={form.control}
                name="direction"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                    <FormLabel>Stimulus Direction</FormLabel>
                    <FormControl>
                        <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
                        >
                        {directionOptions.map((option) => (
                            <FormItem key={option.value} className="flex-1">
                            <FormControl>
                                <RadioGroupItem value={option.value} className="sr-only" id={option.value} />
                            </FormControl>
                            <Label
                                htmlFor={option.value}
                                data-state={watchDirection === option.value ? 'checked' : 'unchecked'}
                                className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground data-[state=checked]:border-primary [&:has(:checked)]:border-primary cursor-pointer transition-colors"
                            >
                                <option.icon className="mb-3 h-6 w-6" />
                                {option.label}
                            </Label>
                            </FormItem>
                        ))}
                        </RadioGroup>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

            <FormField
                control={form.control}
                name="sound"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                    <FormLabel>Sound Type</FormLabel>
                    <FormControl>
                        <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-3 gap-4"
                        >
                        {soundOptions.map((option) => (
                            <FormItem key={option.value} className="flex-1">
                            <FormControl>
                                <RadioGroupItem value={option.value} className="sr-only" id={`sound-${option.value}`} />
                            </FormControl>
                            <Label
                                htmlFor={`sound-${option.value}`}
                                data-state={watchSound === option.value ? 'checked' : 'unchecked'}
                                className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground data-[state=checked]:border-primary [&:has(:checked)]:border-primary cursor-pointer transition-colors text-sm h-full"
                            >
                                <option.icon className="mb-3 h-5 w-5" />
                                {option.label}
                            </Label>
                            </FormItem>
                        ))}
                        </RadioGroup>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                    <FormLabel>Stimulus Color</FormLabel>
                    <FormControl>
                        <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-3 gap-4"
                        >
                        {colorOptions.map((option) => (
                            <FormItem key={option.value} className="flex-1">
                            <FormControl>
                                <RadioGroupItem value={option.value} className="sr-only" id={`color-${option.value}`} />
                            </FormControl>
                            <Label
                                htmlFor={`color-${option.value}`}
                                data-state={watchColor === option.value ? 'checked' : 'unchecked'}
                                className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground data-[state=checked]:border-primary [&:has(:checked)]:border-primary cursor-pointer transition-colors"
                            >
                                <div className={`h-6 w-6 rounded-full mb-3 ${option.className} border`}></div>
                                {option.label}
                            </Label>
                            </FormItem>
                        ))}
                        </RadioGroup>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="shape"
                render={({ field }) => (
                    <FormItem className="space-y-3">
                    <FormLabel>Stimulus Shape</FormLabel>
                    <FormControl>
                        <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-3 gap-4"
                        >
                        {shapeOptions.map((option) => (
                            <FormItem key={option.value} className="flex-1">
                            <FormControl>
                                <RadioGroupItem value={option.value} className="sr-only" id={`shape-${option.value}`} />
                            </FormControl>
                            <Label
                                htmlFor={`shape-${option.value}`}
                                data-state={watchShape === option.value ? 'checked' : 'unchecked'}
                                className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground data-[state=checked]:border-primary [&:has(:checked)]:border-primary cursor-pointer transition-colors"
                            >
                                <option.icon className="mb-3 h-6 w-6" />
                                {option.label}
                            </Label>
                            </FormItem>
                        ))}
                        </RadioGroup>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        
        <Button type="submit" className="w-full text-lg" size="lg">
          Start Session
        </Button>
      </form>
    </Form>
  );
}
