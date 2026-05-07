import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Loader2, LogOut, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  confirmAndDelete,
  fetchAffiliateLinks,
  fetchDepartments,
  fetchFallbackUrl,
  fetchKeywords,
  fetchSeoCategories,
  fetchTiers,
  runMutation,
  upsertFallbackUrl,
} from "@/lib/admin-api";
import { useResource } from "@/hooks/useResource";
import type { AffiliateLink, Department, Keyword, SeoCategory, Tier, TierTable } from "@/lib/types";

import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

/* ============================================================
   Page shell
   ============================================================ */

function AdminPage() {
  const { session, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/login" });
  }, [loading, session, navigate]);

  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) return null;
  if (!isAdmin) return <AccessDenied session={session} />;

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader session={session} onSignOut={() => navigate({ to: "/login" })} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <AdminTabs />
      </main>
    </div>
  );
}

const AccessDenied = ({ session }: { session: Session }) => (
  <div className="min-h-screen flex items-center justify-center px-4">
    <div className="text-center max-w-md">
      <h1 className="text-2xl font-bold">Access denied</h1>
      <p className="mt-2 text-muted-foreground">
        You're signed in as {session.user.email} but don't have admin access. Ask the project
        owner to grant you the <code className="bg-muted px-1.5 py-0.5 rounded">admin</code> role.
      </p>
      <p className="mt-3 text-xs text-muted-foreground break-all">User ID: {session.user.id}</p>
      <div className="mt-6 flex gap-2 justify-center">
        <Button variant="outline" onClick={() => supabase.auth.signOut()}>Sign out</Button>
        <Link to="/"><Button variant="ghost">Home</Button></Link>
      </div>
    </div>
  </div>
);

const AdminHeader = ({ session, onSignOut }: { session: Session; onSignOut: () => void }) => (
  <header className="border-b bg-card">
    <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold">Admin Dashboard</h1>
        <p className="text-xs text-muted-foreground">{session.user.email}</p>
      </div>
      <div className="flex items-center gap-2">
        <Link to="/"><Button variant="ghost" size="sm">View site</Button></Link>
        <ThemeToggle />
        <Button
          variant="outline"
          size="sm"
          onClick={() => supabase.auth.signOut().then(onSignOut)}
        >
          <LogOut className="h-4 w-4 mr-1.5" /> Sign out
        </Button>
      </div>
    </div>
  </header>
);

const AdminTabs = () => (
  <Tabs defaultValue="links">
    <TabsList>
      <TabsTrigger value="links">Affiliate Links</TabsTrigger>
      <TabsTrigger value="departments">Departments</TabsTrigger>
      <TabsTrigger value="keywords">Keywords</TabsTrigger>
      <TabsTrigger value="seo">SEO Pages</TabsTrigger>
      <TabsTrigger value="settings">Settings</TabsTrigger>
    </TabsList>
    <TabsContent value="links" className="mt-6"><LinksTab /></TabsContent>
    <TabsContent value="departments" className="mt-6"><DepartmentsTab /></TabsContent>
    <TabsContent value="keywords" className="mt-6"><KeywordsTab /></TabsContent>
    <TabsContent value="seo" className="mt-6"><SeoTab /></TabsContent>
    <TabsContent value="settings" className="mt-6"><SettingsTab /></TabsContent>
  </Tabs>
);

/* ============================================================
   Shared row primitives
   ============================================================ */

const RowActions = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) => (
  <>
    <Button variant="ghost" size="icon" onClick={onEdit}><Pencil className="h-4 w-4" /></Button>
    <Button variant="ghost" size="icon" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
  </>
);

const EmptyRow = ({ colSpan, label }: { colSpan: number; label: string }) => (
  <TableRow>
    <TableCell colSpan={colSpan} className="text-center text-muted-foreground py-8">
      {label}
    </TableCell>
  </TableRow>
);

type SortInputProps = { value: number; onCommit: (v: number) => void };
const SortInput = ({ value, onCommit }: SortInputProps) => (
  <Input
    type="number"
    className="h-8 w-20"
    defaultValue={value}
    onBlur={(e) => {
      const v = Number(e.target.value);
      if (v !== value) onCommit(v);
    }}
  />
);

type UrlCellInputProps = { value: string; onCommit: (v: string) => void; placeholder?: string };
const UrlCellInput = ({ value, onCommit, placeholder }: UrlCellInputProps) => (
  <Input
    placeholder={placeholder}
    className="h-8"
    defaultValue={value}
    onBlur={(e) => {
      const v = e.target.value.trim();
      if (v !== value) onCommit(v);
    }}
  />
);

const ExternalLink = ({ href }: { href: string }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="hover:underline">
    {href}
  </a>
);

/* ============================================================
   Departments tab
   ============================================================ */

function DepartmentsTab() {
  const { items, reload } = useResource<Department[]>(fetchDepartments, []);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<Department | null>(null);
  const [editForm, setEditForm] = useState({ name: "", sort_order: 0, url: "" });

  const add = async () => {
    if (!name.trim()) return;
    const nextSort = items.length ? Math.max(...items.map((i) => i.sort_order)) + 1 : 0;
    const { ok } = await runMutation(
      supabase.from("departments").insert({ name: name.trim(), sort_order: nextSort }),
      { successMsg: "Added" },
    );
    if (ok) {
      setName("");
      reload();
    }
  };

  const save = async () => {
    if (!editing) return;
    const { ok } = await runMutation(
      supabase
        .from("departments")
        .update({
          name: editForm.name.trim(),
          sort_order: editForm.sort_order,
          default_affiliate_url: editForm.url.trim() || null,
        })
        .eq("id", editing.id),
      { successMsg: "Saved" },
    );
    if (ok) {
      setEditing(null);
      reload();
    }
  };

  const updateSort = async (id: string, sort_order: number) => {
    const { ok } = await runMutation(
      supabase.from("departments").update({ sort_order }).eq("id", id),
    );
    if (ok) reload();
  };

  const updateDefaultUrl = async (id: string, url: string) => {
    const { ok } = await runMutation(
      supabase.from("departments").update({ default_affiliate_url: url || null }).eq("id", id),
      { successMsg: "Saved" },
    );
    if (ok) reload();
  };

  const del = async (id: string) => {
    const ok = await confirmAndDelete(
      "departments",
      id,
      "Delete this department? Linked affiliate URLs will also be removed.",
    );
    if (ok) reload();
  };

  const startEdit = (d: Department) => {
    setEditing(d);
    setEditForm({
      name: d.name,
      sort_order: d.sort_order,
      url: d.default_affiliate_url ?? "",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="New department name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <Button onClick={add}><Plus className="h-4 w-4 mr-1" /> Add</Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Set a Default Affiliate Link per department — used as a fallback when no specific link
        matches the user's filters.
      </p>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-24">Order</TableHead>
              <TableHead>Default Affiliate Link</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell>
                  <SortInput value={d.sort_order} onCommit={(v) => updateSort(d.id, v)} />
                </TableCell>
                <TableCell>
                  <UrlCellInput
                    value={d.default_affiliate_url ?? ""}
                    placeholder="https://amazon.com/..."
                    onCommit={(v) => updateDefaultUrl(d.id, v)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <RowActions onEdit={() => startEdit(d)} onDelete={() => del(d.id)} />
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && <EmptyRow colSpan={4} label="No departments yet" />}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit department</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <SeoField label="Name">
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </SeoField>
            <SeoField label="Order">
              <Input
                type="number"
                value={editForm.sort_order}
                onChange={(e) => setEditForm({ ...editForm, sort_order: Number(e.target.value) })}
              />
            </SeoField>
            <Field
              label="Default Affiliate Link"
              hint="Used when a user's filter combination has no specific affiliate link."
            >
              <Input
                placeholder="https://amazon.com/..."
                value={editForm.url}
                onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
              />
            </SeoField>
          </div>
          <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const Field = ({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) => (
  <div className="space-y-1.5">
    <Label>{label}</Label>
    {children}
    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
  </div>
);

/* ============================================================
   Affiliate links tab
   ============================================================ */

type LinkForm = {
  dept_id: string;
  discount_range: string;
  price_range: string;
  review_range: string;
  affiliate_url: string;
};

const EMPTY_LINK_FORM: LinkForm = {
  dept_id: "",
  discount_range: "",
  price_range: "",
  review_range: "",
  affiliate_url: "",
};

function LinksTab() {
  const [items, setItems] = useState<AffiliateLink[]>([]);
  const [depts, setDepts] = useState<Department[]>([]);
  const [discounts, setDiscounts] = useState<Tier[]>([]);
  const [prices, setPrices] = useState<Tier[]>([]);
  const [reviews, setReviews] = useState<Tier[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AffiliateLink | null>(null);
  const [form, setForm] = useState<LinkForm>(EMPTY_LINK_FORM);

  const load = useCallback(async () => {
    const [links, departments, d, p, r] = await Promise.all([
      fetchAffiliateLinks(),
      fetchDepartments(),
      fetchTiers("discount_tiers"),
      fetchTiers("price_tiers"),
      fetchTiers("review_tiers"),
    ]);
    setItems(links);
    setDepts(departments);
    setDiscounts(d);
    setPrices(p);
    setReviews(r);
  }, []);

  useEffect(() => { load(); }, [load]);

  const deptMap = useMemo(() => new Map(depts.map((d) => [d.id, d.name])), [depts]);
  const tierMaps = useMemo(
    () => ({
      discount: new Map(discounts.map((t) => [t.value, t.label])),
      price: new Map(prices.map((t) => [t.value, t.label])),
      review: new Map(reviews.map((t) => [t.value, t.label])),
    }),
    [discounts, prices, reviews],
  );

  const deptName = (id: string | null) => (id ? deptMap.get(id) ?? "—" : "Any");

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_LINK_FORM);
    setOpen(true);
  };

  const openEdit = (l: AffiliateLink) => {
    setEditing(l);
    setForm({
      dept_id: l.dept_id ?? "any",
      discount_range: l.discount_range,
      price_range: l.price_range,
      review_range: l.review_range ?? "any",
      affiliate_url: l.affiliate_url,
    });
    setOpen(true);
  };

  const save = async () => {
    if (
      !form.dept_id ||
      !form.discount_range ||
      !form.price_range ||
      !form.review_range ||
      !form.affiliate_url
    ) {
      toast.error("Fill all fields");
      return;
    }
    const payload = { ...form, dept_id: form.dept_id === "any" ? null : form.dept_id };
    const op = editing
      ? supabase.from("affiliate_links").update(payload).eq("id", editing.id)
      : supabase.from("affiliate_links").insert(payload);
    const { ok } = await runMutation(op, { successMsg: "Saved" });
    if (ok) {
      setOpen(false);
      load();
    }
  };

  const del = async (id: string) => {
    if (await confirmAndDelete("affiliate_links", id, "Delete this link?")) load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> New link</Button>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Department</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Reviews</TableHead>
              <TableHead>URL</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="font-medium">{deptName(l.dept_id)}</TableCell>
                <TableCell>{tierMaps.discount.get(l.discount_range) ?? l.discount_range}</TableCell>
                <TableCell>{tierMaps.price.get(l.price_range) ?? l.price_range}</TableCell>
                <TableCell>{tierMaps.review.get(l.review_range) ?? l.review_range}</TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">
                  <ExternalLink href={l.affiliate_url} />
                </TableCell>
                <TableCell className="text-right">
                  <RowActions onEdit={() => openEdit(l)} onDelete={() => del(l.id)} />
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && <EmptyRow colSpan={6} label="No affiliate links yet" />}
          </TableBody>
        </Table>
      </div>

      <LinkFormDialog
        open={open}
        editing={editing}
        form={form}
        depts={depts}
        discounts={discounts}
        prices={prices}
        reviews={reviews}
        onChange={setForm}
        onOpenChange={setOpen}
        onSave={save}
      />
    </div>
  );
}

type LinkFormDialogProps = {
  open: boolean;
  editing: AffiliateLink | null;
  form: LinkForm;
  depts: Department[];
  discounts: Tier[];
  prices: Tier[];
  reviews: Tier[];
  onChange: (f: LinkForm) => void;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
};

const LinkFormDialog = ({
  open,
  editing,
  form,
  depts,
  discounts,
  prices,
  reviews,
  onChange,
  onOpenChange,
  onSave,
}: LinkFormDialogProps) => {
  const patch = (p: Partial<LinkForm>) => onChange({ ...form, ...p });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit" : "New"} affiliate link</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <SeoField label="Department">
            <Select value={form.dept_id} onValueChange={(v) => patch({ dept_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {depts.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </SeoField>
          <div className="grid grid-cols-2 gap-3">
            <TierSelect label="Discount" tiers={discounts} value={form.discount_range}
              onChange={(v) => patch({ discount_range: v })} />
            <TierSelect label="Price" tiers={prices} value={form.price_range}
              onChange={(v) => patch({ price_range: v })} />
            <TierSelect label="Reviews" tiers={reviews} value={form.review_range}
              onChange={(v) => patch({ review_range: v })} />
          </div>
          <SeoField label="Affiliate URL">
            <Input
              placeholder="https://amazon.com/..."
              value={form.affiliate_url}
              onChange={(e) => patch({ affiliate_url: e.target.value })}
            />
          </SeoField>
        </div>
        <DialogFooter><Button onClick={onSave}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const TierSelect = ({
  label,
  tiers,
  value,
  onChange,
}: {
  label: string;
  tiers: Tier[];
  value: string;
  onChange: (v: string) => void;
}) => (
  <SeoField label={label}>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
      <SelectContent>
        {tiers.map((t) => <SelectItem key={t.id} value={t.value}>{t.label}</SelectItem>)}
      </SelectContent>
    </Select>
  </SeoField>
);

/* ============================================================
   Keywords tab
   ============================================================ */

type KeywordForm = {
  label: string;
  affiliate_url: string;
  sort_order: number;
  emoji: string;
};

const EMPTY_KEYWORD_FORM: KeywordForm = { label: "", affiliate_url: "", sort_order: 0, emoji: "" };

function KeywordsTab() {
  const { items, reload } = useResource<Keyword[]>(fetchKeywords, []);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Keyword | null>(null);
  const [form, setForm] = useState<KeywordForm>(EMPTY_KEYWORD_FORM);

  const openAdd = () => {
    setEditing(null);
    const nextSort = items.length ? Math.max(...items.map((i) => i.sort_order)) + 1 : 0;
    setForm({ ...EMPTY_KEYWORD_FORM, sort_order: nextSort });
    setOpen(true);
  };

  const openEdit = (k: Keyword) => {
    setEditing(k);
    setForm({
      label: k.label,
      affiliate_url: k.affiliate_url,
      sort_order: k.sort_order,
      emoji: k.emoji ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.label.trim() || !form.affiliate_url.trim()) {
      toast.error("Fill all fields");
      return;
    }
    const payload = {
      label: form.label.trim(),
      affiliate_url: form.affiliate_url.trim(),
      sort_order: form.sort_order,
      emoji: form.emoji.trim() || null,
    };
    const op = editing
      ? supabase.from("keywords").update(payload).eq("id", editing.id)
      : supabase.from("keywords").insert(payload);
    const { ok } = await runMutation(op, { successMsg: "Saved" });
    if (ok) {
      setOpen(false);
      reload();
    }
  };

  const updateSort = async (id: string, sort_order: number) => {
    const { ok } = await runMutation(supabase.from("keywords").update({ sort_order }).eq("id", id));
    if (ok) reload();
  };

  const del = async (id: string) => {
    if (await confirmAndDelete("keywords", id, "Delete this keyword?")) reload();
  };

  const patch = (p: Partial<KeywordForm>) => setForm((f) => ({ ...f, ...p }));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-3">
        <p className="text-xs text-muted-foreground">
          Keyword chips shown above the search form. Lower order numbers appear first.
        </p>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> New keyword</Button>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Emoji</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>URL</TableHead>
              <TableHead className="w-28">Order</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((k) => (
              <TableRow key={k.id}>
                <TableCell className="text-xl">{k.emoji ?? ""}</TableCell>
                <TableCell className="font-medium">{k.label}</TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground">
                  <ExternalLink href={k.affiliate_url} />
                </TableCell>
                <TableCell>
                  <SortInput value={k.sort_order} onCommit={(v) => updateSort(k.id, v)} />
                </TableCell>
                <TableCell className="text-right">
                  <RowActions onEdit={() => openEdit(k)} onDelete={() => del(k.id)} />
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && <EmptyRow colSpan={5} label="No keywords yet" />}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit" : "New"} keyword</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <SeoField label="Emoji / Icon (optional)">
              <Input
                value={form.emoji}
                onChange={(e) => patch({ emoji: e.target.value })}
                placeholder="🎁"
                maxLength={8}
              />
            </SeoField>
            <SeoField label="Label">
              <Input
                value={form.label}
                onChange={(e) => patch({ label: e.target.value })}
                placeholder="Giftable tech under $30"
              />
            </SeoField>
            <SeoField label="Affiliate URL">
              <Input
                value={form.affiliate_url}
                onChange={(e) => patch({ affiliate_url: e.target.value })}
                placeholder="https://amazon.com/..."
              />
            </SeoField>
            <SeoField label="Order">
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => patch({ sort_order: Number(e.target.value) })}
              />
            </SeoField>
          </div>
          <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ============================================================
   Settings tab
   ============================================================ */

function SettingsTab() {
  const [fallback, setFallback] = useState("");
  const [discounts, setDiscounts] = useState<Tier[]>([]);
  const [prices, setPrices] = useState<Tier[]>([]);
  const [reviews, setReviews] = useState<Tier[]>([]);

  const load = useCallback(async () => {
    const [f, d, p, r] = await Promise.all([
      fetchFallbackUrl(),
      fetchTiers("discount_tiers"),
      fetchTiers("price_tiers"),
      fetchTiers("review_tiers"),
    ]);
    setFallback(f);
    setDiscounts(d);
    setPrices(p);
    setReviews(r);
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveFallback = () => runMutation(upsertFallbackUrl(fallback), { successMsg: "Saved" });

  return (
    <div className="space-y-8 max-w-3xl">
      <section className="space-y-3 p-6 border rounded-lg bg-card">
        <h2 className="text-lg font-semibold">Fallback URL</h2>
        <p className="text-sm text-muted-foreground">
          Used when no exact match is found, or when "Any" is selected.
        </p>
        <div className="flex gap-2">
          <Input
            value={fallback}
            onChange={(e) => setFallback(e.target.value)}
            placeholder="https://www.amazon.com/deals"
          />
          <Button onClick={saveFallback}>Save</Button>
        </div>
      </section>

      <TierEditor title="Discount tiers" table="discount_tiers" items={discounts} reload={load} />
      <TierEditor title="Price tiers" table="price_tiers" items={prices} reload={load} />
      <TierEditor title="Review tiers" table="review_tiers" items={reviews} reload={load} />
    </div>
  );
}

type TierEditorProps = { title: string; table: TierTable; items: Tier[]; reload: () => void };

function TierEditor({ title, table, items, reload }: TierEditorProps) {
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [sort, setSort] = useState(0);

  const add = async () => {
    if (!label.trim() || !value.trim()) return;
    const { ok } = await runMutation(
      supabase.from(table).insert({ label: label.trim(), value: value.trim(), sort_order: sort }),
    );
    if (ok) {
      setLabel("");
      setValue("");
      setSort(0);
      reload();
    }
  };

  const del = async (id: string) => {
    if (await confirmAndDelete(table, id, "Delete this tier?")) reload();
  };

  return (
    <section className="space-y-3 p-6 border rounded-lg bg-card">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Value (key)</TableHead>
              <TableHead className="w-20">Order</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.label}</TableCell>
                <TableCell className="font-mono text-xs">{t.value}</TableCell>
                <TableCell>{t.sort_order}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => del(t.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="grid grid-cols-12 gap-2">
        <Input
          className="col-span-5"
          placeholder="Label (e.g. 25%+)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <Input
          className="col-span-4"
          placeholder="Value key (e.g. 25)"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <Input
          className="col-span-2"
          type="number"
          placeholder="Order"
          value={sort}
          onChange={(e) => setSort(Number(e.target.value))}
        />
        <Button className="col-span-1" onClick={add}><Plus className="h-4 w-4" /></Button>
      </div>
    </section>
  );
}

/* ============================================================
   SEO Categories tab — manage seasonal landing pages
   ============================================================ */

import { Textarea } from "@/components/ui/textarea";

function SeoTab() {
  const { items, reload } = useResource<SeoCategory[]>(fetchSeoCategories, []);
  const [editing, setEditing] = useState<SeoCategory | null>(null);
  const [creating, setCreating] = useState(false);

  const blank: Omit<SeoCategory, "id" | "updated_at"> = {
    slug: "",
    title: "",
    meta_title: "",
    meta_description: "",
    h1: "",
    intro_html: "",
    body_html: "",
    keywords: [],
    affiliate_url: "",
    hero_image_url: null,
    og_image_url: null,
    is_published: true,
    is_seasonal: true,
    season_start: null,
    season_end: null,
    sort_order: (items[items.length - 1]?.sort_order ?? 0) + 10,
  };

  const togglePublished = async (c: SeoCategory) => {
    const { ok } = await runMutation(
      supabase.from("seo_categories").update({ is_published: !c.is_published }).eq("id", c.id),
      { successMsg: c.is_published ? "Unpublished" : "Published" },
    );
    if (ok) reload();
  };

  const remove = async (c: SeoCategory) => {
    if (await confirmAndDelete("seo_categories", c.id, `Delete "${c.title}"?`)) reload();
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">SEO Landing Pages</h2>
          <p className="text-sm text-muted-foreground">
            Each row becomes <code>/deals/&#123;slug&#125;</code> and is included in the sitemap.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> New page
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead className="w-24">Sort</TableHead>
            <TableHead className="w-28">Published</TableHead>
            <TableHead className="w-28 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <EmptyRow colSpan={5} label="No SEO pages yet" />
          ) : (
            items.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.title}</TableCell>
                <TableCell className="text-xs text-muted-foreground">/deals/{c.slug}</TableCell>
                <TableCell>{c.sort_order}</TableCell>
                <TableCell>
                  <Button
                    variant={c.is_published ? "default" : "outline"}
                    size="sm"
                    onClick={() => togglePublished(c)}
                  >
                    {c.is_published ? "Live" : "Draft"}
                  </Button>
                </TableCell>
                <TableCell className="text-right">
                  <RowActions onEdit={() => setEditing(c)} onDelete={() => remove(c)} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {(editing || creating) && (
        <SeoEditor
          initial={editing ?? (blank as SeoCategory)}
          isNew={creating}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSaved={() => {
            setEditing(null);
            setCreating(false);
            reload();
          }}
        />
      )}
    </section>
  );
}

function SeoEditor({
  initial,
  isNew,
  onClose,
  onSaved,
}: {
  initial: SeoCategory;
  isNew: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    ...initial,
    keywords: (initial.keywords ?? []).join(", "),
  });
  const [saving, setSaving] = useState(false);

  const upd = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    const payload = {
      slug: form.slug.trim(),
      title: form.title.trim(),
      meta_title: form.meta_title.trim(),
      meta_description: form.meta_description.trim(),
      h1: form.h1.trim(),
      intro_html: form.intro_html,
      body_html: form.body_html,
      keywords: form.keywords
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean),
      affiliate_url: form.affiliate_url.trim(),
      hero_image_url: form.hero_image_url || null,
      og_image_url: form.og_image_url || null,
      is_published: form.is_published,
      is_seasonal: form.is_seasonal,
      season_start: form.season_start || null,
      season_end: form.season_end || null,
      sort_order: Number(form.sort_order) || 0,
    };
    const q = isNew
      ? supabase.from("seo_categories").insert(payload)
      : supabase.from("seo_categories").update(payload).eq("id", initial.id);
    const { ok } = await runMutation(q, { successMsg: isNew ? "Created" : "Saved" });
    setSaving(false);
    if (ok) onSaved();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? "New SEO landing page" : `Edit: ${initial.title}`}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <SeoField label="Slug (URL)">
            <Input
              value={form.slug}
              onChange={(e) => upd("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              placeholder="black-friday-deals"
            />
          </SeoField>
          <SeoField label="Title (display + H1 fallback)">
            <Input value={form.title} onChange={(e) => upd("title", e.target.value)} />
          </SeoField>
          <SeoField label="H1">
            <Input value={form.h1} onChange={(e) => upd("h1", e.target.value)} />
          </SeoField>
          <SeoField label="Meta title (≤60 chars)">
            <Input value={form.meta_title} onChange={(e) => upd("meta_title", e.target.value)} maxLength={70} />
          </SeoField>
          <SeoField label="Meta description (≤160 chars)">
            <Textarea
              value={form.meta_description}
              onChange={(e) => upd("meta_description", e.target.value)}
              maxLength={180}
              rows={2}
            />
          </SeoField>
          <SeoField label="Intro HTML">
            <Textarea
              value={form.intro_html}
              onChange={(e) => upd("intro_html", e.target.value)}
              rows={3}
            />
          </SeoField>
          <SeoField label="Body HTML (optional, supports <h2>/<h3>/<p>)">
            <Textarea
              value={form.body_html}
              onChange={(e) => upd("body_html", e.target.value)}
              rows={6}
            />
          </SeoField>
          <SeoField label="Keywords (comma-separated)">
            <Input value={form.keywords} onChange={(e) => upd("keywords", e.target.value)} />
          </SeoField>
          <SeoField label="Amazon affiliate URL">
            <Input value={form.affiliate_url} onChange={(e) => upd("affiliate_url", e.target.value)} />
          </SeoField>
          <div className="grid grid-cols-2 gap-3">
            <SeoField label="Hero image URL">
              <Input value={form.hero_image_url ?? ""} onChange={(e) => upd("hero_image_url", e.target.value)} />
            </SeoField>
            <SeoField label="OG image URL">
              <Input value={form.og_image_url ?? ""} onChange={(e) => upd("og_image_url", e.target.value)} />
            </SeoField>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <SeoField label="Sort order">
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => upd("sort_order", e.target.value)}
              />
            </SeoField>
            <SeoField label="Season start">
              <Input
                type="date"
                value={form.season_start ?? ""}
                onChange={(e) => upd("season_start", e.target.value)}
              />
            </SeoField>
            <SeoField label="Season end">
              <Input
                type="date"
                value={form.season_end ?? ""}
                onChange={(e) => upd("season_end", e.target.value)}
              />
            </SeoField>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => upd("is_published", e.target.checked)}
            />
            Published
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SeoField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
