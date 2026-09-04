import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Filter, Link2, Search, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  BANDEIRAS,
  MODALIDADES,
  PONTOS_VENDA,
  brl,
  dataBr,
  pct,
  vendas,
  type VendaConciliacao,
} from "@/lib/conciliacao-data";

export const Route = createFileRoute("/vendas")({
  head: () => ({
    meta: [
      { title: "Conciliação de vendas Rede × ERP · Amigos do Bem" },
      {
        name: "description",
        content:
          "Tabela detalhada de transações da Rede confrontadas com o ERP: NSU, autorização, bandeira, modalidade, parcelas, MDR e status de conciliação.",
      },
      { property: "og:title", content: "Conciliação de vendas Rede × ERP" },
      {
        property: "og:description",
        content: "Filtre, investigue e trate divergências de valor, taxa e parcelas.",
      },
    ],
  }),
  component: Vendas,
});

const STATUS = [
  "Conciliado",
  "Ausente no ERP",
  "Ausente na Rede",
  "Divergência de valor",
  "Divergência de taxa",
  "Divergência de parcelas",
  "Em tratamento",
] as const;

function Vendas() {
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<string>("todos");
  const [bandeira, setBandeira] = useState<string>("todas");
  const [modalidade, setModalidade] = useState<string>("todas");
  const [pv, setPv] = useState<string>("todos");
  const [selecao, setSelecao] = useState<string[]>([]);
  const [detalhe, setDetalhe] = useState<VendaConciliacao | null>(null);

  const filtradas = useMemo(
    () =>
      vendas.filter((v) => {
        if (status !== "todos" && v.status !== status) return false;
        if (bandeira !== "todas" && v.bandeira !== bandeira) return false;
        if (modalidade !== "todas" && v.modalidade !== modalidade) return false;
        if (pv !== "todos" && v.pv !== pv) return false;
        if (busca) {
          const t = busca.toLowerCase();
          if (
            !v.nsu.includes(t) &&
            !v.autorizacao.includes(t) &&
            !(v.documentoErp ?? "").toLowerCase().includes(t)
          )
            return false;
        }
        return true;
      }),
    [busca, status, bandeira, modalidade, pv],
  );

  const visiveis = filtradas.slice(0, 60);
  const totalBruto = filtradas.reduce((s, v) => s + v.valorBruto, 0);
  const totalTaxa = filtradas.reduce((s, v) => s + v.valorTaxa, 0);
  const conciliadas = filtradas.filter((v) => v.status === "Conciliado").length;

  const limpar = () => {
    setBusca("");
    setStatus("todos");
    setBandeira("todas");
    setModalidade("todas");
    setPv("todos");
  };

  const alternar = (id: string) =>
    setSelecao((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Conciliação de vendas"
        descricao="Cada transação da API da Rede (/v1/transactions) é confrontada com o lançamento do ERP por NSU, código de autorização, valor e agenda de parcelas."
        acoes={
          <>
            <Button
              variant="outline"
              onClick={() => toast.success("Arquivo CSV das transações filtradas gerado.")}
            >
              Exportar seleção
            </Button>
            <Button
              onClick={() =>
                toast.success("Reconciliação automática executada para os filtros atuais.")
              }
            >
              <Link2 className="mr-2 h-4 w-4" /> Rematch automático
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          rotulo="Transações filtradas"
          valor={filtradas.length.toLocaleString("pt-BR")}
          detalhe={`${conciliadas} conciliadas`}
          tom="marca"
        />
        <KpiCard rotulo="Valor bruto" valor={brl(totalBruto)} tom="neutro" />
        <KpiCard
          rotulo="MDR retido"
          valor={brl(totalTaxa)}
          detalhe={totalBruto > 0 ? `${pct((totalTaxa / totalBruto) * 100)} efetivo` : undefined}
          tom="alerta"
        />
        <KpiCard
          rotulo="Valor líquido a liquidar"
          valor={brl(totalBruto - totalTaxa)}
          tom="positivo"
        />
      </div>

      <SectionCard
        titulo="Filtros"
        descricao="Combine período, PV, bandeira, modalidade e status de conciliação"
        acoes={
          <Button variant="ghost" size="sm" onClick={limpar}>
            <X className="mr-1 h-3.5 w-3.5" /> Limpar
          </Button>
        }
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="relative">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="NSU, autorização ou NF do ERP"
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {STATUS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={bandeira} onValueChange={setBandeira}>
            <SelectTrigger>
              <SelectValue placeholder="Bandeira" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as bandeiras</SelectItem>
              {BANDEIRAS.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={modalidade} onValueChange={setModalidade}>
            <SelectTrigger>
              <SelectValue placeholder="Modalidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as modalidades</SelectItem>
              {MODALIDADES.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={pv} onValueChange={setPv}>
            <SelectTrigger>
              <SelectValue placeholder="Ponto de venda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os PVs</SelectItem>
              {PONTOS_VENDA.map((p) => (
                <SelectItem key={p.pv} value={p.pv}>
                  {p.pv} · {p.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </SectionCard>

      {selecao.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
          <span className="num text-sm font-semibold text-primary">
            {selecao.length} transações selecionadas
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              toast.success(`${selecao.length} transações enviadas para lançamento no ERP.`);
              setSelecao([]);
            }}
          >
            <Send className="mr-1.5 h-3.5 w-3.5" /> Lançar no ERP
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              toast.success("Chamado aberto na Rede para as transações selecionadas.");
              setSelecao([]);
            }}
          >
            Abrir chamado na Rede
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              toast("Divergências marcadas como justificadas.");
              setSelecao([]);
            }}
          >
            Justificar divergência
          </Button>
        </div>
      ) : null}

      <SectionCard
        titulo="Transações"
        descricao={`Exibindo ${visiveis.length} de ${filtradas.length} registros`}
        acoes={
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" /> D-6 a D-1
          </span>
        }
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>NSU</TableHead>
                <TableHead>Autorização</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>PV / canal</TableHead>
                <TableHead>Bandeira</TableHead>
                <TableHead>Modalidade</TableHead>
                <TableHead className="text-center">Parc. Rede/ERP</TableHead>
                <TableHead className="text-right">Bruto Rede</TableHead>
                <TableHead className="text-right">Bruto ERP</TableHead>
                <TableHead className="text-right">MDR</TableHead>
                <TableHead className="text-right">Líquido</TableHead>
                <TableHead>Doc. ERP</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiveis.map((v) => (
                <TableRow
                  key={v.id}
                  className="cursor-pointer"
                  onClick={() => setDetalhe(v)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selecao.includes(v.id)}
                      onCheckedChange={() => alternar(v.id)}
                      aria-label="Selecionar transação"
                    />
                  </TableCell>
                  <TableCell className="num font-medium">{v.nsu}</TableCell>
                  <TableCell className="num">{v.autorizacao}</TableCell>
                  <TableCell className="num">{dataBr(v.dataVenda)}</TableCell>
                  <TableCell className="text-xs">
                    <span className="num">{v.pv}</span>
                    <span className="block text-muted-foreground">{v.canal}</span>
                  </TableCell>
                  <TableCell className="text-xs">{v.bandeira}</TableCell>
                  <TableCell className="text-xs">{v.modalidade}</TableCell>
                  <TableCell
                    className={
                      v.parcelas === v.parcelasErp
                        ? "num text-center text-xs"
                        : "num text-center text-xs font-semibold text-destructive"
                    }
                  >
                    {v.parcelas}/{v.parcelasErp}
                  </TableCell>
                  <TableCell className="num text-right">{brl(v.valorBruto)}</TableCell>
                  <TableCell className="num text-right">
                    {v.valorBrutoErp === null ? (
                      <span className="text-destructive">ausente</span>
                    ) : (
                      brl(v.valorBrutoErp)
                    )}
                  </TableCell>
                  <TableCell
                    className={
                      v.taxaPct > v.taxaPctContratada
                        ? "num text-right text-warning-foreground"
                        : "num text-right"
                    }
                  >
                    {pct(v.taxaPct)}
                  </TableCell>
                  <TableCell className="num text-right">{brl(v.valorLiquido)}</TableCell>
                  <TableCell className="num text-xs">{v.documentoErp ?? "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={v.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <Sheet open={detalhe !== null} onOpenChange={(o) => !o && setDetalhe(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {detalhe ? (
            <>
              <SheetHeader>
                <SheetTitle>Transação NSU {detalhe.nsu}</SheetTitle>
                <SheetDescription>{detalhe.observacao}</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-4 pb-6">
                <StatusBadge status={detalhe.status} />
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ["Autorização", detalhe.autorizacao],
                    ["Data da venda", dataBr(detalhe.dataVenda)],
                    ["Ponto de venda", `${detalhe.pv} · ${detalhe.canal}`],
                    ["Estabelecimento", detalhe.pvNome],
                    ["Bandeira", detalhe.bandeira],
                    ["Modalidade", detalhe.modalidade],
                    ["Parcelas Rede", String(detalhe.parcelas)],
                    ["Parcelas ERP", String(detalhe.parcelasErp)],
                    ["Bruto Rede", brl(detalhe.valorBruto)],
                    [
                      "Bruto ERP",
                      detalhe.valorBrutoErp === null ? "—" : brl(detalhe.valorBrutoErp),
                    ],
                    ["MDR aplicado", pct(detalhe.taxaPct)],
                    ["MDR contratado", pct(detalhe.taxaPctContratada)],
                    ["Valor do MDR", brl(detalhe.valorTaxa)],
                    ["Líquido previsto", brl(detalhe.valorLiquido)],
                    ["Documento ERP", detalhe.documentoErp ?? "não localizado"],
                  ].map(([k, val]) => (
                    <div key={k} className="rounded-md border border-border bg-muted/30 p-2.5">
                      <dt className="text-[11px] text-muted-foreground uppercase">{k}</dt>
                      <dd className="num mt-0.5 font-medium text-foreground">{val}</dd>
                    </div>
                  ))}
                </dl>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      toast.success("Lançamento criado no ERP e vínculo registrado.");
                      setDetalhe(null);
                    }}
                  >
                    Lançar no ERP
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      toast.success("Chamado aberto na Rede.");
                      setDetalhe(null);
                    }}
                  >
                    Abrir chamado
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      toast("Divergência justificada com registro de auditoria.");
                      setDetalhe(null);
                    }}
                  >
                    Justificar
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
