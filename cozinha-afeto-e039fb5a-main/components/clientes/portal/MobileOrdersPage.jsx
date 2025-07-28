'use client';

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { format, startOfWeek, getWeek, getYear, addDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

// Entities
import { Customer } from "@/app/api/entities";
import { Recipe } from "@/app/api/entities";
import { WeeklyMenu } from "@/app/api/entities";
import { Order } from "@/app/api/entities";
import { OrderWaste } from "@/app/api/entities";

// Componentes UI
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Icons
import {
  ChefHat,
  ShoppingCart,
  Package,
  CircleDollarSign,
  ChevronLeft,
  ChevronRight,
  Settings,
  Send,
  Utensils,
  AlertTriangle,
  Loader2
} from "lucide-react";

// Utilitários
import { 
  parseQuantity as utilParseQuantity, 
  formattedQuantity as utilFormattedQuantity, 
  formatCurrency as utilFormatCurrency, 
  formatWeight as utilFormatWeight 
} from "@/components/utils/orderUtils";

import { prepareWasteItemsForDisplay, calculateWasteTotalsAndDiscount } from "@/components/utils/wasteLogic";
import { 
  normalizeNumericInputString,
  validateNumericOnCommit,
  formatQuantityForDisplay,
  formatCurrency,
  WASTE_CONSTANTS
} from "@/lib/sobrasUtils";

import { useCategoryDisplay } from "@/hooks/shared/useCategoryDisplay";

const MobileOrdersPage = ({ customerId }) => {
  const { toast } = useToast();
  const { groupItemsByCategory, getOrderedCategories, generateCategoryStyles } = useCategoryDisplay();
  
  // Estados principais
  const [currentDate, setCurrentDate] = useState(new Date());
  const [customer, setCustomer] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [weeklyMenus, setWeeklyMenus] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [activeTab, setActiveTab] = useState("orders"); // orders, receive, waste
  const [mealsExpected, setMealsExpected] = useState(0);
  const [generalNotes, setGeneralNotes] = useState("");
  
  // Estados para Sobras
  const [wasteItems, setWasteItems] = useState([]);
  const [wasteNotes, setWasteNotes] = useState("");
  const [existingWaste, setExistingWaste] = useState(null);
  const [wasteLoading, setWasteLoading] = useState(false);

  // Calculados
  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const weekNumber = useMemo(() => getWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const year = useMemo(() => getYear(currentDate), [currentDate]);

  // Dias da semana
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 5; i++) {
      const date = addDays(weekStart, i);
      days.push({
        date,
        dayNumber: i + 1,
        dayName: format(date, 'EEEE', { locale: ptBR }),
        shortDayName: format(date, 'EEE', { locale: ptBR }),
        formattedDate: format(date, 'dd/MM')
      });
    }
    return days;
  }, [weekStart]);

  const [selectedDay, setSelectedDay] = useState(1);

  // Funções para Sobras
  const loadWasteData = useCallback(async () => {
    if (!customer || !weeklyMenus.length || !recipes.length) return;

    setWasteLoading(true);
    try {
      // Buscar registro de sobra existente
      const existingWastes = await OrderWaste.query([
        { field: 'customer_id', operator: '==', value: customer.id },
        { field: 'week_number', operator: '==', value: weekNumber },
        { field: 'year', operator: '==', value: year },
        { field: 'day_of_week', operator: '==', value: selectedDay }
      ]);

      const wasteRecord = existingWastes.length > 0 ? existingWastes[0] : null;
      setExistingWaste(wasteRecord);
      setWasteNotes(wasteRecord?.general_notes || "");

      // Preparar itens para display de sobras
      const menu = weeklyMenus[0];
      const menuData = menu?.menu_data?.[selectedDay];
      
      if (!menuData) {
        setWasteItems([]);
        return;
      }

      // Buscar pedidos para este dia para referência
      const dayOrders = await Order.query([
        { field: 'customer_id', operator: '==', value: customer.id },
        { field: 'week_number', operator: '==', value: weekNumber },
        { field: 'year', operator: '==', value: year },
        { field: 'day_of_week', operator: '==', value: selectedDay }
      ]);

      const basePreparedItems = prepareWasteItemsForDisplay(
        customer,
        selectedDay,
        menuData,
        recipes,
        null,
        dayOrders
      );

      let initialItems = [];
      if (wasteRecord && wasteRecord.items) {
        // Mesclar com dados existentes
        const itemsMergedWithExisting = basePreparedItems.map(baseItem => {
          const savedItemData = wasteRecord.items.find(ei => ei.recipe_id === baseItem.recipe_id);
          return {
            ...baseItem,
            internal_waste_quantity: savedItemData?.internal_waste_quantity || 0,
            internal_waste_unit_type: savedItemData?.internal_waste_unit_type || baseItem.internal_waste_unit_type,
            client_returned_quantity: savedItemData?.client_returned_quantity || 0,
            client_returned_unit_type: savedItemData?.client_returned_unit_type || baseItem.client_returned_unit_type,
            payment_percentage: savedItemData?.payment_percentage || WASTE_CONSTANTS.DEFAULT_PAYMENT_PERCENTAGE,
            notes: savedItemData?.notes || '',
          };
        });
        const calculatedFromExisting = calculateWasteTotalsAndDiscount(itemsMergedWithExisting);
        initialItems = calculatedFromExisting.items_with_final_value_for_ui;
      } else {
        // Novos itens com valores padrão
        const initialCalculated = calculateWasteTotalsAndDiscount(basePreparedItems);
        initialItems = initialCalculated.items_with_final_value_for_ui;
      }

      setWasteItems(initialItems);
    } catch (error) {
      console.error("Erro ao carregar dados de sobras:", error);
      toast({ variant: "destructive", description: "Erro ao carregar dados de sobras." });
    } finally {
      setWasteLoading(false);
    }
  }, [customer, weeklyMenus, recipes, weekNumber, year, selectedDay, toast]);

  const updateWasteItem = useCallback((index, field, value) => {
    setWasteItems(prevItems => {
      const updatedItems = prevItems.map((item, i) => {
        if (i === index) {
          let processedValue = value;
          if (field === 'internal_waste_quantity' || field === 'client_returned_quantity') {
            processedValue = validateNumericOnCommit(value, 0);
          } else if (field === 'payment_percentage') {
            processedValue = Math.max(0, Math.min(100, parseInt(value) || 0));
          }
          return { ...item, [field]: processedValue };
        }
        return item;
      });
      
      // Recalcular valores
      const recalculated = calculateWasteTotalsAndDiscount(updatedItems);
      return recalculated.items_with_final_value_for_ui;
    });
  }, []);

  const saveWasteData = useCallback(async () => {
    if (!customer || wasteItems.length === 0) return;

    try {
      // Calcular dados finais
      const calculatedData = calculateWasteTotalsAndDiscount(wasteItems);
      
      // Verificar se é um registro vazio (para deletar)
      const isEmpty = (
        !calculatedData.items_payload ||
        calculatedData.items_payload.every(item => 
          (item.internal_waste_quantity || 0) === 0 && 
          (item.client_returned_quantity || 0) === 0
        )
      ) && (!wasteNotes || wasteNotes.trim() === '');

      if (existingWaste) {
        if (isEmpty) {
          // Deletar registro vazio
          await OrderWaste.delete(existingWaste.id);
          toast({ 
            description: "Registro de sobra vazio foi removido.",
            className: "border-amber-200 bg-amber-50 text-amber-800"
          });
          setExistingWaste(null);
        } else {
          // Atualizar registro existente
          await OrderWaste.update(existingWaste.id, {
            items: calculatedData.items_payload,
            general_notes: wasteNotes,
            total_internal_waste_weight_kg: calculatedData.total_internal_waste_weight_kg,
            total_client_returned_weight_kg: calculatedData.total_client_returned_weight_kg,
            total_combined_waste_weight_kg: calculatedData.total_combined_waste_weight_kg,
            total_original_value_of_waste: calculatedData.total_original_value_of_waste,
            total_discount_value_applied: calculatedData.total_discount_value_applied,
            final_value_after_discount: calculatedData.final_value_after_discount,
          });
          toast({ 
            description: "Sobras atualizadas com sucesso!",
            className: "border-green-200 bg-green-50 text-green-800"
          });
        }
      } else {
        if (!isEmpty) {
          // Criar novo registro
          const newWaste = await OrderWaste.create({
            customer_id: customer.id,
            customer_name: customer.name,
            week_number: weekNumber,
            year: year,
            day_of_week: selectedDay,
            date: format(addDays(weekStart, selectedDay - 1), "yyyy-MM-dd"),
            items: calculatedData.items_payload,
            general_notes: wasteNotes,
            total_internal_waste_weight_kg: calculatedData.total_internal_waste_weight_kg,
            total_client_returned_weight_kg: calculatedData.total_client_returned_weight_kg,
            total_combined_waste_weight_kg: calculatedData.total_combined_waste_weight_kg,
            total_original_value_of_waste: calculatedData.total_original_value_of_waste,
            total_discount_value_applied: calculatedData.total_discount_value_applied,
            final_value_after_discount: calculatedData.final_value_after_discount,
          });
          setExistingWaste(newWaste);
          toast({ 
            description: "Sobras registradas com sucesso!",
            className: "border-green-200 bg-green-50 text-green-800"
          });
        } else {
          toast({ 
            description: "Nenhuma sobra para registrar.",
            className: "border-gray-200 bg-gray-50 text-gray-800"
          });
        }
      }
    } catch (error) {
      console.error("Erro ao salvar sobras:", error);
      toast({ 
        variant: "destructive", 
        title: "Erro ao Salvar Sobras", 
        description: error.message 
      });
    }
  }, [customer, wasteItems, wasteNotes, existingWaste, weekNumber, year, selectedDay, weekStart, toast]);

  // Carregamento inicial
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // Carregar cliente
        const customerData = await Customer.getById(customerId);
        setCustomer(customerData);
        
        // Carregar receitas
        const recipesData = await Recipe.list();
        setRecipes(recipesData);
        
        // Carregar cardápios da semana
        const menusData = await WeeklyMenu.query([
          { field: 'week_number', operator: '==', value: weekNumber },
          { field: 'year', operator: '==', value: year }
        ]);
        setWeeklyMenus(menusData);
        
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast({ variant: "destructive", description: "Erro ao carregar dados iniciais." });
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      loadInitialData();
    }
  }, [customerId, weekNumber, year, toast]);

  // Preparar itens do pedido baseado no cardápio
  const orderItems = useMemo(() => {
    if (!weeklyMenus.length || !recipes.length || !customer) return [];
    
    const menu = weeklyMenus[0];
    if (!menu?.menu_data?.[selectedDay]) return [];
    
    const items = [];
    const menuData = menu.menu_data[selectedDay];
    
    Object.entries(menuData || {}).forEach(([categoryId, categoryItems]) => {
      if (!Array.isArray(categoryItems)) return;
      
      categoryItems.forEach(item => {
        if (!item.recipe_id) return;
        
        // Verificar se o item é para este cliente
        const itemLocations = item.locations;
        const shouldInclude = !itemLocations || 
          itemLocations.length === 0 || 
          (Array.isArray(itemLocations) && itemLocations.includes(customer.id));
        
        if (shouldInclude) {
          const recipe = recipes.find(r => r.id === item.recipe_id && r.active !== false);
          if (!recipe) return;
          
          const defaultUnitType = recipe.cuba_weight && recipe.cuba_weight > 0 ? "cuba" : "kg";
          let unitPrice;
          
          if (defaultUnitType === "cuba") {
            unitPrice = (recipe.cost_per_kg_yield || 0) * (utilParseQuantity(recipe.cuba_weight) || 0);
          } else {
            unitPrice = recipe.cost_per_kg_yield || 0;
          }
          
          items.push({
            recipe_id: item.recipe_id,
            recipe_name: recipe.name,
            category: recipe.category || categoryId,
            unit_type: defaultUnitType,
            quantity: 0,
            unit_price: unitPrice,
            total_price: 0,
            notes: "",
            cuba_weight: utilParseQuantity(recipe.cuba_weight) || 0,
            adjustment_percentage: 0
          });
        }
      });
    });
    
    return items;
  }, [weeklyMenus, recipes, customer, selectedDay]);

  // Atualizar item do pedido
  const updateOrderItem = useCallback((index, field, value) => {
    setCurrentOrder(prev => {
      if (!prev?.items) return prev;
      
      const newItems = [...prev.items];
      const item = { ...newItems[index] };
      
      if (field === 'quantity') {
        const quantity = utilParseQuantity(value);
        item.quantity = quantity;
        item.total_price = quantity * (item.unit_price || 0);
      } else if (field === 'adjustment_percentage') {
        const percentage = utilParseQuantity(value);
        item.adjustment_percentage = percentage;
        // Recalcular quantidade baseada na porcentagem
        const baseQuantity = item.base_quantity || item.quantity;
        const newQuantity = baseQuantity * (1 + (percentage / 100));
        item.quantity = Math.max(0, newQuantity);
        item.total_price = item.quantity * (item.unit_price || 0);
      } else if (field === 'unit_type') {
        item.unit_type = value;
        // Recalcular preço unitário se mudou o tipo
        const recipe = recipes.find(r => r.id === item.recipe_id);
        if (recipe) {
          if (value === "cuba") {
            item.unit_price = (recipe.cost_per_kg_yield || 0) * (utilParseQuantity(recipe.cuba_weight) || 0);
          } else {
            item.unit_price = recipe.cost_per_kg_yield || 0;
          }
          item.total_price = item.quantity * item.unit_price;
        }
      } else {
        item[field] = value;
      }
      
      newItems[index] = item;
      return { ...prev, items: newItems };
    });
  }, [recipes]);

  // Carregar dados de sobras quando a aba waste for selecionada
  useEffect(() => {
    if (activeTab === "waste" && customer && weeklyMenus.length && recipes.length) {
      loadWasteData();
    }
  }, [activeTab, customer, selectedDay, weeklyMenus, recipes, loadWasteData]);

  // Inicializar pedido quando itens mudam
  useEffect(() => {
    if (orderItems.length > 0 && !currentOrder) {
      setCurrentOrder({
        customer_id: customer?.id,
        customer_name: customer?.name,
        day_of_week: selectedDay,
        week_number: weekNumber,
        year: year,
        date: format(addDays(weekStart, selectedDay - 1), "yyyy-MM-dd"),
        total_meals_expected: mealsExpected,
        general_notes: generalNotes,
        items: orderItems
      });
    }
  }, [orderItems, customer, selectedDay, weekNumber, year, weekStart, mealsExpected, generalNotes, currentOrder]);

  // Calcular totais
  const orderTotals = useMemo(() => {
    if (!currentOrder?.items) return { totalItems: 0, totalAmount: 0 };
    
    const totalItems = currentOrder.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalAmount = currentOrder.items.reduce((sum, item) => sum + (item.total_price || 0), 0);
    
    return { totalItems, totalAmount };
  }, [currentOrder]);

  // Enviar pedido
  const handleSubmitOrder = async () => {
    if (!currentOrder || !customer) {
      toast({ variant: "destructive", description: "Dados do pedido incompletos." });
      return;
    }

    try {
      const orderData = {
        ...currentOrder,
        total_meals_expected: mealsExpected,
        general_notes: generalNotes,
        status: 'submitted'
      };

      await Order.create(orderData);
      toast({ description: "Pedido enviado com sucesso!" });
      
      // Reset form
      setCurrentOrder(null);
      setMealsExpected(0);
      setGeneralNotes("");
      
    } catch (error) {
      console.error("Erro ao enviar pedido:", error);
      toast({ variant: "destructive", description: "Erro ao enviar pedido." });
    }
  };

  // Navegação de semana
  const changeWeek = (direction) => {
    const newDate = addDays(currentDate, direction * 7);
    setCurrentDate(newDate);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-pulse" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>Cliente não encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <ChefHat className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Fazer Pedido</h1>
              <p className="text-sm text-gray-500">{customer.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-400" />
            <Badge variant="outline" className="text-xs">
              Rascunho
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Semana {weekNumber}/{year}
            </Badge>
          </div>
        </div>
        
        {/* Week Navigation */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => changeWeek(-1)}
            className="p-2"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="text-sm font-medium text-center">
            {format(weekStart, 'dd/MM', { locale: ptBR })} - {format(addDays(weekStart, 4), 'dd/MM', { locale: ptBR })}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => changeWeek(1)}
            className="p-2"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Day Selector */}
        <div className="flex overflow-x-auto">
          {weekDays.map((day) => (
            <button
              key={day.dayNumber}
              onClick={() => setSelectedDay(day.dayNumber)}
              className={cn(
                "flex flex-col items-center py-3 px-4 border-b-2 whitespace-nowrap min-w-[80px]",
                selectedDay === day.dayNumber
                  ? "border-blue-600 text-blue-600 font-medium bg-blue-50"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              <span className="text-xs">{day.shortDayName}</span>
              <span className="text-xs mt-0.5">{day.formattedDate}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-transparent">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Pedido
            </TabsTrigger>
            <TabsTrigger value="receive" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Recebimento
            </TabsTrigger>
            <TabsTrigger value="waste" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Sobras
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {activeTab === "orders" && (
          <>
            {/* Meals Expected */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Utensils className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Refeições Esperadas
                    </label>
                    <Input
                      type="number"
                      value={mealsExpected}
                      onChange={(e) => setMealsExpected(parseInt(e.target.value) || 0)}
                      className="w-20"
                      min="0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabela de Pedidos por Categoria */}
            <div className="space-y-3">
              {getOrderedCategories(
                groupItemsByCategory(currentOrder?.items || [], (item) => item.category)
              ).map(({ name: categoryName, data: categoryData }) => {
                console.log('🎨 [MobileOrdersPage - Pedidos] Renderizando categoria:', categoryName);
                console.log('🎨 [MobileOrdersPage - Pedidos] Dados da categoria:', categoryData.categoryInfo);
                const { headerStyle } = generateCategoryStyles(categoryData.categoryInfo.color);
                console.log('🎨 [MobileOrdersPage - Pedidos] Estilo gerado:', headerStyle);
                return (
                  <div key={categoryName} className="bg-white rounded-xl shadow-sm border border-gray-200/50 overflow-hidden hover:shadow-md transition-all duration-300">
                    <div 
                      className="py-4 px-6 relative border-b border-gray-100/50" 
                      style={headerStyle}
                    >
                      <div className="flex items-center">
                        <div 
                          className="w-5 h-5 rounded-full mr-3 shadow-sm border-2 border-white/30 ring-2 ring-white/20" 
                          style={{ backgroundColor: categoryData.categoryInfo.color }}
                        />
                        <h3 className="text-lg font-semibold text-gray-800">{categoryName}</h3>
                      </div>
                    </div>
                    <div className="p-6 bg-gradient-to-b from-white to-gray-50/30">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-blue-100 bg-blue-50">
                              <th className="text-left p-2 text-xs font-medium text-blue-700">Item</th>
                              <th className="text-center p-2 text-xs font-medium text-blue-700">Pedido</th>
                              <th className="text-center p-2 text-xs font-medium text-blue-700">% Ajuste</th>
                              <th className="text-center p-2 text-xs font-medium text-blue-700">Unidade</th>
                              <th className="text-center p-2 text-xs font-medium text-blue-700">Qtd Final</th>
                              <th className="text-center p-2 text-xs font-medium text-blue-700">Valor Total</th>
                              <th className="text-left p-2 text-xs font-medium text-blue-700">Observações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {categoryData.items.map((item, index) => {
                              const globalIndex = currentOrder?.items?.findIndex(oi => oi.recipe_id === item.recipe_id) || 0;
                              return (
                                <tr key={`order-${categoryName}-${item.recipe_id}-${index}`} className="border-b border-blue-50">
                                  <td className="p-2">
                                    <div>
                                      <p className="font-medium text-blue-900 text-xs">{item.recipe_name}</p>
                                      <p className="text-xs text-blue-600">
                                        {utilFormatCurrency(item.unit_price)}/{item.unit_type}
                                      </p>
                                    </div>
                                  </td>
                                  <td className="p-2">
                                    <Input
                                      type="text"
                                      inputMode="decimal"
                                      value={item.quantity || ''}
                                      onChange={(e) => updateOrderItem(globalIndex, 'quantity', e.target.value)}
                                      className="text-center text-xs h-8 w-16 border-blue-300 focus:border-blue-500"
                                      placeholder="0"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <Input
                                      type="text"
                                      inputMode="decimal"
                                      value={item.adjustment_percentage || ''}
                                      onChange={(e) => updateOrderItem(globalIndex, 'adjustment_percentage', e.target.value)}
                                      className="text-center text-xs h-8 w-16 border-blue-300 focus:border-blue-500"
                                      placeholder="0"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <select
                                      value={item.unit_type}
                                      onChange={(e) => updateOrderItem(globalIndex, 'unit_type', e.target.value)}
                                      className="text-xs h-8 w-16 border border-blue-300 rounded focus:border-blue-500"
                                    >
                                      <option value="kg">Kg</option>
                                      {item.cuba_weight > 0 && (
                                        <option value="cuba">Cuba</option>
                                      )}
                                    </select>
                                  </td>
                                  <td className="p-2">
                                    <div className="text-center text-xs font-medium text-blue-700">
                                      {utilFormattedQuantity(item.quantity)}
                                    </div>
                                  </td>
                                  <td className="p-2">
                                    <div className="text-center text-xs font-medium text-blue-700">
                                      {utilFormatCurrency(item.total_price)}
                                    </div>
                                  </td>
                                  <td className="p-2">
                                    <Input
                                      type="text"
                                      value={item.notes || ''}
                                      onChange={(e) => updateOrderItem(globalIndex, 'notes', e.target.value)}
                                      className="text-xs h-8 border-blue-300 focus:border-blue-500"
                                      placeholder="Observações..."
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* General Notes */}
            <Card>
              <CardContent className="p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações Gerais
                </label>
                <Textarea
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  placeholder="Observações gerais sobre o pedido..."
                  className="min-h-[80px]"
                  rows={3}
                />
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === "receive" && (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Funcionalidade de recebimento em desenvolvimento</p>
            </CardContent>
          </Card>
        )}

        {activeTab === "waste" && (
          <div className="space-y-4">
            {wasteLoading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Loader2 className="w-8 h-8 mx-auto mb-4 text-amber-500 animate-spin" />
                  <p className="text-amber-600">Carregando dados de sobras...</p>
                </CardContent>
              </Card>
            ) : wasteItems.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-amber-400" />
                  <h3 className="font-semibold text-lg text-amber-700 mb-2">Nenhum Item para Sobras</h3>
                  <p className="text-amber-600 text-sm">
                    Não há itens de cardápio para registrar sobras neste dia.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Tabela de Sobras por Categoria */}
                {getOrderedCategories(
                  groupItemsByCategory(wasteItems, (item) => item.category)
                ).map(({ name: categoryName, data: categoryData }) => {
                  console.log('🎨 [MobileOrdersPage - Sobras] Renderizando categoria:', categoryName);
                  console.log('🎨 [MobileOrdersPage - Sobras] Dados da categoria:', categoryData.categoryInfo);
                  const { headerStyle } = generateCategoryStyles(categoryData.categoryInfo.color);
                  console.log('🎨 [MobileOrdersPage - Sobras] Estilo gerado:', headerStyle);
                  return (
                    <div key={categoryName} className="bg-white rounded-xl shadow-sm border border-gray-200/50 overflow-hidden hover:shadow-md transition-all duration-300">
                      <div 
                        className="py-4 px-6 relative border-b border-gray-100/50" 
                        style={headerStyle}
                      >
                        <div className="flex items-center">
                          <div 
                            className="w-5 h-5 rounded-full mr-3 shadow-sm border-2 border-white/30 ring-2 ring-white/20" 
                            style={{ backgroundColor: categoryData.categoryInfo.color }}
                          />
                          <h3 className="text-lg font-semibold text-gray-800">{categoryName}</h3>
                        </div>
                      </div>
                      <div className="p-6 bg-gradient-to-b from-white to-gray-50/30">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-amber-100 bg-amber-50">
                              <th className="text-left p-2 text-xs font-medium text-amber-700">Item</th>
                              <th className="text-center p-2 text-xs font-medium text-amber-700">Sobra Cozinha</th>
                              <th className="text-center p-2 text-xs font-medium text-amber-700">Sobra Cliente</th>
                              <th className="text-center p-2 text-xs font-medium text-amber-700">% Pag.</th>
                              <th className="text-center p-2 text-xs font-medium text-amber-700">Valor Final</th>
                              <th className="text-left p-2 text-xs font-medium text-amber-700">Observações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {categoryData.items.map((item, index) => {
                              const globalIndex = wasteItems.findIndex(wi => wi.recipe_id === item.recipe_id);
                              return (
                                <tr key={`waste-${categoryName}-${item.recipe_id}-${index}`} className="border-b border-amber-50">
                                  <td className="p-2">
                                    <div>
                                      <p className="font-medium text-amber-900 text-xs">{item.recipe_name}</p>
                                      <p className="text-xs text-amber-600">
                                        Pedido: {formatQuantityForDisplay(item.order_quantity)} {item.order_unit_type}
                                      </p>
                                    </div>
                                  </td>
                                  <td className="p-2">
                                    <div className="flex gap-1 items-center justify-center">
                                      <Input
                                        type="text"
                                        inputMode="decimal"
                                        value={formatQuantityForDisplay(item.internal_waste_quantity)}
                                        onChange={(e) => updateWasteItem(globalIndex, 'internal_waste_quantity', e.target.value)}
                                        className="text-center text-xs h-8 w-12 border-amber-300 focus:border-amber-500"
                                        placeholder="0"
                                      />
                                      <select
                                        value={item.internal_waste_unit_type}
                                        onChange={(e) => updateWasteItem(globalIndex, 'internal_waste_unit_type', e.target.value)}
                                        className="text-xs h-8 w-12 border border-amber-300 rounded focus:border-amber-500"
                                      >
                                        <option value="kg">Kg</option>
                                        <option value="cuba">Cuba</option>
                                      </select>
                                    </div>
                                  </td>
                                  <td className="p-2">
                                    <div className="flex gap-1 items-center justify-center">
                                      <Input
                                        type="text"
                                        inputMode="decimal"
                                        value={formatQuantityForDisplay(item.client_returned_quantity)}
                                        onChange={(e) => updateWasteItem(globalIndex, 'client_returned_quantity', e.target.value)}
                                        className="text-center text-xs h-8 w-12 border-amber-300 focus:border-amber-500"
                                        placeholder="0"
                                      />
                                      <select
                                        value={item.client_returned_unit_type}
                                        onChange={(e) => updateWasteItem(globalIndex, 'client_returned_unit_type', e.target.value)}
                                        className="text-xs h-8 w-12 border border-amber-300 rounded focus:border-amber-500"
                                      >
                                        <option value="kg">Kg</option>
                                        <option value="cuba">Cuba</option>
                                      </select>
                                    </div>
                                  </td>
                                  <td className="p-2">
                                    <div className="flex items-center justify-center">
                                      <Input
                                        type="number"
                                        value={item.payment_percentage}
                                        onChange={(e) => updateWasteItem(globalIndex, 'payment_percentage', parseInt(e.target.value) || 0)}
                                        className="text-center text-xs h-8 w-16 border-amber-300 focus:border-amber-500"
                                        placeholder="100"
                                        min="0"
                                        max="100"
                                      />
                                    </div>
                                  </td>
                                  <td className="p-2">
                                    <div className="text-center text-xs font-medium text-amber-700">
                                      {formatCurrency(item.final_value_this_item || 0)}
                                    </div>
                                  </td>
                                  <td className="p-2">
                                    <Input
                                      type="text"
                                      value={item.notes || ''}
                                      onChange={(e) => updateWasteItem(globalIndex, 'notes', e.target.value)}
                                      className="text-xs h-8 border-amber-300 focus:border-amber-500"
                                      placeholder="Observações..."
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      </div>
                    </div>
                  );
                })}

                {/* Observações Gerais */}
                <Card className="border-amber-200">
                  <CardContent className="p-4">
                    <label className="block text-sm font-medium text-amber-700 mb-2">
                      Observações Gerais sobre Sobras
                    </label>
                    <Textarea
                      value={wasteNotes}
                      onChange={(e) => setWasteNotes(e.target.value)}
                      placeholder="Observações gerais sobre as sobras do dia..."
                      className="min-h-[80px] border-amber-300 focus:border-amber-500"
                      rows={3}
                    />
                  </CardContent>
                </Card>

                {/* Botão de Salvar */}
                <Button 
                  onClick={saveWasteData}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Salvar Sobras
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer with totals and submit button */}
      {activeTab === "orders" && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Total:</span> {utilFormatCurrency(orderTotals.totalAmount)}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Itens:</span> {Math.round(orderTotals.totalItems * 10) / 10}
              </div>
            </div>
            
            <Button 
              onClick={handleSubmitOrder}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
              disabled={orderTotals.totalItems === 0}
            >
              <Send className="w-4 h-4 mr-2" />
              Enviar Pedido
            </Button>
          </div>
        </div>
      )}

      {/* Bottom spacing for fixed footer */}
      {activeTab === "orders" && <div className="h-24"></div>}
    </div>
  );
};

export default MobileOrdersPage;