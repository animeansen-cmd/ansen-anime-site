import { MessageSquare } from "lucide-react";

interface ChatPanelSkeletonProps {
  title: string;
}

export default function ChatPanelSkeleton({ title }: ChatPanelSkeletonProps) {
  return (
    <div className="glass flex h-[420px] w-full flex-col overflow-hidden rounded-3xl border border-border bg-card/40 shadow-2xl sm:h-[500px]">
      <div className="flex items-center gap-2 border-b border-border/50 bg-background/50 px-5 py-4">
        <MessageSquare size={18} className="text-primary" />
        <h3 className="font-heading text-lg font-bold">{title}</h3>
        <div className="ml-auto h-6 w-10 rounded-full skeleton-loading" />
      </div>

      <div className="grid min-h-0 flex-1 gap-4 p-4 sm:p-5">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex gap-3">
            <div className="h-8 w-8 rounded-full skeleton-loading" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 rounded skeleton-loading" />
              <div className="h-4 w-full rounded skeleton-loading" />
              <div className="h-4 w-4/5 rounded skeleton-loading" />
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-border/50 bg-background/50 p-3 sm:p-4">
        <div className="h-20 rounded-2xl skeleton-loading" />
      </div>
    </div>
  );
}
