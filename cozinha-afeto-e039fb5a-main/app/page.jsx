export default function HomePage() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-blue-600">Cozinha Afeto</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium mb-2 text-gray-900">Receitas</h3>
          <p className="text-gray-600">Gerencie suas receitas culinárias</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium mb-2 text-gray-900">Cardápio</h3>
          <p className="text-gray-600">Configure cardápios semanais</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium mb-2 text-gray-900">Pedidos</h3>
          <p className="text-gray-600">Acompanhe pedidos de clientes</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium mb-2 text-gray-900">Ingredientes</h3>
          <p className="text-gray-600">Controle de estoque e custos</p>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Sistema de Gestão para Restaurantes</h2>
        <p className="text-gray-600 leading-relaxed">
          Sistema completo de gestão culinária com controle de receitas, cardápios, 
          pedidos, ingredientes, análise nutricional e relatórios financeiros.
          Desenvolvido para otimizar operações de restaurantes e estabelecimentos alimentícios.
        </p>
      </div>
      
      <div className="text-center text-sm text-gray-500">
        🚀 Deploy realizado com sucesso no Vercel | Status: Online
      </div>
    </div>
  );
}