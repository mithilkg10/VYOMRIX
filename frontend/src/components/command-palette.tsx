"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Search, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { searchApi } from "@/lib/api/search";
import { useDebounce } from "@/lib/hooks/use-debounce";

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const debouncedQuery = useDebounce(query, 300);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: ({ signal }) => searchApi.globalSearch(debouncedQuery, 10, signal),
    enabled: debouncedQuery.length > 1,
  });

  const handleSelect = (url: string) => {
    setOpen(false);
    router.push(url);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 border-border overflow-hidden rounded-xl shadow-2xl sm:max-w-[600px] bg-surface-elevated">
        <DialogTitle className="sr-only">Command Palette</DialogTitle>
        <div className="flex items-center border-b px-4 py-3">
          <Search className="mr-2 h-5 w-5 text-muted-foreground shrink-0" />
          <input
            className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground text-foreground"
            placeholder="Search incidents, assets, rules, or users..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
          <div className="ml-2 flex items-center gap-1">
            <kbd className="bg-surface-sunken text-muted-foreground px-1.5 py-0.5 rounded text-xs border">ESC</kbd>
          </div>
        </div>

        <div className="max-h-[300px] overflow-y-auto p-2">
          {debouncedQuery.length === 0 && (
            <div className="py-2">
              <div className="px-4 text-xs font-semibold text-muted-foreground mb-2">Navigation</div>
              {[
                { title: "Dashboard", url: "/dashboard", type: "route" },
                { title: "Incidents", url: "/incidents", type: "route" },
                { title: "Assets", url: "/assets", type: "route" },
                { title: "Settings", url: "/settings", type: "route" },
              ].map((route) => (
                <button
                  key={route.url}
                  onClick={() => handleSelect(route.url)}
                  className="w-full text-left px-4 py-2 hover:bg-surface-sunken rounded-md transition-colors flex items-center justify-between group"
                >
                  <span className="font-medium text-foreground text-sm">{route.title}</span>
                  <span className="text-xs px-2 py-0.5 bg-surface-base rounded-md border text-muted-foreground capitalize group-hover:border-primary/50 transition-colors">
                    {route.type}
                  </span>
                </button>
              ))}
            </div>
          )}
          
          {data?.results.length === 0 && !isLoading && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No results found for "{debouncedQuery}"
            </div>
          )}

          {data?.results.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => handleSelect(result.url)}
              className="w-full text-left px-4 py-3 hover:bg-surface-sunken rounded-md transition-colors flex items-center justify-between group"
            >
              <div className="flex flex-col">
                <span className="font-medium text-foreground">{result.title}</span>
                {result.subtitle && <span className="text-xs text-muted-foreground mt-0.5">{result.subtitle}</span>}
              </div>
              <span className="text-xs px-2 py-1 bg-surface-base rounded-md border text-muted-foreground capitalize group-hover:border-primary/50 transition-colors">
                {result.type}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
