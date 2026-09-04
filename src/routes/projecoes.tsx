import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Target, TrendingUp, Wallet } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KpiCard, PageHeader, SectionCard } from "@/components/painel/ui-blocos";
import { brl, pct, projecoes, recebiveis } from "@/lib/conciliacao-data";

export const Route = createFileRoute("/projecoes")({
  head: () => ({
    meta: [
      { title: "Projeções de caixa e recebíveis · Amigos do Bem" },
      {
        name: "description",
        content:
          "Visão estratégica: projeção de caixa dos recebíveis de cartão, cenários de crescimento, custo de MDR e impacto de antecipações.",
      },
      { property: "og:title", content: "Projeções de caixa e recebíveis" },
      {
        property: "og:description",
        content: "Simule cenários de doações e antecipação para planejar o caixa dos próximos meses.",
      },
    ],
  }),
  component: Projecoes,
});

function Projecoes() {
  const [crescimento, setCrescimento] = useState([6]);
  const [antecipacao, setAntecipacao] = useState([10]);
  const g = (crescimento[0] ?? 0) / 100;
  const a = (antecipacao[0] ?? 0) / 100;

  const dados = projecoes.map((p, i) => {
    const futuro = p.realizado === null;
    const fator = futuro ? Math.pow(1 + g, i - 2) : 1;
    const cenario = Math.round(p.previsto * fator);
    return {
      ...p,
      cenario,
      caixaComAntecipacao: Math.round(cenario * (1 - a) + cenario * a * 0.982),
    };
  });

  const futuros = dados.filter((d) => d.realizado === null);
  const totalPrevisto = futuros.reduce((s, d) => s + d.cenario, 0);
  const custoAntecipacao = futuros.reduce(
    (s, d) => s + (d.cenario * a * 0.018),
    0,
  );
  const contratado = futuros.reduce((s, d) => s + d.contratado, 0);

  const porModalidade = ["Débito", "Crédito à vista", "Crédito parcelado", "Crédito parcelado emissor"].map(
    (m) => ({
      modalidade: m.replace("Crédito ", "Créd. "),
      valor: Math.round(
        recebiveis
          .filter((r) => r.modalidade === m && r.dataPrevista >= "2026-09-04")
          .reduce((s, r) => s + r.valorLiquido, 0),
      ),
    }),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Projeções de caixa"
        descricao="Visão estratégica dos recebíveis de cartão: agenda contratada, projeção de novas doações e simulação de antecipação."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          rotulo="Projeção 5 meses (cenário atual)"
          valor={brl(totalPrevisto)}
          detalhe={`crescimento de ${pct(crescimento[0] ?? 0)} a.m.`}
          tom="marca"
          icone={<TrendingUp className="h-4 w-4" />}
        />
        <KpiCard
          rotulo="Já contratado em agenda"
          valor={brl(contratado)}
          detalhe={`${pct((contratado / totalPrevisto) * 100)} do previsto`}
          tom="positivo"
          icone={<Wallet className="h-4 w-4" />}
        />
        <KpiCard
          rotulo="Custo estimado de antecipação"
          valor={brl(custoAntecipacao)}
          detalhe={`${pct(antecipacao[0] ?? 0)} da carteira antecipada a 1,8%`}
          tom="alerta"
          icone={<Sparkles className="h-4 w-4" />}
        />
        <KpiCard
          rotulo="Meta anual de arrecadação"
          valor="R$ 12,4 mi"
          detalhe="78% atingido até set/26"
          variacao={5.6}
          tom="neutro"
          icone={<Target className="h-4 w-4" />}
        />
      </div>

      <SectionCard
        titulo="Realizado, contratado e projetado"
        descricao="Valores líquidos por competência (R$)"
      >
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dados}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={12} />
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
                dataKey="contratado"
                name="Agenda contratada"
                fill="var(--primary)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="realizado"
                name="Realizado"
                fill="var(--success)"
                radius={[4, 4, 0, 0]}
              />
              <Line
                type="monotone"
                dataKey="cenario"
                name="Projeção (cenário)"
                stroke="var(--brand-orange)"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="caixaComAntecipacao"
                name="Caixa com antecipação"
                stroke="var(--brand-gold)"
                strokeDasharray="5 4"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard titulo="Simulador de cenários" className="lg:col-span-1">
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Crescimento mensal de doações</span>
                <span className="num font-semibold">{pct(crescimento[0] ?? 0)}</span>
              </div>
              <Slider
                value={crescimento}
                onValueChange={setCrescimento}
                min={-10}
                max={25}
                step={1}
                className="mt-3"
              />
            </div>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Carteira antecipada</span>
                <span className="num font-semibold">{pct(antecipacao[0] ?? 0)}</span>
              </div>
              <Slider
                value={antecipacao}
                onValueChange={setAntecipacao}
                min={0}
                max={100}
                step={5}
                className="mt-3"
              />
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
              <p className="text-muted-foreground">Caixa disponível antecipando hoje</p>
              <p className="num mt-1 text-xl font-semibold text-foreground">
                {brl(totalPrevisto - custoAntecipacao)}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Considera taxa de antecipação de 1,8% a.m. e MDR médio já retido na agenda da Rede.
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          className="lg:col-span-2"
          titulo="Recebíveis futuros por modalidade"
          descricao="Valor líquido em agenda (R$)"
        >
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porModalidade} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="modalidade"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  width={130}
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
                <Bar dataKey="valor" name="Líquido" fill="var(--brand-gold)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <SectionCard titulo="Detalhamento da projeção" descricao="Competências de jun/26 a jan/27">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Competência</TableHead>
                <TableHead className="text-right">Realizado</TableHead>
                <TableHead className="text-right">Agenda contratada</TableHead>
                <TableHead className="text-right">Projeção total</TableHead>
                <TableHead className="text-right">Antecipado</TableHead>
                <TableHead className="text-right">Caixa no cenário</TableHead>
                <TableHead className="text-right">Cobertura contratada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dados.map((d) => (
                <TableRow key={d.mes}>
                  <TableCell className="font-medium">{d.mes}</TableCell>
                  <TableCell className="num text-right">
                    {d.realizado === null ? "—" : brl(d.realizado)}
                  </TableCell>
                  <TableCell className="num text-right">{brl(d.contratado)}</TableCell>
                  <TableCell className="num text-right">{brl(d.cenario)}</TableCell>
                  <TableCell className="num text-right text-muted-foreground">
                    {d.antecipado > 0 ? brl(d.antecipado) : "—"}
                  </TableCell>
                  <TableCell className="num text-right font-semibold">
                    {brl(d.caixaComAntecipacao)}
                  </TableCell>
                  <TableCell className="num text-right">
                    {pct((d.contratado / d.cenario) * 100)}
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
