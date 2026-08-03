import * as React from "react";
import { useForm, useWatch, Controller, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  createContentFormSchema,
  type CreateContentFormValues,
} from "@/features/content/schemas/content-schema";
import { useAiPrefill } from "@/features/ai/hooks/useAiPrefill";
import { useCreateContent } from "@/features/content/hooks/useCreateContent";
import {
  CONTENT_TYPES,
  type ContentType,
  type CreateContentRequest,
} from "@/features/content/types";
import { getErrorMessage, normalizeError } from "@/lib/error";

const TYPE_LABELS: Record<ContentType, string> = {
  tweet: "Tweet",
  video: "Video",
  document: "Document",
  link: "Link",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateContentDialog({ open, onOpenChange }: Props) {
  const create = useCreateContent();
  const prefill = useAiPrefill();
  const lastPrefilledUrl = React.useRef<string | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<CreateContentFormValues>({
    resolver: zodResolver(createContentFormSchema),
    defaultValues: {
      type: "link",
      title: "",
      description: "",
      url: "",
      tags: [],
    },
    mode: "onBlur",
  });

  const type = useWatch({
    control,
    name: "type",
  });

  const tags = useWatch({
    control,
    name: "tags",
  }) ?? [];
  const urlRequired = type === "link" || type === "video";

  const [tagDraft, setTagDraft] = React.useState<string>("");

  React.useEffect(() => {
    if (!open) {
      reset({ type: "link", title: "", description: "", url: "", tags: [] });
      setTagDraft("");
      lastPrefilledUrl.current = null;
      abortRef.current?.abort();
      prefill.reset();
      create.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const runPrefill = async (rawUrl: string, force = false) => {
    const url = rawUrl.trim();
    if (!url) return;

    try {
      new URL(url);
    } catch {
      return;
    }

    if (!force && lastPrefilledUrl.current === url) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const result = await prefill.mutateAsync({ url, signal: controller.signal });
      const current = getValues();

      if (!current.title?.trim() && result.title) {
        setValue("title", result.title, { shouldDirty: true, shouldValidate: true });
      }
      if (!current.description?.trim() && result.description) {
        setValue("description", result.description, { shouldDirty: true });
      }
      if ((current.tags ?? []).length === 0 && result.suggestedTags.length > 0) {
        setValue("tags", result.suggestedTags.slice(0, 10), { shouldDirty: true });
      }

      lastPrefilledUrl.current = url;
    } catch (err) {
      if (controller.signal.aborted) return;

      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 503) return;
      if (status === 429) {
        toast.error("Too many AI requests. Try again in a moment.");
        return;
      }
      toast.error("Couldn't auto-fill from URL");
    }
  };

  const addTag = (raw: string) => {
    const next = raw.trim().toLowerCase();
    if (!next) return;
    if (next.length > 30) {
      toast.error("Tags must be at most 30 characters");
      return;
    }
    if (tags.includes(next)) return;
    if (tags.length >= 10) {
      toast.error("You can add at most 10 tags");
      return;
    }
    setValue("tags", [...tags, next], { shouldDirty: true });
    setTagDraft("");
  };

  const removeTag = (t: string) => {
    setValue(
      "tags",
      tags.filter((x) => x !== t),
      { shouldDirty: true }
    );
  };

  const onSubmit = handleSubmit(async (values) => {
    const payload: CreateContentRequest = {
      type: values.type,
      title: values.title,
      description: values.description || undefined,
      url: values.url || undefined,
      tags: values.tags && values.tags.length > 0 ? values.tags : undefined,
    };

    try {
      await create.mutateAsync(payload);
      toast.success("Content saved");
      onOpenChange(false);
    } catch (err) {
      const norm = normalizeError(err);
      // Map known field errors back onto the form for inline display.
      if (norm.fieldErrors) {
        const known: Path<CreateContentFormValues>[] = [
          "title",
          "description",
          "url",
          "type",
          "tags",
        ];
        for (const [field, message] of Object.entries(norm.fieldErrors)) {
          const f = field as Path<CreateContentFormValues>;
          if (known.includes(f)) setError(f, { type: "server", message });
        }
      }
      toast.error(getErrorMessage(err));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="create-content-dialog"
        className="max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>Add to your second brain</DialogTitle>
          <DialogDescription>
            Save a tweet, video, link or document. URL is required for links and
            videos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="content-type">Type</Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => field.onChange(v as ContentType)}
                >
                  <SelectTrigger
                    id="content-type"
                    data-testid="create-content-type"
                    invalid={Boolean(errors.type)}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_TYPES.map((t) => (
                      <SelectItem
                        key={t}
                        value={t}
                        data-testid={`create-content-type-option-${t}`}
                      >
                        {TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="content-title">Title</Label>
            <Input
              id="content-title"
              placeholder="A short, memorable title"
              {...register("title")}
              invalid={Boolean(errors.title)}
              data-testid="create-content-title"
              maxLength={200}
              autoFocus
            />
            {errors.title ? (
              <p className="text-xs text-danger" data-testid="create-content-title-error">
                {errors.title.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="content-url">
                URL{urlRequired ? " (required)" : " (optional)"}
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                disabled={prefill.isPending || !getValues("url")?.trim()}
                onClick={() => {
                  lastPrefilledUrl.current = null;
                  void runPrefill(getValues("url") ?? "", true);
                }}
                data-testid="create-content-autofill"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Auto-fill
              </Button>
            </div>
            <Input
              id="content-url"
              type="url"
              placeholder="https://…"
              {...register("url", {
                onBlur: (e) => {
                  void runPrefill(e.target.value);
                },
              })}
              invalid={Boolean(errors.url)}
              data-testid="create-content-url"
            />
            {prefill.isPending ? (
              <p className="inline-flex items-center gap-1.5 text-xs text-muted-fg">
                <Loader2 className="h-3 w-3 animate-spin" />
                Suggesting title and tags…
              </p>
            ) : null}
            {errors.url ? (
              <p className="text-xs text-danger" data-testid="create-content-url-error">
                {errors.url.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="content-description">Description</Label>
            <Textarea
              id="content-description"
              placeholder="Why does this matter to you?"
              {...register("description")}
              invalid={Boolean(errors.description)}
              data-testid="create-content-description"
              maxLength={2000}
            />
            {errors.description ? (
              <p className="text-xs text-danger">{errors.description.message}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-bg-elev px-2 py-2 min-h-10">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] text-accent"
                  data-testid={`create-tag-chip-${t}`}
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => removeTag(t)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-accent/20"
                    aria-label={`Remove tag ${t}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag(tagDraft);
                  } else if (e.key === "Backspace" && !tagDraft && tags.length) {
                    const last = tags[tags.length - 1];
                    if (last) removeTag(last);
                  }
                }}
                onBlur={() => {
                  if (tagDraft.trim()) addTag(tagDraft);
                }}
                placeholder={tags.length === 0 ? "Press Enter to add (max 10)…" : ""}
                className="flex-1 min-w-[8ch] bg-transparent text-sm text-fg placeholder:text-muted-fg/70 outline-none"
                data-testid="create-tag-input"
              />
            </div>
            <p className="text-[11px] text-muted-fg">
              Lowercased and de-duplicated automatically. Max 10 tags, 30 chars
              each.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              data-testid="create-content-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting || create.isPending}
              data-testid="create-content-submit"
            >
              <Plus className="h-4 w-4" />
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
