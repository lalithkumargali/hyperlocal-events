import { MapPin } from 'lucide-react';

export default function Home(): JSX.Element {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <MapPin className="h-12 w-12 text-primary" />
          <h1 className="text-4xl font-bold">Hyperlocal Events</h1>
        </div>
        <p className="text-xl text-muted-foreground text-center">
          Discover amazing events happening near you
        </p>
        <div className="text-sm text-muted-foreground">
          MCP-powered event discovery platform
        </div>
      </div>
    </main>
  );
}
