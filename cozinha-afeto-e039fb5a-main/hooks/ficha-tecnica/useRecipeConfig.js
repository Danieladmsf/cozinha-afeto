import { useState, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { User } from "@/app/api/entities";

export const useRecipeConfig = () => {
  const { toast } = useToast();
  
  // Estados de configuração
  const [defaultNames, setDefaultNames] = useState({
    preparation: "Preparo",
    group: "Grupo"
  });
  
  const [defaultStartOption, setDefaultStartOption] = useState("preparation");
  const [configSaving, setConfigSaving] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);

  // Carregar configurações do usuário
  const loadUserConfiguration = useCallback(async () => {
    try {
      setConfigLoading(true);
      
      // Tentar carregar configurações salvas do usuário
      const userId = "default_user"; // ou pegar do contexto de autenticação
      const userConfig = await User.get(userId);
      
      if (userConfig && userConfig.recipe_config) {
        const config = userConfig.recipe_config;
        
        setDefaultNames({
          preparation: config.default_preparation_name || "Preparo",
          group: config.default_group_name || "Grupo"
        });
        
        setDefaultStartOption(config.default_start_option || "preparation");
      }
      
      return userConfig?.recipe_config || null;
    } catch (error) {
      console.error("Erro ao carregar configuração do usuário:", error);
      // Usar configurações padrão em caso de erro
      setDefaultNames({
        preparation: "Preparo",
        group: "Grupo"
      });
      setDefaultStartOption("preparation");
      return null;
    } finally {
      setConfigLoading(false);
    }
  }, []);

  // Salvar configurações do usuário
  const saveConfiguration = useCallback(async () => {
    try {
      setConfigSaving(true);
      
      const userId = "default_user"; // ou pegar do contexto de autenticação
      const configData = {
        default_preparation_name: defaultNames.preparation,
        default_group_name: defaultNames.group,
        default_start_option: defaultStartOption,
        updated_at: new Date()
      };

      // Primeiro tentar obter o usuário existente
      let user;
      try {
        user = await User.get(userId);
      } catch (error) {
        // Se usuário não existe, criar um novo
        user = null;
      }

      if (user) {
        // Atualizar usuário existente
        await User.update(userId, {
          ...user,
          recipe_config: configData
        });
      } else {
        // Criar novo usuário com configurações
        await User.create({
          id: userId,
          recipe_config: configData,
          created_at: new Date()
        });
      }

      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso!",
      });

      return true;
    } catch (error) {
      console.error("Erro ao salvar configuração:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setConfigSaving(false);
    }
  }, [defaultNames, defaultStartOption, toast]);

  // Atualizar nome padrão de preparação
  const updatePreparationName = useCallback((name) => {
    setDefaultNames(prev => ({
      ...prev,
      preparation: name || "Preparo"
    }));
  }, []);

  // Atualizar nome padrão de grupo
  const updateGroupName = useCallback((name) => {
    setDefaultNames(prev => ({
      ...prev,
      group: name || "Grupo"
    }));
  }, []);

  // Atualizar opção de início padrão
  const updateDefaultStartOption = useCallback((option) => {
    setDefaultStartOption(option);
  }, []);

  // Resetar configurações para padrão
  const resetToDefaults = useCallback(() => {
    setDefaultNames({
      preparation: "Preparo",
      group: "Grupo"
    });
    setDefaultStartOption("preparation");
  }, []);

  // Gerar configuração inicial para nova receita
  const getInitialRecipeConfig = useCallback(() => {
    return {
      defaultPreparationName: defaultNames.preparation,
      defaultGroupName: defaultNames.group,
      startWithPreparation: defaultStartOption === "preparation"
    };
  }, [defaultNames, defaultStartOption]);

  // Aplicar configurações a uma preparação
  const applyConfigToPreparation = useCallback((preparation, index = 0) => {
    const config = getInitialRecipeConfig();
    
    return {
      ...preparation,
      name: preparation.name || `${config.defaultPreparationName} ${index + 1}`,
      // Aplicar outras configurações conforme necessário
    };
  }, [getInitialRecipeConfig]);

  // Aplicar configurações a um grupo
  const applyConfigToGroup = useCallback((group, index = 0) => {
    const config = getInitialRecipeConfig();
    
    return {
      ...group,
      name: group.name || `${config.defaultGroupName} ${index + 1}`,
      // Aplicar outras configurações conforme necessário
    };
  }, [getInitialRecipeConfig]);

  // Validar configurações
  const validateConfiguration = useCallback(() => {
    const errors = [];

    if (!defaultNames.preparation?.trim()) {
      errors.push("Nome padrão de preparação não pode estar vazio");
    }

    if (!defaultNames.group?.trim()) {
      errors.push("Nome padrão de grupo não pode estar vazio");
    }

    if (!["preparation", "group"].includes(defaultStartOption)) {
      errors.push("Opção de início deve ser 'preparation' ou 'group'");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, [defaultNames, defaultStartOption]);

  return {
    // Estados
    defaultNames,
    defaultStartOption,
    configSaving,
    configLoading,

    // Operações principais
    loadUserConfiguration,
    saveConfiguration,

    // Atualização de configurações
    updatePreparationName,
    updateGroupName,
    updateDefaultStartOption,
    resetToDefaults,

    // Aplicação de configurações
    getInitialRecipeConfig,
    applyConfigToPreparation,
    applyConfigToGroup,

    // Validação
    validateConfiguration,

    // Setters diretos (para casos especiais)
    setDefaultNames,
    setDefaultStartOption
  };
};