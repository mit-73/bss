import { SettingsForm } from "@/components/SettingsForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Waves } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <div className="container mx-auto px-16">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Waves className="h-8 w-8" />
            </div>
            <CardTitle className="font-headline text-3xl">Bilateral Stimulation Station</CardTitle>
            <CardDescription className="pt-2">Configure your session to begin a journey of focus and tranquility.</CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
