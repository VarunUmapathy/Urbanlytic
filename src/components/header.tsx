import { UrbanPulseLogo } from "@/components/icons";

export function Header({ title }: { title: string }) {
  return (
    <header className="absolute top-0 left-0 right-0 z-20 p-4 h-16 bg-background/80 backdrop-blur-sm border-b border-border/50">
      <div className="flex items-center gap-2">
        <UrbanPulseLogo className="w-8 h-8 text-primary" />
        <h1 className="text-xl font-bold font-headline text-foreground">
          {title}
        </h1>
      </div>
    </header>
  );
}
