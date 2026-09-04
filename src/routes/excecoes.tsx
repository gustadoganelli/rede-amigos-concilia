import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, ClipboardCheck, Inbox, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { KpiCard, PageHeader, SectionCard, StatusBadge } from "@/components/painel/ui-blocos";
import { alertas, brl, dataBr, pct, vendas, type VendaConciliacao } from "@/lib/conciliacao-data";

export const Route = createFileRoute("/excecoes")({
  head: () => ({
    meta: [
      { title: "Exceções e alertas da conciliação · Amigos do Bem" },
      {
        name: "description",
        content:
          "Fila de tratamento de exceções: vendas da Rede ausentes no ERP, divergências de valor, taxa e parcelas, com ações e responsáveis.",
      },
      { property: "og:title", content: "Exceções e alertas da conciliação" },
      {
        property: "og:description",
        content: "Trate divergências com trilha de auditoria, responsáveis e prazos.",
      },
    ],
  }),
  component: Excecoes;
});

const RESPONSAVEIS = ["Financeiro", "Contabilidade", "Tesouraria", "Fila da Rede"] as const;

function Excecoes() {
  const [tipo, setTipo] = useState("todos");
  const [responsavel, setResponsavel] = useState("todos");
  const [aberto, setAberto] = useState<VendaConciliacao | null>(null);
  const [nota, setNota] = useState("");

  const excecoes = useMemo(
    () => vendas.filter((v) => v.status !== "Conciliado"),
    [],
  );

  const comResponsavel = useMemo(
    () =>
      excecoes.map((v, i) => ({
        ...v,
        responsavel: RESPONSAVEIS[i % RESPONSAVEIS.length]!,
        sla: ["Hoje", "1 dia", "2 dias", "Vencido"][i % 4]!,
      })),
    [excecoes],
  );

  const filtradas = comResponsavel.filter((v) => {
    if (tipo !== "todos" && v.status !== tipo) return false;
    if (responsavel !== "todos" && v.responsavel !== responsavel) return false;
    return true;
  });

  const tipos = [...new Set(excecoes.map((v) => v.status))];

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Exceções e alertas"
        descricao="Fila única de tratamento das quebras entre adquirente e ERP, com responsável, prazo e trilha de auditoria de cada decisão."
        acoes={
          <Button
            variant="outline"
            onClick={() => toast.success("Fila distribuída automaticamente por responsável.")}
          >
            <UserCheck className="mr-2 h-4 w-4" /> Distribuir fila
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          rotulo="Exceções abertas"
          valor={String(excecoes.length)}
          detalhe={`${brl(excecoes.reduce((s, v) => s + v.valorBruto, 0))} em risco`}
          tom="critico"
          icone={<Inbox className="h-4 w-4" />}
        />
        <KpiCard
          rotulo="Alertas críticos"
          valor={String(alertas.filter((a) => a.severidade === "Crítico").length)}
          detalhe="exigem ação no dia"
          tom="critico"
          icone={<AlertTriangle className="h-4 w-4" />}
        />
        <KpiCard
          rotulo="Fora do prazo (SLA)"
          valor={String(Math.round(comResponsavel.filter((v) => v.sla === "Vencido").length))}
          detalhe="acima de 2 dias úteis"
          tom="alerta"
        />
        <KpiCard
          rotulo="Tratadas no mês"
          valor="312"
          detalhe="94% resolvidas em até 1 dia"
          variacao={12.4}
          tom="positivo"
          icone={<ClipboardCheck className="h-4 w-4" />}
        />
      </div>

      <SectionCard titulo="Alertas do sistema" descricao="Regras monitoradas continuamente">
        <div className="grid gap-3 md:grid-cols-2">
          {alertas.map((a) => (
            <div
              key={a.id}
              className="rounded-lg border border-border bg-muted/30 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <StatusBadge status={a.severidade} />
                <span className="text-[11px] text-muted-foreground">{a.quando}</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-foreground">{a.titulo}</p>
              <p className="mt-1 text-xs text-muted-foreground">{a.detalhe}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="num text-sm font-semibold text-foreground">
                  {a.valor > 0 ? brl(a.valor) : "—"}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toast.success(`Alerta ${a.id} atribuído ao financeiro.`)}
                >
                  Tratar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        titulo="Fila de exceções"
        descricao={`${filtradas.length} itens aguardando tratamento`}
        acoes={
          <div className="flex gap-2">
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger className="w-[210px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                {tipos.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={responsavel} onValueChange={setResponsavel}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {RESPONSAVEIS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NSU</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Tipo de exceção</TableHead>
                <TableHead>Detalhe</TableHead>
                <TableHead className="text-right">Impacto</TableHead>
                <TableHead>MDR</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtradas.slice(0, 50).map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="num font-medium">{v.nsu}</TableCell>
                  <TableCell className="num">{dataBr(v.dataVenda)}</TableCell>
                  <TableCell>
                    <StatusBadge status={v.status} />
                  </TableCell>
                  <TableCell className="max-w-[280px] text-xs text-muted-foreground">
                    {v.observacao}
                  </TableCell>
                  <TableCell className="num text-right font-semibold">
                    {brl(
                      v.valorBrutoErp === null
                        ? v.valorBruto
                        : Math.abs(v.valorBruto - v.valorBrutoErp) ||
                            (v.valorBruto * (v.taxaPct - v.taxaPctContratada)) / 100,
                    )}
                  </TableCell>
                  <TableCell className="num text-xs">
                    {pct(v.taxaPct)} / {pct(v.taxaPctContratada)}
                  </TableCell>
                  <TableCell className="text-xs">{v.responsavel}</TableCell>
                  <TableCell
                    className={
                      v.sla === "Vencido"
                        ? "text-xs font-semibold text-destructive"
                        : "text-xs text-muted-foreground"
                    }
                  >
                    {v.sla}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => setAberto(v)}>
                      Resolver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <Dialog open={aberto !== null} onOpenChange={(o) => !o && setAberto(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tratar exceção · NSU {aberto?.nsu}</DialogTitle>
            <DialogDescription>{aberto?.observacao}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border border-border bg-muted/30 p-3">
                <p className="text-[11px] text-muted-foreground uppercase">Valor Rede</p>
                <p className="num font-semibold">{aberto ? brl(aberto.valorBruto) : ""}</p>
              </div>
              <div className="rounded-md border border-border bg-muted/30 p-3">
                <p className="text-[11px] text-muted-foreground uppercase">Valor ERP</p>
                <p className="num font-semibold">
                  {aberto?.valorBrutoErp === null || aberto === null
                    ? "não localizado"
                    : brl(aberto.valorBrutoErp)}
                </p>
              </div>
            </div>
            <Textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Justificativa / providência adotada (registrada na trilha de auditoria)"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                toast.success("Chamado aberto na Rede com o histórico da transação.");
                setAberto(null);
                setNota("");
              }}
            >
              Abrir chamado na Rede
            </Button>
            <Button
              onClick={() => {
                toast.success("Exceção resolvida e registrada na trilha de auditoria.");
                setAberto(null);
                setNota("");
              }}
            >
              Concluir tratamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
