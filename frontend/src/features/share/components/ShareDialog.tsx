import * as React from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

import { useCreateShare } from "@/features/share/hooks/useCreateShare";

import {useDisableShare} from "@/features/share/hooks/useDisableShare"

import { getErrorMessage } from "@/lib/error";

type Share = {
  shareId: string;
  isActive: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ShareDialog({ open, onOpenChange }: Props) {
  const [share, setShare] = React.useState<Share | null>(null);
  const [copied, setCopied] = React.useState(false);

  const create = useCreateShare();
  const disable = useDisableShare();

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);

    if (!nextOpen) {
      setShare(null);
      setCopied(false);

      create.reset();
      disable.reset();
    }
  };

  React.useEffect(() => {
  if (!open) return;

  let mounted = true;

  const createShare = async () => {
    try {
      const result = await create.mutateAsync();

      if (mounted) {
        setShare(result);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  createShare();

  return () => {
    mounted = false;
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [open]);

  const shareUrl = share
    ? `${window.location.origin}/share/${share.shareId}`
    : "";

  const isActive = share?.isActive ?? false;

  const handleCopy = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);

      setCopied(true);

      toast.success("Link copied");

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      toast.error(
        "Couldn't copy. Long-press the link to copy manually."
      );
    }
  };

  const handleDisable = async () => {
    if (!share) return;

    try {
      await disable.mutateAsync(share.shareId);

      setShare({
        ...share,
        isActive: false,
      });

      toast.success("Public link disabled");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Second Brain</DialogTitle>

          <DialogDescription>
            Create a public link and share your content with others.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-bg-elev-1 p-3">
            <p className="mb-2 text-xs text-muted-fg">
              Public share link
            </p>

            <div className="flex items-center gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 truncate rounded-md border border-border bg-bg px-3 py-2 text-sm outline-none"
              />

              <Button
                variant="secondary"
                onClick={handleCopy}
                disabled={!isActive}
                aria-label="Copy link"
              >
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          {isActive ? (
            <Button
              variant="ghost"
              onClick={handleDisable}
              isLoading={disable.isPending}
            >
              Disable Link
            </Button>
          ) : (
            <Button disabled variant="ghost">
              Link Disabled
            </Button>
          )}

          <Button onClick={() => handleOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}