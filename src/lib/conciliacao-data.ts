/**
 * Dados simulados no formato retornado pela API da Rede (e-Rede / Conciliação),
 * cruzados com registros do ERP. Geração determinística (seed fixa) para evitar
 * divergências entre servidor e navegador.
 */

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rnd = mulberry32(20260904);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)]!;
const between = (min: number, max: number) => min + rnd() * (max - min);

export const BANDEIRAS = ["Visa", "Mastercard", "Elo", "Amex", "Hipercard"] as const;
export type Bandeira = (typeof BANDEIRAS)[number];

export const MODALIDADES = [
  "Débito",
  "Crédito à vista",
  "Crédito parcelado",
  "Crédito parcelado emissor",
] as const;
export type Modalidade = (typeof MODALIDADES)[number];

export const PONTOS_VENDA = [
  { pv: "12345678", nome: "Sede São Paulo — Doações presenciais", canal: "POS" },
  { pv: "12345901", nome: "Loja Solidária Vila Mariana", canal: "POS" },
  { pv: "23456712", nome: "Portal de Doações (e-commerce)", canal: "E-commerce" },
  { pv: "23456713", nome: "Campanha Recorrente — Link de pagamento", canal: "Link" },
  { pv: "34567821", nome: "Unidade Sertão — Cantina", canal: "POS" },
] as const;

export type StatusConciliacao =
  | "Conciliado"
  | "Ausente no ERP"
  | "Ausente na Rede"
  | "Divergência de valor"
  | "Divergência de taxa"
  | "Divergência de parcelas"
  | "Em tratamento";

export type VendaConciliacao = {
  id: string;
  nsu: string;
  autorizacao: string;
  dataVenda: string;
  dataAutorizacao: string;
  pv: string;
  pvNome: string;
  canal: string;
  bandeira: Bandeira;
  modalidade: Modalidade;
  parcelas: number;
  parcelasErp: number;
  valorBruto: number;
  valorBrutoErp: number | null;
  taxaPct: number;
  taxaPctContratada: number;
  valorTaxa: number;
  valorLiquido: number;
  documentoErp: string | null;
  status: StatusConciliacao;
  observacao: string;
};

const DIAS = [
  "2026-09-03",
  "2026-09-02",
  "2026-09-01",
  "2026-08-31",
  "2026-08-28",
  "2026-08-27",
] as const;

const TAXA_CONTRATADA: Record<Modalidade, number> = {
  Débito: 0.99,
  "Crédito à vista": 2.39,
  "Crédito parcelado": 2.89,
  "Crédito parcelado emissor": 3.19,
};

function gerarVendas(qtd: number): VendaConciliacao[] {
  const lista: VendaConciliacao[] = [];
  for (let i = 0; i < qtd; i++) {
    const ponto = pick(PONTOS_VENDA);
    const modalidade = pick(MODALIDADES);
    const bandeira = pick(BANDEIRAS);
    const parcelas = modalidade.startsWith("Crédito parcelado")
      ? Math.floor(between(2, 12))
      : 1;
    const valorBruto = Math.round(between(35, 4800) * 100) / 100;
    const contratada = TAXA_CONTRATADA[modalidade];
    const dataVenda = pick(DIAS);
    const sorte = rnd();

    let status: StatusConciliacao = "Conciliado";
    let valorBrutoErp: number | null = valorBruto;
    let taxaPct = contratada;
    let parcelasErp = parcelas;
    let documentoErp: string | null = `NF-${100000 + Math.floor(between(0, 89999))}`;
    let observacao = "Match automático por NSU + autorização + valor.";

    if (sorte > 0.9) {
      status = "Ausente no ERP";
      valorBrutoErp = null;
      documentoErp = null;
      observacao = "Venda liquidada pela Rede sem lançamento correspondente no ERP.";
    } else if (sorte > 0.85) {
      status = "Divergência de valor";
      valorBrutoErp = Math.round((valorBruto - between(1, 90)) * 100) / 100;
      observacao = "Valor bruto do ERP menor que o autorizado pela adquirente.";
    } else if (sorte > 0.8) {
      status = "Divergência de taxa";
      taxaPct = Math.round((contratada + between(0.25, 1.4)) * 100) / 100;
      observacao = "MDR aplicado acima da tabela contratada vigente.";
    } else if (sorte > 0.76) {
      status = "Divergência de parcelas";
      parcelasErp = Math.max(1, parcelas - Math.floor(between(1, 3)));
      observacao = "Quantidade de parcelas do ERP diferente da agenda da Rede.";
    } else if (sorte > 0.72) {
      status = "Ausente na Rede";
      observacao = "Lançamento no ERP sem transação correspondente na Rede.";
    } else if (sorte > 0.68) {
      status = "Em tratamento";
      observacao = "Chamado aberto na Rede — protocolo 2026-0" + Math.floor(between(100, 999));
    }

    const valorTaxa = Math.round(valorBruto * (taxaPct / 100) * 100) / 100;

    lista.push({
      id: `TX-${i.toString().padStart(4, "0")}`,
      nsu: String(Math.floor(between(100000000, 999999999))),
      autorizacao: String(Math.floor(between(100000, 999999))),
      dataVenda,
      dataAutorizacao: dataVenda,
      pv: ponto.pv,
      pvNome: ponto.nome,
      canal: ponto.canal,
      bandeira,
      modalidade,
      parcelas,
      parcelasErp,
      valorBruto,
      valorBrutoErp,
      taxaPct,
      taxaPctContratada: contratada,
      valorTaxa,
      valorLiquido: Math.round((valorBruto - valorTaxa) * 100) / 100,
      documentoErp,
      status,
      observacao,
    });
  }
  return lista;
}

export const vendas = gerarVendas(180);

export type Recebivel = {
  id: string;
  dataPrevista: string;
  pv: string;
  bandeira: Bandeira;
  modalidade: Modalidade;
  valorBruto: number;
  descontos: number;
  antecipacao: number;
  valorLiquido: number;
  banco: string;
  status: "Pago" | "Previsto" | "Antecipado" | "Divergente" | "Bloqueado";
  extratoBancario: number | null;
};

function gerarRecebiveis(): Recebivel[] {
  const lista: Recebivel[] = [];
  const base = new Date("2026-08-30T00:00:00Z");
  for (let i = 0; i < 90; i++) {
    const d = new Date(base.getTime() + Math.floor(between(-6, 62)) * 86400000);
    const iso = d.toISOString().slice(0, 10);
    const valorBruto = Math.round(between(1200, 68000) * 100) / 100;
    const descontos = Math.round(valorBruto * between(0.011, 0.032) * 100) / 100;
    const antecipacao = rnd() > 0.85 ? Math.round(valorBruto * between(0.008, 0.021) * 100) / 100 : 0;
    const valorLiquido = Math.round((valorBruto - descontos - antecipacao) * 100) / 100;
    const passado = iso < "2026-09-04";
    const sorte = rnd();
    const status: Recebivel["status"] = passado
      ? sorte > 0.88
        ? "Divergente"
        : "Pago"
      : antecipacao > 0
        ? "Antecipado"
        : sorte > 0.97
          ? "Bloqueado"
          : "Previsto";
    lista.push({
      id: `RC-${i.toString().padStart(3, "0")}`,
      dataPrevista: iso,
      pv: pick(PONTOS_VENDA).pv,
      bandeira: pick(BANDEIRAS),
      modalidade: pick(MODALIDADES),
      valorBruto,
      descontos,
      antecipacao,
      valorLiquido,
      banco: pick(["Itaú 0341 / ag 1234 / cc 56789-0", "Bradesco 0237 / ag 4455 / cc 11223-4"]),
      status,
      extratoBancario:
        status === "Pago"
          ? valorLiquido
          : status === "Divergente"
            ? Math.round((valorLiquido - between(5, 320)) * 100) / 100
            : null,
    });
  }
  return lista.sort((a, b) => a.dataPrevista.localeCompare(b.dataPrevista));
}

export const recebiveis = gerarRecebiveis();

export type ImportacaoDia = {
  data: string;
  arquivo: string;
  status: "Concluída" | "Parcial" | "Falha" | "Pendente";
  registrosRede: number;
  registrosErp: number;
  inicio: string;
  duracao: string;
  mensagem: string;
};

export const importacoes: ImportacaoDia[] = [
  {
    data: "2026-09-04",
    arquivo: "API Rede · /v1/transactions (D-0)",
    status: "Pendente",
    registrosRede: 0,
    registrosErp: 0,
    inicio: "—",
    duracao: "—",
    mensagem: "Janela de captura abre às 07:30 (BRT).",
  },
  {
    data: "2026-09-03",
    arquivo: "API Rede · /v1/transactions + /v1/settlements",
    status: "Concluída",
    registrosRede: 1184,
    registrosErp: 1179,
    inicio: "07:31",
    duracao: "3m 12s",
    mensagem: "5 transações sem par no ERP encaminhadas para exceções.",
  },
  {
    data: "2026-09-02",
    arquivo: "API Rede · /v1/transactions + /v1/settlements",
    status: "Parcial",
    registrosRede: 1042,
    registrosErp: 1042,
    inicio: "07:30",
    duracao: "6m 48s",
    mensagem: "Paginação interrompida (HTTP 429). Reprocessamento concluído às 09:12.",
  },
  {
    data: "2026-09-01",
    arquivo: "API Rede · /v1/transactions + /v1/settlements",
    status: "Concluída",
    registrosRede: 1631,
    registrosErp: 1628,
    inicio: "07:29",
    duracao: "4m 02s",
    mensagem: "Conciliação automática de 99,8% do volume.",
  },
  {
    data: "2026-08-31",
    arquivo: "API Rede · /v1/transactions + /v1/settlements",
    status: "Falha",
    registrosRede: 0,
    registrosErp: 954,
    inicio: "07:30",
    duracao: "0m 41s",
    mensagem: "Token OAuth expirado (HTTP 401). Reprocessado manualmente em 31/08 14:20.",
  },
];

export type Alerta = {
  id: string;
  severidade: "Crítico" | "Atenção" | "Informativo";
  titulo: string;
  detalhe: string;
  valor: number;
  quando: string;
};

export const alertas: Alerta[] = [
  {
    id: "AL-01",
    severidade: "Crítico",
    titulo: "Repasse não identificado no extrato",
    detalhe: "Liquidação prevista para 02/09 (Itaú ag 1234) não localizada no extrato bancário.",
    valor: 48213.77,
    quando: "há 2 dias",
  },
  {
    id: "AL-02",
    severidade: "Crítico",
    titulo: "MDR acima da tabela contratada",
    detalhe: "14 transações de crédito parcelado com taxa 3,9% (contratado 2,89%).",
    valor: 3187.42,
    quando: "há 6 horas",
  },
  {
    id: "AL-03",
    severidade: "Atenção",
    titulo: "Vendas da Rede ausentes no ERP",
    detalhe: "18 transações capturadas pela adquirente sem lançamento contábil correspondente.",
    valor: 21764.9,
    quando: "hoje 07:34",
  },
  {
    id: "AL-04",
    severidade: "Atenção",
    titulo: "Antecipação automática detectada",
    detalhe: "3 agendas antecipadas pela Rede reduzem o caixa previsto de outubro.",
    valor: 9420.15,
    quando: "há 1 dia",
  },
  {
    id: "AL-05",
    severidade: "Informativo",
    titulo: "Novo PV habilitado",
    detalhe: "PV 34567821 (Unidade Sertão) começou a transmitir transações via API.",
    valor: 0,
    quando: "há 3 dias",
  },
];

export type ProjecaoMes = {
  mes: string;
  previsto: number;
  contratado: number;
  antecipado: number;
  realizado: number | null;
};

export const projecoes: ProjecaoMes[] = [
  { mes: "Jun/26", previsto: 812000, contratado: 812000, antecipado: 21000, realizado: 806400 },
  { mes: "Jul/26", previsto: 874500, contratado: 874500, antecipado: 15400, realizado: 869900 },
  { mes: "Ago/26", previsto: 921300, contratado: 921300, antecipado: 33800, realizado: 914250 },
  { mes: "Set/26", previsto: 968400, contratado: 742100, antecipado: 28600, realizado: null },
  { mes: "Out/26", previsto: 1024700, contratado: 512300, antecipado: 9420, realizado: null },
  { mes: "Nov/26", previsto: 1132900, contratado: 318700, antecipado: 0, realizado: null },
  { mes: "Dez/26", previsto: 1487200, contratado: 174900, antecipado: 0, realizado: null },
  { mes: "Jan/27", previsto: 962400, contratado: 61200, antecipado: 0, realizado: null },
];

export const serieDiaria = DIAS.slice()
  .reverse()
  .map((dia) => {
    const doDia = vendas.filter((v) => v.dataVenda === dia);
    const total = doDia.reduce((s, v) => s + v.valorBruto, 0);
    const conciliado = doDia
      .filter((v) => v.status === "Conciliado")
      .reduce((s, v) => s + v.valorBruto, 0);
    return {
      dia: dia.slice(8) + "/" + dia.slice(5, 7),
      total: Math.round(total),
      conciliado: Math.round(conciliado),
      divergente: Math.round(total - conciliado),
    };
  });

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const pct = (v: number) =>
  `${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

export const dataBr = (iso: string) => iso.split("-").reverse().join("/");

export const resumo = (() => {
  const total = vendas.reduce((s, v) => s + v.valorBruto, 0);
  const conciliadas = vendas.filter((v) => v.status === "Conciliado");
  const divergentes = vendas.filter(
    (v) => v.status !== "Conciliado" && v.status !== "Em tratamento",
  );
  const ausentesErp = vendas.filter((v) => v.status === "Ausente no ERP");
  const taxaTotal = vendas.reduce((s, v) => s + v.valorTaxa, 0);
  const taxaExcedente = vendas
    .filter((v) => v.taxaPct > v.taxaPctContratada)
    .reduce((s, v) => s + (v.valorBruto * (v.taxaPct - v.taxaPctContratada)) / 100, 0);
  return {
    totalBruto: total,
    totalLiquido: vendas.reduce((s, v) => s + v.valorLiquido, 0),
    taxaTotal,
    taxaMediaPct: (taxaTotal / total) * 100,
    taxaExcedente,
    qtdTransacoes: vendas.length,
    percConciliado: (conciliadas.length / vendas.length) * 100,
    qtdDivergentes: divergentes.length,
    valorDivergente: divergentes.reduce((s, v) => s + v.valorBruto, 0),
    qtdAusentesErp: ausentesErp.length,
    valorAusentesErp: ausentesErp.reduce((s, v) => s + v.valorBruto, 0),
    aReceber30: recebiveis
      .filter((r) => r.dataPrevista >= "2026-09-04" && r.dataPrevista <= "2026-10-04")
      .reduce((s, r) => s + r.valorLiquido, 0),
    aReceberTotal: recebiveis
      .filter((r) => r.dataPrevista >= "2026-09-04")
      .reduce((s, r) => s + r.valorLiquido, 0),
  };
})();
