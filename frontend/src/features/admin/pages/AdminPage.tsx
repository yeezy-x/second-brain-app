import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, Trash2, Ban } from "lucide-react";
import { toast } from "sonner";

import { adminApi } from "@/features/admin/api/admin-api";
import type { AdminUser } from "@/features/admin/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FullPageLoader } from "@/components/states/FullPageLoader";
import { ErrorState } from "@/components/states/ErrorState";
import { getErrorMessage } from "@/lib/error";
import { queryKeys } from "@/lib/query-keys";

export default function AdminPage() {
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(
    null
  );
  const [shareIdInput, setShareIdInput] = React.useState("");
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: queryKeys.admin.users(),
    queryFn: () => adminApi.listUsers(),
  });

  const contentQuery = useQuery({
    queryKey: queryKeys.admin.userContent(selectedUserId ?? ""),
    queryFn: () => adminApi.getUserContent(selectedUserId!),
    enabled: Boolean(selectedUserId),
  });

  const deleteContent = useMutation({
    mutationFn: (id: string) => adminApi.deleteContent(id),
    onSuccess: () => {
      toast.success("Content deleted");
      if (selectedUserId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.admin.userContent(selectedUserId),
        });
      }
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const disableShare = useMutation({
    mutationFn: (shareId: string) => adminApi.disableShare(shareId),
    onSuccess: () => {
      toast.success("Share disabled");
      setShareIdInput("");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (usersQuery.isLoading) return <FullPageLoader />;
  if (usersQuery.isError) {
    return (
      <ErrorState
        title="Failed to load users"
        error={usersQuery.error}
        onRetry={() => usersQuery.refetch()}
      />
    );
  }

  const users = usersQuery.data ?? [];
  const selected = users.find((u) => u.id === selectedUserId) ?? null;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-fg">Admin</h1>
          <p className="text-sm text-muted-fg">
            Manage users, content, and shares across the app.
          </p>
        </div>
      </div>

      <section className="grid gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-fg">
          Users
        </h2>
        <div className="divide-y divide-border border border-border">
          {users.length === 0 ? (
            <p className="p-4 text-sm text-muted-fg">No users found.</p>
          ) : (
            users.map((user: AdminUser) => (
              <button
                key={user.id}
                type="button"
                onClick={() => setSelectedUserId(user.id)}
                className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-bg-elev-2/60 ${
                  selectedUserId === user.id ? "bg-bg-elev-2" : ""
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-fg">
                    {user.email}
                  </p>
                  <p className="text-xs text-muted-fg">{user.id}</p>
                </div>
                <span className="shrink-0 text-xs uppercase tracking-wide text-muted-fg">
                  {user.role}
                </span>
              </button>
            ))
          )}
        </div>
      </section>

      {selected ? (
        <section className="grid gap-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-fg">
            Content for {selected.email}
          </h2>
          {contentQuery.isLoading ? (
            <p className="text-sm text-muted-fg">Loading content…</p>
          ) : contentQuery.isError ? (
            <p className="text-sm text-danger">
              {getErrorMessage(contentQuery.error)}
            </p>
          ) : (contentQuery.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-fg">No content for this user.</p>
          ) : (
            <ul className="divide-y divide-border border border-border">
              {contentQuery.data!.map((item) => (
                <li
                  key={item._id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-fg">
                      {item.title || item.url || item._id}
                    </p>
                    <p className="text-xs text-muted-fg">{item.type}</p>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => deleteContent.mutate(item._id)}
                    isLoading={
                      deleteContent.isPending &&
                      deleteContent.variables === item._id
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <section className="grid gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-fg">
          Disable share by ID
        </h2>
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const id = shareIdInput.trim();
            if (!id) return;
            disableShare.mutate(id);
          }}
        >
          <Input
            value={shareIdInput}
            onChange={(e) => setShareIdInput(e.target.value)}
            placeholder="Share ID (nanoid)"
            className="max-w-xs"
            aria-label="Share ID"
          />
          <Button
            type="submit"
            variant="secondary"
            isLoading={disableShare.isPending}
            disabled={!shareIdInput.trim()}
          >
            <Ban className="h-4 w-4" />
            Disable
          </Button>
        </form>
      </section>
    </div>
  );
}
