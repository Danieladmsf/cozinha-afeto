'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import './globals.css';
import {
  LayoutDashboard,
  ChefHat,
  Package,
  Building2,
  Users,
  Tag,
  Menu,
  CircleDollarSign,
  Apple,
  Utensils,
  TrendingUp,
  ShoppingCart,
  Clipboard,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import SidebarNav from "@/components/shared/navigation";
import { Toaster } from "@/components/ui/toaster";
import { SpeedInsights } from "@vercel/speed-insights/next";

function _getCurrentPage(pathname) {
  if (pathname === "/") return "Dashboard";
  return pathname.substring(1);
}

export default function RootLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [, setActiveItem] = useState(null);
  const pathname = usePathname();
  const currentPageName = _getCurrentPage(pathname);

  // Verifica se é uma rota do portal do cliente
  const isPortalRoute = pathname.startsWith('/portal');

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Receitas", href: "/receitas", icon: ChefHat },
    { name: "Ficha Técnica", href: "/ficha-tecnica", icon: Clipboard },
    { name: "Análise de Receitas", href: "/analise-de-receitas", icon: TrendingUp },
    { name: "Cardápio", href: "/cardapio", icon: Utensils },
    { name: "Pedidos", href: "/pedidos", icon: ShoppingCart },
    { name: "Ingredientes", href: "/ingredientes", icon: Package },
    { name: "Categorias", href: "/categorias", icon: Tag },
    { name: "Fornecedores e Serviços", href: "/fornecedores-e-servicos", icon: Building2 },
    { name: "Clientes", href: "/clientes", icon: Users },
    { name: "Contas", href: "/contas", icon: CircleDollarSign },
    { name: "Tabela Nutricional", href: "/tabela-nutricional", icon: Apple }
  ];

  useEffect(() => {
    setSidebarOpen(false);
    
    // Only access window on client side to avoid hydration issues
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setSidebarCollapsed(true);
    }
    
    setActiveItem(currentPageName);
  }, [pathname, currentPageName]);

  const handleMouseEnter = () => {
    if (sidebarCollapsed) {
      setIsHovering(true);
    }
  };

  const handleMouseLeave = () => {
    if (sidebarCollapsed) {
      setIsHovering(false);
    }
  };

  // Se for rota do portal, renderiza layout limpo
  if (isPortalRoute) {
    return (
      <html lang="pt-BR">
        <head>
          <meta charSet="utf-8" />
          <meta name="description" content="Portal do Cliente - Cozinha Afeto" />
          <meta name="keywords" content="portal cliente, pedidos online, cozinha afeto" />
          <meta name="author" content="Cozinha Afeto" />
          <meta name="robots" content="noindex, nofollow" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
          <meta name="theme-color" content="#3b82f6" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta property="og:title" content="Portal do Cliente - Cozinha Afeto" />
          <meta property="og:description" content="Portal exclusivo para clientes da Cozinha Afeto" />
          <meta property="og:type" content="website" />
          <meta property="og:locale" content="pt_BR" />
          <title>Portal do Cliente - Cozinha Afeto</title>
        </head>
        <body>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
            {children}
          </div>
          <Toaster />
          <SpeedInsights />
        </body>
      </html>
    );
  }

  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="description" content="Sistema de gestão completo para restaurantes - gerencie receitas, cardápios, pedidos, ingredientes e análise nutricional. Controle de estoque, custos e relatórios detalhados." />
        <meta name="keywords" content="gestão restaurante, sistema restaurante, controle estoque, receitas, cardápio, pedidos, ingredientes, análise nutricional, custos restaurante" />
        <meta name="author" content="Cozinha Afeto" />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta property="og:title" content="Cozinha Afeto - Sistema de Gestão para Restaurantes" />
        <meta property="og:description" content="Sistema completo de gestão para restaurantes com controle de receitas, cardápios, pedidos e análise nutricional." />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="pt_BR" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Cozinha Afeto - Sistema de Gestão para Restaurantes" />
        <meta name="twitter:description" content="Sistema completo de gestão para restaurantes com controle de receitas, cardápios, pedidos e análise nutricional." />
        <link rel="canonical" href="http://localhost:9000" />
        <title>Cozinha Afeto - Sistema de Gestão para Restaurantes</title>
      </head>
      <body>
        <div className="flex h-screen bg-gray-100 main-app-container">

          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <SidebarNav
            navigation={navigation}
            currentPageName={currentPageName}
            sidebarCollapsed={sidebarCollapsed}
            setSidebarCollapsed={setSidebarCollapsed}
            isHovering={isHovering}
            setIsHovering={setIsHovering}
            setActiveItem={setActiveItem}
            handleMouseEnter={handleMouseEnter}
            handleMouseLeave={handleMouseLeave}
          />

          <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
            <header className="lg:hidden bg-white border-b px-4 py-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </Button>
            </header>

            <main className="flex-1 overflow-auto bg-gray-100 compact-ui">
              {children}
            </main>
          </div>
        </div>
        <Toaster />
        <SpeedInsights />
      </body>
    </html>
  );
}