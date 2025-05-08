import { Skeleton } from "@/components/ui/skeleton";
import { LayoutGrid } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-primary flex items-center">
          <LayoutGrid size={36} className="mr-3 text-accent" /> Organize Now
        </h1>
        <p className="text-muted-foreground">Your personal Trello-style planner.</p>
      </header>

      <div className="mb-8 p-4 bg-card shadow-md rounded-lg">
        <Skeleton className="h-8 w-1/4 mb-3" />
        <div className="flex flex-col sm:flex-row gap-2">
          <Skeleton className="h-10 flex-grow" />
          <Skeleton className="h-10 w-full sm:w-28" />
        </div>
      </div>

      <div className="flex overflow-x-auto space-x-4 pb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-[300px] flex-shrink-0">
            <Skeleton className="h-full rounded-lg">
              <div className="p-3 bg-secondary-foreground/10 rounded-t-lg">
                <Skeleton className="h-7 w-3/4" />
              </div>
              <div className="p-3 space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
              <div className="p-3 border-t border-border">
                <Skeleton className="h-10 w-full" />
              </div>
            </Skeleton>
          </div>
        ))}
      </div>
    </div>
  );
}
