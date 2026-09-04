import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Banknote, CalendarClock, TriangleAlert, Wallet } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KpiCard, PageHeader, SectionCard, StatusBadge } from "@/components/painel/ui-blocos";
import { PONTOS_VENDA, brl, dataBr, recebiveis } from "@/lib/conciliacao-data";

export const Route = createFileRoute("/recebiveis")({
  head: () => ({
    meta: [
      { title: "Agenda de recebíveis Rede · Amigos do Bem" },
      {
        name: "description",
        content:
          "Conciliação de recebíveis: agenda de liquidação da Rede confrontada com o extrato bancário e com o contas a receber do ERP.",
      },
      { property: "og:title", content: "Agenda de recebíveis Rede" },
      {
        property: "og:description",
        content: "Liquidações previstas, pagas, antecipadas e divergentes por data e ponto de venda.",
      },
    ],
  }),
  component: Recebiveis,
});

const HOJE = "2026-09-04";

function Recebiveis() {
  const [aba, setAba] = useState("todos");
  const [pv, setPv] = useState("todos");

  const filtrados = useMemo(
    () =>
      recebiveis.filter((r) => {
        if (pv !== "todos" && r.pv !== pv) return false;
        if (aba === "pendentes" && r.dataPrevista < HOJE) return false;
        if (aba === "liquidados" && r.status !== "Pago") return false;
        if (aba === "divergentes" && r.status !== "Divergente") return false;
        if (aba === "antecipados" && r.status !== "Antecipado") return false;
        return true;
      }),
    [aba, pv],
  );

  const serie = useMemo(() => {
    const mapa = new Map<string, { data: string; liquido: number; acumulado: number }>();
    for (const r of recebiveis.filter((x) => x.dataPrevista >= HOJE)) {
      const atual = mapa.get(r.dataPrevista) ?? {
        data: r.dataPrevista,
        liquido: 0,
        acumulado: 0,
      };
      atual.liquido += r.valorLiquido;
      mapa.set(r.dataPrevista, atual);
    }
    let acc = 0;
    return [...mapa.values()]
      .sort((a, b) => a.data.localeCompare(b.data))
      .map((d) => {
        acc += d.liquido;
        return {
          rotulo: dataBr(d.data).slice(0, 5),
          liquido: Math.round(d.liquido),
          acumulado: Math.round(acc),
        };
      });
  }, []);

  const aReceber = recebiveis
    .filter((r) => r.dataPrevista >= HOJE)
    .reduce((s, r) => s + r.valorLiquido, 0);
  const divergentes = recebiveis.filter((r) => r.status === "Divergente");
  const antecipados = recebiveis.filter((r) => r.status === "Antecipado");
  const proximos7 = recebiveis
    .filter((r) => r.dataPrevista >= HOJE && r.dataPrevista <= "2026-09-11")
    .reduce((s, r) => s + r.valorLiquido, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Conciliação de recebíveis"
        descricao="Agenda financeira da Rede (/v1/settlements) confrontada com o extrato bancário e o contas a receber do ERP, incluindo descontos e antecipações."
        acoes={
          <Button
            variant="outline"
            onClick={() => toast.success("Extrato bancário OFX reimportado e reconciliado.")}
          >
            Reimportar extrato
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          rotulo="A receber (total em agenda)"
          valor={brl(aReceber)}
          detalhe="líquido de MDR e antecipações"
          tom="marca"
          icone={<Wallet className="h-4 w-4" />}
        />
        <KpiCard
          rotulo="Próximos 7 dias"
          valor={brl(proximos7)}
          detalhe="Itaú ag 1234 e Bradesco ag 4455"
          tom="positivo"
          icone={<CalendarClock className="h-4 w-4" />}
        />
        <KpiCard
          rotulo="Liquidações divergentes"
          valor={brl(
            divergentes.reduce((s, r) => s + (r.valorLiquido - (r.extratoBancario ?? 0)), 0),
          )}
          detalhe={`${divergentes.length} repasses com diferença no extrato`}
          tom="critico"
          icone={<TriangleAlert className="h-4 w-4" />}
        />
        <KpiCard
          rotulo="Antecipações no período"
          valor={brl(antecipados.reduce((s, r) => s + r.antecipacao, 0))}
          detalhe={`${antecipados.length} agendas antecipadas`}
          tom="alerta"
          icone={<Banknote className="h-4 w-4" />}
        />
      </div>

      <SectionCard
        titulo="Curva de liquidação prevista"
        descricao="Recebimento líquido diário e caixa acumulado dos próximos 60 dias"
      >
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={serie}>
              <defs>
                <linearGradient id="grad-acc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="rotulo" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={11}
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
              <Area
                type="monotone"
                dataKey="acumulado"
                name="Caixa acumulado"
                stroke="var(--primary)"
                fill="url(#grad-acc)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="liquido"
                name="Liquidação do dia"
                stroke="var(--brand-orange)"
                fill="transparent"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <SectionCard
        titulo="Agenda detalhada"
        descricao={`${filtrados.length} lançamentos na visão atual`}
        acoes={
          <Select value={pv} onValueChange={setPv}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="PV" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os PVs</SelectItem>
              {PONTOS_VENDA.map((p) => (
                <SelectItem key={p.pv} value={p.pv}>
                  {p.pv}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      >
        <Tabs value={aba} onValueChange={setAba} className="mb-4">
          <TabsList>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="pendentes">Previstos</TabsTrigger>
            <TabsTrigger value="liquidados">Liquidados</TabsTrigger>
            <TabsTrigger value="divergentes">Divergentes</TabsTrigger>
            <TabsTrigger value="antecipados">Antecipados</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data prevista</TableHead>
                <TableHead>PV</TableHead>
                <TableHead>Bandeira</TableHead>
                <TableHead>Modalidade</TableHead>
                <TableHead className="text-right">Bruto</TableHead>
                <TableHead className="text-right">Descontos</TableHead>
                <TableHead className="text-right">Antecipação</TableHead>
                <TableHead className="text-right">Líquido Rede</TableHead>
                <TableHead className="text-right">Extrato banco</TableHead>
                <TableHead>Conta de crédito</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.slice(0, 60).map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="num font-medium">{dataBr(r.dataPrevista)}</TableCell>
                  <TableCell className="num">{r.pv}</TableCell>
                  <TableCell className="text-xs">{r.bandeira}</TableCell>
                  <TableCell className="text-xs">{r.modalidade}</TableCell>
                  <TableCell className="num text-right">{brl(r.valorBruto)}</TableCell>
                  <TableCell className="num text-right text-muted-foreground">
                    -{brl(r.descontos)}
                  </TableCell>
                  <TableCell className="num text-right text-muted-foreground">
                    {r.antecipacao > 0 ? `-${brl(r.antecipacao)}` : "—"}
                  </TableCell>
                  <TableCell className="num text-right font-semibold">
                    {brl(r.valorLiquido)}
                  </TableCell>
                  <TableCell
                    className={
                      r.status === "Divergente"
                        ? "num text-right font-semibold text-destructive"
                        : "num text-right"
                    }
                  >
                    {r.extratoBancario === null ? "—" : brl(r.extratoBancario)}
                  </TableCell>
                  <TableCell className="num text-[11px] text-muted-foreground">
                    {r.banco}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        toast.success(
                          r.status === "Divergente"
                            ? `Divergência do repasse ${dataBr(r.dataPrevista)} enviada ao financeiro.`
                            : `Repasse ${r.id} conciliado manualmente.`,
                        )
                      }
                    >
                      Tratar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </div>
  );
}
