import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Save, AlertCircle, Plus, Loader2 } from 'lucide-react';
import { emitToast } from '@/components/ui/Toaster';
import { kitService } from '@/services/kitService';
import { SolarBrand } from '@/lib/types';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct?: (product: any) => void;
}

const CATEGORIES = [
  'Módulos',
  'Inversores',
  'Micro Inversores',
  'Wallbox',
  'Cabos',
  'Estruturas',
  'Outros'
];

export default function AddProductModal({ isOpen, onClose, onAddProduct }: AddProductModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'Módulos',
    brand: '',
    model: '',
    power: '',
    voltage: '',
    warranty: '',
    image_url: '',
    description: ''
  });

  const [brands, setBrands] = useState<SolarBrand[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadBrands();
    }
  }, [isOpen]);

  const loadBrands = async () => {
    try {
      setLoadingBrands(true);
      const data = await kitService.getBrands();
      setBrands(data);
    } catch (error) {
      console.error('Erro ao carregar marcas:', error);
    } finally {
      setLoadingBrands(false);
    }
  };

  const getFilteredBrands = () => {
    if (formData.category === 'Módulos') {
      return brands.filter(b => b.type === 'placas');
    }
    if (['Inversores', 'Micro Inversores'].includes(formData.category)) {
      return brands.filter(b => b.type === 'aparelho');
    }
    if (formData.category === 'Wallbox') {
      return brands.filter(b => b.type === 'carregador');
    }
    return brands;
  };

  const handleAddNewBrand = async () => {
    const brandName = prompt('Digite o nome da nova marca:');
    if (!brandName) return;

    let type: 'placas' | 'aparelho' | 'carregador' = 'aparelho';
    if (formData.category === 'Módulos') type = 'placas';
    else if (formData.category === 'Wallbox') type = 'carregador';

    try {
      const newBrand = await kitService.createBrand(brandName, type);
      await loadBrands(); // Refresh brands list
      setFormData({ ...formData, brand: newBrand.name });
      emitToast({ title: "Sucesso", description: `Marca "${newBrand.name}" adicionada!` });
    } catch (error) {
      console.error('Erro ao adicionar marca:', error);
      emitToast({ title: "Erro", description: "Erro ao adicionar marca.", variant: "destructive" });
    }
  };

  if (!isOpen) return null;

  const filteredBrands = getFilteredBrands();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      emitToast({ title: "Upload iniciado", description: `Enviando ${file.name}...` });
      const url = await kitService.uploadKitImage(file);
      setFormData(prev => ({ ...prev, image_url: url }));
      emitToast({ title: "Sucesso", description: "Imagem carregada com sucesso!" });
    } catch (error) {
      console.error("Erro no upload:", error);
      emitToast({ title: "Erro", description: "Falha ao enviar a imagem.", variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Find the actual brand ID from the selected brand name
    const selectedBrand = brands.find(b => b.name === formData.brand);

    try {
        setLoadingSubmit(true);
        const newProduct = {
            name: formData.name,
            price: parseFloat(formData.price) || 0,
            category: formData.category,
            brand_id: selectedBrand?.id || null,
            model: formData.model,
            power: parseFloat(formData.power) || 0,
            voltage: formData.voltage,
            warranty: parseInt(formData.warranty) || null,
            image_url: formData.image_url,
            description: formData.description
        };

        await kitService.createProduct(newProduct);
        
        emitToast({ title: "Sucesso", description: "Produto cadastrado com sucesso!" });
        
        if (onAddProduct) {
             onAddProduct(formData);
        }
        
        setFormData({
            name: '', price: '', category: 'Módulos', brand: '', model: '',
            power: '', voltage: '', warranty: '', image_url: '', description: ''
        });
        onClose();
        
    } catch (error) {
        console.error("Erro ao salvar produto:", error);
        emitToast({ title: "Erro", description: "Falha ao cadastrar o produto.", variant: "destructive" });
    } finally {
        setLoadingSubmit(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col animate-scale-in custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-slate-900/80 backdrop-blur-md z-10">
          <div>
            <h3 className="text-xl font-bold text-white font-display">Novo Produto</h3>
            <p className="text-sm text-white/40">Adicione um novo produto ao seu catálogo.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Nome */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Nome *</label>
              <input 
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="form-input"
                placeholder="Ex: Painel JA Solar 550W"
              />
            </div>

            {/* Preço */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">
                Preço * <span className="text-[10px] text-white/40 font-normal ml-1">(Para Cabos informar preço por metro)</span>
              </label>
              <input 
                type="text"
                required
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="form-input"
                placeholder="Ex: 950.00"
              />
            </div>
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">Categoria</label>
            <select 
              value={formData.category}
              onChange={(e) => {
                setFormData({...formData, category: e.target.value, brand: ''});
              }}
              className="form-input bg-slate-900"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Marca */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white/70">Marca</label>
                <button
                  type="button"
                  onClick={handleAddNewBrand}
                  className="p-1 rounded-md hover:bg-white/5 text-primary transition-all hover:scale-110 flex items-center gap-1 group"
                  title="Adicionar nova marca"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">Nova Marca</span>
                </button>
              </div>
              <select 
                value={formData.brand}
                onChange={(e) => setFormData({...formData, brand: e.target.value})}
                className="form-input bg-slate-900"
              >
                <option value="">Selecione uma marca</option>
                {filteredBrands.map(brand => (
                  <option key={brand.id} value={brand.name}>{brand.name}</option>
                ))}
              </select>
            </div>

            {/* Modelo */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Modelo</label>
              <input 
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({...formData, model: e.target.value})}
                className="form-input"
                placeholder="Ex: JAM72S30"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Potência */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Potência</label>
              <input 
                type="text"
                value={formData.power}
                onChange={(e) => setFormData({...formData, power: e.target.value})}
                className="form-input"
                placeholder="Ex: 550 Wp, 5 kW"
              />
            </div>

            {/* Tensão */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/70">Tensão (inversores e transformadores)</label>
              <input 
                type="text"
                value={formData.voltage}
                onChange={(e) => setFormData({...formData, voltage: e.target.value})}
                className="form-input"
                placeholder="Ex: 220V, 380V"
              />
            </div>
          </div>

          {/* Garantia */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">Garantia (em anos)</label>
            <input 
              type="text"
              value={formData.warranty}
              onChange={(e) => setFormData({...formData, warranty: e.target.value})}
              className="form-input"
              placeholder="Ex: 12"
            />
          </div>

          {/* Imagem */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">Imagem do Produto (Opcional)</label>
            <div className="flex gap-2 relative">
              <input 
                type="text"
                value={formData.image_url}
                onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                className="form-input flex-1 pr-12"
                placeholder="URL da imagem (ou faça upload)"
              />
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute right-2 top-1.5 bottom-1.5 p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all flex items-center justify-center"
              >
                <Upload className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">Descrição</label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="form-input min-h-[120px] resize-none py-3"
              placeholder="Descrição técnica e detalhes do produto..."
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5 sticky bottom-0 bg-slate-900/90 py-4 -mx-6 px-6 backdrop-blur-md">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={loadingSubmit}
              className="px-8 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white transition-all text-sm font-bold shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
            >
              {loadingSubmit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {loadingSubmit ? "Salvando..." : "Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
