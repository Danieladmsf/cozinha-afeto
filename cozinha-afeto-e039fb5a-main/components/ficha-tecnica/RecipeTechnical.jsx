
'use client';


import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRecipeOperations, useRecipeCalculations, useRecipeInterface, useRecipeConfig } from "@/hooks/ficha-tecnica";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Plus,
  Trash2,
  Save,
  CookingPot,
  Edit,
  AlertTriangle,
  Loader2,
  Package,
  Settings,
  Printer,
  Search,
  ChevronsUpDown,
  Scissors,
  Layers,
  ClipboardList,
  ClipboardCheck,
  FilePlus,
  Clock,
  AlertCircle
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import { createPageUrl } from "@/utils";
import { motion } from 'framer-motion';
import RecipeTechnicalPrintDialog from "@/components/receitas/RecipeTechnicalPrintDialog";
import RecipeTechnicalCollectDialog from "@/components/receitas/RecipeTechnicalCollectDialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  RecipeCalculator,
} from '@/components/utils/recipeCalculator';
import { TableCell } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import IngredientPrePreparoItem from "@/components/receitas/IngredientPrePreparoItem";

export default function RecipeTechnical() {
  const router = useRouter();
  const { toast } = useToast();

  const {
    loading,
    saving,
    error,
    loadInitialData,
    loadRecipe: loadRecipeOperation,
    saveRecipe,
    createNewRecipe,
    loadAllRecipes
  } = useRecipeOperations();

  const {
    calculateAssemblyTotalWeight,
    handleRecalculate,
    calculateCubaCost,
    parseNumericValue
  } = useRecipeCalculations();

  const {
    isEditing,
    currentRecipeId,
    searchQuery,
    updateSearchQuery,
    searchOpen,
    setSearchOpen,
    showConfigDialog,
    setShowConfigDialog,
    isDetailedProcessDialogOpen,
    openDetailedProcessDialog,
    closeDetailedProcessDialog,
    processFormData,
    updateProcessFormData,
    selectedCategory,
    updateSelectedCategory,
    isRecipeCopyModalOpen,
    setIsRecipeCopyModalOpen,
    selectedSourceRecipe,
    setSelectedSourceRecipe,
    sourceRecipeSearch,
    setSourceRecipeSearch,
    selectedStageLevel,
    setSelectedStageLevel,
    recipePreview,
    setRecipePreview,
    isPrintDialogOpen,
    setIsPrintDialogOpen,
    isPrintCollectDialogOpen,
    setIsPrintCollectDialogOpen,
    activeTab,
    setActiveTab,
    startEditing,
    stopEditing,
    resetInterface
  } = useRecipeInterface();

  const {
    loadUserConfiguration,
    saveConfiguration,
    configSaving
  } = useRecipeConfig();

  const [categories, setCategories] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [allRecipes, setAllRecipesState] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [filteredSourceRecipes, setFilteredSourceRecipes] = useState([]);
  const [sourceRecipeStages, setSourceRecipeStages] = useState([]);

  const [recipeData, setRecipeData] = useState({
    name: "",
    name_complement: "",
    category: "",
    prep_time: 0,
    total_weight: 0,
    yield_weight: 0,
    cuba_weight: 0,
    total_cost: 0,
    cost_per_kg_raw: 0,
    cost_per_kg_yield: 0,
    instructions: "",
    active: true,
    pre_preparo: {}
  });

  const [preparationsData, setPreparationsData] = useState([]);
  const [isDirty, setIsDirty] = useState(false);
  const saveTimeoutRef = useRef(null);

  // Carregar dados iniciais e de receita
  useEffect(() => {
    const initializePage = async () => {
      try {
        const { categories: loadedCategories, ingredients: loadedIngredients } = await loadInitialData();
        setCategories(loadedCategories.filter(cat => cat.type === "recipe" && cat.active !== false));
        setAllCategories(loadedCategories);
        setIngredients(loadedIngredients.filter(ing => ing.active !== false));
        const allRecipesData = await loadAllRecipes();
        setAllRecipesState(allRecipesData);

        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');

        if (id && id !== 'new') {
          await loadRecipe(id);
        } else {
          resetForm();
          startEditing();
        }
      } catch (err) {
        toast({ variant: "destructive", title: "Erro de Inicialização", description: err.message });
        resetForm();
      }
    };
    initializePage();
  }, []);

  const loadRecipe = useCallback(async (id) => {
    try {
      const recipe = await loadRecipeOperation(id);
      setRecipeData(recipe);
      setPreparationsData(recipe.processes || []);
      startEditing(id);
      updateSearchQuery(recipe.name);
    } catch (err) {
      toast({ variant: "destructive", title: "Erro ao Carregar Receita", description: err.message });
      resetForm();
    }
  }, [loadRecipeOperation, startEditing, toast, updateSearchQuery]);

  const resetForm = useCallback(() => {
    createNewRecipe().then(newRecipe => {
      setRecipeData(newRecipe);
      setPreparationsData([]);
      stopEditing();
      setIsDirty(false);
      updateSearchQuery('');
      window.history.replaceState({}, '', createPageUrl('RecipeTechnical', { id: 'new' }));
    });
  }, [createNewRecipe, stopEditing, updateSearchQuery]);

  const handleSave = async () => {
    const { updatedRecipe, updatedPreparations } = handleRecalculate(recipeData, preparationsData);
    const savedRecipe = await saveRecipe(updatedRecipe, updatedPreparations);
    if (savedRecipe) {
      setRecipeData(savedRecipe);
      setPreparationsData(savedRecipe.processes);
      setIsDirty(false);
      if (!isEditing) {
        startEditing(savedRecipe.id);
        const newUrl = createPageUrl('RecipeTechnical') + `?id=${savedRecipe.id}`;
        window.history.replaceState({}, '', newUrl);
      }
    }
  };
  
  // Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRecipeData(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);
  };
  
  const handleCubaWeightChange = (e) => {
    const value = e.target.value;
    setRecipeData(prev => ({ ...prev, cuba_weight: value }));
    setIsDirty(true);
    setTimeout(() => handleRecalculate(recipeData, preparationsData), 0);
  };
  
  const handleRecipeSelect = async (selectedRecipeId) => {
    if (!selectedRecipeId) return;
    window.history.pushState({}, '', `/recipes/technical?id=${selectedRecipeId}`);
    await loadRecipe(selectedRecipeId);
    const selectedRecipe = filteredRecipes.find(r => r.id === selectedRecipeId);
    if (selectedRecipe) updateSearchQuery(selectedRecipe.name);
    setSearchOpen(false);
  };
  
  const handleClear = () => {
    if (isDirty) {
      if (!window.confirm("Existem alterações não salvas. Deseja continuar e descartar?")) return;
    }
    resetForm();
  };

  useEffect(() => {
    if (isDirty) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(handleSave, 3000);
    }
    return () => clearTimeout(saveTimeoutRef.current);
  }, [recipeData, preparationsData, isDirty]);
  
  // Render functions...
  // ... (As funções de renderização serão simplificadas e movidas para cá se necessário)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5 mr-3" />
          <p>{error}</p>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
                <ClipboardList className="h-5 w-5" />
                <h1 className="text-xl font-semibold">Ficha Técnica</h1>
            </div>
            <p className="text-gray-500 text-sm">
                Crie e estruture suas receitas com detalhes profissionais
            </p>
        </div>

        {/* Form */}
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          {/* Informações Básicas */}
          <Card className="bg-white shadow-sm border">
            <CardHeader className="bg-gray-50 border-b border-gray-200 px-6 py-4 rounded-t-lg">
                <CardTitle className="text-lg font-semibold text-gray-700">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 items-start">
                    <div>
                        <Label htmlFor="name" className="flex items-center text-sm font-medium text-gray-700 mb-1">Nome Principal *</Label>
                        <Input id="name" name="name" value={recipeData.name} onChange={handleInputChange} placeholder="Ex: Maminha Assada" required />
                    </div>
                    <div>
                        <Label htmlFor="name_complement" className="flex items-center text-sm font-medium text-gray-700 mb-1">Complemento</Label>
                        <Input id="name_complement" name="name_complement" value={recipeData.name_complement} onChange={handleInputChange} placeholder="Ex: ao molho de mostarda" />
                    </div>
                    <div>
                        <Label htmlFor="cuba_weight" className="flex items-center text-sm font-medium text-gray-700 mb-1">Peso da Cuba (kg)</Label>
                        <Input id="cuba_weight" name="cuba_weight" type="text" value={recipeData.cuba_weight || ''} onChange={handleCubaWeightChange} placeholder="Ex: 3,5" />
                    </div>
                </div>
            </CardContent>
          </Card>
          
          {/* Ações */}
          <div className="flex justify-end gap-4 mt-6">
            <Button type="button" variant="outline" onClick={handleClear}>Nova Ficha</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
