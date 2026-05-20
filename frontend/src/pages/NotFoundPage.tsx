import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="max-w-md text-center animate-fade-in">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-fg">
          404 · Not found
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-fg">
          That page slipped out of memory.
        </h1>
        <p className="mt-3 text-sm text-muted-fg">
          The link you followed might be broken, or the page may have moved.
        </p>
        <Button asChild className="mt-6" data-testid="notfound-home-btn">
          <Link to="/">Take me home</Link>
        </Button>
      </div>
    </div>
  );
}
