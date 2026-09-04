import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  BadgePercent,
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  FileWarning,
  RefreshCw,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KpiCard, PageHeader, SectionCard, StatusBadge } from "@/components/painel/ui-blocos";
import {
  alertas,
  brl,
  dataBr,
  importacoes,
  pct,
  resumo,
  serieDiaria,
  vendas,
} from "@/lib/conciliacao-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Visão diária de conciliação · Amigos do Bem" },
      {
        name: "description",
        content:
          "KPIs, alertas e exceções da conciliação diária de cartões entre a adquirente Rede e o ERP da Amigos do Bem.",
      },
      { property: "og:title", content: "Visão diária de conciliação · Amigos do Bem" },
      {
        property: "og:description",
        content:
          "Acompanhe o status da importação da Rede, divergências de valores, taxas e parcelas em um só painel.",
      },
    ],
  }),
  component: VisaoDiaria,
});

const statusResumo = [
  { nome: "Conciliado", cor: "var(--success)" },
  { nome: "Ausente no ERP", cor: "var(--destructive)" },
  { nome: "Divergência de valor", cor: "var(--brand-orange)" },
  { nome: "Divergência de taxa", cor: "var(--brand-gold)" },
  { nome: "Divergência de parcelas", cor: "var(--primary)" },
  { nome: "Ausente na Rede", cor: "oklch(0.6 0.05 260)" },
  { nome: "Em tratamento", cor: "var(--warning)" },
];

function VisaoDiaria() {
  const distribuicao = statusResumo.map((s) => ({
    ...s,
    valor: vendas.filter((v) => v.status === s.nome).length,
  }));

  const criticas = vendas
    .filter((v) => v.status !== "Conciliado" && v.status !== "Em tratamento")
    .sort((a, b) => b.valorBruto - a.valorBruto)
    .slice(0, 8);

  const ultimaImportacao = importacoes[1]!;

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Visão diária de conciliação"
        descricao="Fechamento operacional de 03/09/2026 — transações capturadas pela API da Rede cruzadas com os lançamentos do ERP."
        acoes={
          <>
            <Button
              variant="outline"
              onClick={() => toast.success("Reprocessamento solicitado à API da Rede (D-1).")}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Reprocessar D-1
            </Button>
            <Button onClick={() => toast.success("Relatório de conciliação exportado em XLSX.")}>
              Exportar fechamento
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          rotulo="Volume bruto capturado"
          valor={brl(resumo.totalBruto)}
          detalhe={`${resumo.qtdTransacoes} transações · 5 PVs`}
          variacao={4.8}
          tom="marca"
          icone={<CircleDollarSign className="h-4 w-4" />}
        />
        <KpiCard
          rotulo="Conciliação automática"
          valor={pct(resumo.percConciliado)}
          detalhe={`${resumo.qtdDivergentes} divergências abertas`}
          variacao={-1.2}
          tom="positivo"
          icone={<CheckCircle2 className="h-4 w-4" />}
        />
        <KpiCard
          rotulo="Vendas da Rede ausentes no ERP"
          valor={brl(resumo.valorAusentesErp)}
          detalhe={`${resumo.qtdAusentesErp} transações sem lançamento`}
          tom="critico"
          icone={<FileWarning className="h-4 w-4" />}
        />
        <KpiCard
          rotulo="MDR excedente identificado"
          valor={brl(resumo.taxaExcedente)}
          detalhe={`Taxa média efetiva ${pct(resumo.taxaMediaPct)}`}
          tom="alerta"
          icone={<BadgePercent className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          className="lg:col-span-2"
          titulo="Volume conciliado × divergente por dia"
          descricao="Valores brutos em R$, por data da venda"
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serieDiaria} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="dia" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                />
                <ReTooltip
                  formatter={(v: number) => brl(v)}
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="conciliado"
                  name="Conciliado"
                  fill="var(--success)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="divergente"
                  name="Divergente"
                  fill="var(--brand-orange)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard titulo="Distribuição por status" descricao="Quantidade de transações">
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribuicao}
                  dataKey="valor"
                  nameKey="nome"
                  innerRadius={45}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {distribuicao.map((d) => (
                    <Cell key={d.nome} fill={d.cor} />
                  ))}
                </Pie>
                <ReTooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-3 space-y-1.5">
            {distribuicao.map((d) => (
              <li key={d.nome} className="flex items-center gap-2 text-xs">
                <span
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: d.cor }}
                  aria-hidden
                />
                <span className="flex-1 truncate text-muted-foreground">{d.nome}</span>
                <span className="num font-semibold text-foreground">{d.valor}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          titulo="Status da importação diária"
          descricao="Rotina automática 07:30 BRT"
          className="lg:col-span-1"
          acoes={
            <Button variant="ghost" size="sm" asChild>
              <Link to="/importacoes">Ver histórico</Link>
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  {dataBr(ultimaImportacao.data)}
                </span>
                <StatusBadge status={ultimaImportacao.status} />
              </div>
              <p className="num mt-3 text-sm text-foreground">
                {ultimaImportacao.registrosRede} registros Rede ·{" "}
                {ultimaImportacao.registrosErp} ERP
              </p>
              <Progress
                value={(ultimaImportacao.registrosErp / ultimaImportacao.registrosRede) * 100}
                className="mt-3"
              />
              <p className="mt-2 text-xs text-muted-foreground">{ultimaImportacao.mensagem}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-4 w-4" />
              Próxima janela: 04/09/2026 07:30 · endpoints /v1/transactions e /v1/settlements
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Banknote className="h-4 w-4" />
              Líquido previsto D+1: {brl(resumo.totalLiquido * 0.32)}
            </div>
          </div>
        </SectionCard>

        <SectionCard
          className="lg:col-span-2"
          titulo="Alertas e exceções prioritárias"
          descricao="Ordenados por severidade e impacto financeiro"
          acoes={
            <Button variant="ghost" size="sm" asChild>
              <Link to="/excecoes">Tratar exceções</Link>
            </Button>
          }
        >
          <ul className="divide-y divide-border">
            {alertas.map((a) => (
              <li key={a.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <AlertTriangle
                  className={
                    a.severidade === "Crítico"
                      ? "mt-0.5 h-4 w-4 text-destructive"
                      : a.severidade === "Atenção"
                        ? "mt-0.5 h-4 w-4 text-warning"
                        : "mt-0.5 h-4 w-4 text-primary"
                  }
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{a.titulo}</p>
                    <StatusBadge status={a.severidade} />
                    <span className="text-xs text-muted-foreground">{a.quando}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{a.detalhe}</p>
                </div>
                {a.valor > 0 ? (
                  <span className="num text-sm font-semibold text-foreground">{brl(a.valor)}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard
        titulo="Maiores divergências do fechamento"
        descricao="Transações que exigem tratamento manual"
        acoes={
          <Button variant="outline" size="sm" asChild>
            <Link to="/vendas">Abrir conciliação completa</Link>
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NSU</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>PV</TableHead>
                <TableHead>Modalidade</TableHead>
                <TableHead className="text-right">Rede (bruto)</TableHead>
                <TableHead className="text-right">ERP (bruto)</TableHead>
                <TableHead className="text-right">Diferença</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {criticas.map((v) => {
                const dif = v.valorBrutoErp === null ? v.valorBruto : v.valorBruto - v.valorBrutoErp;
                return (
                  <TableRow key={v.id}>
                    <TableCell className="num font-medium">{v.nsu}</TableCell>
                    <TableCell className="num">{dataBr(v.dataVenda)}</TableCell>
                    <TableCell className="num">{v.pv}</TableCell>
                    <TableCell className="text-xs">
                      {v.modalidade}
                      {v.parcelas > 1 ? ` ${v.parcelas}x` : ""}
                    </TableCell>
                    <TableCell className="num text-right">{brl(v.valorBruto)}</TableCell>
                    <TableCell className="num text-right">
                      {v.valorBrutoErp === null ? "—" : brl(v.valorBrutoErp)}
                    </TableCell>
                    <TableCell className="num text-right font-semibold text-destructive">
                      {dif === 0 ? "—" : brl(dif)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={v.status} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </div>
  );
}
