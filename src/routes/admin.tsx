import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";
import { Loader2, LogOut, Pencil, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

type Dept = { id: string; name: string; sort_order: number };
type Tier = { id: string; label: string; value: string; sort_order: number };
type Link_ = {
  id: string;
  dept_id: string;
  discount_range: string;
  price_range: string;
  review_range: string;
  affiliate_url: string;
};

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

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold">Access denied</h1>
          <p className="mt-2 text-muted-foreground">
            You're signed in as {session.user.email} but don't have admin access. Ask the project
            owner to grant you the <code className="bg-muted px-1.5 py-0.5 rounded">admin</code>{" "}
            role.
          </p>
          <p className="mt-3 text-xs text-muted-foreground break-all">User ID: {session.user.id}</p>
          <div className="mt-6 flex gap-2 justify-center">
            <Button variant="outline" onClick={() => supabase.auth.signOut()}>Sign out</Button>
            <Link to="/"><Button variant="ghost">Home</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
            <p className="text-xs text-muted-foreground">{session.user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/"><Button variant="ghost" size="sm">View site</Button></Link>
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut().then(() => navigate({ to: "/login" }))}>
              <LogOut className="h-4 w-4 mr-1.5" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Tabs defaultValue="links">
          <TabsList>
            <TabsTrigger value="links">Affiliate Links</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="links" className="mt-6"><LinksTab /></TabsContent>
          <TabsContent value="departments" className="mt-6"><DepartmentsTab /></TabsContent>
          <TabsContent value="settings" className="mt-6"><SettingsTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

/* ---------- Departments ---------- */

function DepartmentsTab() {
  const [items, setItems] = useState<Dept[]>([]);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<Dept | null>(null);
  const [editName, setEditName] = useState("");
  const [editSort, setEditSort] = useState(0);

  const load = () =>
    supabase
      .from("departments")
      .select("*")
      .order("sort_order")
      .order("name")
      .then(({ data }) => setItems((data as Dept[]) ?? []));
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!name.trim()) return;
    const nextSort = items.length ? Math.max(...items.map((i) => i.sort_order)) + 1 : 0;
    const { error } = await supabase.from("departments").insert({ name: name.trim(), sort_order: nextSort });
    if (error) toast.error(error.message); else { toast.success("Added"); setName(""); load(); }
  };
  const save = async () => {
    if (!editing) return;
    const { error } = await supabase
      .from("departments")
      .update({ name: editName.trim(), sort_order: editSort })
      .eq("id", editing.id);
    if (error) toast.error(error.message); else { toast.success("Saved"); setEditing(null); load(); }
  };
  const updateSort = async (id: string, sort_order: number) => {
    const { error } = await supabase.from("departments").update({ sort_order }).eq("id", id);
    if (error) toast.error(error.message); else load();
  };
  const del = async (id: string) => {
    if (!confirm("Delete this department? Linked affiliate URLs will also be removed.")) return;
    const { error } = await supabase.from("departments").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input placeholder="New department name" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <Button onClick={add}><Plus className="h-4 w-4 mr-1" /> Add</Button>
      </div>
      <p className="text-xs text-muted-foreground">Use the Order column to control how departments appear on the homepage (lower numbers first).</p>
      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="w-28">Order</TableHead><TableHead className="w-32 text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {items.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    className="h-8 w-20"
                    defaultValue={d.sort_order}
                    onBlur={(e) => {
                      const v = Number(e.target.value);
                      if (v !== d.sort_order) updateSort(d.id, v);
                    }}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(d); setEditName(d.name); setEditSort(d.sort_order); }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => del(d.id)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No departments yet</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit department</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Order</Label>
              <Input type="number" value={editSort} onChange={(e) => setEditSort(Number(e.target.value))} />
            </div>
          </div>
          <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------- Links ---------- */

function LinksTab() {
  const [items, setItems] = useState<Link_[]>([]);
  const [depts, setDepts] = useState<Dept[]>([]);
  const [discounts, setDiscounts] = useState<Tier[]>([]);
  const [prices, setPrices] = useState<Tier[]>([]);
  const [reviews, setReviews] = useState<Tier[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Link_ | null>(null);
  const [form, setForm] = useState({ dept_id: "", discount_range: "", price_range: "", review_range: "", affiliate_url: "" });

  const load = async () => {
    const [l, d, dt, pt, rt] = await Promise.all([
      supabase.from("affiliate_links").select("*").order("created_at", { ascending: false }),
      supabase.from("departments").select("id,name,sort_order").order("sort_order").order("name"),
      supabase.from("discount_tiers").select("*").order("sort_order"),
      supabase.from("price_tiers").select("*").order("sort_order"),
      supabase.from("review_tiers").select("*").order("sort_order"),
    ]);
    setItems((l.data as Link_[]) ?? []);
    setDepts(d.data ?? []);
    setDiscounts(dt.data ?? []);
    setPrices(pt.data ?? []);
    setReviews(rt.data ?? []);
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ dept_id: "", discount_range: "", price_range: "", review_range: "", affiliate_url: "" });
    setOpen(true);
  };
  const openEdit = (l: Link_) => {
    setEditing(l);
    setForm({ dept_id: l.dept_id, discount_range: l.discount_range, price_range: l.price_range, review_range: l.review_range ?? "any", affiliate_url: l.affiliate_url });
    setOpen(true);
  };

  const save = async () => {
    if (!form.dept_id || !form.discount_range || !form.price_range || !form.review_range || !form.affiliate_url) {
      toast.error("Fill all fields");
      return;
    }
    const op = editing
      ? supabase.from("affiliate_links").update(form).eq("id", editing.id)
      : supabase.from("affiliate_links").insert(form);
    const { error } = await op;
    if (error) toast.error(error.message);
    else { toast.success("Saved"); setOpen(false); load(); }
  };
  const del = async (id: string) => {
    if (!confirm("Delete this link?")) return;
    const { error } = await supabase.from("affiliate_links").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };

  const deptName = (id: string) => depts.find((d) => d.id === id)?.name ?? "—";
  const tierLabel = (tiers: Tier[], v: string) => tiers.find((t) => t.value === v)?.label ?? v;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> New link</Button>
      </div>
      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Department</TableHead><TableHead>Discount</TableHead><TableHead>Price</TableHead><TableHead>Reviews</TableHead><TableHead>URL</TableHead><TableHead className="w-32 text-right">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {items.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="font-medium">{deptName(l.dept_id)}</TableCell>
                <TableCell>{tierLabel(discounts, l.discount_range)}</TableCell>
                <TableCell>{tierLabel(prices, l.price_range)}</TableCell>
                <TableCell>{tierLabel(reviews, l.review_range)}</TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground"><a href={l.affiliate_url} target="_blank" rel="noopener noreferrer" className="hover:underline">{l.affiliate_url}</a></TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(l)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => del(l.id)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No affiliate links yet</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} affiliate link</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={form.dept_id} onValueChange={(v) => setForm({ ...form, dept_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>{depts.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Discount</Label>
                <Select value={form.discount_range} onValueChange={(v) => setForm({ ...form, discount_range: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{discounts.map((t) => <SelectItem key={t.id} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Price</Label>
                <Select value={form.price_range} onValueChange={(v) => setForm({ ...form, price_range: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{prices.map((t) => <SelectItem key={t.id} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Affiliate URL</Label>
              <Input placeholder="https://amazon.com/..." value={form.affiliate_url} onChange={(e) => setForm({ ...form, affiliate_url: e.target.value })} />
            </div>
          </div>
          <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------- Settings ---------- */

function SettingsTab() {
  const [fallback, setFallback] = useState("");
  const [discounts, setDiscounts] = useState<Tier[]>([]);
  const [prices, setPrices] = useState<Tier[]>([]);

  const load = async () => {
    const [s, d, p] = await Promise.all([
      supabase.from("app_settings").select("value").eq("key", "fallback_url").maybeSingle(),
      supabase.from("discount_tiers").select("*").order("sort_order"),
      supabase.from("price_tiers").select("*").order("sort_order"),
    ]);
    setFallback(s.data?.value ?? "");
    setDiscounts(d.data ?? []);
    setPrices(p.data ?? []);
  };
  useEffect(() => { load(); }, []);

  const saveFallback = async () => {
    const { error } = await supabase.from("app_settings").upsert({ key: "fallback_url", value: fallback, updated_at: new Date().toISOString() });
    if (error) toast.error(error.message); else toast.success("Saved");
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <section className="space-y-3 p-6 border rounded-lg bg-card">
        <h2 className="text-lg font-semibold">Fallback URL</h2>
        <p className="text-sm text-muted-foreground">Used when no exact match is found, or when "Any" is selected.</p>
        <div className="flex gap-2">
          <Input value={fallback} onChange={(e) => setFallback(e.target.value)} placeholder="https://www.amazon.com/deals" />
          <Button onClick={saveFallback}>Save</Button>
        </div>
      </section>

      <TierEditor title="Discount tiers" table="discount_tiers" items={discounts} reload={load} />
      <TierEditor title="Price tiers" table="price_tiers" items={prices} reload={load} />
    </div>
  );
}

function TierEditor({ title, table, items, reload }: { title: string; table: "discount_tiers" | "price_tiers"; items: Tier[]; reload: () => void }) {
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [sort, setSort] = useState(0);

  const add = async () => {
    if (!label.trim() || !value.trim()) return;
    const { error } = await supabase.from(table).insert({ label: label.trim(), value: value.trim(), sort_order: sort });
    if (error) toast.error(error.message); else { setLabel(""); setValue(""); setSort(0); reload(); }
  };
  const del = async (id: string) => {
    if (!confirm("Delete this tier?")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) toast.error(error.message); else reload();
  };

  return (
    <section className="space-y-3 p-6 border rounded-lg bg-card">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="border rounded-md">
        <Table>
          <TableHeader><TableRow><TableHead>Label</TableHead><TableHead>Value (key)</TableHead><TableHead className="w-20">Order</TableHead><TableHead className="w-16" /></TableRow></TableHeader>
          <TableBody>
            {items.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.label}</TableCell>
                <TableCell className="font-mono text-xs">{t.value}</TableCell>
                <TableCell>{t.sort_order}</TableCell>
                <TableCell><Button variant="ghost" size="icon" onClick={() => del(t.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="grid grid-cols-12 gap-2">
        <Input className="col-span-5" placeholder="Label (e.g. 25%+)" value={label} onChange={(e) => setLabel(e.target.value)} />
        <Input className="col-span-4" placeholder="Value key (e.g. 25)" value={value} onChange={(e) => setValue(e.target.value)} />
        <Input className="col-span-2" type="number" placeholder="Order" value={sort} onChange={(e) => setSort(Number(e.target.value))} />
        <Button className="col-span-1" onClick={add}><Plus className="h-4 w-4" /></Button>
      </div>
    </section>
  );
}
