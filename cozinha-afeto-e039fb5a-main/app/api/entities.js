import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

// Firebase Collection Helper
const createEntity = (collectionName) => {
  return {
    // Get all documents
    getAll: async () => {
      try {
        console.log(`[Firebase] Getting all documents from ${collectionName}...`);
        const querySnapshot = await getDocs(collection(db, collectionName));
        const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`[Firebase] Successfully loaded ${docs.length} documents from ${collectionName}`);
        return docs;
      } catch (error) {
        console.error(`[Firebase] Error getting documents from ${collectionName}:`, error);
        // Rethrow the error so calling code can handle it
        throw new Error(`Failed to load data from ${collectionName}: ${error.message}`);
      }
    },

    // Alias for getAll (for compatibility)
    list: async () => {
      try {
        console.log(`[Firebase] Listing all documents from ${collectionName}...`);
        const querySnapshot = await getDocs(collection(db, collectionName));
        const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`[Firebase] Successfully listed ${docs.length} documents from ${collectionName}`);
        return docs;
      } catch (error) {
        console.error(`[Firebase] Error listing documents from ${collectionName}:`, error);
        // Rethrow the error so calling code can handle it
        throw new Error(`Failed to list data from ${collectionName}: ${error.message}`);
      }
    },

    // Get document by ID
    getById: async (id) => {
      try {
        // Handle temporary customer IDs for portal
        if (collectionName === 'Customer' && id?.startsWith('temp-')) {
          return {
            id: id,
            name: 'Novo Cliente',
            active: false,
            pending_registration: true,
            category: 'temp',
            blocked: false,
            suspended: false
          };
        }
        
        console.log(`[Firebase] Getting document ${id} from ${collectionName}...`);
        const docRef = doc(db, collectionName, id);
        const docSnap = await getDoc(docRef);
        const result = docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
        console.log(`[Firebase] Document ${id} from ${collectionName}:`, result ? 'found' : 'not found');
        return result;
      } catch (error) {
        console.error(`[Firebase] Error getting document ${id} from ${collectionName}:`, error);
        throw new Error(`Failed to get document ${id} from ${collectionName}: ${error.message}`);
      }
    },

    // Alias for getById (for compatibility)
    get: function(id) {
      return this.getById(id);
    },

    // Create new document
    create: async (data) => {
      const docData = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const docRef = await addDoc(collection(db, collectionName), docData);
      return { id: docRef.id, ...docData };
    },

    // Update document
    update: async (id, data) => {
      const docRef = doc(db, collectionName, id);
      const updateData = {
        ...data,
        updatedAt: new Date()
      };
      await updateDoc(docRef, updateData);
      return { id, ...updateData };
    },

    // Delete document
    delete: async (id) => {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
    },

    // Query with filters
    query: async (filters = [], orderByField = null, limitCount = null) => {
      try {
        console.log(`[Firebase] Querying ${collectionName} with filters:`, filters);
        let q = collection(db, collectionName);
        
        if (filters.length > 0) {
          const constraints = filters.map(filter => where(filter.field, filter.operator, filter.value));
          q = query(q, ...constraints);
        }
        
        if (orderByField) {
          q = query(q, orderBy(orderByField));
        }
        
        if (limitCount) {
          q = query(q, limit(limitCount));
        }

        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`[Firebase] Query returned ${docs.length} documents from ${collectionName}`);
        return docs;
      } catch (error) {
        console.error(`[Firebase] Error querying ${collectionName}:`, error);
        throw new Error(`Failed to query ${collectionName}: ${error.message}`);
      }
    }
  };
};

// Export all entities using exact Firebase collection names
export const BillPayment = createEntity('BillPayment');
export const Brand = createEntity('Brand');
export const Category = createEntity('Category');
export const CategoryTree = createEntity('CategoryTree');
export const CategoryType = createEntity('CategoryType');
export const Customer = createEntity('Customer');
export const Ingredient = createEntity('Ingredient');
export const MenuCategory = createEntity('MenuCategory');
export const MenuConfig = createEntity('MenuConfig');
export const MenuLocation = createEntity('MenuLocation');
export const MenuNote = createEntity('MenuNote');
export const NutritionCategory = createEntity('NutritionCategory');
export const NutritionFood = createEntity('NutritionFood');
export const Order = createEntity('Order');
export const OrderWaste = createEntity('OrderWaste');
export const PriceHistory = createEntity('PriceHistory');
export const Recipe = createEntity('Recipe');
export const RecipeIngredient = createEntity('RecipeIngredient');
export const RecipeNutritionConfig = createEntity('RecipeNutritionConfig');
export const RecipeProcess = createEntity('RecipeProcess');
export const RecurringBill = createEntity('RecurringBill');
export const Supplier = createEntity('Supplier');
export const UserNutrientConfig = createEntity('UserNutrientConfig');
export const VariableBill = createEntity('VariableBill');
export const WeeklyMenu = createEntity('WeeklyMenu');

// User entity
export const UserEntity = createEntity('User');

// Auth with User methods
import { auth } from '../../lib/firebase';

export const User = {
  ...auth,
  
  // Get current user data - No authentication required
  me: async () => {
    return new Promise((resolve, reject) => {
      // Return mock user data for development without authentication
      resolve({
        id: 'mock-user-id',
        email: 'dev@cozinhaafeto.com',
        displayName: 'Usuário de Desenvolvimento',
        photoURL: null
      });
    });
  },

  // Get user data - Load from Firestore
  getMyUserData: async () => {
    try {
      const userId = 'mock-user-id'; // Em produção, pegar do usuário autenticado
      
      const userData = await UserEntity.getById(userId);
      return userData;
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      return null;
    }
  },

  // Update user data - Save to Firestore
  updateMyUserData: async (userData) => {
    try {
      const userId = 'mock-user-id'; // Em produção, pegar do usuário autenticado
      
      // Primeiro, tenta buscar o usuário existente
      let existingUser = await UserEntity.getById(userId);
      
      if (existingUser) {
        // Se existe, atualiza
        await UserEntity.update(userId, {
          ...existingUser,
          ...userData,
          updatedAt: new Date()
        });
      } else {
        // Se não existe, cria um novo
        await UserEntity.create({
          id: userId,
          ...userData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      return {
        success: true,
        message: 'Dados do usuário salvos com sucesso no Firestore'
      };
    } catch (error) {
      console.error('Erro ao salvar dados do usuário:', error);
      throw new Error('Falha ao salvar configurações: ' + error.message);
    }
  }
};