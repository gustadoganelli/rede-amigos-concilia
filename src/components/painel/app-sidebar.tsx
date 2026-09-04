import { Link, useRouterState } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarClock,
  CreditCard,
  Download,
  LayoutDashboard,
  LineChart,
  ShieldCheck,
} from "lucide-react";
import logo from "@/assets/logo-amigos-do-bem.png.asset.json";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

const operacional = [
  { titulo: "Visão diária", url: "/", icon: LayoutDashboard },
  { titulo: "Conciliação de vendas", url: "/vendas", icon: CreditCard, marcador: "42" },
  { titulo: "Exceções e alertas", url: "/excecoes", icon: AlertTriangle, marcador: "18" },
  { titulo: "Importações da Rede", url: "/importacoes", icon: Download },
];

const estrategico = [
  { titulo: "Agenda de recebíveis", url: "/recebiveis", icon: CalendarClock },
  { titulo: "Projeções de caixa", url: "/projecoes", icon: LineChart },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const colapsada = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });

  const render = (
    itens: { titulo: string; url: string; icon: typeof CreditCard; marcador?: string }[],
  ) => (
    <SidebarMenu>
      {itens.map((item) => (
        <SidebarMenuItem key={item.url}>
          <SidebarMenuButton asChild isActive={path === item.url} tooltip={item.titulo}>
            <Link to={item.url} className="flex items-center gap-2">
              <item.icon className="h-4 w-4 shrink-0" />
              {!colapsada && <span className="truncate">{item.titulo}</span>}
              {!colapsada && item.marcador ? (
                <Badge className="num ml-auto h-5 rounded-full bg-brand-gold px-1.5 text-[11px] text-accent-foreground">
                  {item.marcador}
                </Badge>
              ) : null}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-1 py-2">
          <img
            src={logo.url}
            alt="Amigos do Bem"
            className="h-9 w-9 shrink-0 rounded-full bg-white/95 object-contain p-0.5"
          />
          {!colapsada && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">
                Amigos do Bem
              </p>
              <p className="truncate text-[11px] text-sidebar-foreground/60">
                Conciliação Rede × ERP
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operacional</SidebarGroupLabel>
          <SidebarGroupContent>{render(operacional)}</SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Estratégico</SidebarGroupLabel>
          <SidebarGroupContent>{render(estrategico)}</SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-1 py-1 text-[11px] text-sidebar-foreground/70">
          <ShieldCheck className="h-4 w-4 shrink-0 text-sidebar-primary" />
          {!colapsada && <span>API Rede conectada · PVs 5 · OAuth válido</span>}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
