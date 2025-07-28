import { useState, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Recipe, Ingredient, Category, CategoryTree } from "@/app/api/entities";

export const useRecipeOperations = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Carregar dados iniciais
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [categoriesData, ingredientsData] = await Promise.all([
        loadCategories(),
        loadIngredients()
      ]);

      return {
        categories: categoriesData,
        ingredients: ingredientsData
      };
    } catch (error) {
      console.error("Erro ao carregar dados iniciais:", error);
      setError("Erro ao carregar dados iniciais");
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar categorias
  const loadCategories = useCallback(async () => {
    try {
      const categoriesData = await CategoryTree.list();
      const activeCategories = categoriesData.filter(cat => cat.active !== false);
      return activeCategories;
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
      throw error;
    }
  }, []);

  // Carregar ingredientes
  const loadIngredients = useCallback(async () => {
    try {
      const ingredientsData = await Ingredient.list();
      const activeIngredients = ingredientsData.filter(ing => ing.active !== false);
      return activeIngredients;
    } catch (error) {
      console.error("Erro ao carregar ingredientes:", error);
      throw error;
    }
  }, []);

  // Carregar receita específica
  const loadRecipe = useCallback(async (recipeId) => {
    try {
      setLoading(true);
      setError(null);

      if (!recipeId) {
        throw new Error("ID da receita é obrigatório");
      }

      const recipe = await Recipe.get(recipeId);
      
      if (!recipe) {
        throw new Error("Receita não encontrada");
      }

      return recipe;
    } catch (error) {
      console.error("Erro ao carregar receita:", error);
      setError("Erro ao carregar receita");
      toast({
        title: "Erro",
        description: "Não foi possível carregar a receita.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Salvar receita
  const saveRecipe = useCallback(async (recipeData, preparationsData) => {
    try {
      setSaving(true);
      setError(null);

      let savedRecipe;

      if (recipeData.id) {
        // Atualizar receita existente
        savedRecipe = await Recipe.update(recipeData.id, {
          ...recipeData,
          processes: preparationsData,
          updated_at: new Date()
        });
      } else {
        // Criar nova receita
        savedRecipe = await Recipe.create({
          ...recipeData,
          processes: preparationsData,
          created_at: new Date(),
          updated_at: new Date()
        });
      }

      toast({
        title: "Sucesso",
        description: recipeData.id ? "Receita atualizada com sucesso!" : "Receita criada com sucesso!",
      });

      return savedRecipe;
    } catch (error) {
      console.error("Erro ao salvar receita:", error);
      setError("Erro ao salvar receita");
      toast({
        title: "Erro",
        description: "Não foi possível salvar a receita.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setSaving(false);
    }
  }, [toast]);

  // Criar nova receita
  const createNewRecipe = useCallback(async (initialData = {}) => {
    try {
      const newRecipeData = {
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
        pre_preparo: {},
        processes: [],
        ...initialData
      };

      return newRecipeData;
    } catch (error) {
      console.error("Erro ao criar nova receita:", error);
      throw error;
    }
  }, []);

  // Deletar receita
  const deleteRecipe = useCallback(async (recipeId) => {
    try {
      setSaving(true);
      setError(null);

      await Recipe.delete(recipeId);

      toast({
        title: "Sucesso",
        description: "Receita deletada com sucesso!",
      });

      return true;
    } catch (error) {
      console.error("Erro ao deletar receita:", error);
      setError("Erro ao deletar receita");
      toast({
        title: "Erro",
        description: "Não foi possível deletar a receita.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setSaving(false);
    }
  }, [toast]);

  // Listar todas as receitas
  const loadAllRecipes = useCallback(async () => {
    try {
      const recipes = await Recipe.list();
      return recipes.filter(recipe => recipe.active !== false);
    } catch (error) {
      console.error("Erro ao carregar receitas:", error);
      throw error;
    }
  }, []);

  // Duplicar receita
  const duplicateRecipe = useCallback(async (sourceRecipeId, newName) => {
    try {
      setSaving(true);
      setError(null);

      const sourceRecipe = await loadRecipe(sourceRecipeId);
      
      const duplicatedRecipe = {
        ...sourceRecipe,
        id: undefined, // Remove o ID para criar nova receita
        name: newName || `${sourceRecipe.name} - Cópia`,
        created_at: new Date(),
        updated_at: new Date()
      };

      const savedRecipe = await Recipe.create(duplicatedRecipe);

      toast({
        title: "Sucesso",
        description: "Receita duplicada com sucesso!",
      });

      return savedRecipe;
    } catch (error) {
      console.error("Erro ao duplicar receita:", error);
      setError("Erro ao duplicar receita");
      toast({
        title: "Erro",
        description: "Não foi possível duplicar a receita.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setSaving(false);
    }
  }, [toast, loadRecipe]);

  return {
    // Estados
    loading,
    saving,
    error,

    // Operações básicas
    loadInitialData,
    loadCategories,
    loadIngredients,
    loadRecipe,
    saveRecipe,
    createNewRecipe,
    deleteRecipe,
    loadAllRecipes,
    duplicateRecipe,

    // Setters para controle manual se necessário
    setLoading,
    setSaving,
    setError
  };
};