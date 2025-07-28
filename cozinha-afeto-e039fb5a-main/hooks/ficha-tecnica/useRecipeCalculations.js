import { useCallback } from 'react';
import { RecipeCalculator } from '@/components/utils/recipeCalculator';

export const useRecipeCalculations = () => {
  
  // Calcular peso total de montagem
  const calculateAssemblyTotalWeight = useCallback((subComponents) => {
    if (!subComponents || !Array.isArray(subComponents)) return 0;
    
    return subComponents.reduce((total, component) => {
      const weight = parseFloat(component.weight) || 0;
      return total + weight;
    }, 0);
  }, []);

  // Recalcular métricas da receita
  const handleRecalculate = useCallback((recipeData, preparationsData) => {
    try {
      // Usar o RecipeCalculator existente
      const { updatedRecipe, updatedPreparations } = RecipeCalculator.calculateRecipeMetrics(
        recipeData,
        preparationsData
      );

      // Processar preparações do tipo "assembly"
      const processedPreparations = updatedPreparations.map(prep => {
        if (prep.type === "assembly" && prep.sub_components) {
          const updatedSubComponents = prep.sub_components.map(sc => {
            // Recalcular pesos baseados em receitas referenciadas
            if (sc.recipe_id && sc.recipe_data) {
              return {
                ...sc,
                weight: sc.recipe_data.yield_weight || sc.weight,
                cost: sc.recipe_data.total_cost || sc.cost
              };
            }
            return sc;
          });

          const totalWeight = calculateAssemblyTotalWeight(updatedSubComponents);
          
          return {
            ...prep,
            sub_components: updatedSubComponents,
            total_weight: totalWeight
          };
        }

        return prep;
      });

      return {
        updatedRecipe,
        updatedPreparations: processedPreparations
      };
    } catch (error) {
      console.error("Erro no recálculo:", error);
      throw error;
    }
  }, [calculateAssemblyTotalWeight]);

  // Calcular custo da cuba
  const calculateCubaCost = useCallback((recipeData) => {
    try {
      const cubaWeight = parseFloat(recipeData.cuba_weight) || 0;
      const costPerKgYield = parseFloat(recipeData.cost_per_kg_yield) || 0;
      
      return (cubaWeight * costPerKgYield) / 1000; // Converter para kg
    } catch (error) {
      console.error("Erro ao calcular custo da cuba:", error);
      return 0;
    }
  }, []);

  // Calcular perda por descongelamento
  const calculateThawingLoss = useCallback((item) => {
    try {
      return RecipeCalculator.calculateAndClassifyThawingLoss(item);
    } catch (error) {
      console.error("Erro ao calcular perda por descongelamento:", error);
      return { loss: 0, classification: 'normal' };
    }
  }, []);

  // Calcular perda por limpeza
  const calculateCleaningLoss = useCallback((item) => {
    try {
      return RecipeCalculator.calculateAndClassifyCleaningLoss(item);
    } catch (error) {
      console.error("Erro ao calcular perda por limpeza:", error);
      return { loss: 0, classification: 'normal' };
    }
  }, []);

  // Calcular perda por cocção
  const calculateCookingLoss = useCallback((item) => {
    try {
      return RecipeCalculator.calculateAndClassifyCookingLoss(item);
    } catch (error) {
      console.error("Erro ao calcular perda por cocção:", error);
      return { loss: 0, classification: 'normal' };
    }
  }, []);

  // Calcular perda por porcionamento
  const calculatePortioningLoss = useCallback((item) => {
    try {
      return RecipeCalculator.calculateAndClassifyPortioningLoss(item);
    } catch (error) {
      console.error("Erro ao calcular perda por porcionamento:", error);
      return { loss: 0, classification: 'normal' };
    }
  }, []);

  // Calcular rendimento
  const calculateYield = useCallback((item) => {
    try {
      return RecipeCalculator.calculateAndClassifyYield(item);
    } catch (error) {
      console.error("Erro ao calcular rendimento:", error);
      return { yield: 0, classification: 'normal' };
    }
  }, []);

  // Calcular custos totais de uma preparação
  const calculatePreparationCosts = useCallback((preparation) => {
    try {
      if (!preparation.items || !Array.isArray(preparation.items)) {
        return { totalCost: 0, totalWeight: 0 };
      }

      let totalCost = 0;
      let totalWeight = 0;

      preparation.items.forEach(item => {
        const weight = parseFloat(item.weight) || 0;
        const cost = parseFloat(item.cost) || 0;
        
        totalWeight += weight;
        totalCost += cost;
      });

      return { totalCost, totalWeight };
    } catch (error) {
      console.error("Erro ao calcular custos da preparação:", error);
      return { totalCost: 0, totalWeight: 0 };
    }
  }, []);

  // Calcular percentual de cada ingrediente
  const calculateIngredientPercentage = useCallback((itemWeight, totalWeight) => {
    try {
      if (!totalWeight || totalWeight === 0) return 0;
      return ((parseFloat(itemWeight) || 0) / parseFloat(totalWeight)) * 100;
    } catch (error) {
      console.error("Erro ao calcular percentual:", error);
      return 0;
    }
  }, []);

  // Recalcular pesos proporcionais
  const recalculateProportionalWeights = useCallback((items, newTotalWeight) => {
    try {
      if (!items || !Array.isArray(items) || !newTotalWeight) {
        return items;
      }

      const currentTotalWeight = items.reduce((total, item) => 
        total + (parseFloat(item.weight) || 0), 0
      );

      if (currentTotalWeight === 0) return items;

      const ratio = newTotalWeight / currentTotalWeight;

      return items.map(item => ({
        ...item,
        weight: (parseFloat(item.weight) || 0) * ratio
      }));
    } catch (error) {
      console.error("Erro ao recalcular pesos proporcionais:", error);
      return items;
    }
  }, []);

  // Validar consistência de dados
  const validateRecipeData = useCallback((recipeData, preparationsData) => {
    const errors = [];

    try {
      // Validar dados básicos da receita
      if (!recipeData.name?.trim()) {
        errors.push("Nome da receita é obrigatório");
      }

      if (!recipeData.category?.trim()) {
        errors.push("Categoria é obrigatória");
      }

      // Validar preparações
      if (!preparationsData || !Array.isArray(preparationsData)) {
        errors.push("Ao menos uma preparação é necessária");
      } else {
        preparationsData.forEach((prep, index) => {
          if (!prep.name?.trim()) {
            errors.push(`Nome da preparação ${index + 1} é obrigatório`);
          }

          if (prep.items && Array.isArray(prep.items)) {
            prep.items.forEach((item, itemIndex) => {
              if (!item.ingredient_id) {
                errors.push(`Ingrediente na preparação ${index + 1}, item ${itemIndex + 1} é obrigatório`);
              }
              
              if (!item.weight || parseFloat(item.weight) <= 0) {
                errors.push(`Peso do item ${itemIndex + 1} na preparação ${index + 1} deve ser maior que zero`);
              }
            });
          }
        });
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    } catch (error) {
      console.error("Erro ao validar dados:", error);
      return {
        isValid: false,
        errors: ["Erro interno na validação"]
      };
    }
  }, []);

  return {
    // Cálculos básicos
    calculateAssemblyTotalWeight,
    calculateCubaCost,
    calculatePreparationCosts,
    calculateIngredientPercentage,

    // Cálculos de perdas
    calculateThawingLoss,
    calculateCleaningLoss,
    calculateCookingLoss,
    calculatePortioningLoss,
    calculateYield,

    // Recálculos e ajustes
    handleRecalculate,
    recalculateProportionalWeights,

    // Validação
    validateRecipeData
  };
};
