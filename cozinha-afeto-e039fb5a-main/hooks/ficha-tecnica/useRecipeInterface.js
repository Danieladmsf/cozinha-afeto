import { useState, useCallback } from 'react';

export const useRecipeInterface = () => {
  // Estados de controle de edição
  const [isEditing, setIsEditing] = useState(false);
  const [currentRecipeId, setCurrentRecipeId] = useState(null);

  // Estados de diálogos e modais
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [isDetailedProcessDialogOpen, setDetailedProcessDialogOpen] = useState(false);

  // Estados de busca e filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [ingredientSearchTerm, setIngredientSearchTerm] = useState("");
  const [sourceRecipeSearch, setSourceRecipeSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState("");

  // Estados de seleção atual
  const [currentPrepIndex, setCurrentPrepIndex] = useState(0);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [currentIngredient, setCurrentIngredient] = useState(null);
  const [currentPrepIndexForDetail, setCurrentPrepIndexForDetail] = useState(null);
  const [currentItemIndexForDetail, setCurrentItemIndexForDetail] = useState(null);

  // Estados de formulários
  const [processFormData, setProcessFormData] = useState({
    weight_frozen: 0,
    weight_thawed: 0,
    weight_clean: 0,
    weight_cooked: 0
  });

  // Estados para cópia de receitas
  const [selectedSourceRecipe, setSelectedSourceRecipe] = useState(null);
  const [selectedStageLevel, setSelectedStageLevel] = useState(null);
  const [availableStages, setAvailableStages] = useState([]);
  const [recipePreview, setRecipePreview] = useState(null);

  // Estados de prints e relatórios
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [showCollectDialog, setShowCollectDialog] = useState(false);

  // Handlers para diálogos
  const openSearchModal = useCallback(() => {
    setSearchModalOpen(true);
  }, []);

  const closeSearchModal = useCallback(() => {
    setSearchModalOpen(false);
    setSearchQuery('');
  }, []);

  const openConfigDialog = useCallback(() => {
    setShowConfigDialog(true);
  }, []);

  const closeConfigDialog = useCallback(() => {
    setShowConfigDialog(false);
  }, []);

  const openDetailedProcessDialog = useCallback((ingredient, prepIndex, itemIndex) => {
    setCurrentIngredient(ingredient);
    setCurrentPrepIndexForDetail(prepIndex);
    setCurrentItemIndexForDetail(itemIndex);
    setDetailedProcessDialogOpen(true);
  }, []);

  const closeDetailedProcessDialog = useCallback(() => {
    setDetailedProcessDialogOpen(false);
    setCurrentIngredient(null);
    setCurrentPrepIndexForDetail(null);
    setCurrentItemIndexForDetail(null);
    setProcessFormData({
      weight_frozen: 0,
      weight_thawed: 0,
      weight_clean: 0,
      weight_cooked: 0
    });
  }, []);

  // Handlers para busca
  const updateSearchQuery = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  const updateIngredientSearchTerm = useCallback((term) => {
    setIngredientSearchTerm(term);
  }, []);

  const updateSourceRecipeSearch = useCallback((term) => {
    setSourceRecipeSearch(term);
  }, []);

  const clearAllSearches = useCallback(() => {
    setSearchQuery('');
    setIngredientSearchTerm('');
    setSourceRecipeSearch('');
  }, []);

  // Handlers para navegação
  const setActivePreparation = useCallback((index) => {
    setCurrentPrepIndex(index);
    setCurrentGroupIndex(0); // Reset group quando muda preparação
  }, []);

  const setActiveGroup = useCallback((index) => {
    setCurrentGroupIndex(index);
  }, []);

  // Handlers para seleção de categoria
  const updateSelectedCategory = useCallback((category) => {
    setSelectedCategory(category);
  }, []);

  // Handlers para edição
  const startEditing = useCallback((recipeId = null) => {
    setIsEditing(true);
    if (recipeId) {
      setCurrentRecipeId(recipeId);
    }
  }, []);

  const stopEditing = useCallback(() => {
    setIsEditing(false);
    setCurrentRecipeId(null);
  }, []);

  // Handlers para formulários
  const updateProcessFormData = useCallback((field, value) => {
    setProcessFormData(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  }, []);

  const resetProcessFormData = useCallback(() => {
    setProcessFormData({
      weight_frozen: 0,
      weight_thawed: 0,
      weight_clean: 0,
      weight_cooked: 0
    });
  }, []);

  // Handlers para cópia de receitas
  const setSourceRecipe = useCallback((recipe) => {
    setSelectedSourceRecipe(recipe);
    setSelectedStageLevel(null);
    setRecipePreview(null);
  }, []);

  const setStageLevel = useCallback((stage) => {
    setSelectedStageLevel(stage);
  }, []);

  const clearRecipeCopySelection = useCallback(() => {
    setSelectedSourceRecipe(null);
    setSelectedStageLevel(null);
    setAvailableStages([]);
    setRecipePreview(null);
  }, []);

  // Handlers para prints
  const openPrintDialog = useCallback(() => {
    setShowPrintDialog(true);
  }, []);

  const closePrintDialog = useCallback(() => {
    setShowPrintDialog(false);
  }, []);

  const openCollectDialog = useCallback(() => {
    setShowCollectDialog(true);
  }, []);

  const closeCollectDialog = useCallback(() => {
    setShowCollectDialog(false);
  }, []);

  // Função para resetar toda a interface
  const resetInterface = useCallback(() => {
    setIsEditing(false);
    setCurrentRecipeId(null);
    setSearchModalOpen(false);
    setSearchOpen(false);
    setShowConfigDialog(false);
    setDetailedProcessDialogOpen(false);
    clearAllSearches();
    setCurrentPrepIndex(0);
    setCurrentGroupIndex(0);
    setCurrentIngredient(null);
    setSelectedCategory("");
    resetProcessFormData();
    clearRecipeCopySelection();
    setShowPrintDialog(false);
    setShowCollectDialog(false);
  }, [clearAllSearches, resetProcessFormData, clearRecipeCopySelection]);

  return {
    // Estados de controle
    isEditing,
    currentRecipeId,

    // Estados de diálogos
    searchModalOpen,
    searchOpen,
    showConfigDialog,
    isDetailedProcessDialogOpen,
    showPrintDialog,
    showCollectDialog,

    // Estados de busca
    searchQuery,
    ingredientSearchTerm,
    sourceRecipeSearch,
    selectedCategory,

    // Estados de seleção
    currentPrepIndex,
    currentGroupIndex,
    currentIngredient,
    currentPrepIndexForDetail,
    currentItemIndexForDetail,

    // Estados de formulários
    processFormData,

    // Estados de cópia de receitas
    selectedSourceRecipe,
    selectedStageLevel,
    availableStages,
    recipePreview,

    // Setters diretos (para casos especiais)
    setIsEditing,
    setCurrentRecipeId,
    setSearchOpen,
    setAvailableStages,
    setRecipePreview,

    // Handlers de diálogos
    openSearchModal,
    closeSearchModal,
    openConfigDialog,
    closeConfigDialog,
    openDetailedProcessDialog,
    closeDetailedProcessDialog,

    // Handlers de busca
    updateSearchQuery,
    updateIngredientSearchTerm,
    updateSourceRecipeSearch,
    clearAllSearches,

    // Handlers de navegação
    setActivePreparation,
    setActiveGroup,
    updateSelectedCategory,

    // Handlers de edição
    startEditing,
    stopEditing,

    // Handlers de formulários
    updateProcessFormData,
    resetProcessFormData,

    // Handlers de cópia
    setSourceRecipe,
    setStageLevel,
    clearRecipeCopySelection,

    // Handlers de prints
    openPrintDialog,
    closePrintDialog,
    openCollectDialog,
    closeCollectDialog,

    // Utilitários
    resetInterface
  };
};
