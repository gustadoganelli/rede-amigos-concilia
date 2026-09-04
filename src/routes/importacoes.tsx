import { createFileRoute } from "@tanstack/react-router";
import { Database, PlugZap, RefreshCw, ServerCog } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KpiCard, PageHeader, SectionCard, StatusBadge } from "@/components/painel/ui-blocos";
import { PONTOS_VENDA, dataBr, importacoes } from "@/lib/conciliacao-data";

export const Route = createFileRoute("/importacoes")({
  head: () => ({
    meta: [
      { title: "Importações da API da Rede · Amigos do Bem" },
      {
        name: "description",
        content:
          "Status diário da integração com a API da Rede: endpoints consumidos, registros importados, falhas e reprocessamentos.",
      },
      { property: "og:title", content: "Importações da API da Rede" },
      {
        property: "og:description",
        content: "Monitore a captura diária de transações e liquidações por ponto de venda.",
      },
    ],
  }),
  component: Importacoes,
});

const ENDPOINTS = [
  {
    nome: "GET /v1/transactions",
    descricao: "Transações autorizadas e canceladas (D-1), paginação de 500 registros",
    ultima: "04/09/2026 07:34",
    status: "Concluída",
  },
  {
    nome: "GET /v1/settlements",
    descricao: "Agenda financeira e liquidações confirmadas por PV",
    ultima: "04/09/2026 07:36",
    status: "Concluída",
  },
  {
    nome: "GET /v1/adjustments",
    descricao: "Ajustes, chargebacks e cancelamentos pós-liquidação",
    ultima: "04/09/2026 07:37",
    status: "Parcial",
  },
  {
    nome: "POST /oauth/token",
    descricao: "Renovação de credenciais (client_credentials), TTL 3600s",
    ultima: "04/09/2026 07:30",
    status: "Concluída",
  },
  {
    nome: "ERP · /api/financeiro/lancamentos",
    descricao: "Lançamentos de cartão do ERP para o motor de match",
    ultima: "04/09/2026 07:33",
    status: "Concluída",
  },
];

function Importacoes() {
  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Importações da Rede"
        descricao="Rotina automática de captura às 07:30 (BRT) e reprocessamentos manuais, com log por endpoint e por ponto de venda."
        acoes={
          <>
            <Button
              variant="outline"
              onClick={() => toast.success("Credenciais OAuth renovadas com sucesso.")}
            >
              <PlugZap className="mr-2 h-4 w-4" /> Testar conexão
            </Button>
            <Button onClick={() => toast.success("Importação manual iniciada para D-1.")}>
              <RefreshCw className="mr-2 h-4 w-4" /> Importar agora
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard rotulo="Disponibilidade da API (30d)" valor="99,4%" tom="positivo" variacao={0.3} />
        <KpiCard
          rotulo="Registros importados (D-1)"
          valor="1.184"
          detalhe="1.179 casados com o ERP"
          tom="marca"
          icone={<Database className="h-4 w-4" />}
        />
        <KpiCard rotulo="Falhas nos últimos 30 dias" valor="2" detalhe="401 e 429" tom="alerta" />
        <KpiCard
          rotulo="Tempo médio de processamento"
          valor="3m 48s"
          tom="neutro"
          icone={<ServerCog className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard className="lg:col-span-2" titulo="Endpoints monitorados">
          <ul className="divide-y divide-border">
            {ENDPOINTS.map((e) => (
              <li key={e.nome} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="num text-sm font-semibold text-foreground">{e.nome}</p>
                  <p className="text-xs text-muted-foreground">{e.descricao}</p>
                </div>
                <span className="num hidden text-xs text-muted-foreground sm:block">
                  {e.ultima}
                </span>
                <StatusBadge status={e.status} />
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard titulo="Parâmetros da rotina">
          <div className="space-y-4">
            {[
              ["Importação automática diária (07:30 BRT)", true],
              ["Rematch automático por NSU + autorização", true],
              ["Tolerância de R$ 0,05 em arredondamento", true],
              ["Bloquear liquidação com divergência de MDR", false],
              ["Notificar financeiro por e-mail", true],
            ].map(([rotulo, ativo]) => (
              <div key={String(rotulo)} className="flex items-center justify-between gap-3">
                <Label className="text-xs leading-snug text-muted-foreground">
                  {String(rotulo)}
                </Label>
                <Switch
                  defaultChecked={Boolean(ativo)}
                  onCheckedChange={() => toast.success("Parâmetro atualizado.")}
                />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard titulo="Histórico de execuções" descricao="Últimos 5 dias">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead className="text-right">Registros Rede</TableHead>
                <TableHead className="text-right">Registros ERP</TableHead>
                <TableHead>Cobertura</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Log</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {importacoes.map((i) => (
                <TableRow key={i.data}>
                  <TableCell className="num font-medium">{dataBr(i.data)}</TableCell>
                  <TableCell className="text-xs">{i.arquivo}</TableCell>
                  <TableCell className="num">{i.inicio}</TableCell>
                  <TableCell className="num">{i.duracao}</TableCell>
                  <TableCell className="num text-right">
                    {i.registrosRede.toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell className="num text-right">
                    {i.registrosErp.toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell className="w-32">
                    <Progress
                      value={
                        i.registrosRede > 0
                          ? Math.min(100, (i.registrosErp / i.registrosRede) * 100)
                          : 0
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={i.status} />
                  </TableCell>
                  <TableCell className="max-w-[280px] text-xs text-muted-foreground">
                    {i.mensagem}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      <SectionCard titulo="Cobertura por ponto de venda" descricao="Transmissão via API da Rede">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {PONTOS_VENDA.map((p, idx) => (
            <div key={p.pv} className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <span className="num text-sm font-semibold text-foreground">{p.pv}</span>
                <StatusBadge status={idx === 4 ? "Pendente" : "Concluída"} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{p.nome}</p>
              <p className="mt-2 text-[11px] text-muted-foreground">Canal: {p.canal}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
