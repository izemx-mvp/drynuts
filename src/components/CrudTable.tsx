import { useMemo, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, Plus, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";

export type FieldType = "text" | "number" | "date" | "select";
export interface CrudField<T> {
  key: keyof T & string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  required?: boolean;
  step?: string;
  hidden?: (row: Partial<T>) => boolean;
}

export interface Column<T> {
  key: keyof T & string;
  label: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

export interface CrudTableProps<T extends { id: string }> {
  data: T[];
  columns: Column<T>[];
  fields: CrudField<T>[];
  onCreate: (row: T) => void;
  onUpdate: (row: T) => void;
  onDelete: (id: string) => void;
  filters?: ReactNode;
  searchKeys?: (keyof T)[];
  title?: string;
  emptyMsg?: string;
  buildDefaults?: () => Partial<T>;
}

export function CrudTable<T extends { id: string }>({
  data,
  columns,
  fields,
  onCreate,
  onUpdate,
  onDelete,
  filters,
  searchKeys,
  emptyMsg = "Aucun résultat",
  buildDefaults,
}: CrudTableProps<T>) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [detail, setDetail] = useState<T | null>(null);
  const [form, setForm] = useState<Partial<T>>({});
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    if (!q.trim()) return data;
    const query = q.toLowerCase();
    const keys = searchKeys ?? (columns.map((c) => c.key) as (keyof T)[]);
    return data.filter((row) =>
      keys.some((k) => String(row[k] ?? "").toLowerCase().includes(query)),
    );
  }, [data, q, searchKeys, columns]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openNew = () => {
    setEditing(null);
    setForm(buildDefaults ? buildDefaults() : {});
    setOpen(true);
  };
  const openEdit = (row: T) => {
    setEditing(row);
    setForm({ ...row });
    setOpen(true);
  };
  const submit = () => {
    for (const f of fields) {
      if (f.hidden?.(form)) continue;
      if (f.required && (form[f.key] === undefined || form[f.key] === "" || form[f.key] === null)) {
        toast.error(`Champ requis : ${f.label}`);
        return;
      }
    }
    if (editing) {
      onUpdate({ ...(editing as object), ...(form as object) } as T);
      toast.success("Modifié");
    } else {
      const id = `id-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
      onCreate({ id, ...(form as object) } as T);
      toast.success("Créé");
    }
    setOpen(false);
  };

  return (
    <Card className="p-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher…"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {filters}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew}>
                <Plus className="h-4 w-4 mr-1" /> Nouveau
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editing ? "Modifier" : "Nouvel enregistrement"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
                {fields.map((f) => {
                  if (f.hidden?.(form)) return null;
                  const value = form[f.key] as string | number | undefined;
                  return (
                    <div key={f.key} className="space-y-1.5">
                      <Label>
                        {f.label}
                        {f.required && <span className="text-destructive"> *</span>}
                      </Label>
                      {f.type === "select" ? (
                        <Select
                          value={value ? String(value) : ""}
                          onValueChange={(v) => setForm({ ...form, [f.key]: v } as Partial<T>)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner…" />
                          </SelectTrigger>
                          <SelectContent>
                            {f.options?.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          type={f.type}
                          step={f.step}
                          value={value ?? ""}
                          onChange={(e) => {
                            const v =
                              f.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value;
                            setForm({ ...form, [f.key]: v } as Partial<T>);
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={submit}>{editing ? "Enregistrer" : "Créer"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.key} className={c.className}>
                  {c.label}
                </TableHead>
              ))}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {current.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center text-muted-foreground py-8">
                  {emptyMsg}
                </TableCell>
              </TableRow>
            )}
            {current.map((row) => (
              <TableRow key={row.id} className="hover:bg-muted/40">
                {columns.map((c) => (
                  <TableCell key={c.key} className={c.className}>
                    {c.render ? c.render(row) : String(row[c.key] ?? "")}
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setDetail(row)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => openEdit(row)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("Supprimer cet élément ?")) {
                          onDelete(row.id);
                          toast.success("Supprimé");
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
        <div>
          {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Précédent
          </Button>
          <Badge variant="outline">
            {page} / {pageCount}
          </Badge>
          <Button size="sm" variant="outline" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>
            Suivant
          </Button>
        </div>
      </div>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détail</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="grid gap-2 text-sm">
              {Object.entries(detail).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b py-1.5">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium text-right break-all">
                    {typeof v === "object" ? JSON.stringify(v) : String(v)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
