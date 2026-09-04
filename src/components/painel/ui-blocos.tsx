import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function PageHeader({
  titulo,
  descricao,
  acoes,
}: {
  titulo: string;
  descricao: string;
  acoes?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{titulo}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{descricao}</p>
      </div>
      {acoes ? <div className="flex flex-wrap items-center gap-2">{acoes}</div> : null}
    </div>
  );
}

export function KpiCard({
  rotulo,
  valor,
  detalhe,
  variacao,
  tom = "neutro",
  icone,
}: {
  rotulo: string;
  valor: string;
  detalhe?: string;
  variacao?: number;
  tom?: "neutro" | "positivo" | "alerta" | "critico" | "marca";
  icone?: ReactNode;
}) {
  const barra = {
    neutro: "bg-border",
    positivo: "bg-success",
    alerta: "bg-warning",
    critico: "bg-destructive",
    marca: "bg-brand-gold",
  }[tom];

  return (
    <Card className="relative gap-0 overflow-hidden p-5">
      <span className={cn("absolute inset-x-0 top-0 h-1", barra)} />
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {rotulo}
        </p>
        {icone ? <span className="text-muted-foreground">{icone}</span> : null}
      </div>
      <p className="num mt-3 text-2xl font-semibold text-foreground">{valor}</p>
      <div className="mt-2 flex items-center gap-2">
        {typeof variacao === "number" ? (
          <span
            className={cn(
              "num inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-semibold",
              variacao >= 0
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive",
            )}
          >
            {variacao >= 0 ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {Math.abs(variacao).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
          </span>
        ) : null}
        {detalhe ? <p className="text-xs text-muted-foreground">{detalhe}</p> : null}
      </div>
    </Card>
  );
}

const TONS: Record<string, string> = {
  Conciliado: "bg-success/12 text-success border-success/25",
  Pago: "bg-success/12 text-success border-success/25",
  Concluída: "bg-success/12 text-success border-success/25",
  Previsto: "bg-primary/10 text-primary border-primary/25",
  Antecipado: "bg-brand-orange/15 text-brand-orange border-brand-orange/30",
  Parcial: "bg-warning/15 text-warning-foreground border-warning/40",
  "Em tratamento": "bg-warning/15 text-warning-foreground border-warning/40",
  Pendente: "bg-muted text-muted-foreground border-border",
  Atenção: "bg-warning/15 text-warning-foreground border-warning/40",
  Informativo: "bg-primary/10 text-primary border-primary/25",
};

export function StatusBadge({ status }: { status: string }) {
  const cls = TONS[status] ?? "bg-destructive/10 text-destructive border-destructive/25";
  return (
    <Badge variant="outline" className={cn("rounded-full font-semibold", cls)}>
      {status}
    </Badge>
  );
}

export function SectionCard({
  titulo,
  descricao,
  acoes,
  children,
  className,
}: {
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("gap-0 overflow-hidden p-0", className)}>
      <div className="flex flex-col gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{titulo}</h2>
          {descricao ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{descricao}</p>
          ) : null}
        </div>
        {acoes ? <div className="flex items-center gap-2">{acoes}</div> : null}
      </div>
      <div className="p-5">{children}</div>
    </Card>
  );
}
